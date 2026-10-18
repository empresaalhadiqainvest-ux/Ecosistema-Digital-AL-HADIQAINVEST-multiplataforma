import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="hero">
      <div className="grid-bg" aria-hidden="true"></div>
      <div className="glow glow--gold" aria-hidden="true"></div>
      <div className="glow glow--amber" aria-hidden="true"></div>

      <div className="wrap hero__inner">
        <p className="eyebrow">Holding empresarial · Desde 2026</p>
        <h1 className="h-display">
          Holding Empresarial &amp;<br />
          <span className="gradient-text">Ecosistema Digital</span>
        </h1>
        <p className="lead">
          Innovación, estrategia y rentabilidad. Conectamos los mercados financieros, soluciones
          tecnológicas corporativas y el entretenimiento digital de alto nivel en un solo ecosistema integral.
        </p>

        <div className="hero__actions">
          <a className="btn" href="#trading">
            Explorar Ecosistema <span className="arrow" aria-hidden="true">&rarr;</span>
          </a>
          <a className="btn btn--ghost" href="#ecosistema">
            Nuestros pilares
          </a>
        </div>

        <ul className="pills">
          <li className="pill" style={{ ['--accent' as string]: 'var(--emerald)' }}>
            <span className="dot" aria-hidden="true"></span>Trading Institucional
          </li>
          <li className="pill" style={{ ['--accent' as string]: 'var(--blue)' }}>
            <span className="dot" aria-hidden="true"></span>SmithBusiness Solutions
          </li>
          <li className="pill" style={{ ['--accent' as string]: 'var(--orange)' }}>
            <span className="dot" aria-hidden="true"></span>Taberna Lions-Gold
          </li>
          <li className="pill">
            <span className="dot" aria-hidden="true"></span>AL-HADIQA Capital
          </li>
        </ul>

        <dl className="metrics">
          <div className="metric">
            <dt>Unidades de negocio</dt>
            <dd><em>04</em> divisiones activas</dd>
          </div>
          <div className="metric">
            <dt>Enfoque</dt>
            <dd>Finanzas · <em>Tech</em> · Gaming</dd>
          </div>
          <div className="metric">
            <dt>Modelo operativo</dt>
            <dd>Ecosistema <em>integrado</em></dd>
          </div>
        </dl>
      </div>
    </section>
  );
};
