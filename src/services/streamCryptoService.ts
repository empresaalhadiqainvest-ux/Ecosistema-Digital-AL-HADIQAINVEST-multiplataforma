/**
 * Servicio de Cifrado de Transmisiones en Vivo y Protección Anti-Ciberataques
 * Implementa WebCrypto AES-256-GCM, firmas HMAC-SHA256 efímeras,
 * validación estricta de URLs de streaming (anti-XSS/hijacking) y conexión con SOC EXCAISRES.
 */

import { socService } from './socService';

export interface StreamSecuritySession {
  sessionId: string;
  classId: string;
  cipherSuite: string;
  keyFingerprint: string;
  hmacSignature: string;
  issuedAt: string;
  expiresAt: string;
  aesKey: CryptoKey;
  verifiedByServer: boolean;
}

export interface StreamUrlValidationResult {
  valid: boolean;
  sanitizedUrl: string;
  reason?: string;
}

const TRUSTED_STREAM_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'tiktok.com',
  'www.tiktok.com',
  'vm.tiktok.com',
  'twitch.tv',
  'www.twitch.tv',
  'player.twitch.tv',
  'vimeo.com',
  'player.vimeo.com',
  'facebook.com',
  'www.facebook.com',
  'fb.watch',
];

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Genera una clave efímera AES-256-GCM en WebCrypto, calcula su huella SHA-256
 * y obtiene una firma HMAC-SHA256 del servidor para autenticar la transmisión en vivo.
 */
export async function initializeEncryptedBroadcastSession(
  classId: string,
  hostUid?: string
): Promise<StreamSecuritySession> {
  const subtle = window.crypto?.subtle;
  const sessionId = `sec-stream-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  if (!subtle) {
    throw new Error('WebCrypto API no disponible en este navegador para cifrado AES-256-GCM.');
  }

  // 1. Generar clave simétrica AES-256-GCM (256 bits reales)
  const aesKey = await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Exportar en bruto únicamente para calcular huella SHA-256 verificable
  const rawKey = await subtle.exportKey('raw', aesKey);
  const digest = await subtle.digest('SHA-256', rawKey);
  const keyFingerprint = bufferToHex(digest).slice(0, 24).toUpperCase();

  // 3. Solicitar firma HMAC-SHA256 al backend (/api/stream/security-token)
  let hmacSignature = '';
  let issuedAt = new Date().toISOString();
  let expiresAt = new Date(Date.now() + 1000 * 60 * 120).toISOString();
  let cipherSuite = 'TLS-1.3 / DTLS-SRTP / AES-256-GCM';
  let verifiedByServer = false;

  try {
    const response = await fetch('/api/stream/security-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classId,
        hostUid: hostUid || 'admin-host',
        keyFingerprint,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        sessionId?: string;
        signature?: string;
        issuedAt?: string;
        expiresAt?: string;
        cipherSuite?: string;
      };
      if (data.signature) {
        hmacSignature = data.signature;
        issuedAt = data.issuedAt || issuedAt;
        expiresAt = data.expiresAt || expiresAt;
        cipherSuite = data.cipherSuite || cipherSuite;
        verifiedByServer = true;
      }
    }
  } catch {
    // Respaldo criptográfico local si la API no responde temporalmente
  }

  if (!hmacSignature) {
    const fallbackMaterial = new TextEncoder().encode(`${sessionId}:${classId}:${keyFingerprint}`);
    const fallbackDigest = await subtle.digest('SHA-256', fallbackMaterial);
    hmacSignature = bufferToHex(fallbackDigest);
  }

  return {
    sessionId,
    classId,
    cipherSuite,
    keyFingerprint,
    hmacSignature,
    issuedAt,
    expiresAt,
    aesKey,
    verifiedByServer,
  };
}

/**
 * Cifra paquetes de señalización o metadatos de sala en vivo con AES-256-GCM
 */
export async function encryptStreamPayload(
  aesKey: CryptoKey,
  payload: Record<string, unknown>
): Promise<{ ciphertext: string; iv: string; algorithm: 'AES-256-GCM' }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recomendado para GCM
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoded
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
    algorithm: 'AES-256-GCM',
  };
}

/**
 * Descifra paquetes de señalización de transmisión en vivo con AES-256-GCM
 */
export async function decryptStreamPayload<T = Record<string, unknown>>(
  aesKey: CryptoKey,
  ciphertextB64: string,
  ivB64: string
): Promise<T> {
  const iv = base64ToUint8Array(ivB64);
  const cipherBytes = base64ToUint8Array(ciphertextB64);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    aesKey,
    cipherBytes.buffer as ArrayBuffer
  );

  return JSON.parse(new TextDecoder().decode(decrypted)) as T;
}

/**
 * Valida y endurece URLs de transmisiones en vivo contra XSS, secuestro de iframe e HTTP inseguro.
 * Si detecta un payload hostil, dispara la mitigación automática de SOC EXCAISRES.
 */
export function verifyStreamUrlIntegrity(rawUrl: string): StreamUrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, sanitizedUrl: '', reason: 'URL de transmisión vacía.' };
  }

  const trimmed = rawUrl.trim();

  // 1. Inspección heurística de inyección contra XSS / SQLi
  const threat = socService.inspectPayload(trimmed);
  if (threat.isThreat && threat.vector) {
    socService.detectAndMitigate({
      attackVector: threat.vector,
      severity: 'CRITICAL',
      targetEndpoint: '/streaming/broadcast-url',
      payloadSample: threat.sample || trimmed.slice(0, 100),
      details: 'Intento de inyección maliciosa detectado en enlace de transmisión en vivo.',
    });
    return {
      valid: false,
      sanitizedUrl: '',
      reason: `Bloqueado por SOC EXCAISRES: firma sospechosa (${threat.vector}).`,
    };
  }

  // 2. Bloqueo estricto de esquemas peligrosos
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    socService.detectAndMitigate({
      attackVector: 'XSS_ATTACK',
      severity: 'CRITICAL',
      targetEndpoint: '/streaming/broadcast-url',
      payloadSample: trimmed.slice(0, 100),
      details: 'Esquema URI peligroso bloqueado en reproductor en vivo.',
    });
    return {
      valid: false,
      sanitizedUrl: '',
      reason: 'Esquema de URL prohibido por política de seguridad.',
    };
  }

  // 3. Permitir WebRTC directo o IDs seguros de YouTube (11 caracteres)
  if (trimmed === 'webrtc_direct' || trimmed.startsWith('webrtc://') || /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { valid: true, sanitizedUrl: trimmed };
  }

  // 4. Forzar HTTPS (actualizar http:// -> https://) y validar hostname confiable
  const upgraded = trimmed.replace(/^http:\/\//i, 'https://');
  try {
    const parsed = new URL(upgraded.startsWith('https://') ? upgraded : `https://${upgraded}`);
    const host = parsed.hostname.toLowerCase();
    const isTrusted = TRUSTED_STREAM_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );

    if (!isTrusted) {
      return {
        valid: false,
        sanitizedUrl: '',
        reason: `Dominio de transmisión no autorizado (${host}). Solo se permiten plataformas verificadas bajo HTTPS.`,
      };
    }

    return { valid: true, sanitizedUrl: parsed.toString() };
  } catch {
    return {
      valid: false,
      sanitizedUrl: '',
      reason: 'Formato de URL de transmisión inválido.',
    };
  }
}
