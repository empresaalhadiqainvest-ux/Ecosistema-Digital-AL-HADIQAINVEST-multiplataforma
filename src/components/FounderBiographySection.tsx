import React, { useState } from 'react';

interface FounderBiographyProps {
  onOpenAdvisorChat?: () => void;
}

export const FounderBiographySection: React.FC<FounderBiographyProps> = ({ onOpenAdvisorChat }) => {
  const [activeTab, setActiveTab] = useState<'origenes' | 'trayectoria' | 'liderazgo' | 'filosofia' | 'completa'>('origenes');
  const [imageError, setImageError] = useState(false);

  const portraitSrc = '/assets/aistudio/Gemini_Generated_Image_yszfflyszfflyszf_0d40df6e.jpeg';

  return (
    <section id="fundador" className="founder-bio-section" aria-labelledby="founder-bio-title">
      <div className="wrap">
        {/* Encabezado Oficial de la Sección */}
        <div className="section-head text-center" style={{ maxWidth: '920px', margin: '0 auto 3rem' }}>
          <div className="founder-badge-pill">
            <span className="founder-lion-icon" aria-hidden="true">🦁</span>
            <span>IDENTIDAD &amp; LIDERAZGO INSTITUCIONAL</span>
          </div>

          <h2 id="founder-bio-title" className="founder-main-title">
            La Cara Detrás de <span className="gold-text">AL-HADIQA INVEST</span>
          </h2>

          <p className="founder-subtitle">
            Conoce la trayectoria de <strong>Carlos Smith Zambrano González</strong>: orígenes en la cuna más antigua de América,
            formación en investigación penal, disciplina militar, resiliencia ante la persecución y visión como CEO &amp; Presidente del holding.
          </p>
        </div>

        {/* Estructura Principal: Retrato + Biografía Estructurada */}
        <div className="founder-hero-grid">
          {/* Columna Izquierda: Retrato Oficial con Fallback / Placeholder */}
          <div className="founder-portrait-card">
            <div className="portrait-frame">
              {!imageError ? (
                <picture>
                  <source srcSet="/assets/aistudio/Gemini_Generated_Image_yszfflyszfflyszf_0d40df6e.webp" type="image/webp" />
                  <img
                    src={portraitSrc}
                    width={896}
                    height={1170}
                    decoding="async"
                    alt="Carlos Smith Zambrano González - CEO y Presidente de AL-HADIQA INVEST"
                    className="portrait-image"
                    loading="lazy"
                    onError={() => setImageError(true)}
                  />
                </picture>
              ) : (
                /* Placeholder Ilustrado Presidencial en caso de error de carga */
                <div className="portrait-placeholder">
                  <div className="placeholder-crest">
                    <span className="placeholder-lion">🦁</span>
                    <div className="placeholder-flag-stripe" aria-hidden="true"></div>
                  </div>
                  <div className="placeholder-initials">CS</div>
                  <div className="placeholder-caption">Carlos Smith Zambrano González</div>
                  <div className="placeholder-sub">CEO &amp; Presidente · AL-HADIQA INVEST</div>
                </div>
              )}
              <div className="portrait-reflection-overlay" aria-hidden="true"></div>
            </div>

            <div className="portrait-meta-box">
              <h3 className="portrait-founder-name">Carlos Smith Zambrano González</h3>
              <p className="portrait-founder-role">Fundador, CEO &amp; Presidente</p>

              <div className="portrait-tags-list">
                <span className="portrait-tag">TSU en Investigación Penal</span>
                <span className="portrait-tag">Ex Militar Venezolano</span>
                <span className="portrait-tag portrait-tag--highlight">Ex Preso Político</span>
                <span className="portrait-tag">Delta Amacuro</span>
              </div>

              {/* Lema en el pie del marco */}
              <div className="portrait-quote-chip">
                <span className="quote-mark">«</span>
                <span>Los hombres luchan y Dios concede victoria</span>
                <span className="quote-mark">»</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Contenido Estructurado */}
          <div className="founder-content-card">
            {/* Barra de Selección de Modos de Lectura */}
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
                <span className="tab-text">4. Filosofía</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'completa'}
                className={`founder-tab-btn founder-tab-btn--all ${activeTab === 'completa' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('completa')}
                title="Leer la biografía completa sin interrupciones"
              >
                <span className="tab-icon">📖</span>
                <span className="tab-text">Lectura Completa</span>
              </button>
            </div>

            {/* CUERPO DEL CONTENIDO ESTRUCTURADO */}
            <div className="founder-tab-body">
              {/* VISTA 1: 1. Orígenes y Raíces */}
              {activeTab === 'origenes' && (
                <div className="bio-chapter-panel" tabIndex={0} role="tabpanel">
                  <div className="chapter-badge">
                    <span>CAPÍTULO I</span>
                    <span className="chapter-dot">•</span>
                    <span>ORÍGENES Y RAÍCES</span>
                  </div>

                  <h3 className="chapter-title">1. Orígenes y Raíces</h3>

                  <p className="chapter-lead">
                    <strong>Carlos Smith Zambrano González</strong> nació el <strong>9 de octubre de 1998</strong> en el estado Delta Amacuro,
                    siendo natural de <strong>Barrancas del Orinoco</strong>.
                  </p>

                  <div className="barrancas-highlight-card">
                    <div className="barrancas-card-head">
                      <span className="barrancas-icon">🌊</span>
                      <div>
                        <h4 className="barrancas-title">Sobre su localidad natal: Barrancas del Orinoco</h4>
                        <span className="barrancas-subtitle">Población habitada más antigua del continente</span>
                      </div>
                    </div>
                    <p className="barrancas-text">
                      Barrancas del Orinoco es ampliamente reconocida como <strong>la población habitada de forma continua más antigua de Venezuela y de todo el continente americano</strong>,
                      con vestigios arqueológicos que datan de las culturas prehispánicas <em>barrancoide</em> y <em>saladoide</em>.
                      Situada a las orillas del imponente río Orinoco, esta tierra está profundamente vinculada a la historia ancestral,
                      la pesca, la navegación fluvial y la vibrante herencia cultural del pueblo indígena <strong>Warao</strong>.
                    </p>
                  </div>

                  <div className="resilience-origin-box">
                    <span className="origin-icon">🌱</span>
                    <p>
                      Creció en el seno de una familia de <strong>clase social media baja</strong>, formándose en el sistema de <strong>educación pública</strong>,
                      lo que forjó desde su juventud un carácter resiliente, disciplinado y enfocado en el esfuerzo propio para superar los retos socioeconómicos.
                    </p>
                  </div>
                </div>
              )}

              {/* VISTA 2: 2. Formación Académica, Trayectoria Militar y Resiliencia */}
              {activeTab === 'trayectoria' && (
                <div className="bio-chapter-panel" tabIndex={0} role="tabpanel">
                  <div className="chapter-badge">
                    <span>CAPÍTULO II</span>
                    <span className="chapter-dot">•</span>
                    <span>FORMACIÓN ACADÉMICA, MILITAR Y RESILIENCIA</span>
                  </div>

                  <h3 className="chapter-title">2. Formación Académica, Trayectoria Militar y Resiliencia</h3>

                  <ul className="structured-bullet-list">
                    <li className="bullet-card">
                      <div className="bullet-header">
                        <span className="bullet-icon">⚖️</span>
                        <strong>Educación y Vocación:</strong>
                      </div>
                      <p>
                        Cursó su educación regular en planteles públicos y posteriormente obtuvo el título de <strong>TSU en Investigación Penal</strong>,
                        desarrollando un profundo sentido de la justicia, el análisis riguroso y la legalidad.
                      </p>
                    </li>

                    <li className="bullet-card bullet-card--highlight">
                      <div className="bullet-header">
                        <span className="bullet-icon">⚔️</span>
                        <strong>Experiencia Militar y Persecución:</strong>
                      </div>
                      <p>
                        Formó parte de las filas como <strong>militar venezolano</strong>, una etapa que marcó su disciplina y visión de liderazgo.
                        Debido a su postura y circunstancias sociopolíticas en el país, enfrentó la dura prueba de ser <strong>ex preso político del régimen venezolano</strong>,
                        un capítulo que puso a prueba su temple, pero que fortaleció inquebrantablemente su espíritu de lucha y convicción por la libertad.
                      </p>
                    </li>
                  </ul>
                </div>
              )}

              {/* VISTA 3: 3. Liderazgo Empresarial: AL-HADIQA INVEST */}
              {activeTab === 'liderazgo' && (
                <div className="bio-chapter-panel" tabIndex={0} role="tabpanel">
                  <div className="chapter-badge">
                    <span>CAPÍTULO III</span>
                    <span className="chapter-dot">•</span>
                    <span>LIDERAZGO EMPRESARIAL</span>
                  </div>

                  <h3 className="chapter-title">3. Liderazgo Empresarial: AL-HADIQA INVEST</h3>

                  <p className="chapter-lead">
                    Lejos de permitir que las adversidades definieran su techo profesional, Carlos canalizó su experiencia hacia la innovación tecnológica y el emprendimiento estratégico.
                    Actualmente se desempeña como <strong>CEO y Presidente de AL-HADIQA INVEST</strong>, un holding empresarial y ecosistema digital de vanguardia.
                  </p>

                  <div className="holding-inquiry-box">
                    <h4 className="inquiry-title">¿Qué es AL-HADIQA INVEST y qué busca?</h4>

                    <div className="inquiry-items-grid">
                      <div className="inquiry-item">
                        <div className="inquiry-item-head">
                          <span className="inquiry-icon">💻</span>
                          <strong>Ecosistema Digital y Tecnológico:</strong>
                        </div>
                        <p>
                          Es una plataforma corporativa integral diseñada para consolidar soluciones tecnológicas, desarrollo de software, comercio electrónico y estrategias digitales.
                        </p>
                      </div>

                      <div className="inquiry-item">
                        <div className="inquiry-item-head">
                          <span className="inquiry-icon">📈</span>
                          <strong>Innovación y Educación:</strong>
                        </div>
                        <p>
                          Busca transformar el panorama digital mediante la implementación de sistemas descentralizados, herramientas de gestión orientadas a optimizar procesos comerciales, educación financiera y proyectos comunitarios de alto impacto.
                        </p>
                      </div>

                      <div className="inquiry-item inquiry-item--full">
                        <div className="inquiry-item-head">
                          <span className="inquiry-icon">🌐</span>
                          <strong>Visión de Futuro:</strong>
                        </div>
                        <p>
                          Su propósito fundamental bajo este liderazgo es <strong>edificar una infraestructura empresarial autosostenible</strong> que impulse el talento humano,
                          la digitalización y el crecimiento económico independiente en la región y más allá.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA 4: 4. Filosofía de Vida */}
              {activeTab === 'filosofia' && (
                <div className="bio-chapter-panel" tabIndex={0} role="tabpanel">
                  <div className="chapter-badge">
                    <span>CAPÍTULO IV</span>
                    <span className="chapter-dot">•</span>
                    <span>FILOSOFÍA DE VIDA</span>
                  </div>

                  <h3 className="chapter-title">4. Filosofía de Vida</h3>

                  <p className="chapter-lead">
                    La trayectoria vital de Carlos Smith Zambrano González se resume en una premisa inquebrantable que guía cada uno de sus pasos personales y profesionales:
                  </p>

                  <div className="master-quote-container">
                    <div className="quote-icon-gold">⚔️</div>
                    <blockquote className="master-quote-text">
                      «Los hombres luchan y Dios concede victoria».
                    </blockquote>
                    <div className="quote-author-signature">
                      <strong>Carlos Smith Zambrano González</strong>
                      <small>CEO y Presidente · AL-HADIQA INVEST</small>
                    </div>
                  </div>

                  <div className="philosophy-explanation-box">
                    <p>
                      Esta frase refleja su <strong>profunda fe</strong>, su negativa a rendirse ante la adversidad y la convicción de que el esfuerzo constante,
                      la valentía y el trabajo honesto siempre encuentran su recompensa en la <strong>justicia divina</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* VISTA 5: LECTURA COMPLETA ESTRUCTURADA (TODOS LOS CAPÍTULOS JUNTOS) */}
              {activeTab === 'completa' && (
                <div className="bio-full-document-panel" tabIndex={0} role="tabpanel">
                  <div className="full-doc-header">
                    <span className="full-doc-badge">DOCUMENTO BIOGRÁFICO OFICIAL</span>
                    <h3 className="full-doc-heading">Biografía de Carlos Smith Zambrano González</h3>
                    <div className="full-doc-divider"></div>
                  </div>

                  {/* Sección 1 */}
                  <section className="full-doc-section">
                    <h4 className="full-doc-section-title">1. Orígenes y Raíces</h4>
                    <p>
                      <strong>Carlos Smith Zambrano González</strong> nació el <strong>9 de octubre de 1998</strong> en el estado Delta Amacuro,
                      siendo natural de <strong>Barrancas del Orinoco</strong>.
                    </p>
                    <ul className="full-doc-list">
                      <li>
                        <strong>Sobre su localidad natal:</strong> Barrancas del Orinoco es ampliamente reconocida como <strong>la población habitada de forma continua más antigua de Venezuela</strong> y de todo el continente americano, con vestigios arqueológicos que datan de las culturas prehispánicas <em>barrancoide</em> y <em>saladoide</em>. Situada a las orillas del imponente río Orinoco, esta tierra está profundamente vinculada a la historia ancestral, la pesca, la navegación fluvial y la vibrante herencia cultural del pueblo indígena Warao.
                      </li>
                    </ul>
                    <p>
                      Creció en el seno de una familia de <strong>clase social media baja</strong>, formándose en el sistema de <strong>educación pública</strong>,
                      lo que forjó desde su juventud un carácter resiliente, disciplinado y enfocado en el esfuerzo propio para superar los retos socioeconómicos.
                    </p>
                  </section>

                  <div className="full-doc-divider"></div>

                  {/* Sección 2 */}
                  <section className="full-doc-section">
                    <h4 className="full-doc-section-title">2. Formación Académica, Trayectoria Militar y Resiliencia</h4>
                    <ul className="full-doc-list">
                      <li>
                        <strong>Educación y Vocación:</strong> Cursó su educación regular en planteles públicos y posteriormente obtuvo el título de <strong>TSU en Investigación Penal</strong>, desarrollando un profundo sentido de la justicia, el análisis riguroso y la legalidad.
                      </li>
                      <li>
                        <strong>Experiencia Militar y Persecución:</strong> Formó parte de las filas como <strong>militar venezolano</strong>, una etapa que marcó su disciplina y visión de liderazgo. Debido a su postura y circunstancias sociopolíticas en el país, enfrentó la dura prueba de ser <strong>ex preso político del régimen venezolano</strong>, un capítulo que puso a prueba su temple, pero que fortaleció inquebrantablemente su espíritu de lucha y convicción por la libertad.
                      </li>
                    </ul>
                  </section>

                  <div className="full-doc-divider"></div>

                  {/* Sección 3 */}
                  <section className="full-doc-section">
                    <h4 className="full-doc-section-title">3. Liderazgo Empresarial: AL-HADIQA INVEST</h4>
                    <p>
                      Lejos de permitir que las adversidades definieran su techo profesional, Carlos canalizó su experiencia hacia la innovación tecnológica y el emprendimiento estratégico.
                      Actualmente se desempeña como <strong>CEO y Presidente de AL-HADIQA INVEST</strong>, un holding empresarial y ecosistema digital de vanguardia.
                    </p>

                    <h5 className="full-doc-subheading">¿Qué es AL-HADIQA INVEST y qué busca?</h5>
                    <ul className="full-doc-list">
                      <li>
                        <strong>Ecosistema Digital y Tecnológico:</strong> Es una plataforma corporativa integral diseñada para consolidar soluciones tecnológicas, desarrollo de software, comercio electrónico y estrategias digitales.
                      </li>
                      <li>
                        <strong>Innovación y Educación:</strong> Busca transformar el panorama digital mediante la implementación de sistemas descentralizados, herramientas de gestión orientadas a optimizar procesos comerciales, educación financiera y proyectos comunitarios de alto impacto.
                      </li>
                      <li>
                        <strong>Visión de Futuro:</strong> Su propósito fundamental bajo este liderazgo es edificar una infraestructura empresarial autosostenible que impulse el talento humano, la digitalización y el crecimiento económico independiente en la región y más allá.
                      </li>
                    </ul>
                  </section>

                  <div className="full-doc-divider"></div>

                  {/* Sección 4 */}
                  <section className="full-doc-section">
                    <h4 className="full-doc-section-title">4. Filosofía de Vida</h4>
                    <p>
                      La trayectoria vital de Carlos Smith Zambrano González se resume en una premisa inquebrantable que guía cada uno de sus pasos personales y profesionales:
                    </p>

                    <blockquote className="full-doc-quote">
                      «Los hombres luchan y Dios concede victoria».
                    </blockquote>

                    <p>
                      Esta frase refleja su profunda fe, su negativa a rendirse ante la adversidad y la convicción de que el esfuerzo constante,
                      la valentía y el trabajo honesto siempre encuentran su recompensa en la justicia divina.
                    </p>
                  </section>
                </div>
              )}
            </div>

            {/* Enlaces de Acción Rápida Institucional */}
            <div className="founder-footer-actions">
              <a href="#streaming" className="btn btn--gold">
                <span>🔴 Transmisiones en Vivo con Sr.smith</span>
                <span aria-hidden="true">&rarr;</span>
              </a>

              <a href="#ecosistema" className="btn btn--ghost">
                <span>🏛️ Ecosistema AL-HADIQA INVEST</span>
              </a>

              {onOpenAdvisorChat && (
                <button
                  type="button"
                  className="btn btn--emerald"
                  onClick={onOpenAdvisorChat}
                >
                  <span>🦁 Mentor Institucional (Código Abierto)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
