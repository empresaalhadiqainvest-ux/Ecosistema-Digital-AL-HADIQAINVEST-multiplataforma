import React, { useState } from 'react';
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
import { GeminiAdvisorModal } from './components/GeminiAdvisorModal';
import { GeminiLiveVoiceModal } from './components/GeminiLiveVoiceModal';

export const AppContent: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isStudentPortalOpen, setIsStudentPortalOpen] = useState(false);
  const [isApproverOpen, setIsApproverOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isAdvisorChatOpen, setIsAdvisorChatOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);

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
        onOpenAdvisorChat={() => setIsAdvisorChatOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
      />

      <main id="contenido">
        <Hero
          onOpenAdvisorChat={() => setIsAdvisorChatOpen(true)}
          onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        />
        <Roadmap />
        <FounderBiographySection onOpenAdvisorChat={() => setIsAdvisorChatOpen(true)} />
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

      {/* Funciones de IA Integradas: Mentor Gemini Multi-Turn & Live Voice API */}
      <GeminiAdvisorModal
        isOpen={isAdvisorChatOpen}
        onClose={() => setIsAdvisorChatOpen(false)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
      />
      <GeminiLiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        onOpenAdvisorChat={() => setIsAdvisorChatOpen(true)}
      />

      {/* Bot Asistente Flotante Integrado (Guía para Nuevos Usuarios, Clases, Chat, Biblioteca, Permisos y Accesos IA) */}
      <FloatingAssistantBot
        onOpenStudentPortal={() => setIsStudentPortalOpen(true)}
        onOpenAdvisorChat={() => setIsAdvisorChatOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
      />
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
