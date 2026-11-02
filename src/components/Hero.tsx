import React, { useState } from 'react';

interface HeroProps {
  onOpenAdvisorChat?: () => void;
  onOpenLiveVoice?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenAdvisorChat, onOpenLiveVoice }) => {
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const coverImageSrc = '/assets/aistudio/presentacion_de_alhadiqa_721bb0bc.jpeg';

  return (
    <section className="hero" id="inicio">
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

            <h1 className="h-display hero-title">
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

            {/* Botones de acción principales */}
            <div className="hero__actions">
              <a className="btn" href="#roadmap">
                <span>🧭 Roadmap del Alumno</span>
                <span className="arrow" aria-hidden="true">&rarr;</span>
              </a>
              <a
                className="btn"
                href="#streaming"
                style={{
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(185, 28, 28, 0.95))',
                  borderColor: '#ef4444',
                  color: '#ffffff',
                  boxShadow: '0 0 18px rgba(239, 68, 68, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                }}
              >
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 0 8px #fff' }}></span>
                <span>🔴 Streaming en Vivo</span>
              </a>
              {onOpenLiveVoice && (
                <button
                  type="button"
                  className="btn btn--emerald"
                  onClick={onOpenLiveVoice}
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #047857)',
                    borderColor: '#10B981',
                    boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🎙️ Voz en Vivo (Live API)</span>
                </button>
              )}
              {onOpenAdvisorChat && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={onOpenAdvisorChat}
                  style={{
                    borderColor: 'rgba(197, 168, 128, 0.6)',
                    color: 'var(--gold)',
                    background: 'rgba(197, 168, 128, 0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🧠 Mentor Gemini IA</span>
                </button>
              )}
              <a className="btn btn--ghost" href="#clases-en-vivo">
                <span>🎓 Clases en Vivo</span>
              </a>
              <a className="btn btn--ghost" href="#capital">
                <span>🏛️ AL-HADIQA Capital</span>
              </a>
              <a className="btn btn--ghost" href="#biblioteca">
                <span>📚 Biblioteca</span>
              </a>
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
                <img
                  src={coverImageSrc}
                  alt="Presentación oficial de AL-HADIQA INVEST - Cultivando el crecimiento, nutriendo su capital"
                  className="hero-cover-image"
                  loading="eager"
                />
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
            <img
              src={coverImageSrc}
              alt="Presentación oficial de AL-HADIQA INVEST"
              className="cover-lightbox-image"
            />
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
