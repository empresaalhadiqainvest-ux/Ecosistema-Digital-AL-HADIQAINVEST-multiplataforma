import {
  DAILY_PERSONAL_DEV_MESSAGES,
  DailyPersonalDevMessage,
} from '../data/dailyPersonalDevMessages';

const STORAGE_KEYS = {
  ENABLED: 'al_hadiqa_daily_dev_enabled',
  LAST_DATE: 'al_hadiqa_daily_dev_last_date',
  TODAY_MSG_ID: 'al_hadiqa_daily_dev_today_msg_id',
  HISTORY_IDS: 'al_hadiqa_daily_dev_history_ids',
  PWA_INSTALLED: 'al_hadiqa_pwa_installed',
  PROMPT_DISMISSED_DATE: 'al_hadiqa_daily_dev_prompt_dismissed',
};

export interface DailyPersonalDevStatus {
  enabled: boolean;
  isInstalledOrStandalone: boolean;
  permission: NotificationPermission | 'unsupported';
  todayKey: string;
  deliveredToday: boolean;
  todayMessage: DailyPersonalDevMessage;
}

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isAppInstalledOrStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    nav.standalone === true;
  if (standalone) {
    try {
      localStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
    } catch {
      // ignore
    }
    return true;
  }
  try {
    return localStorage.getItem(STORAGE_KEYS.PWA_INSTALLED) === 'true';
  } catch {
    return false;
  }
}

export function markAppAsInstalled(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PWA_INSTALLED, 'true');
  } catch {
    // ignore
  }
}

export function isDailyPersonalDevEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setDailyPersonalDevEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ENABLED, String(enabled));
  } catch {
    // ignore
  }
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

function getHistoryIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY_IDS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistoryIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY_IDS, JSON.stringify(ids.slice(-30)));
  } catch {
    // ignore
  }
}

function pickNextUnseenMessage(excludeId?: string): DailyPersonalDevMessage {
  const history = getHistoryIds();
  let pool = DAILY_PERSONAL_DEV_MESSAGES.filter(
    (m) => m.id !== excludeId && !history.includes(m.id)
  );

  // If all messages were seen recently, reset history except the immediate previous one
  if (pool.length === 0) {
    pool = DAILY_PERSONAL_DEV_MESSAGES.filter((m) => m.id !== excludeId);
    saveHistoryIds(excludeId ? [excludeId] : []);
  }

  // Deterministic-feeling yet varied selection across days + randomness
  const idx = Math.floor(Math.random() * pool.length);
  const chosen = pool[idx] || DAILY_PERSONAL_DEV_MESSAGES[0];

  const updatedHistory = [...getHistoryIds().filter((id) => id !== chosen.id), chosen.id];
  saveHistoryIds(updatedHistory);
  return chosen;
}

export function getTodayPersonalDevMessage(): DailyPersonalDevMessage {
  const todayKey = getTodayDateKey();
  try {
    const savedDate = localStorage.getItem(STORAGE_KEYS.LAST_DATE);
    const savedId = localStorage.getItem(STORAGE_KEYS.TODAY_MSG_ID);

    if (savedDate === todayKey && savedId) {
      const found = DAILY_PERSONAL_DEV_MESSAGES.find((m) => m.id === savedId);
      if (found) return found;
    }

    const chosen = pickNextUnseenMessage(savedId || undefined);
    localStorage.setItem(STORAGE_KEYS.TODAY_MSG_ID, chosen.id);
    return chosen;
  } catch {
    return DAILY_PERSONAL_DEV_MESSAGES[0];
  }
}

export function rotateDailyPersonalDevMessage(): DailyPersonalDevMessage {
  const current = getTodayPersonalDevMessage();
  const next = pickNextUnseenMessage(current.id);
  try {
    localStorage.setItem(STORAGE_KEYS.TODAY_MSG_ID, next.id);
  } catch {
    // ignore
  }
  return next;
}

export function wasDailyNotificationDeliveredToday(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_DATE) === getTodayDateKey();
  } catch {
    return false;
  }
}

export function getDailyPersonalDevStatus(): DailyPersonalDevStatus {
  return {
    enabled: isDailyPersonalDevEnabled(),
    isInstalledOrStandalone: isAppInstalledOrStandalone(),
    permission: getNotificationPermissionState(),
    todayKey: getTodayDateKey(),
    deliveredToday: wasDailyNotificationDeliveredToday(),
    todayMessage: getTodayPersonalDevMessage(),
  };
}

export function dismissDailyPromptForToday(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROMPT_DISMISSED_DATE, getTodayDateKey());
  } catch {
    // ignore
  }
}

export function isDailyPromptDismissedToday(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.PROMPT_DISMISSED_DATE) === getTodayDateKey();
  } catch {
    return false;
  }
}

async function dispatchOsNotification(msg: DailyPersonalDevMessage): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (window.Notification.permission !== 'granted') return false;

  const title = `🦁 ${msg.title} · ${msg.pillar}`;
  const body = `${msg.message}\n\n🎯 ${msg.dailyAction} — ${msg.mentor}`;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `alhadiqa-daily-dev-${getTodayDateKey()}`,
          renotify: true,
          data: { url: '/#dashboard-estudiantes', messageId: msg.id },
        } as NotificationOptions);
        return true;
      }
    }

    const notif = new window.Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag: `alhadiqa-daily-dev-${getTodayDateKey()}`,
    });
    notif.onclick = () => {
      window.focus();
      const el = document.getElementById('dashboard-estudiantes');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    return true;
  } catch {
    return false;
  }
}

export function broadcastInAppDailyNotification(msg: DailyPersonalDevMessage, showToast = true): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('al_hadiqa_daily_dev_notification', {
      detail: {
        message: msg,
        dateKey: getTodayDateKey(),
        showToast,
        deliveredAt: new Date().toISOString(),
      },
    })
  );
}

/**
 * Envía la dosis diaria de desarrollo personal:
 * - Si está instalada la app (o force=true) y no se envió hoy, elige un mensaje nuevo variado.
 * - Lo envía por Service Worker / Notification API del sistema si el permiso es 'granted'.
 * - Lo inyecta siempre en el Centro de Notificaciones dentro de la App y dispara el toast discreto.
 */
export async function deliverDailyPersonalDevNotification(options?: {
  force?: boolean;
  rotate?: boolean;
  showToast?: boolean;
}): Promise<{ delivered: boolean; osNotified: boolean; message: DailyPersonalDevMessage }> {
  const { force = false, rotate = false, showToast = true } = options || {};
  const enabled = isDailyPersonalDevEnabled();
  const currentMsg = rotate ? rotateDailyPersonalDevMessage() : getTodayPersonalDevMessage();

  if (!enabled && !force) {
    return { delivered: false, osNotified: false, message: currentMsg };
  }

  const alreadyDeliveredToday = wasDailyNotificationDeliveredToday();
  if (alreadyDeliveredToday && !force && !rotate) {
    return { delivered: false, osNotified: false, message: currentMsg };
  }

  const msg = rotate ? currentMsg : getTodayPersonalDevMessage();
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_DATE, getTodayDateKey());
    localStorage.setItem(STORAGE_KEYS.TODAY_MSG_ID, msg.id);
  } catch {
    // ignore
  }

  const osNotified = await dispatchOsNotification(msg);
  broadcastInAppDailyNotification(msg, showToast);

  return { delivered: true, osNotified, message: msg };
}

/**
 * Solicita permiso de notificaciones del dispositivo (idealmente tras instalar la app o clic del usuario)
 * y envía inmediatamente la primera dosis diaria de desarrollo personal.
 */
export async function requestPermissionAndDeliverDailyDev(): Promise<{
  permission: NotificationPermission | 'unsupported';
  osNotified: boolean;
  message: DailyPersonalDevMessage;
}> {
  setDailyPersonalDevEnabled(true);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    const res = await deliverDailyPersonalDevNotification({ force: true, showToast: true });
    return { permission: 'unsupported', osNotified: false, message: res.message };
  }

  let permission = window.Notification.permission;
  if (permission === 'default') {
    try {
      permission = await window.Notification.requestPermission();
    } catch {
      permission = window.Notification.permission;
    }
  }

  const res = await deliverDailyPersonalDevNotification({ force: true, showToast: true });
  return {
    permission,
    osNotified: res.osNotified,
    message: res.message,
  };
}
