import React, { useState } from 'react';

interface FounderBiographyProps {
  onOpenAdvisorChat?: () => void;
}

export const FounderBiographySection: React.FC<FounderBiographyProps> = ({ onOpenAdvisorChat }) => {
  const [activeTab, setActiveTab] = useState<'origenes' | 'trayectoria' | 'liderazgo' | 'filosofia'>('origenes');

  return (
    <section id="fundador" className="founder-bio-section" aria-labelledby="founder-bio-title">
      <div className="wrap">
        {/* Cabecera de la Sección */}
        <div className="section-head text-center" style={{ maxWidth: '900px', margin: '0 auto 3rem' }}>
          <div className="founder-badge-pill">
            <span className="founder-lion-icon" aria-hidden="true">🦁</span>
            <span>LIDERAZGO &amp; IDENTIDAD INSTITUCIONAL</span>
          </div>

          <h2 id="founder-bio-title" className="founder-main-title">
            La Cara Detrás de <span className="gold-text">AL-HADIQA INVEST</span>
          </h2>

          <p className="founder-subtitle">
            Conoce la historia, raíces, trayectoria militar y visión estratégica de <strong>Carlos Smith Zambrano González</strong>,
            fundador, CEO y presidente de la firma. Una vida templada en la resiliencia, la justicia y el liderazgo inquebrantable.
          </p>
        </div>

        {/* Bloque Principal: Retrato Oficial + Resumen Biográfico */}
        <div className="founder-hero-grid">
          {/* Tarjeta del Retrato Presidencial */}
          <div className="founder-portrait-card">
            <div className="portrait-frame">
              <img
                src="/assets/aistudio/Gemini_Generated_Image_yszfflyszfflyszf_0d40df6e.jpeg"
                alt="Carlos Smith Zambrano González - Fundador, CEO y Presidente de AL-HADIQA INVEST"
                className="portrait-image"
                loading="lazy"
              />
              <div className="portrait-reflection-overlay" aria-hidden="true"></div>
            </div>

            <div className="portrait-meta-box">
              <h3 className="portrait-founder-name">Carlos Smith Zambrano González</h3>
              <p className="portrait-founder-role">CEO &amp; Presidente de AL-HADIQA INVEST</p>

              <div className="portrait-tags-list">
                <span className="portrait-tag">TSU en Investigación Penal</span>
                <span className="portrait-tag">Ex Militar Venezolano</span>
                <span className="portrait-tag portrait-tag--highlight">Ex Preso Político</span>
                <span className="portrait-tag">Delta Amacuro</span>
              </div>

              {/* Lema en el pie de la imagen */}
              <div className="portrait-quote-chip">
                <span className="quote-mark">«</span>
                <span>Los hombres luchan y Dios concede victoria</span>
                <span className="quote-mark">»</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Ejecutiva & Navegación de Pilares Biográficos */}
          <div className="founder-content-card">
            {/* Pestañas de Navegación Temática */}
            <div className="founder-tabs-bar" role="tablist" aria-label="Capítulos de la biografía">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'origenes'}
                className={`founder-tab-btn ${activeTab === 'origenes' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('origenes')}
              >
                <span className="tab-icon">🌿</span>
                <span className="tab-text">1. Orígenes &amp; Raíces</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'trayectoria'}
                className={`founder-tab-btn ${activeTab === 'trayectoria' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('trayectoria')}
              >
                <span className="tab-icon">⚔️</span>
                <span className="tab-text">2. Formación &amp; Resiliencia</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'liderazgo'}
                className={`founder-tab-btn ${activeTab === 'liderazgo' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('liderazgo')}
              >
                <span className="tab-icon">🏛️</span>
                <span className="tab-text">3. AL-HADIQA INVEST</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'filosofia'}
                className={`founder-tab-btn ${activeTab === 'filosofia' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('filosofia')}
              >
                <span className="tab-icon">✨</span>
                <span className="tab-text">4. Filosofía de Vida</span>
              </button>
            </div>

            {/* Contenido Dinámico por Pestaña */}
            <div className="founder-tab-body">
              {/* CAPÍTULO 1: Orígenes y Raíces */}
              {activeTab === 'origenes' && (
                <div className="bio-chapter-panel" tabIndex={0} role="tabpanel">
                  <div className="chapter-badge">
                    <span>CAPÍTULO I</span>
                    <span className="chapter-dot">•</span>
                    <span>TIERRA ANCESTRAL &amp; CUNA HISTÓRICA</span>
                  </div>

                  <h4 className="chapter-title">Nacimiento en la Tierra Más Antigua del Continente</h4>

                  <p className="chapter-lead">
                    <strong>Carlos Smith Zambrano González</strong> nació el <strong>9 de octubre de 1998</strong> en el
                    estado <strong>Delta Amacuro</strong>, siendo orgullosamente natural de <strong>Barrancas del Orinoco</strong>.
                  </p>

                  <div className="barrancas-highlight-card">
                    <div className="barrancas-card-head">
                      <span className="barrancas-icon">🌊</span>
                      <div>
                        <strong className="barrancas-title">Sobre Barrancas del Orinoco:</strong>
                        <span className="barrancas-subtitle">Patrimonio arqueológico e identidad fluvial</span>
                      </div>
                    </div>
                    <p className="barrancas-text">
                      Barrancas del Orinoco es ampliamente reconocida como <strong>la población habitada de forma continua más antigua de Venezuela y de todo el continente americano</strong>,
                      con vestigios arqueológicos que datan de las milenarias culturas prehispánicas <em>barrancoide</em> y <em>saladoide</em>.
                      Situada a las orillas del imponente río Orinoco, esta tierra está profundamente vinculada a la historia ancestral,
                      la navegación fluvial, la pesca y la vibrante herencia cultural del pueblo indígena <strong>Warao</strong>.
                    </p>
                  </div>

                  <div className="resilience-origin-box">
                    <span className="origin-icon">🌱</span>
                    <p>
                      Creció en el seno de una familia de <strong>clase social media baja</strong>, formándose íntegramente
                      en el sistema de <strong>educación pública</strong>. Estas vivencias tempranas forjaron desde su juventud
                      un carácter profundamente resiliente, disciplinado y enfocado en el esfuerzo propio para superar cualquier
                      barrera socioeconómica.
                    </p>
                  </div>
                </div>
              )}

              {/* CAPÍTULO 2: Formación Académica, Trayectoria Militar y Resiliencia */}
              {activeTab === 'trayectoria' && (
                <div className="bio-chapter-panel" tabIndex={0} role="tabpanel">
                  <div className="chapter-badge">
                    <span>CAPÍTULO II</span>
                    <span className="chapter-dot">•</span>
                    <span>DISCIPLINA, JUSTICIA &amp; SUPERACIÓN</span>
                  </div>

                  <h4 className="chapter-title">Formación Académica, Carrera Militar y Temple de Acero</h4>

                  <div className="milestones-vertical-list">
                    {/* Hito 1: Investigación Penal */}
                    <div className="milestone-item">
                      <div className="milestone-indicator">
                        <span className="milestone-number">01</span>
                      </div>
                      <div className="milestone-body">
                        <h5 className="milestone-heading">Educación y Vocación Jurídica: TSU en Investigación Penal</h5>
                        <p className="milestone-desc">
                          Cursó su educación regular en planteles públicos y posteriormente obtuvo el título de
                          <strong> TSU en Investigación Penal</strong>, desarrollando un profundo sentido de la justicia,
                          el análisis probatorio minucioso, la rigurosidad deductiva y el respeto inviolable por la legalidad.
                        </p>
                      </div>
                    </div>

                    {/* Hito 2: Carrera Militar */}
                    <div className="milestone-item">
                      <div className="milestone-indicator">
                        <span className="milestone-number">02</span>
                      </div>
                      <div className="milestone-body">
                        <h5 className="milestone-heading">Experiencia Militar Venezolana</h5>
                        <p className="milestone-desc">
                          Formó parte activa como <strong>militar venezolano</strong>, una etapa institucional que marcó
                          para siempre su disciplina táctica, la capacidad de toma de decisiones bajo presión extrema y su
                          visión estratégica de mando y lealtad a los principios éticos.
                        </p>
                      </div>
                    </div>

                    {/* Hito 3: Persecución y Resiliencia Inquebrantable */}
                    <div className="milestone-item milestone-item--persecution">
                      <div className="milestone-indicator milestone-indicator--persecution">
                        <span className="milestone-icon">🛡️</span>
                      </div>
                      <div className="milestone-body">
                        <h5 className="milestone-heading">Prueba de Fuego: Ex Preso Político del Régimen</h5>
                        <p className="milestone-desc">
                          Debido a su postura firme por los principios constitucionales y a las complejas circunstancias
                          sociopolíticas de su país, enfrentó la durísima prueba de ser <strong>ex preso político del régimen venezolano</strong>.
                          Un capítulo que puso a prueba su temple moral y físico, pero que lejos de doblegarlo, fortaleció
                          de manera inquebrantable su espíritu de lucha, su fe y su convicción perpetua por la libertad y el mérito.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CAPÍTULO 3: Liderazgo Empresarial - AL-HADIQA INVEST */}
              {activeTab === 'liderazgo' && (
                <div className="bio-chapter-panel" tabIndex={0} role="tabpanel">
                  <div className="chapter-badge">
                    <span>CAPÍTULO III</span>
                    <span className="chapter-dot">•</span>
                    <span>INNOVACIÓN TECNOLÓGICA &amp; HOLDING</span>
                  </div>

                  <h4 className="chapter-title">Liderazgo Empresarial: CEO y Presidente de AL-HADIQA INVEST</h4>

                  <p className="chapter-lead">
                    Lejos de permitir que las adversidades definieran su techo profesional, Carlos canalizó toda su experiencia,
                    disciplina militar y pensamiento analítico hacia la <strong>innovación tecnológica y el emprendimiento estratégico</strong>.
                    Hoy lidera como CEO y Presidente el holding corporativo <strong>AL-HADIQA INVEST</strong>.
                  </p>

                  <div className="holding-pillars-grid">
                    <div className="holding-pillar-card">
                      <div className="pillar-icon-box">💻</div>
                      <h5 className="pillar-title">Ecosistema Digital y Tecnológico</h5>
                      <p className="pillar-desc">
                        Plataforma corporativa integral diseñada para consolidar soluciones tecnológicas de vanguardia,
                        desarrollo de software propietario, comercio electrónico y estrategias de digitalización para empresas.
                      </p>
                    </div>

                    <div className="holding-pillar-card">
                      <div className="pillar-icon-box">📊</div>
                      <h5 className="pillar-title">Innovación y Educación Financiera</h5>
                      <p className="pillar-desc">
                        Transformación del panorama digital mediante la implementación de sistemas descentralizados,
                        herramientas orientadas a optimizar procesos comerciales, formación bursátil institucional SMC y proyectos comunitarios.
                      </p>
                    </div>

                    <div className="holding-pillar-card holding-pillar-card--full">
                      <div className="pillar-icon-box">🌐</div>
                      <h5 className="pillar-title">Visión de Futuro Autosostenible</h5>
                      <p className="pillar-desc">
                        Su propósito fundamental bajo este liderazgo es <strong>edificar una infraestructura empresarial autosostenible</strong> que
                        impulse el talento humano, la soberanía financiera, la digitalización y el crecimiento económico
                        independiente en la región y a nivel internacional.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CAPÍTULO 4: Filosofía de Vida */}
              {activeTab === 'filosofia' && (
                <div className="bio-chapter-panel" tabIndex={0} role="tabpanel">
                  <div className="chapter-badge">
                    <span>CAPÍTULO IV</span>
                    <span className="chapter-dot">•</span>
                    <span>PRINCIPIOS INQUEBRANTABLES</span>
                  </div>

                  <h4 className="chapter-title">La Máxima que Guía Cada Decisión</h4>

                  <p className="chapter-lead">
                    La trayectoria vital y empresarial de Carlos Smith Zambrano González se resume en una premisa
                    innegociable que rige su actuar personal, familiar y profesional:
                  </p>

                  {/* CITA DORADA INSTITUCIONAL */}
                  <div className="master-quote-container">
                    <div className="quote-icon-gold">⚔️</div>
                    <blockquote className="master-quote-text">
                      «Los hombres luchan y Dios concede victoria».
                    </blockquote>
                    <div className="quote-author-signature">
                      <span>— Carlos Smith Zambrano González</span>
                      <small>CEO &amp; Presidente · AL-HADIQA INVEST</small>
                    </div>
                  </div>

                  <div className="philosophy-explanation-box">
                    <p>
                      Esta frase no es solo un lema; representa su <strong>profunda fe en el Creador</strong>, su negativa
                      absoluta a rendirse frente a la adversidad, y la certeza de que el esfuerzo constante, la disciplina férrea,
                      la valentía y el trabajo honesto siempre encuentran su justa recompensa en la providencia divina.
                    </p>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="philosophy-actions-row">
                    <a href="#streaming" className="btn btn--gold">
                      <span>🔴 Ver Transmisión en Vivo con Sr.smith</span>
                      <span aria-hidden="true">&rarr;</span>
                    </a>

                    <a href="#ecosistema" className="btn btn--ghost">
                      <span>🏛️ Conocer el Ecosistema Digital</span>
                    </a>

                    {onOpenAdvisorChat && (
                      <button
                        type="button"
                        className="btn btn--emerald"
                        onClick={onOpenAdvisorChat}
                      >
                        <span>🧠 Consultar al Mentor IA</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Barra de Navegación Rápida entre Capítulos */}
            <div className="founder-footer-stepper">
              <span className="stepper-label">Capítulo seleccionado:</span>
              <div className="stepper-dots">
                <button
                  type="button"
                  className={`stepper-dot ${activeTab === 'origenes' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('origenes')}
                  title="1. Orígenes & Raíces"
                  aria-label="Ir a capítulo 1"
                >
                  1
                </button>
                <button
                  type="button"
                  className={`stepper-dot ${activeTab === 'trayectoria' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('trayectoria')}
                  title="2. Formación & Resiliencia"
                  aria-label="Ir a capítulo 2"
                >
                  2
                </button>
                <button
                  type="button"
                  className={`stepper-dot ${activeTab === 'liderazgo' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('liderazgo')}
                  title="3. AL-HADIQA INVEST"
                  aria-label="Ir a capítulo 3"
                >
                  3
                </button>
                <button
                  type="button"
                  className={`stepper-dot ${activeTab === 'filosofia' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('filosofia')}
                  title="4. Filosofía de Vida"
                  aria-label="Ir a capítulo 4"
                >
                  4
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
