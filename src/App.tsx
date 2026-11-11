import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Background3D } from './components/Background3D';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Roadmap } from './components/Roadmap';
import { FounderBiographySection } from './components/FounderBiographySection';
import { TradingSection } from './components/TradingSection';
import { TradingPlatformClone } from './components/TradingPlatformClone';
import { StreamingHubSection } from './components/StreamingHubSection';
import { LiveClassesSection } from './components/LiveClassesSection';
import { LibrarySection } from './components/LibrarySection';
import { CommunityChatSection } from './components/CommunityChatSection';
import { MarketNewsSection } from './components/MarketNewsSection';
import { SmithBusinessSection } from './components/SmithBusinessSection';
import { GamingSection } from './components/GamingSection';
import { EcosystemSection } from './components/EcosystemSection';
import { CapitalSection } from './components/CapitalSection';
import { FaqSection } from './components/FaqSection';
import { NewsletterSection } from './components/NewsletterSection';
import { Footer } from './components/Footer';
import { FloatingAssistantBot } from './components/FloatingAssistantBot';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { FeedbackCategory, FeedbackModule } from './types/feedback';
import type { LegalTab } from './components/LegalTermsPrivacyModal';
import { NotFoundPage } from './components/NotFoundPage';
import { trackPageView } from './utils/analytics';

// Modales pesados cargados bajo demanda (Code Splitting / Reducción masiva del bundle inicial)
const AdminPanelModal = React.lazy(() => import('./components/AdminPanelModal').then(m => ({ default: m.AdminPanelModal })));
const StudentPortalModal = React.lazy(() => import('./components/StudentPortalModal').then(m => ({ default: m.StudentPortalModal })));
const PartnerApproverModal = React.lazy(() => import('./components/PartnerApproverModal').then(m => ({ default: m.PartnerApproverModal })));
const SecurityComplianceModal = React.lazy(() => import('./components/SecurityComplianceModal').then(m => ({ default: m.SecurityComplianceModal })));
const OpenSourceTradingMentorModal = React.lazy(() => import('./components/OpenSourceTradingMentorModal').then(m => ({ default: m.OpenSourceTradingMentorModal })));
const SmcCalculatorValidatorModal = React.lazy(() => import('./components/SmcCalculatorValidatorModal').then(m => ({ default: m.SmcCalculatorValidatorModal })));
const FeedbackModal = React.lazy(() => import('./components/FeedbackModal').then(m => ({ default: m.FeedbackModal })));
const LegalTermsPrivacyModal = React.lazy(() => import('./components/LegalTermsPrivacyModal').then(m => ({ default: m.LegalTermsPrivacyModal })));

export const AppContent: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isStudentPortalOpen, setIsStudentPortalOpen] = useState(false);
  const [isApproverOpen, setIsApproverOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [isSmcSuiteOpen, setIsSmcSuiteOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('sugerencia');
  const [feedbackModule, setFeedbackModule] = useState<FeedbackModule>('calculador_smc');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('terms');
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  const isNotFound = currentPath !== '/' && currentPath !== '' && currentPath !== '/index.html';

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

  // Asegura que al ingresar o recargar la página, SIEMPRE cargue y se posicione exactamente
  // en la cabecera: "Investor Academy Al-hadida Invest · «Cultivando el crecimiento, nutriendo su capital»"
  useEffect(() => {
    if (isNotFound) return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollToInvestorAcademy = () => {
      // Forzar temporalmente scroll instantáneo desactivando smooth scroll
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      const hero = document.getElementById('inicio') || document.getElementById('investor-academy');
      if (hero) {
        hero.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
      }
    };

    // 1. Ejecución instantánea en el primer ciclo
    scrollToInvestorAcademy();

    // 2. Refuerzo escalonado para neutralizar repintados tras carga de fuentes/imágenes
    const timer1 = setTimeout(scrollToInvestorAcademy, 25);
    const timer2 = setTimeout(scrollToInvestorAcademy, 100);
    const timer3 = setTimeout(scrollToInvestorAcademy, 250);
    const timer4 = setTimeout(() => {
      scrollToInvestorAcademy();
      // Restaurar el comportamiento de scroll suave para clics en enlaces internos
      document.documentElement.style.scrollBehavior = '';
    }, 500);

    // 3. Cuando finalice la carga completa de recursos (imágenes de portada y tipografías)
    const handleWindowLoad = () => scrollToInvestorAcademy();
    window.addEventListener('load', handleWindowLoad, { once: true });

    // 4. Si el navegador restaura la sesión desde memoria o historial (pageshow / bfcache)
    const handlePageShow = () => scrollToInvestorAcademy();
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
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
        </React.Suspense>
        <CookieConsentBanner />
      </>
    );
  }

  return (
    <>
      <Background3D />
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
      />

      <main id="contenido">
        <Hero
          onOpenAdvisorChat={() => setIsMentorOpen(true)}
          onOpenLiveVoice={() => setIsSmcSuiteOpen(true)}
          onOpenSmcSuite={() => setIsSmcSuiteOpen(true)}
        />
        <Roadmap />
        <FounderBiographySection onOpenAdvisorChat={() => setIsMentorOpen(true)} />
        <TradingSection />
        <TradingPlatformClone />
        <StreamingHubSection />
        <LiveClassesSection />
        <LibrarySection />
        <CommunityChatSection />
        <MarketNewsSection />
        <SmithBusinessSection />
        <GamingSection />
        <EcosystemSection />
        <CapitalSection />
        <FaqSection />
        <NewsletterSection />
      </main>

      <Footer />

      {/* Modales cargados bajo demanda con Suspense para máxima velocidad de carga */}
      <React.Suspense fallback={null}>
        {isAdminOpen && <AdminPanelModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />}
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
      <FloatingAssistantBot
        onOpenStudentPortal={() => setIsStudentPortalOpen(true)}
        onOpenAdvisorChat={() => setIsMentorOpen(true)}
        onOpenLiveVoice={() => setIsMentorOpen(true)}
      />

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
