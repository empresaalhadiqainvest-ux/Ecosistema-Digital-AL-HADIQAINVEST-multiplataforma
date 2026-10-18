import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#" aria-label="AL-HADIQAINVEST, volver al inicio">
              AL-HADIQA<span>INVEST</span>
            </a>
            <p>
              Holding Empresarial &amp; Ecosistema Digital. Finanzas, tecnología y entretenimiento bajo una misma estrategia.
            </p>
          </div>

          <nav aria-labelledby="footer-nav-title">
            <h2 className="footer-title" id="footer-nav-title">Divisiones</h2>
            <div className="footer-links">
              <a href="#trading">Trading Institucional</a>
              <a href="#smithbusiness">SmithBusiness Solutions</a>
              <a href="#gaming">Taberna Lions-Gold</a>
              <a href="#capital">AL-HADIQA Capital</a>
              <a href="#ecosistema">Ecosistema Digital</a>
              <a href="#newsletter">Boletín Informativo</a>
            </div>
          </nav>

          <div>
            <h2 className="footer-title">Plataformas</h2>
            <div className="footer-links">
              <a
                href="https://empresaalhadiqainvest-ux.github.io/Al-hadiqainvest-TRADING-Y-EDUCACI-N-FINANCIERA-/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Plataforma de Trading
              </a>
              <a
                href="https://empresaalhadiqainvest-ux.github.io/Smith-business-solutions/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Soluciones de Negocio
              </a>
              <a
                href="https://zambranogonzalezsmith-blip.github.io/LA-TABERNA-LIONS-GOLD-/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Comunidad Gaming
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 AL-HADIQAINVEST. Todos los derechos reservados.</p>
          <p className="footer-credit">
            <span>Derechos de autor &copy; 2026 <strong>Smith Business Solutions</strong></span>
            <span className="sep" aria-hidden="true">|</span>
            <span>Diseño y desarrollo</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
