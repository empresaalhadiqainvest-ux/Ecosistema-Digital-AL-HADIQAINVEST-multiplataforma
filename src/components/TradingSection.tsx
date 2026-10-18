import React from 'react';

export const TradingSection: React.FC = () => {
  return (
    <section className="section section--alt" id="trading" style={{ ['--accent' as string]: 'var(--emerald)' }}>
      <div className="wrap split">
        <div className="stack">
          <p className="eyebrow">División 01 · Finanzas</p>
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
          <div>
            <a
              className="btn btn--emerald"
              href="https://empresaalhadiqainvest-ux.github.io/Al-hadiqainvest-TRADING-Y-EDUCACI-N-FINANCIERA-/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ingresar a la Plataforma <span className="arrow" aria-hidden="true">&rarr;</span>
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
