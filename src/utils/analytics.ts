/**
 * Google Analytics 4 (GA4) Integration Utility
 * AL-HADIQA INVEST & Ecosistema Digital
 * 
 * Cumple con normativas RGPD y ePrivacy:
 * Solo inicializa y rastrea si el usuario otorgó consentimiento para analíticas ('analytics: true')
 * en el Centro de Preferencias de Cookies.
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const COOKIE_STORAGE_KEY = 'al_hadiqa_cookie_consent';
// ID de Medición GA4 oficial (configurable mediante variable de entorno o fallback institucional)
export const GA_MEASUREMENT_ID =
  (import.meta.env.VITE_GA4_MEASUREMENT_ID as string) || 'G-ALHADIQA26';

let isInitialized = false;

/**
 * Comprueba si el usuario aceptó cookies analíticas
 */
export const hasAnalyticsConsent = (): boolean => {
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.preferences?.analytics);
  } catch {
    return false;
  }
};

/**
 * Inicializa GA4 si se cuenta con consentimiento activo
 */
export const initGA4 = (): void => {
  if (typeof window === 'undefined') return;

  const consentGranted = hasAnalyticsConsent();
  if (!consentGranted) {
    return;
  }

  if (isInitialized) return;

  // Inicializar dataLayer y función gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());

  // Configuración de privacidad estricta
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    send_page_view: false, // se gestiona manualmente por SPA
  });

  // Inyectar script oficial de Google Tag Manager asíncronamente
  const existingScript = document.getElementById('ga4-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  isInitialized = true;

  // Registrar primera vista de página
  trackPageView(window.location.pathname + window.location.search, document.title);
};

/**
 * Registra una vista de página en GA4 para SPAs
 */
export const trackPageView = (path: string, title?: string): void => {
  if (typeof window === 'undefined' || !isInitialized || !hasAnalyticsConsent()) return;

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }
};

/**
 * Registra un evento de interacción institucional
 */
export const trackEvent = (
  eventName: string,
  eventParams: Record<string, any> = {}
): void => {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  // Si tiene consentimiento pero no se había inicializado aún el script, inicializar ahora
  if (!isInitialized) {
    initGA4();
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...eventParams,
      transport_type: 'beacon',
    });
  }
};

/**
 * Actualiza el consentimiento de analítica en tiempo real (invocado tras aceptar cookies)
 */
export const updateAnalyticsConsent = (granted: boolean): void => {
  if (granted) {
    initGA4();
    trackEvent('cookie_consent_updated', { analytics_granted: true });
  } else {
    isInitialized = false;
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  }
};
