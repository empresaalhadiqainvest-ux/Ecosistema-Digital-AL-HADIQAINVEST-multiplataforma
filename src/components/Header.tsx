import React, { useState } from 'react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <a className="brand" href="#" aria-label="AL-HADIQAINVEST, inicio" onClick={closeMenu}>
          AL-HADIQA<span>INVEST</span>
        </a>

        <button
          type="button"
          className={`burger-btn ${mobileMenuOpen ? 'is-open' : ''}`}
          onClick={toggleMenu}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Cerrar el menú de navegación' : 'Abrir el menú de navegación'}
        >
          <span className="burger-icon-line" aria-hidden="true"></span>
        </button>

        <nav className={`nav ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
          <a href="#trading" onClick={closeMenu}>Trading</a>
          <a href="#smithbusiness" onClick={closeMenu}>SmithBusiness</a>
          <a href="#gaming" onClick={closeMenu}>Lions-Gold</a>
          <a href="#capital" onClick={closeMenu}>AL-HADIQA Capital</a>
          <a href="#ecosistema" onClick={closeMenu}>Ecosistema</a>
          <a className="btn header-cta" href="#ecosistema" onClick={closeMenu}>Ver ecosistema</a>
        </nav>
      </div>
    </header>
  );
};
