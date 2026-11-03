import React, { useState, useEffect } from 'react';

interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  preferences: true,
  analytics: true,
};

const COOKIE_STORAGE_KEY = 'al_hadiqa_cookie_consent';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!storedConsent) {
        // Retardo suave para dar protagonismo inicial al Hero "Holding & Academia"
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 700);
        return () => clearTimeout(timer);
      } else {
        const parsed = JSON.parse(storedConsent);
        if (parsed?.preferences) {
          setPreferences({
            essential: true,
            preferences: Boolean(parsed.preferences.preferences),
            analytics: Boolean(parsed.preferences.analytics),
          });
        }
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  // Escuchar evento personalizado para reabrir la configuración desde el footer o cualquier sección
  useEffect(() => {
    const handleOpenCookies = () => {
      setShowConfigModal(true);
      setIsVisible(true);
    };

    window.addEventListener('al_hadiqa_open_cookies', handleOpenCookies);
    return () => window.removeEventListener('al_hadiqa_open_cookies', handleOpenCookies);
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const payload = {
      acceptedAt: new Date().toISOString(),
      version: '1.0',
      preferences: {
        essential: true,
        preferences: prefs.preferences,
        analytics: prefs.analytics,
      },
    };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('No se pudo guardar la preferencia de cookies en localStorage:', e);
    }
    setPreferences(prefs);
    setIsVisible(false);
    setShowConfigModal(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      preferences: true,
      analytics: true,
    });
  };

  const handleAcceptEssential = () => {
    saveConsent({
      essential: true,
      preferences: false,
      analytics: false,
    });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!isVisible && !showConfigModal) {
    return null;
  }

  return (
    <>
      {/* Banner flotante principal inferior */}
      {isVisible && !showConfigModal && (
        <aside
          role="region"
          aria-label="Aviso de cookies y privacidad"
          className="fixed bottom-3 left-3 right-3 sm:bottom-5 sm:left-6 sm:right-auto sm:max-w-2xl z-50 bg-[#061e16]/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-xl shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              🍪
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm sm:text-base text-amber-200 tracking-wide flex items-center gap-2">
                  <span>Aviso de Privacidad y Uso de Cookies</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Oficial
                  </span>
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                En <strong>AL-HADIQA INVEST</strong> utilizamos cookies esenciales y tecnologías de almacenamiento local para garantizar la seguridad de su sesión, preservar sus configuraciones de análisis técnico en los gráficos y personalizar su progreso en la academia de trading institucional.
              </p>

              <div className="mt-3.5 flex flex-wrap items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#03140e] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_4px_14px_rgba(212,175,55,0.4)] transition-all active:scale-95 cursor-pointer"
                >
                  Aceptar todas
                </button>

                <button
                  type="button"
                  onClick={handleAcceptEssential}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-slate-500 transition-all cursor-pointer"
                >
                  Solo necesarias
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm text-amber-300/90 hover:text-amber-200 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configurar
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Modal granular de configuración de cookies */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-[#051c14] border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-modal-title"
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
                  ⚙️
                </div>
                <div>
                  <h3 id="cookie-modal-title" className="font-semibold text-lg text-amber-200">
                    Centro de Preferencias de Cookies
                  </h3>
                  <p className="text-xs text-slate-400">
                    AL-HADIQA INVEST · Transparencia y Protección de Datos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="my-4 overflow-y-auto space-y-4 pr-1 text-sm text-slate-300">
              <p className="text-xs leading-relaxed text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                Respetamos su privacidad financiera. Configure las tecnologías que autoriza utilizar en su navegador. Las cookies esenciales no pueden desactivarse ya que sustentan el funcionamiento seguro de la plataforma.
              </p>

              {/* Categoría 1: Esenciales */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-emerald-300">Cookies Técnicas y Esenciales</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Obligatorias
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Requeridas para la autenticación en el portal del alumno y panel de administración, validación antifraude y ejecución del mentor de trading en el navegador.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mt-1 w-5 h-5 accent-emerald-500 rounded cursor-not-allowed opacity-80"
                  aria-label="Cookies esenciales siempre activas"
                />
              </div>

              {/* Categoría 2: Preferencias y Trading */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-500/20 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-amber-200">Preferencias de Trading y Gráficos</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Personalización
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Permiten recordar sus instrumentos favoritos (EUR/USD, Oro, BTC), tamaño de lotaje calculado, temporalidades de velas japonesas y ajustes del simulador.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.preferences}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, preferences: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Categoría 3: Analíticas y Rendimiento */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-700/50 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-200">Métricas de Rendimiento y Streaming</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      Rendimiento
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    Nos ayuda a evaluar la latencia del streaming oficial, estabilidad de conexión en clases en directo y optimizar la velocidad de carga de la biblioteca.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Acordeón informativo adicional */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-amber-300/80 hover:text-amber-200 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>{showDetails ? '▼ Ocultar información legal' : '▶ Ver información legal sobre el tratamiento de cookies'}</span>
                </button>
                {showDetails && (
                  <div className="mt-2 text-xs text-slate-400 bg-black/40 p-3 rounded-lg border border-slate-800 space-y-1.5">
                    <p>
                      <strong>Responsable:</strong> Holding AL-HADIQA INVEST &amp; Smith Business Solutions.
                    </p>
                    <p>
                      <strong>Finalidad:</strong> Gestión técnica de la plataforma educativa de trading, persistencia de preferencias de usuario y análisis de calidad de servicio.
                    </p>
                    <p>
                      <strong>Terceros:</strong> No comercializamos ni transferimos sus datos de navegación a corredores no regulados o intermediarios externos no autorizados.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción del modal */}
            <div className="pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleAcceptEssential}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-all cursor-pointer"
              >
                Solo obligatorias
              </button>

              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer"
              >
                Guardar preferencias
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#03140e] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all shadow-[0_4px_14px_rgba(212,175,55,0.4)] cursor-pointer"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Utilidad global para reabrir el aviso de cookies desde cualquier parte de la web
export const triggerCookiePreferences = () => {
  window.dispatchEvent(new CustomEvent('al_hadiqa_open_cookies'));
};
