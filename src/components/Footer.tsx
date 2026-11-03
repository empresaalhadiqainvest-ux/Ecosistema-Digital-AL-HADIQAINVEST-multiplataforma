import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#" aria-label="AL-HADIQA INVEST, volver al inicio">
              AL-HADIQA <span>INVEST</span>
            </a>
            <p className="footer-slogan" style={{ color: 'var(--gold-soft)', fontStyle: 'italic', margin: '0.4rem 0 0.8rem 0', fontSize: '0.92rem' }}>
              «Cultivando el crecimiento, nutriendo su capital»
            </p>
            <p>
              Holding Empresarial &amp; Ecosistema Digital. Trading institucional de alta precisión, educación financiera integral y soluciones tecnológicas de vanguardia.
            </p>
          </div>

          <nav aria-labelledby="footer-nav-title">
            <h2 className="footer-title" id="footer-nav-title">Divisiones</h2>
            <div className="footer-links">
              <a href="#roadmap">Roadmap del Alumno</a>
              <a href="#fundador">Biografía de Carlos Smith (CEO)</a>
              <a href="#streaming">Transmisión Streaming Oficial</a>
              <a href="#trading">Trading Institucional</a>
              <a href="#broker">Bróker Auditado</a>
              <a href="#clases-en-vivo">Clases en Vivo</a>
              <a href="#biblioteca">Biblioteca de Trading</a>
              <a href="#comunidad-chat">Chat Comunitario</a>
              <a href="#capital">AL-HADIQA Capital</a>
              <a href="#noticias-mercado">Noticias de Mercado</a>
              <a href="#smithbusiness">SmithBusiness Solutions</a>
              <a href="#gaming">Taberna Lions-Gold</a>
              <a href="#ecosistema">Ecosistema Digital</a>
              <a href="#faq">Preguntas Frecuentes</a>
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
          <p>&copy; 2026 AL-HADIQA INVEST. «Cultivando el crecimiento, nutriendo su capital». Todos los derechos reservados.</p>
          <p className="footer-credit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
            <span>Derechos de autor &copy; 2026 <strong>Smith Business Solutions</strong></span>
            <span className="sep" aria-hidden="true">|</span>
            <span>Diseño y desarrollo</span>
            <span className="sep" aria-hidden="true">|</span>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('al_hadiqa_open_cookies'));
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--gold-soft)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                padding: 0
              }}
              title="Administrar preferencias de cookies y privacidad"
            >
              🍪 Aviso y Configuración de Cookies
            </button>
          </p>
        </div>
      </div>
    </footer>
  );
};
