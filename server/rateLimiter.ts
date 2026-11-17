import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export interface RateLimitRule {
  bucketName: string;
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetEpochSec: number;
  retryAfterSec: number;
  clientIp: string;
}

// Almacén en memoria con poda periódica por bucket e IP normalizada
const bucketStore = new Map<string, Map<string, number[]>>();

export function extractNormalizedClientIp(req: Pick<Request, 'headers' | 'ip' | 'socket'>): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.ip || req.socket?.remoteAddress || '127.0.0.1';

  return (raw || '127.0.0.1').replace(/^::ffff:/, '').slice(0, 64);
}

/**
 * Evaluador puro de Rate Limiting por IP (compatible con Express y funciones Serverless/Edge)
 */
export function evaluateIpRateLimit(clientIp: string, rule: RateLimitRule): RateLimitDecision {
  const now = Date.now();
  const windowStart = now - rule.windowMs;

  let ipMap = bucketStore.get(rule.bucketName);
  if (!ipMap) {
    ipMap = new Map<string, number[]>();
    bucketStore.set(rule.bucketName, ipMap);
  }

  const timestamps = (ipMap.get(clientIp) || []).filter((ts) => ts > windowStart);
  const oldestTs = timestamps[0] ?? now;
  const resetEpochSec = Math.ceil((oldestTs + rule.windowMs) / 1000);

  if (timestamps.length >= rule.maxRequests) {
    ipMap.set(clientIp, timestamps);
    const retryAfterSec = Math.max(1, Math.ceil((oldestTs + rule.windowMs - now) / 1000));
    return {
      allowed: false,
      limit: rule.maxRequests,
      remaining: 0,
      resetEpochSec,
      retryAfterSec,
      clientIp,
    };
  }

  timestamps.push(now);
  ipMap.set(clientIp, timestamps);

  return {
    allowed: true,
    limit: rule.maxRequests,
    remaining: Math.max(0, rule.maxRequests - timestamps.length),
    resetEpochSec,
    retryAfterSec: 0,
    clientIp,
  };
}

/**
 * Middleware Express de Rate Limiting estricto por dirección IP
 */
export function createStrictIpRateLimiter(rule: RateLimitRule) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Excluir sondas de vida de orquestadores (Kubernetes/Cloud Run)
    if (req.path === '/health/live' || req.path === '/health/ready') {
      next();
      return;
    }

    const clientIp = extractNormalizedClientIp(req);
    const decision = evaluateIpRateLimit(clientIp, rule);

    res.setHeader('X-RateLimit-Policy', `${rule.maxRequests};w=${Math.floor(rule.windowMs / 1000)}`);
    res.setHeader('X-RateLimit-Limit', String(decision.limit));
    res.setHeader('X-RateLimit-Remaining', String(decision.remaining));
    res.setHeader('X-RateLimit-Reset', String(decision.resetEpochSec));

    if (!decision.allowed) {
      const traceId =
        (res.getHeader('X-Trace-Id') as string | undefined) ||
        `rl-${crypto.randomBytes(6).toString('hex')}`;
      res.setHeader('Retry-After', String(decision.retryAfterSec));
      res.status(429).json({
        error: 'Límite de peticiones excedido. Protección anti-DoS y fuerza bruta activa.',
        code: 'RATE_LIMIT_EXCEEDED',
        bucket: rule.bucketName,
        retryAfterSeconds: decision.retryAfterSec,
        traceId,
      });
      return;
    }

    next();
  };
}

export function pruneExpiredRateLimitEntries(maxAgeMs = 15 * 60 * 1000): number {
  const cutoff = Date.now() - maxAgeMs;
  let removed = 0;

  for (const [, ipMap] of Array.from(bucketStore.entries())) {
    for (const [ip, timestamps] of Array.from(ipMap.entries())) {
      const fresh = timestamps.filter((ts) => ts >= cutoff);
      if (fresh.length === 0) {
        ipMap.delete(ip);
        removed += 1;
      } else {
        ipMap.set(ip, fresh);
      }
    }
  }

  return removed;
}

export function getRateLimiterStats() {
  let trackedIps = 0;
  const buckets: { name: string; activeIps: number }[] = [];
  for (const [name, ipMap] of Array.from(bucketStore.entries())) {
    trackedIps += ipMap.size;
    buckets.push({ name, activeIps: ipMap.size });
  }
  return {
    activeBuckets: buckets.length,
    trackedIps,
    buckets,
  };
}
