/**
 * Servicio de Enlaces Firmados y de Corta Duración (Signed Short-Lived URLs)
 * Genera y valida tokens criptográficos HMAC con tiempo de expiración estricto (15 minutos).
 */

const SECRET_SIGNING_SALT = 'al_hadiqa_secure_download_salt_2026_smc_secret';

export interface SignedTokenPayload {
  resourceId: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export interface SignedUrlResult {
  signedUrl: string;
  token: string;
  expiresAt: Date;
  expiresInMinutes: number;
}

/**
 * Computa una firma HMAC simple usando SHA-256
 */
async function computeSignature(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_SIGNING_SALT),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(message));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

/**
 * Genera un enlace firmado criptográficamente válido por un tiempo determinado (por defecto 15 min)
 */
export async function generateSignedDownloadUrl(
  resourceId: string,
  userId: string,
  ttlMinutes = 15
): Promise<SignedUrlResult> {
  const now = Date.now();
  const expiresAtMs = now + ttlMinutes * 60 * 1000;
  const nonce = Math.random().toString(36).substring(2, 10);

  const payload: SignedTokenPayload = {
    resourceId,
    userId,
    issuedAt: now,
    expiresAt: expiresAtMs,
    nonce,
  };

  const payloadString = JSON.stringify(payload);
  const encodedPayload = btoa(payloadString);
  const signature = await computeSignature(encodedPayload);

  const token = `${encodedPayload}.${signature}`;
  const signedUrl = `${window.location.origin}/#download?resourceId=${encodeURIComponent(resourceId)}&token=${encodeURIComponent(token)}`;

  return {
    signedUrl,
    token,
    expiresAt: new Date(expiresAtMs),
    expiresInMinutes: ttlMinutes,
  };
}

/**
 * Valida un token firmado verificando firma, integridad y tiempo de expiración
 */
export async function validateSignedDownloadToken(
  token: string,
  currentUserId: string
): Promise<{ valid: boolean; resourceId?: string; error?: string }> {
  try {
    if (!token || !token.includes('.')) {
      return { valid: false, error: 'Token firmado inválido o malformado.' };
    }

    const [encodedPayload, signature] = token.split('.');
    const expectedSignature = await computeSignature(encodedPayload);

    // 1. Verificación de firma criptográfica
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Firma criptográfica inválida. El enlace ha sido manipulado.' };
    }

    // 2. Decodificación del payload
    const payloadJson = atob(encodedPayload);
    const payload: SignedTokenPayload = JSON.parse(payloadJson);

    // 3. Verificación de expiración temporal (15 min)
    if (Date.now() > payload.expiresAt) {
      const expiredAgoMinutes = Math.round((Date.now() - payload.expiresAt) / 60000);
      return {
        valid: false,
        error: `El enlace firmado ha expirado hace ${expiredAgoMinutes} minuto(s). Genera un nuevo enlace desde la biblioteca.`,
      };
    }

    // 4. Verificación de pertenencia de usuario (enlace intransferible)
    if (payload.userId !== currentUserId) {
      return {
        valid: false,
        error: 'Este enlace firmado pertenece a otra cuenta de alumno y es intransferible.',
      };
    }

    return { valid: true, resourceId: payload.resourceId };
  } catch (err) {
    return { valid: false, error: 'Error procesando la firma del enlace: ' + String(err) };
  }
}
