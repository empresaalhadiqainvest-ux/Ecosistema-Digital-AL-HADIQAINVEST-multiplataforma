import React from 'react';

export const TradingSection: React.FC = () => {
  return (
    <section className="section section--alt" id="trading" style={{ ['--accent' as string]: 'var(--emerald)' }}>
      <div className="wrap split">
        <div className="stack">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <p className="eyebrow" style={{ marginBottom: 0 }}>División 01 · Finanzas</p>
            {/* Botón en la parte inicial de la sección vinculado a la nueva sección clonada */}
            <a
              href="#trading-plataforma-completa"
              className="badge badge--gold"
              style={{
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.25s var(--ease), box-shadow 0.25s var(--ease)',
              }}
              title="Ir a la sección de Trading Institucional clonada e integrada"
            >
              <span>⚡ Trading Institucional Completo</span>
              <span className="arrow" aria-hidden="true">&darr;</span>
            </a>
          </div>

          <h2 className="h-section">Trading Institucional &amp; Educación Financiera</h2>
          <p className="body-text">
            Accede a los mercados globales con estrategias institucionales. Formamos traders profesionales
            combinando análisis avanzado, gestión de riesgo y una educación financiera estructurada para la
            rentabilidad a largo plazo.
          </p>
          <ul className="checklist">
            <li>Estrategias de nivel institucional aplicadas a mercados globales.</li>
            <li>Gestión de riesgo y control de capital como base de cada operación.</li>
            <li>Programa formativo estructurado y orientado al largo plazo.</li>
          </ul>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '0.5rem' }}>
            {/* Botón principal vinculado a la sección integrada */}
            <a
              className="btn btn--emerald"
              href="#trading-plataforma-completa"
            >
              Ver Plataforma Integrada de Trading <span className="arrow" aria-hidden="true">&darr;</span>
            </a>

            <a
              className="btn btn--ghost"
              href="https://empresaalhadiqainvest-ux.github.io/Al-hadiqainvest-TRADING-Y-EDUCACI-N-FINANCIERA-/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Web Externa <span className="arrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        <div className="visual" aria-hidden="true">
          <div className="bars">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
      </div>
    </section>
  );
};
