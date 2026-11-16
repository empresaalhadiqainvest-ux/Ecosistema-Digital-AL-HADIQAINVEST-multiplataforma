import React, { useState } from 'react';
import { trackEvent } from '../utils/analytics';

interface HeroProps {
  onOpenAdvisorChat?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenSmcSuite?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenAdvisorChat, onOpenLiveVoice, onOpenSmcSuite }) => {
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const coverImageSrc = '/assets/aistudio/presentacion_de_alhadiqa_721bb0bc.jpeg';

  const handleOpenSmc = () => {
    if (onOpenSmcSuite) {
      onOpenSmcSuite();
    } else if (onOpenLiveVoice) {
      onOpenLiveVoice();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('al_hadiqa_open_smc_suite'));
    }
  };

  return (
    <section className="hero" id="inicio" data-section="investor-academy">
      {/* Fondos y resplandores dorados acordes al mármol negro y oro de la portada */}
      <div className="grid-bg" aria-hidden="true"></div>
      <div className="glow glow--gold" aria-hidden="true"></div>
      <div className="glow glow--amber" aria-hidden="true"></div>

      <div className="wrap">
        {/* Layout principal en 2 columnas en desktop / 1 en móvil */}
        <div className="hero-showcase">
          {/* Columna de Contenido e Identidad */}
          <div className="hero-showcase__content">
            <div className="hero-credo-badge">
              <span className="hero-credo-badge__icon">🦁</span>
              <span>HOLDING &amp; ACADEMIA FINANCIERA · DESDE 2026</span>
            </div>

            <h1 id="investor-academy" className="h-display hero-title">
              Investor Academy <span className="gradient-text">Al-hadida Invest</span>
            </h1>

            {/* Eslogan Oficial Grabado */}
            <p className="hero-slogan">
              «Cultivando el crecimiento, nutriendo su capital»
            </p>

            <p className="lead hero-description">
              Ecosistema integral de alta especialización bursátil y desarrollo patrimonial. 
              Fusionamos el <strong>trading institucional de precisión</strong> (Smart Money Concepts, 
              gestión de liquidez y scalping), la <strong>educación financiera de Al-Hadiqa Capital</strong> 
              y la disciplina estratégica en un entorno tecnológico seguro y en tiempo real.
            </p>

            {/* CTA ÚNICO Y CLARO: Embudo principal de conversión del alumno */}
            <div className="hero__actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
                <a
                  className="btn"
                  href="#roadmap"
                  onClick={() => {
                    trackEvent('cta_click_main_hero', {
                      cta_label: 'Comenzar Formación Institucional',
                      target: '#roadmap',
                    });
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #fce072 0%, #d4af37 45%, #997b2d 100%)',
                    color: '#03140e',
                    fontWeight: 800,
                    fontSize: '1.02rem',
                    padding: '0.95rem 2rem',
                    borderRadius: '14px',
                    boxShadow: '0 10px 25px rgba(212, 175, 55, 0.45)',
                    border: '1px solid rgba(255, 242, 178, 0.6)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    textDecoration: 'none',
                    letterSpacing: '0.01em',
                  }}
                >
                  <span>🚀 Comenzar Formación Institucional</span>
                  <span className="arrow" aria-hidden="true" style={{ fontSize: '1.15rem' }}>&rarr;</span>
                </a>

                {onOpenAdvisorChat && (
                  <button
                    type="button"
                    className="btn btn--gold"
                    onClick={() => {
                      trackEvent('cta_click_mentor_hero', { target: 'mentor_modal' });
                      onOpenAdvisorChat();
                    }}
                    style={{
                      background: 'rgba(9, 51, 37, 0.85)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      color: '#f8fafc',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      padding: '0.95rem 1.4rem',
                      borderRadius: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      backdropFilter: 'blur(8px)',
                      cursor: 'pointer',
                    }}
                  >
                    <span>🦁 Mentor de Trading (Código Abierto)</span>
                  </button>
                )}
              </div>

              {/* Atajos Rápidos Complementarios para Alumnos */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--muted)', fontWeight: 600, marginRight: '4px' }}>
                  Accesos directos:
                </span>
                <a
                  href="#streaming"
                  style={{
                    color: '#fca5a5',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  🔴 Streaming en Vivo
                </a>
                <button
                  type="button"
                  onClick={handleOpenSmc}
                  style={{
                    color: '#6ee7b7',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  🧮 Suite SMC Real
                </button>
                <a
                  href="#clases-en-vivo"
                  style={{
                    color: '#93c5fd',
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  🎓 Clases
                </a>
                <a
                  href="#biblioteca"
                  style={{
                    color: '#fde68a',
                    background: 'rgba(212, 175, 55, 0.12)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  📚 Biblioteca
                </a>
                <a
                  href="#dashboard-estudiantes"
                  style={{
                    color: '#a5f3fc',
                    background: 'rgba(6, 182, 212, 0.12)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  📊 Dashboard
                </a>
              </div>
            </div>

            {/* Credenciales y garantías */}
            <div className="hero-guarantees">
              <div className="hero-guarantee-item">
                <span className="hero-guarantee-bullet">✓</span>
                <span><strong>Google OAuth 2.0</strong> &amp; OWASP Top 10</span>
              </div>
              <div className="hero-guarantee-item">
                <span className="hero-guarantee-bullet">✓</span>
                <span><strong>Firestore Realtime</strong> en Chat y Clases</span>
              </div>
              <div className="hero-guarantee-item">
                <span className="hero-guarantee-bullet">✓</span>
                <span><strong>Streaming Multicanal</strong> (YouTube/Twitch)</span>
              </div>
              <div className="hero-guarantee-item">
                <span className="hero-guarantee-bullet">✓</span>
                <span><strong>Socio Educativo</strong> JustMarkets (Revisión Previa)</span>
              </div>
            </div>
          </div>

          {/* Columna de Portada Oficial */}
          <div className="hero-showcase__cover">
            <div 
              className="hero-cover-card"
              onClick={() => setIsCoverModalOpen(true)}
              title="Click para ver la portada en alta resolución"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setIsCoverModalOpen(true);
                }
              }}
            >
              <div className="hero-cover-tag">
                <span className="hero-cover-tag__dot"></span>
                <span>PORTADA OFICIAL · AL-HADIQA INVEST</span>
              </div>

              <div className="hero-cover-image-wrapper">
                <picture>
                  <source srcSet="/assets/aistudio/presentacion_de_alhadiqa_721bb0bc.webp" type="image/webp" />
                  <img
                    src={coverImageSrc}
                    width={1376}
                    height={768}
                    decoding="async"
                    {...({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)}
                    alt="Presentación oficial de AL-HADIQA INVEST - Cultivando el crecimiento, nutriendo su capital"
                    className="hero-cover-image"
                    loading="eager"
                  />
                </picture>
                <div className="hero-cover-overlay">
                  <span className="hero-cover-zoom-icon">🔍 Ampliar Portada</span>
                </div>
              </div>

              <div className="hero-cover-caption">
                <p className="hero-cover-caption__title">Investor Academy Al-hadida Invest</p>
                <p className="hero-cover-caption__subtitle">Cultivando el crecimiento, nutriendo su capital</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pilares Estratégicos del Ecosistema AL-HADIQA INVEST */}
        <div className="hero-pillars">
          <div className="hero-pillar-card">
            <div className="hero-pillar-card__icon">📈</div>
            <h3>Trading Institucional</h3>
            <p>Smart Money Concepts, desequilibrios FVG, lectura de volumen y scalping en sesiones de Nueva York y Londres en directo.</p>
            <a href="#trading" className="hero-pillar-card__link">Ver metodología &rarr;</a>
          </div>

          <div className="hero-pillar-card">
            <div className="hero-pillar-card__icon">🏛️</div>
            <h3>AL-HADIQA Capital</h3>
            <p>Educación financiera basada en el Cuadrante del Flujo de Dinero (Kiyosaki), hábitos, presencia y psicotrading disciplinado.</p>
            <a href="#capital" className="hero-pillar-card__link">Explorar módulos &rarr;</a>
          </div>

          <div className="hero-pillar-card">
            <div className="hero-pillar-card__icon">📚</div>
            <h3>Biblioteca Exclusiva</h3>
            <p>Libros y manuales con control de acceso asignado por alumno, enlaces de descarga firmados temporales y registro auditable.</p>
            <a href="#biblioteca" className="hero-pillar-card__link">Consultar catálogo &rarr;</a>
          </div>

          <div className="hero-pillar-card">
            <div className="hero-pillar-card__icon">💬</div>
            <h3>Chat &amp; Transmisión</h3>
            <p>Salas temáticas en tiempo real con Firestore, emojis, envío seguro de capturas con antivirus y streaming multicanal.</p>
            <a href="#comunidad-chat" className="hero-pillar-card__link">Entrar a la sala &rarr;</a>
          </div>
        </div>

        {/* Métricas y Valores Clave */}
        <dl className="metrics">
          <div className="metric">
            <dt>Unidades Estratégicas</dt>
            <dd><em>04</em> Pilares Activos</dd>
          </div>
          <div className="metric">
            <dt>Filosofía y Misión</dt>
            <dd>Crecimiento &amp; <em>Capital</em></dd>
          </div>
          <div className="metric">
            <dt>Cumplimiento &amp; Seguridad</dt>
            <dd>TLS 1.3 · <em>OWASP</em></dd>
          </div>
        </dl>
      </div>

      {/* Modal para visualizar portada en pantalla completa */}
      {isCoverModalOpen && (
        <div 
          className="cover-lightbox-overlay"
          onClick={() => setIsCoverModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="cover-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="cover-lightbox-close"
              onClick={() => setIsCoverModalOpen(false)}
              aria-label="Cerrar modal"
            >
              ✕
            </button>
            <picture>
              <source srcSet="/assets/aistudio/presentacion_de_alhadiqa_721bb0bc.webp" type="image/webp" />
              <img
                src={coverImageSrc}
                width={1376}
                height={768}
                decoding="async"
                alt="Presentación institucional de AL-HADIQA INVEST en alta resolución - Portada corporativa con emblema de león dorado, lema 'Cultivando el crecimiento, nutriendo su capital' y pilares de inversión"
                className="cover-lightbox-image"
              />
            </picture>
            <div className="cover-lightbox-footer">
              <h3 style={{ color: 'var(--gold)', fontFamily: 'var(--font-head)', margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>
                AL-HADIQA INVEST
              </h3>
              <p style={{ color: 'var(--gold-soft)', fontStyle: 'italic', margin: 0, fontSize: '0.95rem' }}>
                «Cultivando el crecimiento, nutriendo su capital»
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
