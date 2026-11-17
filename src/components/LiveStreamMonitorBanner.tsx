import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Radio, ExternalLink, X, BellRing } from 'lucide-react';

export const TIKTOK_CHANNEL_URL = 'https://www.tiktok.com/@alhadiqa.capital';
export const TIKTOK_LIVE_URL = 'https://www.tiktok.com/@alhadiqa.capital/live';
export const TIKTOK_HANDLE = '@alhadiqa.capital';

export interface LiveAlertBannerItem {
  id: string;
  platform: 'tiktok' | 'youtube';
  title: string;
  message: string;
  url: string;
  isLive: boolean;
  detectedAt: string;
}

function playNotificationTone() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.48);
  } catch {
    // ignore autoplay restriction
  }
}

function dispatchBrowserNotification(alert: LiveAlertBannerItem) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (window.Notification.permission !== 'granted') return;
  try {
    const n = new window.Notification(alert.title, {
      body: alert.message,
      icon: '/pwa-192x192.png',
      tag: alert.id,
    });
    n.onclick = () => {
      window.focus();
      try {
        const parsed = new URL(alert.url, window.location.origin);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
          const link = document.createElement('a');
          link.href = parsed.toString();
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch {
        // ignore invalid notification URL
      }
    };
  } catch {
    // fallback silently on restricted webviews
  }
}

export const LiveStreamMonitorBanner: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<LiveAlertBannerItem | null>(null);
  const dismissedIdsRef = useRef<Set<string>>(new Set());
  const isInitialNotifSnapshotRef = useRef(true);
  const lastTikTokEventRef = useRef<string | null>(null);

  const triggerAlert = (alert: LiveAlertBannerItem, notifyBrowser = true) => {
    if (dismissedIdsRef.current.has(alert.id)) return;
    setActiveAlert(alert);

    window.dispatchEvent(
      new CustomEvent('al_hadiqa_channel_alert', {
        detail: alert,
      })
    );

    if (notifyBrowser) {
      playNotificationTone();
      dispatchBrowserNotification(alert);
    }
  };

  // 1. Escuchar en tiempo real estado del canal TikTok (@alhadiqa.capital) en Firestore
  useEffect(() => {
    const unsubTikTok = onSnapshot(
      doc(db, 'live_broadcasts', 'tiktok_alhadiqa_capital'),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as {
          isLive?: boolean;
          status?: string;
          title?: string;
          description?: string;
          youtubeUrl?: string;
          channelUrl?: string;
          updatedAt?: string;
          lastNotificationSent?: string;
        };

        const eventKey = `tiktok-${data.lastNotificationSent || data.updatedAt || data.status || 'live'}`;
        if (data.isLive || data.status === 'en_vivo' || data.status === 'nuevo_contenido') {
          const isNewUpdate = lastTikTokEventRef.current !== null && lastTikTokEventRef.current !== eventKey;
          lastTikTokEventRef.current = eventKey;

          triggerAlert(
            {
              id: eventKey,
              platform: 'tiktok',
              title: data.isLive
                ? `🔴 ¡${TIKTOK_HANDLE} está EN VIVO en TikTok!`
                : `🎵 Nuevo contenido en TikTok ${TIKTOK_HANDLE}`,
              message:
                data.title ||
                data.description ||
                'AL-HADIQA Capital acaba de emitir contenido nuevo en TikTok. Únete ahora.',
              url: data.youtubeUrl || TIKTOK_LIVE_URL,
              isLive: Boolean(data.isLive || data.status === 'en_vivo'),
              detectedAt: data.updatedAt || new Date().toISOString(),
            },
            isNewUpdate
          );
        }
      },
      () => {
        // Silent listener fallback
      }
    );

    // 2. Escuchar nuevas notificaciones emitidas en Firestore mientras el usuario navega
    const notifQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(3));
    const unsubNotifs = onSnapshot(
      notifQuery,
      (snapshot) => {
        if (isInitialNotifSnapshotRef.current) {
          isInitialNotifSnapshotRef.current = false;
          return;
        }
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const d = change.doc.data() as {
              title?: string;
              message?: string;
              type?: string;
              link?: string;
              actionUrl?: string;
            };
            if (d.type === 'class' || (d.title && (d.title.includes('TikTok') || d.title.includes('EN VIVO')))) {
              const isTikTok = Boolean(d.title?.includes('TikTok') || d.message?.includes('@alhadiqa.capital'));
              triggerAlert(
                {
                  id: `fs-notif-${change.doc.id}`,
                  platform: isTikTok ? 'tiktok' : 'youtube',
                  title: d.title || '🔴 Nueva Transmisión en Vivo',
                  message: d.message || 'Se ha iniciado una nueva transmisión oficial.',
                  url: d.actionUrl || d.link || (isTikTok ? TIKTOK_LIVE_URL : '#streaming'),
                  isLive: true,
                  detectedAt: new Date().toISOString(),
                },
                true
              );
            }
          }
        });
      },
      () => {}
    );

    return () => {
      unsubTikTok();
      unsubNotifs();
    };
  }, []);

  // 3. Monitoreo periódico automático contra el endpoint del servidor (/api/channels/tiktok/status)
  useEffect(() => {
    let isMounted = true;

    const checkTikTokChannel = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const res = await fetch('/api/channels/tiktok/status', { cache: 'no-store' });
        if (!res.ok || !isMounted) return;
        const data = (await res.json()) as {
          isLive?: boolean;
          liveRoomId?: string | null;
          liveTitle?: string | null;
          latestVideoId?: string | null;
          latestVideoUrl?: string | null;
          latestVideoTitle?: string | null;
        };

        if (data.isLive) {
          const liveId = `tiktok-live-${data.liveRoomId || 'active'}`;
          triggerAlert(
            {
              id: liveId,
              platform: 'tiktok',
              title: `🔴 ¡${TIKTOK_HANDLE} transmitiendo EN VIVO en TikTok!`,
              message:
                data.liveTitle ||
                'Transmisión directa activa en @alhadiqa.capital. Toca para abrir el directo.',
              url: TIKTOK_LIVE_URL,
              isLive: true,
              detectedAt: new Date().toISOString(),
            },
            true
          );
          return;
        }

        if (data.latestVideoId && data.latestVideoUrl) {
          const storedVideoId = localStorage.getItem('alhadiqa_last_tiktok_video_id');
          if (!storedVideoId) {
            localStorage.setItem('alhadiqa_last_tiktok_video_id', data.latestVideoId);
          } else if (storedVideoId !== data.latestVideoId) {
            localStorage.setItem('alhadiqa_last_tiktok_video_id', data.latestVideoId);
            triggerAlert(
              {
                id: `tiktok-video-${data.latestVideoId}`,
                platform: 'tiktok',
                title: `🎵 Nuevo video en TikTok (${TIKTOK_HANDLE})`,
                message:
                  data.latestVideoTitle ||
                  'Se ha publicado nuevo contenido financiero en el canal oficial de TikTok.',
                url: data.latestVideoUrl,
                isLive: false,
                detectedAt: new Date().toISOString(),
              },
              true
            );
          }
        }
      } catch {
        // Ignore network polling errors silently
      }
    };

    checkTikTokChannel();
    const interval = setInterval(checkTikTokChannel, 90_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!activeAlert) return null;

  const isExternal = activeAlert.url.startsWith('http');

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-[80px] right-3 sm:right-4 z-[920] w-[min(390px,calc(100vw-1.5rem))] rounded-2xl bg-[#041b13]/95 border border-amber-400/60 shadow-[0_18px_50px_rgba(0,0,0,0.9)] backdrop-blur-xl p-3.5 text-slate-100"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/30 to-amber-500/20 border border-rose-400/50 flex items-center justify-center shrink-0">
          {activeAlert.isLive ? (
            <Radio size={18} className="text-rose-400 animate-pulse" aria-hidden="true" />
          ) : (
            <BellRing size={18} className="text-amber-300" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 font-['Montserrat']">
              {activeAlert.platform === 'tiktok' ? 'TikTok @alhadiqa.capital' : 'Streaming Oficial'}
            </span>
            <button
              type="button"
              onClick={() => {
                dismissedIdsRef.current.add(activeAlert.id);
                setActiveAlert(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 cursor-pointer"
              aria-label="Cerrar notificación de transmisión"
            >
              <X size={15} />
            </button>
          </div>

          <p className="text-xs sm:text-sm font-bold text-white leading-snug mt-0.5">
            {activeAlert.title}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mt-1 line-clamp-2">
            {activeAlert.message}
          </p>

          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {isExternal ? (
              <a
                href={activeAlert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#03140e] font-bold text-xs hover:brightness-105 transition-all"
              >
                <span>Ver Transmisión</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : (
              <a
                href={activeAlert.url}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-[#03140e] font-bold text-xs hover:brightness-105 transition-all"
              >
                <span>Ir a la Sala en Vivo</span>
              </a>
            )}
            <a
              href="#streaming"
              onClick={() => setActiveAlert(null)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
            >
              Sala Hub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
