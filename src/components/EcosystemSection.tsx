import React from 'react';

export const EcosystemSection: React.FC = () => {
  return (
    <section className="section" id="ecosistema">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Infraestructura</p>
          <h2 className="h-section">Pilares del Ecosistema Digital</h2>
          <p>
            La infraestructura tecnológica y de servicios que da soporte al holding empresarial,
            garantizando escalabilidad y eficiencia.
          </p>
        </div>

        <div className="cards">
          <article className="card" style={{ ['--accent' as string]: 'var(--gold)' }}>
            <div className="card__icon" aria-hidden="true">🛒</div>
            <h3 className="h-card">Plataformas E-Commerce</h3>
            <div className="card__rule" aria-hidden="true"></div>
            <p>
              Desarrollo e implementación de sistemas multi-tienda y plataformas de distribución con pasarelas de pago integradas e inventario automatizado.
            </p>
          </article>

          <article className="card" style={{ ['--accent' as string]: 'var(--emerald)' }}>
            <div className="card__icon" aria-hidden="true">🧠</div>
            <h3 className="h-card">Inteligencia Artificial</h3>
            <div className="card__rule" aria-hidden="true"></div>
            <p>
              Diseño de asistentes virtuales e inteligencias artificiales capaces de operar localmente (offline) para optimizar la toma de decisiones empresariales.
            </p>
          </article>

          <article className="card" style={{ ['--accent' as string]: 'var(--blue)' }}>
            <div className="card__icon" aria-hidden="true">🛡️</div>
            <h3 className="h-card">Gestión de Comunidades</h3>
            <div className="card__rule" aria-hidden="true"></div>
            <p>
              Creación, administración y liderazgo de entornos digitales a gran escala, gestionando recursos y fomentando el crecimiento colectivo.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
};
