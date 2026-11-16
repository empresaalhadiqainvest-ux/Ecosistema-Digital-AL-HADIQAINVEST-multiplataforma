import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { AppNotificationItem, EmailLogItem } from '../types/notifications';
import { EmailViewerModal } from './EmailViewerModal';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { DailyPersonalDevMessage } from '../data/dailyPersonalDevMessages';
import {
  deliverDailyPersonalDevNotification,
  getTodayPersonalDevMessage,
  isAppInstalledOrStandalone,
  isDailyPersonalDevEnabled,
} from '../services/dailyPersonalDevService';

export const NotificationCenter: React.FC = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'emails'>('notifications');
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailLogItem | null>(null);
  const [isPrefsOpen, setIsPrefsOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load read state from localStorage
  useEffect(() => {
    if (!currentUser?.uid) return;
    const saved = localStorage.getItem(`al_hadiqa_read_notifs_${currentUser.uid}`);
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, [currentUser]);

  // Click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Listen to in-app notifications
  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(25));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: AppNotificationItem[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...(d.data() as Omit<AppNotificationItem, 'id'>) });
        });
        setNotifications(items);
      },
      (err) => {
        console.warn('Notifications listener:', err.message);
      }
    );

    return () => unsub();
  }, []);

  // Escuchar alertas instantáneas de transmisión (TikTok @alhadiqa.capital / YouTube) en la sesión actual
  useEffect(() => {
    const handleLiveChannelAlert = (event: Event) => {
      const detail = (event as CustomEvent<{
        id: string;
        platform: 'tiktok' | 'youtube';
        title: string;
        message: string;
        url: string;
        detectedAt: string;
      }>).detail;
      if (!detail?.id) return;

      setNotifications((prev) => {
        if (prev.some((item) => item.id === detail.id)) return prev;
        const injected: AppNotificationItem = {
          id: detail.id,
          title: detail.title,
          message: detail.message,
          category: 'clase',
          targetRole: 'all',
          type: 'class',
          actionUrl: detail.url,
          actionLabel: detail.platform === 'tiktok' ? 'Ver en TikTok ↗' : 'Ir a Streaming',
          createdAt: detail.detectedAt || new Date().toISOString(),
        };
        return [injected, ...prev].slice(0, 30);
      });
    };

    window.addEventListener('al_hadiqa_channel_alert', handleLiveChannelAlert);
    return () => window.removeEventListener('al_hadiqa_channel_alert', handleLiveChannelAlert);
  }, []);

  // Escuchar e incluir notificaciones diarias de desarrollo personal (Brian Tracy y mentores)
  useEffect(() => {
    const injectDailyDevItem = (msg: DailyPersonalDevMessage, dateKey?: string) => {
      const notifId = `daily-dev-${msg.id}-${dateKey || new Date().toISOString().slice(0, 10)}`;
      const injected: AppNotificationItem = {
        id: notifId,
        title: `✨ ${msg.title} (${msg.pillar})`,
        message: `${msg.message} — Reto: ${msg.dailyAction} [${msg.mentor}]`,
        category: 'contenido',
        targetRole: 'all',
        type: 'info',
        actionUrl: '#dashboard-estudiantes',
        actionLabel: 'Ver en Dashboard →',
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => {
        if (prev.some((item) => item.id === notifId)) return prev;
        return [injected, ...prev].slice(0, 30);
      });
    };

    if (isAppInstalledOrStandalone() && isDailyPersonalDevEnabled()) {
      injectDailyDevItem(getTodayPersonalDevMessage());
    }

    const handleDailyDevEvent = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          message: DailyPersonalDevMessage;
          dateKey?: string;
        }>
      ).detail;
      if (detail?.message) {
        injectDailyDevItem(detail.message, detail.dateKey);
      }
    };

    window.addEventListener('al_hadiqa_daily_dev_notification', handleDailyDevEvent);
    return () => window.removeEventListener('al_hadiqa_daily_dev_notification', handleDailyDevEvent);
  }, []);

  // Listen to transactional email logs for this user
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(collection(db, 'email_logs'), orderBy('createdAt', 'desc'), limit(25));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: EmailLogItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Omit<EmailLogItem, 'id'>;
          if (data.userId === currentUser.uid || data.toEmail?.toLowerCase() === currentUser.email?.toLowerCase()) {
            items.push({ id: d.id, ...data });
          }
        });
        setEmailLogs(items);
      },
      (err) => {
        console.warn('Email logs listener:', err.message);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // Calculate unread count
  const unreadNotifications = notifications.filter((n) => {
    if (currentUser?.uid && n.readBy?.includes(currentUser.uid)) return false;
    return !readIds.includes(n.id);
  });

  const unreadCount = unreadNotifications.length;

  const markAsRead = async (notificationId: string) => {
    if (!readIds.includes(notificationId)) {
      const updated = [...readIds, notificationId];
      setReadIds(updated);
      if (currentUser?.uid) {
        localStorage.setItem(`al_hadiqa_read_notifs_${currentUser.uid}`, JSON.stringify(updated));
        try {
          await updateDoc(doc(db, 'notifications', notificationId), {
            readBy: arrayUnion(currentUser.uid),
          });
        } catch {
          // offline or permission
        }
      }
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    if (currentUser?.uid) {
      localStorage.setItem(`al_hadiqa_read_notifs_${currentUser.uid}`, JSON.stringify(allIds));
    }
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'clase':
        return { label: 'Clase en Vivo', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', icon: '🔴' };
      case 'contenido':
        return { label: 'Contenido', bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)', icon: '📚' };
      case 'permisos':
        return { label: 'Permisos', bg: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', icon: '🔑' };
      case 'bienvenida':
        return { label: 'Bienvenida', bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--gold)', icon: '🎓' };
      default:
        return { label: 'Aviso', bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--muted)', icon: '📢' };
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir centro de notificaciones"
        style={{
          position: 'relative',
          background: isOpen ? 'rgba(245, 158, 11, 0.18)' : 'rgba(148, 163, 184, 0.08)',
          border: `1px solid ${isOpen ? 'var(--gold)' : 'var(--line)'}`,
          color: isOpen ? 'var(--gold)' : 'var(--text)',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '1.05rem',
          transition: 'all 0.2s ease',
        }}
      >
        <span>🔔</span>

        {/* Counter Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '999px',
              padding: '0.1rem 0.35rem',
              fontSize: '0.68rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.5)',
              border: '2px solid var(--surface)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 'clamp(320px, 90vw, 420px)',
            maxHeight: '520px',
            background: 'linear-gradient(170deg, var(--surface-2), var(--surface))',
            border: '1px solid var(--line-strong)',
            borderRadius: '12px',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.7)',
            zIndex: 1050,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--line)',
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🔔</span> Centro de Notificaciones
              </strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                {unreadCount} sin leer · Avisos oficiales
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--emerald)',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Leídas ✓
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPrefsOpen(true)}
                title="Preferencias de notificación"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Sub-tab Switcher: Notifications vs Emails */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--line)',
              background: 'var(--surface-3)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                background: activeTab === 'notifications' ? 'transparent' : 'rgba(0,0,0,0.2)',
                color: activeTab === 'notifications' ? 'var(--gold)' : 'var(--muted)',
                fontWeight: activeTab === 'notifications' ? 700 : 500,
                fontSize: '0.78rem',
                borderBottom: activeTab === 'notifications' ? '2px solid var(--gold)' : 'none',
                cursor: 'pointer',
              }}
            >
              Avisos en App ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('emails')}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                background: activeTab === 'emails' ? 'transparent' : 'rgba(0,0,0,0.2)',
                color: activeTab === 'emails' ? 'var(--emerald)' : 'var(--muted)',
                fontWeight: activeTab === 'emails' ? 700 : 500,
                fontSize: '0.78rem',
                borderBottom: activeTab === 'emails' ? '2px solid var(--emerald)' : 'none',
                cursor: 'pointer',
              }}
            >
              Correos Enviados ({emailLogs.length})
            </button>
          </div>

          {/* Scrollable Items List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {activeTab === 'notifications' ? (
              notifications.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  No hay notificaciones recientes en el sistema.
                </div>
              ) : (
                notifications.map((item) => {
                  const isRead = readIds.includes(item.id) || (currentUser?.uid && item.readBy?.includes(currentUser.uid));
                  const badge = getCategoryBadge(item.category);

                  let timeAgo = 'Reciente';
                  if (item.createdAt) {
                    try {
                      const d = (item.createdAt as { toDate?: () => Date }).toDate
                        ? (item.createdAt as { toDate: () => Date }).toDate()
                        : new Date(item.createdAt as string | number);
                      const diffMinutes = Math.round((Date.now() - d.getTime()) / 60000);
                      if (diffMinutes < 1) timeAgo = 'Justo ahora';
                      else if (diffMinutes < 60) timeAgo = `Hace ${diffMinutes}m`;
                      else timeAgo = `Hace ${Math.round(diffMinutes / 60)}h`;
                    } catch {
                      // ignore
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => markAsRead(item.id)}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: '8px',
                        background: isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(245, 158, 11, 0.08)',
                        border: `1px solid ${isRead ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 158, 11, 0.3)'}`,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: badge.bg,
                            color: badge.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>

                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{timeAgo}</span>
                      </div>

                      <strong style={{ fontSize: '0.85rem', color: isRead ? '#e2e8f0' : '#ffffff', lineHeight: 1.35 }}>
                        {item.title}
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                        {item.message}
                      </p>
                      {(item.actionUrl || (item as AppNotificationItem & { link?: string }).link) && (
                        <a
                          href={item.actionUrl || (item as AppNotificationItem & { link?: string }).link}
                          target={
                            (item.actionUrl || (item as AppNotificationItem & { link?: string }).link || '').startsWith('http')
                              ? '_blank'
                              : undefined
                          }
                          rel={
                            (item.actionUrl || (item as AppNotificationItem & { link?: string }).link || '').startsWith('http')
                              ? 'noopener noreferrer'
                              : undefined
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item.id);
                          }}
                          style={{
                            marginTop: '0.25rem',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#6ee7b7',
                            textDecoration: 'underline',
                            alignSelf: 'flex-start',
                          }}
                        >
                          {item.actionLabel || 'Abrir transmisión ↗'}
                        </a>
                      )}
                    </div>
                  );
                })
              )
            ) : emailLogs.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                Aún no has recibido correos transaccionales en esta sesión.
              </div>
            ) : (
              emailLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedEmail(log)}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--emerald)', fontWeight: 700 }}>
                      📧 {log.templateType.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {log.status === 'delivered' ? '✓ Entregado' : 'Dado de baja'}
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.84rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.subject}
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gold-soft)' }}>
                    Para: {log.toEmail} · Clic para ver correo HTML &rarr;
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid var(--line)',
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setIsPrefsOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'underline',
              }}
            >
              ⚙️ Preferencias &amp; Darse de Baja
            </button>

            <button
              type="button"
              onClick={() => {
                void deliverDailyPersonalDevNotification({
                  force: true,
                  rotate: true,
                  showToast: true,
                });
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#fde68a',
                fontSize: '0.73rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="Recibir otra dosis diaria de Brian Tracy y desarrollo personal"
            >
              ✨ Nueva Dosis Diaria
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <EmailViewerModal
        email={selectedEmail}
        isOpen={Boolean(selectedEmail)}
        onClose={() => setSelectedEmail(null)}
        onOpenPreferences={() => setIsPrefsOpen(true)}
      />

      <NotificationPreferencesModal
        isOpen={isPrefsOpen}
        onClose={() => setIsPrefsOpen(false)}
      />
    </div>
  );
};
