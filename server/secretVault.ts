import crypto from 'crypto';

export interface SigningKeyRecord {
  kid: string;
  keyHex: string;
  createdAt: string;
  expiresAt: string;
  source: 'env' | 'ephemeral-csprng';
}

export interface SecretVaultStatus {
  activeKid: string;
  previousKid: string | null;
  rotationCount: number;
  lastRotatedAt: string;
  nextScheduledRotationAt: string;
  keySource: 'env' | 'ephemeral-csprng';
  envSecretsPresent: {
    SESSION_HMAC_SECRET: boolean;
    STREAM_HMAC_SECRET: boolean;
    BACKUP_SIGNING_SECRET: boolean;
    GEMINI_API_KEY: boolean;
  };
}

const KEY_ROTATION_INTERVAL_MS = 12 * 60 * 60 * 1000; // Rotación automática cada 12 horas

function isRealEnvSecret(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed.length < 16) return false;
  if (trimmed.includes('YOUR_') || trimmed.includes('REPLACE_ME') || trimmed.includes('changeme')) {
    return false;
  }
  return true;
}

class SecretVaultService {
  private currentKey: SigningKeyRecord;
  private previousKey: SigningKeyRecord | null = null;
  private rotationCount = 0;

  constructor() {
    this.currentKey = this.generateKeyRecord(process.env.SESSION_HMAC_SECRET);
  }

  private generateKeyRecord(envSeed?: string): SigningKeyRecord {
    const now = Date.now();
    const useEnv = isRealEnvSecret(envSeed);
    const keyHex = useEnv
      ? crypto.createHash('sha256').update(envSeed!.trim()).digest('hex')
      : crypto.randomBytes(32).toString('hex');

    return {
      kid: `kid-${now.toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
      keyHex,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + KEY_ROTATION_INTERVAL_MS).toISOString(),
      source: useEnv ? 'env' : 'ephemeral-csprng',
    };
  }

  public getActiveSigningKey(): SigningKeyRecord {
    // Rotación automática si expiró el intervalo de validez de clave
    if (Date.now() >= new Date(this.currentKey.expiresAt).getTime()) {
      this.rotateKeys('automatic-ttl-expiry');
    }
    return this.currentKey;
  }

  public getKeyById(kid?: string): SigningKeyRecord | null {
    const active = this.getActiveSigningKey();
    if (!kid || kid === active.kid) return active;
    if (this.previousKey && this.previousKey.kid === kid) return this.previousKey;
    return null;
  }

  public getStreamHmacSecret(): string {
    if (isRealEnvSecret(process.env.STREAM_HMAC_SECRET)) {
      return process.env.STREAM_HMAC_SECRET!.trim();
    }
    return this.getActiveSigningKey().keyHex;
  }

  public getBackupSigningSecret(): string {
    if (isRealEnvSecret(process.env.BACKUP_SIGNING_SECRET)) {
      return process.env.BACKUP_SIGNING_SECRET!.trim();
    }
    return this.getActiveSigningKey().keyHex;
  }

  public rotateKeys(_reason = 'manual-or-scheduled'): SecretVaultStatus {
    this.previousKey = { ...this.currentKey };
    // Al rotar explícitamente, generamos una nueva clave CSPRNG derivada para invalidar firmas antiguas tras ventana de gracia
    const now = Date.now();
    const derivedMaterial = crypto.randomBytes(32).toString('hex');
    this.currentKey = {
      kid: `kid-${now.toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
      keyHex: derivedMaterial,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + KEY_ROTATION_INTERVAL_MS).toISOString(),
      source: 'ephemeral-csprng',
    };
    this.rotationCount += 1;
    return this.getPublicStatus();
  }

  public getPublicStatus(): SecretVaultStatus {
    const active = this.getActiveSigningKey();
    return {
      activeKid: active.kid,
      previousKid: this.previousKey ? this.previousKey.kid : null,
      rotationCount: this.rotationCount,
      lastRotatedAt: active.createdAt,
      nextScheduledRotationAt: active.expiresAt,
      keySource: active.source,
      envSecretsPresent: {
        SESSION_HMAC_SECRET: isRealEnvSecret(process.env.SESSION_HMAC_SECRET),
        STREAM_HMAC_SECRET: isRealEnvSecret(process.env.STREAM_HMAC_SECRET),
        BACKUP_SIGNING_SECRET: isRealEnvSecret(process.env.BACKUP_SIGNING_SECRET),
        GEMINI_API_KEY: Boolean(
          process.env.GEMINI_API_KEY &&
            process.env.GEMINI_API_KEY.trim() !== '' &&
            !process.env.GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY')
        ),
      },
    };
  }
}

export const secretVault = new SecretVaultService();
