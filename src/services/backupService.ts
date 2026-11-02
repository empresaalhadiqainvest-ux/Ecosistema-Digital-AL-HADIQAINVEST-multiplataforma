import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateSha256 } from '../utils/fileSecurityScanner';
import { logAdminAction } from './adminAuditService';

export interface DatabaseBackupSnapshot {
  version: string;
  ecosystem: string;
  createdAt: string;
  createdBy: string;
  sha256Checksum: string;
  summary: {
    usersCount: number;
    classesCount: number;
    libraryResourcesCount: number;
    chatMessagesCount: number;
    downloadLogsCount: number;
    emailLogsCount: number;
  };
  collections: {
    users: unknown[];
    classes: unknown[];
    library_resources: unknown[];
    chat_messages: unknown[];
    download_logs: unknown[];
    email_logs: unknown[];
    system_settings: unknown[];
  };
}

/**
 * Genera una copia de seguridad íntegra de la base de datos con hash criptográfico SHA-256
 */
export async function generateDatabaseBackup(adminUid: string, adminEmail: string): Promise<DatabaseBackupSnapshot> {
  // 1. Recolectar documentos de todas las colecciones principales
  const [
    usersSnap,
    classesSnap,
    librarySnap,
    chatSnap,
    downloadsSnap,
    emailsSnap,
    settingsSnap,
  ] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'classes')),
    getDocs(collection(db, 'library_resources')),
    getDocs(collection(db, 'chat_messages')),
    getDocs(collection(db, 'download_logs')),
    getDocs(collection(db, 'email_logs')),
    getDocs(collection(db, 'system_settings')),
  ]);

  const users: unknown[] = [];
  usersSnap.forEach((d) => users.push({ id: d.id, ...d.data() }));

  const classes: unknown[] = [];
  classesSnap.forEach((d) => classes.push({ id: d.id, ...d.data() }));

  const library_resources: unknown[] = [];
  librarySnap.forEach((d) => library_resources.push({ id: d.id, ...d.data() }));

  const chat_messages: unknown[] = [];
  chatSnap.forEach((d) => chat_messages.push({ id: d.id, ...d.data() }));

  const download_logs: unknown[] = [];
  downloadsSnap.forEach((d) => download_logs.push({ id: d.id, ...d.data() }));

  const email_logs: unknown[] = [];
  emailsSnap.forEach((d) => email_logs.push({ id: d.id, ...d.data() }));

  const system_settings: unknown[] = [];
  settingsSnap.forEach((d) => system_settings.push({ id: d.id, ...d.data() }));

  const nowIso = new Date().toISOString();

  // 2. Pre-snapshot sin hash
  const rawDataToHash = JSON.stringify({
    users,
    classes,
    library_resources,
    chat_messages,
    download_logs,
  });

  const encoder = new TextEncoder();
  const sha256Checksum = await calculateSha256(encoder.encode(rawDataToHash).buffer);

  const snapshot: DatabaseBackupSnapshot = {
    version: '1.4.0',
    ecosystem: 'AL-HADIQA INVEST & CAPITAL',
    createdAt: nowIso,
    createdBy: `${adminEmail} (${adminUid})`,
    sha256Checksum,
    summary: {
      usersCount: users.length,
      classesCount: classes.length,
      libraryResourcesCount: library_resources.length,
      chatMessagesCount: chat_messages.length,
      downloadLogsCount: download_logs.length,
      emailLogsCount: email_logs.length,
    },
    collections: {
      users,
      classes,
      library_resources,
      chat_messages,
      download_logs,
      email_logs,
      system_settings,
    },
  };

  // 3. Registrar acción en el registro inmutable de auditoría
  await logAdminAction({
    adminUid,
    adminEmail,
    actionType: 'GENERATE_BACKUP',
    targetType: 'backup',
    details: `Generado respaldo snapshot íntegro (Checksum SHA-256: ${sha256Checksum.substring(0, 16)}...). Registros: ${users.length} usuarios, ${classes.length} clases, ${library_resources.length} libros.`,
  });

  return snapshot;
}

/**
 * Descarga el snapshot como un archivo .json estructurado y firmado
 */
export function triggerBackupDownload(snapshot: DatabaseBackupSnapshot): void {
  const jsonContent = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  link.href = url;
  link.download = `al_hadiqa_backup_snapshot_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
