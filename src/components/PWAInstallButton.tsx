import React, { useState } from 'react';
import { Download, Smartphone, Tablet, Laptop, Share, PlusSquare, CheckCircle2, X, BellRing } from 'lucide-react';
import { usePWAInstall, DevicePlatform } from '../hooks/usePWAInstall';
import {
  getNotificationPermissionState,
  requestPermissionAndDeliverDailyDev,
} from '../services/dailyPersonalDevService';

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer';
  onAfterTrigger?: () => void;
}

const PLATFORM_LABELS: Record<DevicePlatform, string> = {
  ios: 'iPhone & iPad (iOS / iPadOS)',
  android: 'Android Móvil & Tablet',
  mac: 'Mac (macOS Dock & Desktop)',
  desktop: 'Ordenador (Windows / Linux / Mac)',
};

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onAfterTrigger,
}) => {
  const {
    canPromptNatively,
    isStandalone,
    isInstalling,
    platform,
    isSafari,
    showInstallModal,
    setShowInstallModal,
    triggerNativeInstall,
    handleInstallClick,
  } = usePWAInstall();
  const [notifStatus, setNotifStatus] = useState<'idle' | 'active' | 'denied'>(() =>
    getNotificationPermissionState() === 'granted' ? 'active' : 'idle'
  );

  // Ocultar automáticamente si ya se ejecuta como aplicación descargada (standalone)
  if (isStandalone) {
    return null;
  }

  const onClick = async () => {
    await handleInstallClick();
    if (canPromptNatively && onAfterTrigger) {
      onAfterTrigger();
    }
  };

  const handleActivateDailyNotifs = async () => {
    const res = await requestPermissionAndDeliverDailyDev();
    if (res.permission === 'granted') {
      setNotifStatus('active');
    } else if (res.permission === 'denied') {
      setNotifStatus('denied');
    }
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={onClick}
          disabled={isInstalling}
          className="pwa-header-install-btn"
          title="Descargar App oficial de AL-HADIQA INVEST para Móvil, Tablet o Mac"
          aria-label="Descargar App AL-HADIQA INVEST"
        >
          <Download size={14} aria-hidden="true" />
          <span className="pwa-header-install-label">
            {isInstalling ? 'Instalando…' : 'App'}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={isInstalling}
          className="drawer-pwa-install-card"
        >
          <div className="drawer-pwa-install-icon">
            <img
              src="/pwa-192x192.png"
              alt="Ícono oficial AL-HADIQA INVEST App"
              width={40}
              height={40}
              className="rounded-xl border border-amber-400/50"
            />
          </div>
          <div className="drawer-pwa-install-text">
            <span className="drawer-pwa-install-title">
              {canPromptNatively ? '📲 Instalar App Oficial ahora' : '📲 Descargar App (Móvil / Tablet / Mac)'}
            </span>
            <span className="drawer-pwa-install-sub">
              Incluye dosis diaria de desarrollo personal (Brian Tracy y mentores)
            </span>
          </div>
        </button>
      )}

      {showInstallModal && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
          onClick={() => setShowInstallModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-[#041b13] border border-amber-500/45 text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.95)] p-5 sm:p-6 space-y-4 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="Icono de aplicación AL-HADIQA INVEST"
                  width={48}
                  height={48}
                  className="rounded-xl border border-amber-400/50 shrink-0"
                />
                <div>
                  <h3 id="pwa-install-modal-title" className="text-base sm:text-lg font-extrabold text-white font-['Montserrat']">
                    Descargar App <span className="text-amber-400">AL-HADIQA INVEST</span>
                  </h3>
                  <p className="text-xs text-emerald-300 font-medium">
                    Detectado: {PLATFORM_LABELS[platform]}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Cerrar guía de instalación"
              >
                <X size={18} />
              </button>
            </div>

            {canPromptNatively && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-3">
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  Tu dispositivo soporta instalación directa en un solo toque con acceso sin conexión, cifrado TLS 1.3 y mensajes diarios de desarrollo personal.
                </p>
                <button
                  type="button"
                  onClick={triggerNativeInstall}
                  disabled={isInstalling}
                  className="btn btn--emerald w-full justify-center"
                >
                  <Download size={16} />
                  <span>{isInstalling ? 'Instalando aplicación…' : 'Instalar Aplicación Ahora'}</span>
                </button>
              </div>
            )}

            {/* Activación de Mensajes Diarios de Desarrollo Personal */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <BellRing size={14} />
                  <span>Notificaciones Diarias de Desarrollo Personal</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Todo el que instale la App recibe reflexiones diarias variadas basadas en <strong>Brian Tracy</strong>, Jim Rohn y referentes de alto rendimiento.
                </p>
              </div>
              <button
                type="button"
                onClick={handleActivateDailyNotifs}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                  notifStatus === 'active'
                    ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200'
                    : 'bg-amber-400 hover:bg-amber-300 text-[#03140e]'
                }`}
              >
                {notifStatus === 'active'
                  ? '✓ Activadas'
                  : notifStatus === 'denied'
                    ? 'Permiso bloqueado'
                    : 'Activar Alertas'}
              </button>
            </div>

            {/* Instrucciones adaptadas por plataforma */}
            <div className="space-y-3">
              {/* iPhone & iPad */}
              <div
                className={`p-3.5 rounded-xl border ${
                  platform === 'ios'
                    ? 'bg-amber-500/10 border-amber-400/55'
                    : 'bg-[#03140e]/80 border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-white mb-2">
                  <Smartphone size={16} className="text-amber-400 shrink-0" />
                  <span>iPhone &amp; iPad (Safari)</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    Abre la plataforma en <strong>Safari</strong> (iOS / iPadOS).
                  </li>
                  <li className="inline-flex items-center gap-1 flex-wrap">
                    Toca el ícono <strong className="text-amber-300 inline-flex items-center gap-1"><Share size={13} /> Compartir</strong> en la barra inferior o superior.
                  </li>
                  <li className="inline-flex items-center gap-1 flex-wrap">
                    Selecciona <strong className="text-emerald-300 inline-flex items-center gap-1"><PlusSquare size={13} /> Añadir a pantalla de inicio</strong> y confirma «Añadir».
                  </li>
                </ol>
              </div>

              {/* Android Móvil & Tablet */}
              <div
                className={`p-3.5 rounded-xl border ${
                  platform === 'android'
                    ? 'bg-amber-500/10 border-amber-400/55'
                    : 'bg-[#03140e]/80 border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-white mb-2">
                  <Tablet size={16} className="text-emerald-400 shrink-0" />
                  <span>Móviles &amp; Tablets Android (Chrome / Edge)</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Abre en <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.</li>
                  <li>Pulsa el menú <strong>⋮ (tres puntos)</strong> arriba a la derecha.</li>
                  <li>Elige <strong className="text-emerald-300">Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</li>
                </ol>
              </div>

              {/* Mac (macOS Safari / Chrome) */}
              <div
                className={`p-3.5 rounded-xl border ${
                  platform === 'mac' || platform === 'desktop'
                    ? 'bg-amber-500/10 border-amber-400/55'
                    : 'bg-[#03140e]/80 border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-white mb-2">
                  <Laptop size={16} className="text-sky-400 shrink-0" />
                  <span>Mac (macOS Dock) &amp; Ordenadores</span>
                </div>
                {isSafari && platform === 'mac' ? (
                  <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>En <strong>Safari para macOS (Sonoma o superior)</strong>, haz clic en <strong>Archivo</strong> en la barra superior (o en el ícono Compartir).</li>
                    <li>Elige <strong className="text-emerald-300">Añadir al Dock…</strong> para ejecutar AL-HADIQA INVEST como app nativa de Mac.</li>
                  </ol>
                ) : (
                  <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>En <strong>Safari (macOS)</strong>: menú <strong>Archivo &rarr; Añadir al Dock…</strong></li>
                    <li>En <strong>Chrome / Edge (Mac o Windows)</strong>: haz clic en el ícono <strong>⊕ Instalar</strong> a la derecha de la barra de direcciones.</li>
                  </ol>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-500/15 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 size={14} />
                Modo Standalone · Caché Offline · HTTPS/TLS 1.3
              </span>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
