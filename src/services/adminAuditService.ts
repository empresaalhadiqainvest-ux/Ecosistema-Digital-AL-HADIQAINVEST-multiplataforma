import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getClientIpFingerprint } from '../utils/botProtection';

export type AdminActionType =
  | 'UPDATE_USER_ROLE'
  | 'UPDATE_USER_STATUS'
  | 'APPROVE_CLASS'
  | 'REJECT_CLASS'
  | 'DELETE_CLASS'
  | 'MUTE_CHAT'
  | 'DELETE_CHAT_MESSAGE'
  | 'ASSIGN_BOOKS'
  | 'ASSIGN_CAPITAL'
  | 'BROADCAST_NOTIFICATION'
  | 'DISPATCH_TRANSACTIONAL_EMAIL'
  | 'GENERATE_BACKUP'
  | 'UPDATE_SECURITY_POLICY';

export interface AdminAuditLogEntry {
  id?: string;
  adminUid: string;
  adminEmail: string;
  actionType: AdminActionType;
  targetType: 'user' | 'class' | 'chat' | 'library' | 'system' | 'security' | 'backup';
  targetId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: unknown;
}

/**
 * Registra una acción administrativa en la base de datos de auditoría inmutable
 */
export async function logAdminAction(params: {
  adminUid: string;
  adminEmail: string;
  actionType: AdminActionType;
  targetType: AdminAuditLogEntry['targetType'];
  targetId?: string;
  details: string;
}): Promise<void> {
  try {
    const ipAddress = getClientIpFingerprint();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Agent';

    await addDoc(collection(db, 'admin_audit_logs'), {
      adminUid: params.adminUid,
      adminEmail: params.adminEmail,
      actionType: params.actionType,
      targetType: params.targetType,
      targetId: params.targetId || 'N/A',
      details: params.details,
      ipAddress,
      userAgent: userAgent.substring(0, 150),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error logging admin action to audit trail:', err);
  }
}

/**
 * Suscribe a los registros de auditoría más recientes para visualización en tiempo real
 */
export function subscribeAdminAuditLogs(
  callback: (logs: AdminAuditLogEntry[]) => void,
  maxLogs = 50
): () => void {
  const q = query(collection(db, 'admin_audit_logs'), orderBy('createdAt', 'desc'), limit(maxLogs));
  return onSnapshot(
    q,
    (snap) => {
      const list: AdminAuditLogEntry[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<AdminAuditLogEntry, 'id'>) });
      });
      callback(list);
    },
    (err) => {
      console.warn('admin_audit_logs subscription error:', err);
    }
  );
}
