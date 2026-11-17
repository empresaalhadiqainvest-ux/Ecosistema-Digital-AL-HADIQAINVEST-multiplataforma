import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Roadmap } from './components/Roadmap';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { FeedbackCategory, FeedbackModule } from './types/feedback';
import type { LegalTab } from './components/LegalTermsPrivacyModal';
import { NotFoundPage } from './components/NotFoundPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LiveStreamMonitorBanner } from './components/LiveStreamMonitorBanner';
import { DailyPersonalDevManager } from './components/DailyPersonalDevManager';
import { trackPageView } from './utils/analytics';
import { lazyWithRetry, SectionGuard } from './utils/lazyWithRetry';

// Fondo 3D (Three.js) y secciones por debajo del pliegue cargados mediante Code Splitting resiliente
const Background3D = lazyWithRetry(() => import('./components/Background3D').then(m => ({ default: m.Background3D })), 'Fondo 3D');
const StudentDashboardSection = lazyWithRetry(() => import('./components/StudentDashboardSection').then(m => ({ default: m.StudentDashboardSection })), 'Dashboard de Estudiantes');
const FounderBiographySection = lazyWithRetry(() => import('./components/FounderBiographySection').then(m => ({ default: m.FounderBiographySection })), 'Biografía del Fundador');
const TradingSection = lazyWithRetry(() => import('./components/TradingSection').then(m => ({ default: m.TradingSection })), 'Ecosistema Trading');
const TradingPlatformClone = lazyWithRetry(() => import('./components/TradingPlatformClone').then(m => ({ default: m.TradingPlatformClone })), 'Terminal Chart');
const StreamingHubSection = lazyWithRetry(() => import('./components/StreamingHubSection').then(m => ({ default: m.StreamingHubSection })), 'Streaming Hub');
const LiveClassesSection = lazyWithRetry(() => import('./components/LiveClassesSection').then(m => ({ default: m.LiveClassesSection })), 'Clases en Vivo');
const LibrarySection = lazyWithRetry(() => import('./components/LibrarySection').then(m => ({ default: m.LibrarySection })), 'Biblioteca Digital');
const CommunityChatSection = lazyWithRetry(() => import('./components/CommunityChatSection').then(m => ({ default: m.CommunityChatSection })), 'Comunidad');
const MarketNewsSection = lazyWithRetry(() => import('./components/MarketNewsSection').then(m => ({ default: m.MarketNewsSection })), 'Noticias de Mercado');
const SmithBusinessSection = lazyWithRetry(() => import('./components/SmithBusinessSection').then(m => ({ default: m.SmithBusinessSection })), 'Smith Business');
const GamingSection = lazyWithRetry(() => import('./components/GamingSection').then(m => ({ default: m.GamingSection })), 'División Gaming');
const EcosystemSection = lazyWithRetry(() => import('./components/EcosystemSection').then(m => ({ default: m.EcosystemSection })), 'Ecosistema Holding');
const CapitalSection = lazyWithRetry(() => import('./components/CapitalSection').then(m => ({ default: m.CapitalSection })), 'Al-Hadiqa Capital');
const FaqSection = lazyWithRetry(() => import('./components/FaqSection').then(m => ({ default: m.FaqSection })), 'Preguntas Frecuentes');
const NewsletterSection = lazyWithRetry(() => import('./components/NewsletterSection').then(m => ({ default: m.NewsletterSection })), 'Newsletter');
const Footer = lazyWithRetry(() => import('./components/Footer').then(m => ({ default: m.Footer })), 'Pie de página');
const FloatingAssistantBot = lazyWithRetry(() => import('./components/FloatingAssistantBot').then(m => ({ default: m.FloatingAssistantBot })), 'Asistente Flotante');

// Modales pesados cargados bajo demanda (Code Splitting / Reducción masiva del bundle inicial)
const AdminPanelModal = lazyWithRetry(() => import('./components/AdminPanelModal').then(m => ({ default: m.AdminPanelModal })), 'Panel de Administración');
const StudentPortalModal = lazyWithRetry(() => import('./components/StudentPortalModal').then(m => ({ default: m.StudentPortalModal })), 'Portal del Estudiante');
const PartnerApproverModal = lazyWithRetry(() => import('./components/PartnerApproverModal').then(m => ({ default: m.PartnerApproverModal })), 'Panel de Aprobadores');
const SecurityComplianceModal = lazyWithRetry(() => import('./components/SecurityComplianceModal').then(m => ({ default: m.SecurityComplianceModal })), 'Seguridad y Cumplimiento');
const OpenSourceTradingMentorModal = lazyWithRetry(() => import('./components/OpenSourceTradingMentorModal').then(m => ({ default: m.OpenSourceTradingMentorModal })), 'Mentor de Trading');
const SmcCalculatorValidatorModal = lazyWithRetry(() => import('./components/SmcCalculatorValidatorModal').then(m => ({ default: m.SmcCalculatorValidatorModal })), 'Calculadora SMC');
const FeedbackModal = lazyWithRetry(() => import('./components/FeedbackModal').then(m => ({ default: m.FeedbackModal })), 'Feedback');
const LegalTermsPrivacyModal = lazyWithRetry(() => import('./components/LegalTermsPrivacyModal').then(m => ({ default: m.LegalTermsPrivacyModal })), 'Aviso Legal');
const SocExcaisresModal = lazyWithRetry(() => import('./components/SocExcaisresModal').then(m => ({ default: m.SocExcaisresModal })), 'SOC EXCAISRES');

export const AppContent: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isStudentPortalOpen, setIsStudentPortalOpen] = useState(false);
  const [isApproverOpen, setIsApproverOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isSocOpen, setIsSocOpen] = useState(false);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [isSmcSuiteOpen, setIsSmcSuiteOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('sugerencia');
  const [feedbackModule, setFeedbackModule] = useState<FeedbackModule>('calculador_smc');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('terms');
  const [shouldRender3DBackground, setShouldRender3DBackground] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  const isNotFound = currentPath !== '/' && currentPath !== '' && currentPath !== '/index.html';

  // Diferir Three.js hasta después del primer renderizado y carga, respetando ahorro de datos y movimiento reducido
  useEffect(() => {
    if (isNotFound || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const isConstrainedNetwork = Boolean(
      connection?.saveData || connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g'
    );
    if (prefersReducedMotion || isConstrainedNetwork) return;

    const enable3D = () => setShouldRender3DBackground(true);
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const schedule3D = () => {
      if (win.requestIdleCallback) {
        idleId = win.requestIdleCallback(enable3D, { timeout: 1800 });
      } else {
        fallbackTimer = setTimeout(enable3D, 1200);
      }
    };

    if (document.readyState === 'complete') {
      schedule3D();
    } else {
      window.addEventListener('load', schedule3D, { once: true });
    }

    return () => {
      window.removeEventListener('load', schedule3D);
      if (idleId !== undefined) win.cancelIdleCallback?.(idleId);
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
    };
  }, [isNotFound]);

  // Escuchar cambios de ruta de navegación en el historial (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Seguimiento analítico GA4 de páginas vistas conforme a consentimiento GDPR/ePrivacy
  useEffect(() => {
    trackPageView(
      currentPath,
      isNotFound
        ? 'Error 404 - Página no encontrada | AL-HADIQA INVEST'
        : 'AL-HADIQA INVEST | Holding Empresarial y Academia de Trading Institucional'
    );
  }, [currentPath, isNotFound]);

  // Asegura que al ingresar o recargar la página, SIEMPRE cargue desde el inicio (y = 0)
  // mostrando el encabezado: "Investor Academy Al-hadida Invest · «Cultivando el crecimiento, nutriendo su capital»"
  useEffect(() => {
    if (isNotFound) return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    let userInteracted = false;
    const markUserInteracted = () => {
      userInteracted = true;
    };

    window.addEventListener('wheel', markUserInteracted, { passive: true, once: true });
    window.addEventListener('touchstart', markUserInteracted, { passive: true, once: true });
    window.addEventListener('pointerdown', markUserInteracted, { passive: true, once: true });
    window.addEventListener('hashchange', markUserInteracted, { passive: true, once: true });

    const scrollToTop = () => {
      if (userInteracted) return;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();
    const rafId = requestAnimationFrame(scrollToTop);
    const timers = [120, 420].map((delay, idx, arr) =>
      setTimeout(() => {
        scrollToTop();
        if (idx === arr.length - 1) {
          document.documentElement.style.scrollBehavior = '';
        }
      }, delay)
    );

    const handleWindowLoad = () => scrollToTop();
    const handlePageShow = () => scrollToTop();

    window.addEventListener('load', handleWindowLoad, { once: true });
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      cancelAnimationFrame(rafId);
      timers.forEach(clearTimeout);
      window.removeEventListener('wheel', markUserInteracted);
      window.removeEventListener('touchstart', markUserInteracted);
      window.removeEventListener('pointerdown', markUserInteracted);
      window.removeEventListener('hashchange', markUserInteracted);
      window.removeEventListener('load', handleWindowLoad);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isNotFound]);

  // Escuchar evento global para abrir la suite de cálculo y validación SMC
  useEffect(() => {
    const handleOpenSmcSuite = () => {
      setIsSmcSuiteOpen(true);
    };

    window.addEventListener('al_hadiqa_open_smc_suite', handleOpenSmcSuite);
    return () => window.removeEventListener('al_hadiqa_open_smc_suite', handleOpenSmcSuite);
  }, []);

  // Escuchar evento global para abrir el Centro de Feedback y Correcciones
  useEffect(() => {
    const handleOpenFeedback = (e: any) => {
      if (e?.detail?.category) setFeedbackCategory(e.detail.category);
      if (e?.detail?.module) setFeedbackModule(e.detail.module);
      setIsFeedbackOpen(true);
    };

    window.addEventListener('al_hadiqa_open_feedback', handleOpenFeedback);
    return () => window.removeEventListener('al_hadiqa_open_feedback', handleOpenFeedback);
  }, []);

  // Escuchar evento global para abrir Términos, Política de Privacidad y Auditoría de Secretos
  useEffect(() => {
    const handleOpenLegal = (e: any) => {
      if (e?.detail?.tab) {
        setLegalModalTab(e.detail.tab);
      }
      setIsLegalModalOpen(true);
    };

    window.addEventListener('al_hadiqa_open_legal', handleOpenLegal);
    return () => window.removeEventListener('al_hadiqa_open_legal', handleOpenLegal);
  }, []);

  // Escuchar evento global para abrir SOC EXCAISRES (Centro Autónomo de Ciberseguridad)
  useEffect(() => {
    const handleOpenSoc = () => {
      setIsSocOpen(true);
    };

    window.addEventListener('al_hadiqa_open_soc', handleOpenSoc);
    return () => window.removeEventListener('al_hadiqa_open_soc', handleOpenSoc);
  }, []);

  if (isNotFound) {
    return (
      <>
        <NotFoundPage
          onGoHome={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
              setCurrentPath('/');
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
            }
          }}
        />
        <React.Suspense fallback={null}>
          {isFeedbackOpen && (
            <FeedbackModal
              isOpen={isFeedbackOpen}
              onClose={() => setIsFeedbackOpen(false)}
              defaultCategory={feedbackCategory}
              defaultModule={feedbackModule}
            />
          )}
          {isLegalModalOpen && (
            <LegalTermsPrivacyModal
              isOpen={isLegalModalOpen}
              onClose={() => setIsLegalModalOpen(false)}
              initialTab={legalModalTab}
            />
          )}
          {isSocOpen && (
            <SocExcaisresModal
              isOpen={isSocOpen}
              onClose={() => setIsSocOpen(false)}
            />
          )}
        </React.Suspense>
        <CookieConsentBanner />
      </>
    );
  }

  return (
    <>
      {shouldRender3DBackground && (
        <React.Suspense fallback={null}>
          <Background3D />
        </React.Suspense>
      )}
      <a className="skip-link" href="#contenido">
        Saltar al contenido principal
      </a>

      <Header
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenProfile={() => setIsStudentPortalOpen(true)}
        onOpenApprover={() => setIsApproverOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenAdvisorChat={() => setIsMentorOpen(true)}
        onOpenLiveVoice={() => setIsSmcSuiteOpen(true)}
        onOpenSoc={() => setIsSocOpen(true)}
      />

      <OfflineIndicator />
      <LiveStreamMonitorBanner />
      <DailyPersonalDevManager />

      <main id="contenido">
        <Hero
          onOpenAdvisorChat={() => setIsMentorOpen(true)}
          onOpenLiveVoice={() => setIsSmcSuiteOpen(true)}
          onOpenSmcSuite={() => setIsSmcSuiteOpen(true)}
        />
        <Roadmap />
        <SectionGuard label="Dashboard de Estudiantes" anchorId="dashboard-estudiantes" defer><StudentDashboardSection /></SectionGuard>
        <SectionGuard label="Biografía del Fundador" anchorId="fundador" defer><FounderBiographySection onOpenAdvisorChat={() => setIsMentorOpen(true)} /></SectionGuard>
        <SectionGuard label="Ecosistema Trading" anchorId="trading" extraAnchors={['broker']} defer><TradingSection /></SectionGuard>
        <SectionGuard label="Terminal Chart" anchorId="trading-plataforma-completa" defer fallbackHeight="320px"><TradingPlatformClone /></SectionGuard>
        <SectionGuard label="Streaming Hub" anchorId="streaming" defer><StreamingHubSection /></SectionGuard>
        <SectionGuard label="Clases en Vivo" anchorId="clases-en-vivo" defer><LiveClassesSection /></SectionGuard>
        <SectionGuard label="Biblioteca Digital" anchorId="biblioteca" defer><LibrarySection /></SectionGuard>
        <SectionGuard label="Comunidad" anchorId="comunidad-chat" defer><CommunityChatSection /></SectionGuard>
        <SectionGuard label="Noticias de Mercado" anchorId="noticias-mercado" defer><MarketNewsSection /></SectionGuard>
        <SectionGuard label="Smith Business" anchorId="smithbusiness" defer><SmithBusinessSection /></SectionGuard>
        <SectionGuard label="División Gaming" anchorId="gaming" defer><GamingSection /></SectionGuard>
        <SectionGuard label="Ecosistema Holding" anchorId="ecosistema" defer><EcosystemSection /></SectionGuard>
        <SectionGuard label="Al-Hadiqa Capital" anchorId="capital" defer><CapitalSection /></SectionGuard>
        <SectionGuard label="Preguntas Frecuentes" anchorId="faq" defer><FaqSection /></SectionGuard>
        <SectionGuard label="Newsletter" anchorId="newsletter" defer><NewsletterSection /></SectionGuard>
      </main>

      <SectionGuard label="Pie de página" defer fallbackHeight="120px">
        <Footer />
      </SectionGuard>

      {/* Modales cargados bajo demanda con Suspense para máxima velocidad de carga */}
      <React.Suspense fallback={null}>
        {isAdminOpen && (
          <AdminPanelModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            onOpenSoc={() => {
              setIsAdminOpen(false);
              setIsSocOpen(true);
            }}
          />
        )}
        {isSocOpen && (
          <SocExcaisresModal
            isOpen={isSocOpen}
            onClose={() => setIsSocOpen(false)}
          />
        )}
        {isStudentPortalOpen && <StudentPortalModal isOpen={isStudentPortalOpen} onClose={() => setIsStudentPortalOpen(false)} />}
        {isApproverOpen && <PartnerApproverModal isOpen={isApproverOpen} onClose={() => setIsApproverOpen(false)} />}
        {isSecurityOpen && <SecurityComplianceModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />}
        {isMentorOpen && (
          <OpenSourceTradingMentorModal
            isOpen={isMentorOpen}
            onClose={() => setIsMentorOpen(false)}
          />
        )}
        {isSmcSuiteOpen && (
          <SmcCalculatorValidatorModal
            isOpen={isSmcSuiteOpen}
            onClose={() => setIsSmcSuiteOpen(false)}
            onConsultMentor={(_prompt) => {
              setIsSmcSuiteOpen(false);
              setIsMentorOpen(true);
            }}
          />
        )}
        {isFeedbackOpen && (
          <FeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            defaultCategory={feedbackCategory}
            defaultModule={feedbackModule}
          />
        )}
        {isLegalModalOpen && (
          <LegalTermsPrivacyModal
            isOpen={isLegalModalOpen}
            onClose={() => setIsLegalModalOpen(false)}
            initialTab={legalModalTab}
          />
        )}
      </React.Suspense>

      {/* Bot Asistente Flotante Integrado (Guía para Nuevos Usuarios, Clases, Chat, Biblioteca, Permisos y Mentor) */}
      <React.Suspense fallback={null}>
        <FloatingAssistantBot
          onOpenStudentPortal={() => setIsStudentPortalOpen(true)}
          onOpenAdvisorChat={() => setIsMentorOpen(true)}
          onOpenLiveVoice={() => setIsMentorOpen(true)}
        />
      </React.Suspense>

      {/* Botón flotante discreto de Feedback y Correcciones */}
      <button
        type="button"
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-3.5 left-3 sm:bottom-4 sm:left-4 z-40 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-[#03140e]/95 hover:bg-[#062319] border border-amber-500/40 hover:border-amber-400 text-amber-200 text-[11px] sm:text-xs font-bold shadow-[0_10px_25px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:scale-105 active:scale-95 group"
        title="Enviar Feedback, Sugerencias o Correcciones de la plataforma"
      >
        <span className="text-sm">📨</span>
        <span className="hidden sm:inline">Feedback &amp; Correcciones</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse group-hover:scale-125" />
      </button>

      {/* Aviso Oficial y Gestión de Uso de Cookies */}
      <CookieConsentBanner />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
