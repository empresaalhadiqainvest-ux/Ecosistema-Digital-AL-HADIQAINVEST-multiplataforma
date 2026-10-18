import React from 'react';

export const GamingSection: React.FC = () => {
  return (
    <section className="section section--alt" id="gaming" style={{ ['--accent' as string]: 'var(--orange)' }}>
      <div className="wrap split">
        <div className="stack">
          <p className="eyebrow">División 03 · Entretenimiento</p>
          <h2 className="h-section">TABERNA LIONS-GOLD</h2>
          <h3 className="h-card" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            Comunidad Gaming MMORPG Albion Online
          </h3>
          <p className="body-text">
            Nuestro brazo de entretenimiento e interacción digital. Una comunidad sólida y competitiva dentro
            del MMORPG Albion Online, centrada en la estrategia de gremios, economía interna y desarrollo de
            jugadores en un entorno colaborativo.
          </p>
          <ul className="checklist">
            <li>Estrategia de gremios y coordinación competitiva.</li>
            <li>Economía interna y gestión eficiente de recursos.</li>
            <li>Desarrollo de jugadores en un entorno colaborativo.</li>
          </ul>
          <div>
            <a
              className="btn btn--orange"
              href="https://zambranogonzalezsmith-blip.github.io/LA-TABERNA-LIONS-GOLD-/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Unirse a la Taberna <span className="arrow" aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        <div className="visual" aria-hidden="true">
          <span className="visual__glyph">⚔️</span>
        </div>
      </div>
    </section>
  );
};
