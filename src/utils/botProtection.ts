/**
 * Módulo de Protección Anti-Bots & Limitación de Peticiones (Rate Limiting)
 * Integra lógica de verificación Cloudflare Turnstile / reCAPTCHA y control por IP y Usuario.
 */

// Memoria volátil para el limitador de tasa (Sliding Window Rate Limiter)
const rateLimitStore: Record<string, number[]> = {};

/**
 * Obtiene una huella de red / IP simulada del cliente para control de bots y abuso
 */
export function getClientIpFingerprint(): string {
  try {
    let fp = localStorage.getItem('al_hadiqa_client_ip_fp');
    if (!fp) {
      const octet1 = Math.floor(Math.random() * 50) + 180;
      const octet2 = Math.floor(Math.random() * 200) + 10;
      fp = `${octet1}.${octet2}.24.112`;
      localStorage.setItem('al_hadiqa_client_ip_fp', fp);
    }
    return fp;
  } catch {
    return '185.120.24.112';
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  totalLimit: number;
  retryAfterSeconds: number;
}

/**
 * Limitador de tasa por ventana deslizante (Sliding Window)
 * @param identifier Identificador único (e.g. `user_123` o `ip_192.168.1.1`)
 * @param maxLimit Número máximo de peticiones permitidas en la ventana
 * @param windowSeconds Duración de la ventana en segundos
 */
export function checkRateLimit(
  identifier: string,
  maxLimit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (!rateLimitStore[identifier]) {
    rateLimitStore[identifier] = [];
  }

  // Filtrar peticiones fuera de la ventana actual
  rateLimitStore[identifier] = rateLimitStore[identifier].filter(
    (timestamp) => now - timestamp < windowMs
  );

  const currentCount = rateLimitStore[identifier].length;

  if (currentCount >= maxLimit) {
    const oldestTimestamp = rateLimitStore[identifier][0];
    const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      totalLimit: maxLimit,
      retryAfterSeconds: Math.max(1, retryAfter),
    };
  }

  // Registrar nueva petición
  rateLimitStore[identifier].push(now);

  return {
    allowed: true,
    remaining: maxLimit - (currentCount + 1),
    totalLimit: maxLimit,
    retryAfterSeconds: 0,
  };
}

/**
 * Validador de tasa específico para envío de mensajes en el chat:
 * - Máximo 5 mensajes por minuto por usuario
 * - Máximo 15 mensajes por minuto por IP
 */
export function checkChatRateLimit(userId: string): { allowed: boolean; message?: string } {
  const ip = getClientIpFingerprint();

  // 1. Verificación por Usuario (5 msgs/min)
  const userCheck = checkRateLimit(`chat_user_${userId}`, 5, 60);
  if (!userCheck.allowed) {
    return {
      allowed: false,
      message: `Has alcanzado el límite de 5 mensajes por minuto. Por favor espera ${userCheck.retryAfterSeconds} segundos antes de enviar otro mensaje.`,
    };
  }

  // 2. Verificación por IP (15 msgs/min)
  const ipCheck = checkRateLimit(`chat_ip_${ip}`, 15, 60);
  if (!ipCheck.allowed) {
    return {
      allowed: false,
      message: `Límite de actividad excedido desde tu red. Espera ${ipCheck.retryAfterSeconds} segundos.`,
    };
  }

  return { allowed: true };
}

/**
 * Verificación simulada de Cloudflare Turnstile / Google reCAPTCHA v3
 * Genera un token criptográfico no interactivo evaluado por puntaje de riesgo (0.0 a 1.0)
 */
export interface TurnstileVerificationResult {
  success: boolean;
  score: number;
  hostname: string;
  challengeTs: string;
  action: string;
}

export async function verifyTurnstileChallenge(
  action: 'registration' | 'chat_message' | 'resource_download',
  token?: string
): Promise<TurnstileVerificationResult> {
  // Simulación de resolución criptográfica del reto Turnstile / reCAPTCHA
  await new Promise((resolve) => setTimeout(resolve, 200));

  const validToken = Boolean(token && token.length > 10);
  const score = validToken ? 0.95 : 0.88; // Puntaje de humano (> 0.5)

  return {
    success: true,
    score,
    hostname: window.location.hostname,
    challengeTs: new Date().toISOString(),
    action,
  };
}
