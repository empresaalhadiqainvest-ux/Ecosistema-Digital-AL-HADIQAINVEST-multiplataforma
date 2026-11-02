export type NotificationCategory = 'clase' | 'contenido' | 'permisos' | 'bienvenida' | 'sistema';

export interface AppNotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  targetRole: string; // 'all' | 'alumno' | 'admin' | 'aprobador'
  type: string; // 'info' | 'urgent' | 'class' | 'maintenance' | 'welcome'
  targetUserId?: string; // Optional specific user targeting
  readBy?: string[]; // Array of UIDs that read this notification
  actionUrl?: string;
  actionLabel?: string;
  createdAt?: unknown;
}

export type EmailTemplateType = 'bienvenida' | 'clase_en_vivo' | 'nuevo_contenido' | 'cambio_permisos' | 'sistema';

export interface EmailLogItem {
  id: string;
  userId: string;
  toEmail: string;
  toName: string;
  subject: string;
  templateType: EmailTemplateType;
  htmlContent: string;
  plainTextContent?: string;
  status: 'delivered' | 'pending' | 'bounced' | 'opted_out';
  createdAt?: unknown;
}

export interface UserNotificationPreferences {
  userId: string;
  emailLiveClasses: boolean;
  emailNewContent: boolean;
  emailPermissionChanges: boolean;
  emailWeeklyDigest: boolean;
  inAppSound: boolean;
  unsubscribedAll: boolean;
  updatedAt?: unknown;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<UserNotificationPreferences, 'userId'> = {
  emailLiveClasses: true,
  emailNewContent: true,
  emailPermissionChanges: true,
  emailWeeklyDigest: true,
  inAppSound: true,
  unsubscribedAll: false,
};
