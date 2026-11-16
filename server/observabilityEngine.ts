import crypto from 'crypto';
import os from 'os';
import v8 from 'v8';
import type { Request, Response, NextFunction } from 'express';

export interface StructuredTraceLog {
  timestamp: string;
  traceId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  level: 'INFO' | 'WARN' | 'ERROR';
}

export interface SelfHealingEvent {
  id: string;
  timestamp: string;
  trigger: string;
  action: string;
  heapUsedMbBefore: number;
  heapUsedMbAfter: number;
  recovered: boolean;
}

const MAX_TRACE_LOGS = 200;
const MAX_LATENCY_SAMPLES = 300;
const MAX_HEALING_EVENTS = 30;
const HEAP_PRESSURE_THRESHOLD_PCT = 86;

class ObservabilityEngine {
  private readonly bootTime = Date.now();
  private traceLogs: StructuredTraceLog[] = [];
  private latenciesMs: number[] = [];
  private healingEvents: SelfHealingEvent[] = [];
  private totalRequests = 0;
  private totalErrors5xx = 0;
  private totalBlocked4xx = 0;
  private eventLoopLagMs = 0;
  private lastCpuUsage = process.cpuUsage();
  private lastCpuCheckMs = Date.now();
  private cpuLoadPercent = 0;
  private watchdogTimer: NodeJS.Timeout | null = null;
  private cleanupCallbacks: (() => number)[] = [];

  public startWatchdog(): void {
    if (this.watchdogTimer) return;

    // Medición periódica de Event Loop Lag y Auto-Healing cada 30 segundos
    this.watchdogTimer = setInterval(() => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const diffNs = Number(process.hrtime.bigint() - start);
        this.eventLoopLagMs = Number((diffNs / 1e6).toFixed(2));
      });

      // Cómputo de CPU de proceso real
      const now = Date.now();
      const elapsedMs = Math.max(1, now - this.lastCpuCheckMs);
      const diffCpu = process.cpuUsage(this.lastCpuUsage);
      const cpuMs = (diffCpu.user + diffCpu.system) / 1000;
      const cpus = Math.max(1, os.cpus().length);
      this.cpuLoadPercent = Number(Math.min(100, (cpuMs / (elapsedMs * cpus)) * 100).toFixed(2));
      this.lastCpuUsage = process.cpuUsage();
      this.lastCpuCheckMs = now;

      // Auto-Healing Watchdog: detectar presión alta real contra el límite de heap V8 o event loop bloqueado
      const mem = process.memoryUsage();
      const heapLimit = v8.getHeapStatistics().heap_size_limit || mem.heapTotal;
      const heapLimitPct = heapLimit > 0 ? (mem.heapUsed / heapLimit) * 100 : 0;
      const heapChunkPct = mem.heapTotal > 256 * 1024 * 1024 ? (mem.heapUsed / mem.heapTotal) * 100 : 0;
      const effectiveHeapPct = Math.max(heapLimitPct, heapChunkPct);
      if (effectiveHeapPct >= HEAP_PRESSURE_THRESHOLD_PCT || this.eventLoopLagMs > 250) {
        this.executeSelfHealing(
          effectiveHeapPct >= HEAP_PRESSURE_THRESHOLD_PCT
            ? `HEAP_PRESSURE_${effectiveHeapPct.toFixed(1)}%`
            : `EVENT_LOOP_LAG_${this.eventLoopLagMs}ms`
        );
      }
    }, 30_000);

    this.watchdogTimer.unref();
  }

  public registerCachePruner(fn: () => number): void {
    this.cleanupCallbacks.push(fn);
  }

  public executeSelfHealing(trigger: string): SelfHealingEvent {
    const beforeMb = Number((process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2));
    let prunedCount = 0;
    for (const cb of this.cleanupCallbacks) {
      try {
        prunedCount += cb();
      } catch {
        // ignore pruner failure
      }
    }

    // Recortar buffers internos para liberar memoria inmediatamente
    if (this.traceLogs.length > 80) {
      this.traceLogs = this.traceLogs.slice(-80);
    }
    if (this.latenciesMs.length > 100) {
      this.latenciesMs = this.latenciesMs.slice(-100);
    }

    const gcFn = (globalThis as { gc?: () => void }).gc;
    if (typeof gcFn === 'function') {
      try {
        gcFn();
      } catch {
        // ignore if gc not exposed
      }
    }

    const afterMb = Number((process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2));
    const event: SelfHealingEvent = {
      id: `heal-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      trigger,
      action: `Compactación automática de buffers y cachés (${prunedCount} entradas purgadas)`,
      heapUsedMbBefore: beforeMb,
      heapUsedMbAfter: afterMb,
      recovered: true,
    };

    this.healingEvents = [event, ...this.healingEvents].slice(0, MAX_HEALING_EVENTS);
    return event;
  }

  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    const incomingTrace =
      (typeof req.headers['x-trace-id'] === 'string' && req.headers['x-trace-id']) ||
      (typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id']);
    const traceId = incomingTrace || `tr-${crypto.randomBytes(8).toString('hex')}`;

    res.setHeader('X-Trace-Id', traceId);
    res.setHeader('X-Request-Id', traceId);

    const startNs = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number((Number(process.hrtime.bigint() - startNs) / 1e6).toFixed(2));
      const statusCode = res.statusCode;

      this.totalRequests += 1;
      if (statusCode >= 500) this.totalErrors5xx += 1;
      else if (statusCode >= 400) this.totalBlocked4xx += 1;

      this.latenciesMs.push(durationMs);
      if (this.latenciesMs.length > MAX_LATENCY_SAMPLES) {
        this.latenciesMs.shift();
      }

      if (req.path.startsWith('/api')) {
        const entry: StructuredTraceLog = {
          timestamp: new Date().toISOString(),
          traceId,
          method: req.method,
          path: req.path,
          statusCode,
          durationMs,
          level: statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO',
        };
        this.traceLogs.push(entry);
        if (this.traceLogs.length > MAX_TRACE_LOGS) {
          this.traceLogs.shift();
        }
      }
    });

    next();
  };

  private computePercentile(sorted: number[], pct: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length));
    return sorted[idx];
  }

  public getMetricsSnapshot(activeWsClients = 0) {
    const mem = process.memoryUsage();
    const sortedLatencies = [...this.latenciesMs].sort((a, b) => a - b);

    return {
      service: 'al-hadiqa-invest-core',
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor((Date.now() - this.bootTime) / 1000),
      nodeVersion: process.version,
      memory: {
        rssMb: Number((mem.rss / (1024 * 1024)).toFixed(2)),
        heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(2)),
        heapTotalMb: Number((mem.heapTotal / (1024 * 1024)).toFixed(2)),
        heapUtilizationPct:
          mem.heapTotal > 0 ? Number(((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)) : 0,
      },
      cpu: {
        processPercent: this.cpuLoadPercent,
        cores: os.cpus().length,
        loadAvg1m: Number((os.loadavg()[0] || 0).toFixed(2)),
      },
      eventLoopLagMs: this.eventLoopLagMs,
      traffic: {
        totalRequests: this.totalRequests,
        errors5xx: this.totalErrors5xx,
        blocked4xx: this.totalBlocked4xx,
        activeWebSockets: activeWsClients,
        latencyMs: {
          p50: this.computePercentile(sortedLatencies, 50),
          p95: this.computePercentile(sortedLatencies, 95),
          p99: this.computePercentile(sortedLatencies, 99),
        },
      },
      selfHealing: {
        watchdogActive: Boolean(this.watchdogTimer),
        heapThresholdPct: HEAP_PRESSURE_THRESHOLD_PCT,
        eventsCount: this.healingEvents.length,
        recentEvents: this.healingEvents.slice(0, 8),
      },
      recentTraces: [...this.traceLogs].reverse().slice(0, 20),
    };
  }
}

export const observability = new ObservabilityEngine();
