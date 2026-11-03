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

export const AppContent: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isStudentPortalOpen, setIsStudentPortalOpen] = useState(false);
  const [isApproverOpen, setIsApproverOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isMentorOpen, setIsMentorOpen] = useState(false);

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
        onOpenLiveVoice={() => setIsMentorOpen(true)}
      />

      <main id="contenido">
        <Hero
          onOpenAdvisorChat={() => setIsMentorOpen(true)}
          onOpenLiveVoice={() => setIsMentorOpen(true)}
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
