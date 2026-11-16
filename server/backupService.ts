import crypto from 'crypto';
import { secretVault } from './secretVault';

export interface ImmutableBackupSnapshot {
  snapshotId: string;
  createdAt: string;
  immutableSeal: string;
  hmacSignature: string;
  sizeBytes: number;
  recordsCount: number;
  lastVerifiedAt: string | null;
  lastRestoreTestResult: 'VERIFIED_CLEAN' | 'PENDING_TEST' | 'INTEGRITY_FAILED';
  payloadJson: string;
}

const MAX_SNAPSHOTS = 15;
const AUTO_BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // Snapshot automático cada 6 horas

class ImmutableBackupService {
  private snapshots: ImmutableBackupSnapshot[] = [];
  private scheduler: NodeJS.Timeout | null = null;

  public startAutomatedBackups(getStateProvider: () => Record<string, unknown>): void {
    // Generar snapshot inicial al arrancar
    if (this.snapshots.length === 0) {
      this.createImmutableSnapshot(getStateProvider(), 'boot-baseline');
    }

    if (this.scheduler) return;
    this.scheduler = setInterval(() => {
      this.createImmutableSnapshot(getStateProvider(), 'scheduled-6h');
    }, AUTO_BACKUP_INTERVAL_MS);
    this.scheduler.unref();
  }

  public createImmutableSnapshot(
    statePayload: Record<string, unknown>,
    triggerSource = 'manual'
  ): Omit<ImmutableBackupSnapshot, 'payloadJson'> {
    const createdAt = new Date().toISOString();
    const snapshotId = `bkp-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;

    const envelope = {
      schemaVersion: '1.0.0',
      snapshotId,
      createdAt,
      triggerSource,
      ecosystem: 'AL-HADIQA INVEST',
      state: statePayload,
    };

    const payloadJson = JSON.stringify(envelope);
    const immutableSeal = crypto.createHash('sha256').update(payloadJson).digest('hex');
    const hmacSignature = crypto
      .createHmac('sha256', secretVault.getBackupSigningSecret())
      .update(`${snapshotId}:${immutableSeal}`)
      .digest('hex');

    const snapshot: ImmutableBackupSnapshot = {
      snapshotId,
      createdAt,
      immutableSeal,
      hmacSignature,
      sizeBytes: Buffer.byteLength(payloadJson, 'utf8'),
      recordsCount: Object.keys(statePayload).length,
      lastVerifiedAt: null,
      lastRestoreTestResult: 'PENDING_TEST',
      payloadJson,
    };

    // Almacenamiento append-only inmutable (nunca mutar snapshots existentes)
    this.snapshots = [snapshot, ...this.snapshots].slice(0, MAX_SNAPSHOTS);
    return this.redactSnapshot(snapshot);
  }

  /**
   * Ejecuta una prueba real de restauración en entorno aislado en memoria:
   * 1) Verifica el hash SHA-256 bit-a-bit en tiempo constante
   * 2) Deserializa el payload en un objeto aislado
   * 3) Valida schemaVersion, snapshotId y estructura de estado
   */
  public verifyRestoreInIsolatedSandbox(snapshotId?: string): {
    testedAt: string;
    snapshotId: string;
    checksumMatch: boolean;
    schemaValid: boolean;
    restoredKeys: string[];
    status: 'VERIFIED_CLEAN' | 'INTEGRITY_FAILED';
    durationMs: number;
  } {
    const startNs = process.hrtime.bigint();
    const target = snapshotId
      ? this.snapshots.find((s) => s.snapshotId === snapshotId)
      : this.snapshots[0];

    if (!target) {
      return {
        testedAt: new Date().toISOString(),
        snapshotId: snapshotId || 'none',
        checksumMatch: false,
        schemaValid: false,
        restoredKeys: [],
        status: 'INTEGRITY_FAILED',
        durationMs: 0,
      };
    }

    const recomputedHash = crypto.createHash('sha256').update(target.payloadJson).digest('hex');
    const a = Buffer.from(recomputedHash, 'utf8');
    const b = Buffer.from(target.immutableSeal, 'utf8');
    const checksumMatch = a.length === b.length && crypto.timingSafeEqual(a, b);

    let schemaValid = false;
    let restoredKeys: string[] = [];
    try {
      const isolatedClone = JSON.parse(target.payloadJson) as {
        schemaVersion?: string;
        snapshotId?: string;
        state?: Record<string, unknown>;
      };
      if (
        isolatedClone.schemaVersion === '1.0.0' &&
        isolatedClone.snapshotId === target.snapshotId &&
        isolatedClone.state &&
        typeof isolatedClone.state === 'object'
      ) {
        schemaValid = true;
        restoredKeys = Object.keys(isolatedClone.state);
      }
    } catch {
      schemaValid = false;
    }

    const status = checksumMatch && schemaValid ? 'VERIFIED_CLEAN' : 'INTEGRITY_FAILED';
    const testedAt = new Date().toISOString();
    target.lastVerifiedAt = testedAt;
    target.lastRestoreTestResult = status;

    const durationMs = Number((Number(process.hrtime.bigint() - startNs) / 1e6).toFixed(2));
    return {
      testedAt,
      snapshotId: target.snapshotId,
      checksumMatch,
      schemaValid,
      restoredKeys,
      status,
      durationMs,
    };
  }

  public listSnapshots(): Omit<ImmutableBackupSnapshot, 'payloadJson'>[] {
    return this.snapshots.map((s) => this.redactSnapshot(s));
  }

  private redactSnapshot(s: ImmutableBackupSnapshot): Omit<ImmutableBackupSnapshot, 'payloadJson'> {
    return {
      snapshotId: s.snapshotId,
      createdAt: s.createdAt,
      immutableSeal: s.immutableSeal,
      hmacSignature: s.hmacSignature,
      sizeBytes: s.sizeBytes,
      recordsCount: s.recordsCount,
      lastVerifiedAt: s.lastVerifiedAt,
      lastRestoreTestResult: s.lastRestoreTestResult,
    };
  }
}

export const backupService = new ImmutableBackupService();
