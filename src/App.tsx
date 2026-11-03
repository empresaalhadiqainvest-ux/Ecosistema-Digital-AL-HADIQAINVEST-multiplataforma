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
import { AdminPanelModal } from './components/AdminPanelModal';
import { StudentPortalModal } from './components/StudentPortalModal';
import { PartnerApproverModal } from './components/PartnerApproverModal';
import { FloatingAssistantBot } from './components/FloatingAssistantBot';
import { SecurityComplianceModal } from './components/SecurityComplianceModal';
import { OpenSourceTradingMentorModal } from './components/OpenSourceTradingMentorModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { SmcCalculatorValidatorModal } from './components/SmcCalculatorValidatorModal';
import { FeedbackModal } from './components/FeedbackModal';
import { FeedbackCategory, FeedbackModule } from './types/feedback';

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

  // Asegura que al cargar la aplicación inmediatamente cargue desde el inicio ("Holding & Academia")
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Scroll instantáneo al tope (0, 0)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    // Refuerzo para asegurar el inicio tras pintar componentes pesados
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }, 50);

    return () => clearTimeout(timer);
  }, []);

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

      {/* Modales Principales: Panel Maestro (Sr.smith), Portal del Alumno, Panel de Aprobador Socio & Centro de Seguridad */}
      <AdminPanelModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <StudentPortalModal isOpen={isStudentPortalOpen} onClose={() => setIsStudentPortalOpen(false)} />
      <PartnerApproverModal isOpen={isApproverOpen} onClose={() => setIsApproverOpen(false)} />
      <SecurityComplianceModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />

      {/* Mentor de Trading Gratuito de Código Abierto (SMC, Lotaje, Validador y Voz Nativa) */}
      <OpenSourceTradingMentorModal
        isOpen={isMentorOpen}
        onClose={() => setIsMentorOpen(false)}
      />

      {/* Bot Asistente Flotante Integrado (Guía para Nuevos Usuarios, Clases, Chat, Biblioteca, Permisos y Mentor) */}
      <FloatingAssistantBot
        onOpenStudentPortal={() => setIsStudentPortalOpen(true)}
        onOpenAdvisorChat={() => setIsMentorOpen(true)}
        onOpenLiveVoice={() => setIsMentorOpen(true)}
      />

      {/* Suite Matemática y Auditoría Algorítmica SMC (100% Funcional y No Simulado) */}
      <SmcCalculatorValidatorModal
        isOpen={isSmcSuiteOpen}
        onClose={() => setIsSmcSuiteOpen(false)}
        onConsultMentor={(_prompt) => {
          setIsSmcSuiteOpen(false);
          setIsMentorOpen(true);
        }}
      />

      {/* Centro Integral de Feedback, Sugerencias y Correcciones */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        defaultCategory={feedbackCategory}
        defaultModule={feedbackModule}
      />

      {/* Botón flotante discreto de Feedback y Correcciones */}
      <button
        type="button"
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-4 left-4 z-40 px-3.5 py-2 rounded-full bg-[#03140e]/95 hover:bg-[#062319] border border-amber-500/40 hover:border-amber-400 text-amber-200 text-xs font-bold shadow-[0_10px_25px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 group"
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
