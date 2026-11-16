import React, { useEffect, useState } from 'react';
import { BellRing, Sparkles, RefreshCw, X, Check } from 'lucide-react';
import { DailyPersonalDevMessage } from '../data/dailyPersonalDevMessages';
import {
  deliverDailyPersonalDevNotification,
  dismissDailyPromptForToday,
  getDailyPersonalDevStatus,
  getTodayPersonalDevMessage,
  isAppInstalledOrStandalone,
  isDailyPersonalDevEnabled,
  isDailyPromptDismissedToday,
  markAppAsInstalled,
  requestPermissionAndDeliverDailyDev,
  wasDailyNotificationDeliveredToday,
} from '../services/dailyPersonalDevService';

export const DailyPersonalDevManager: React.FC = () => {
  const [activeToastMsg, setActiveToastMsg] = useState<DailyPersonalDevMessage | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);

  useEffect(() => {
    const checkAndDeliver = async () => {
      const installed = isAppInstalledOrStandalone();
      const enabled = isDailyPersonalDevEnabled();
      const status = getDailyPersonalDevStatus();

      // Si el usuario instaló la app (standalone o appinstalled) o concedió permiso de notificaciones:
      if (enabled && (installed || status.permission === 'granted')) {
        if (!wasDailyNotificationDeliveredToday()) {
          await deliverDailyPersonalDevNotification({ showToast: true });
        }
      }

      // Si instaló la app pero aún no autoriza notificaciones del sistema operativo, ofrecer botón de 1 toque
      if (
        installed &&
        enabled &&
        status.permission === 'default' &&
        !isDailyPromptDismissedToday()
      ) {
        setShowPermissionPrompt(true);
      } else {
        setShowPermissionPrompt(false);
      }
    };

    const timerInit = setTimeout(() => {
      void checkAndDeliver();
    }, 1800);

    const handleAppInstalled = () => {
      markAppAsInstalled();
      void requestPermissionAndDeliverDailyDev().then((res) => {
        if (res.permission === 'default') {
          setShowPermissionPrompt(true);
        } else {
          setShowPermissionPrompt(false);
        }
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkAndDeliver();
      }
    };

    const handleDailyEvent = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          message: DailyPersonalDevMessage;
          showToast?: boolean;
        }>
      ).detail;
      if (detail?.message && detail.showToast !== false) {
        setActiveToastMsg(detail.message);
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('al_hadiqa_daily_dev_notification', handleDailyEvent);

    // Verificar cada 30 minutos por si cambia el día con la app abierta
    const interval = setInterval(() => {
      void checkAndDeliver();
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(timerInit);
      clearInterval(interval);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('al_hadiqa_daily_dev_notification', handleDailyEvent);
    };
  }, []);

  // Auto-ocultar toast después de 16 segundos si el usuario no interactúa
  useEffect(() => {
    if (!activeToastMsg) return;
    const t = setTimeout(() => setActiveToastMsg(null), 16000);
    return () => clearTimeout(t);
  }, [activeToastMsg]);

  const handleEnableDeviceNotifications = async () => {
    setIsActivating(true);
    try {
      const res = await requestPermissionAndDeliverDailyDev();
      setShowPermissionPrompt(false);
      setActiveToastMsg(res.message);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDismissPermissionPrompt = () => {
    dismissDailyPromptForToday();
    setShowPermissionPrompt(false);
  };

  const handleRotateToast = async () => {
    const res = await deliverDailyPersonalDevNotification({
      force: true,
      rotate: true,
      showToast: true,
    });
    setActiveToastMsg(res.message);
  };

  if (!showPermissionPrompt && !activeToastMsg) {
    return null;
  }

  return (
    <div
      className="fixed top-[74px] right-3 left-3 sm:left-auto sm:right-4 sm:w-[395px] z-[920] flex flex-col gap-2.5 pointer-events-none"
      aria-live="polite"
    >
      {/* 1. Solicitud de permiso de notificaciones del SO al instalar la App */}
      {showPermissionPrompt && (
        <div className="pointer-events-auto rounded-2xl bg-[#041b13]/95 backdrop-blur-md border border-amber-400/50 shadow-[0_18px_45px_rgba(0,0,0,0.85)] p-4 text-slate-100 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <BellRing className="w-4 h-4 shrink-0" />
              <span>Activar Mensajes Diarios en tu App</span>
            </div>
            <button
              type="button"
              onClick={handleDismissPermissionPrompt}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
              aria-label="Cerrar recordatorio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Recibe cada día una dosis variada de desarrollo personal, disciplina y liderazgo basada en <strong>Brian Tracy</strong> y grandes mentores.
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              disabled={isActivating}
              onClick={handleEnableDeviceNotifications}
              className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#03140e] text-xs font-bold cursor-pointer transition-colors"
            >
              {isActivating ? 'Activando...' : 'Permitir Notificaciones Diarias'}
            </button>
            <button
              type="button"
              onClick={handleDismissPermissionPrompt}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#062319] border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Luego
            </button>
          </div>
        </div>
      )}

      {/* 2. Tarjeta de Notificación Diaria de Desarrollo Personal */}
      {activeToastMsg && (
        <div
          role="status"
          className="pointer-events-auto rounded-2xl bg-[#041b13]/95 backdrop-blur-md border border-emerald-400/45 shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-4 text-slate-100 space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Desarrollo Personal Diario · {activeToastMsg.pillar}</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 leading-snug font-['Montserrat']">
                {activeToastMsg.title}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setActiveToastMsg(null)}
              className="text-slate-400 hover:text-white p-1 shrink-0 cursor-pointer"
              aria-label="Cerrar mensaje diario"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            {activeToastMsg.message}
          </p>

          <div className="p-2.5 rounded-xl bg-[#03140e]/85 border border-amber-500/25 text-[11px] text-amber-200 leading-relaxed">
            <strong className="text-amber-300">Reto de hoy:</strong> {activeToastMsg.dailyAction}
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
            <span className="text-slate-400 font-mono truncate">
              {activeToastMsg.mentor || getTodayPersonalDevMessage().mentor}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRotateToast}
                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#062319] hover:bg-[#093325] border border-slate-700 text-slate-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
                title="Ver otra reflexión de desarrollo personal"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Otra</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveToastMsg(null)}
                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Aplicar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
