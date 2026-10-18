import React from 'react';

export const SmithBusinessSection: React.FC = () => {
  return (
    <section className="section" id="smithbusiness" style={{ ['--accent' as string]: 'var(--blue)' }}>
      <div className="wrap split split--flip">
        <div className="visual" aria-hidden="true">
          <span className="visual__glyph">⚙️</span>
        </div>

        <div className="stack">
          <p className="eyebrow">División 02 · Tecnología</p>
          <h2 className="h-section">SMITHBUSINESS Solutions</h2>
          <p className="body-text">
            Desarrollo de soluciones de negocio, tecnología y consultoría empresarial. Optimizamos procesos,
            diseñamos arquitecturas de software robustas y escalamos operaciones comerciales mediante
            innovación digital.
          </p>
          <ul className="checklist">
            <li>Arquitecturas de software escalables y mantenibles.</li>
            <li>Automatización y optimización de procesos operativos.</li>
            <li>Consultoría estratégica para el crecimiento comercial.</li>
          </ul>
          <div>
            <a
              className="btn btn--blue"
              href="https://empresaalhadiqainvest-ux.github.io/Smith-business-solutions/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Descubrir Soluciones <span className="arrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
