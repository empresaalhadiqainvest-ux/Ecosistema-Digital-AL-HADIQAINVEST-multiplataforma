import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TradingSection } from './components/TradingSection';
import { SmithBusinessSection } from './components/SmithBusinessSection';
import { GamingSection } from './components/GamingSection';
import { EcosystemSection } from './components/EcosystemSection';
import { CapitalSection } from './components/CapitalSection';
import { NewsletterSection } from './components/NewsletterSection';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido principal
      </a>

      <Header />

      <main id="contenido">
        <Hero />
        <TradingSection />
        <SmithBusinessSection />
        <GamingSection />
        <EcosystemSection />
        <CapitalSection />
        <NewsletterSection />
      </main>

      <Footer />
    </>
  );
};

export default App;
