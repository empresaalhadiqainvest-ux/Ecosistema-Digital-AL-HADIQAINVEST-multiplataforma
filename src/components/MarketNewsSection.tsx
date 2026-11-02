import React, { useState, useMemo } from 'react';
import { MarketSentimentWidget } from './MarketSentimentWidget';

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  institutionalAnalysis: string;
  category: 'Macro & FED' | 'Forex & Divisas' | 'Oro & Commodities' | 'Criptomercados' | 'Wall St & Índices';
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  impact: 'Alto Impacto' | 'Medio Impacto' | 'Estructural';
  source: string;
  timeAgo: string;
  relatedAsset: string;
}

const INITIAL_NEWS: MarketNewsItem[] = [
  {
    id: 'fed-rates-2026',
    title: 'La Reserva Federal señala pausa estratégica en tasas ante resiliencia del empleo',
    summary: 'El Comité Federal de Mercado Abierto (FOMC) proyecta estabilidad en los tipos de referencia, manteniendo el rendimiento del bono del Tesoro a 10 años en rango de equilibrio.',
    institutionalAnalysis: 'Para traders de SMC, esto prolonga la consolidación en el índice DXY. Esperamos barridos de liquidez en los rangos semanales (PDH/PDL) antes de expansiones direccionales claras en EUR/USD y GBP/USD.',
    category: 'Macro & FED',
    sentiment: 'Neutral',
    impact: 'Alto Impacto',
    source: 'Federal Reserve Wire / Bloomberg Terminal',
    timeAgo: 'Hace 8 min',
    relatedAsset: 'DXY / Bonos US10Y',
  },
  {
    id: 'gold-ath-demand',
    title: 'XAU/USD consolida en máximos históricos impulsado por compras récord de Bancos Centrales',
    summary: 'Las reservas oficiales de oro físico en economías emergentes alcanzan máximos de la década, mitigando la presión del rendimiento real de los bonos soberanos.',
    institutionalAnalysis: 'El oro respeta sistemáticamente los Order Blocks de demanda en temporalidad 4H. La estrategia institucional prioriza buscar mitigaciones en zonas de descuento tras la apertura de la sesión de Londres y Nueva York.',
    category: 'Oro & Commodities',
    sentiment: 'Bullish',
    impact: 'Alto Impacto',
    source: 'World Gold Council / Reuters Finance',
    timeAgo: 'Hace 22 min',
    relatedAsset: 'XAU/USD',
  },
  {
    id: 'ecb-inflation-target',
    title: 'Banco Central Europeo evalúa ajustes en liquidez interbancaria ante convergencia de inflación',
    summary: 'El BCE destaca avances hacia el objetivo del 2%, mientras el sector manufacturero alemán exhibe señales de estabilización en pedidos exteriores.',
    institutionalAnalysis: 'Posible cambio de carácter (ChoCh) alcista en temporalidad 1H para EUR/USD si se confirman cierres sobre la zona 1.0920 con ruptura de estructura (BOS).',
    category: 'Forex & Divisas',
    sentiment: 'Bullish',
    impact: 'Medio Impacto',
    source: 'European Central Bank Press / FT Markets',
    timeAgo: 'Hace 45 min',
    relatedAsset: 'EUR/USD',
  },
  {
    id: 'btc-etf-inflows',
    title: 'Entradas netas en ETFs spot de Bitcoin superan los $650M en una sola jornada bursátil',
    summary: 'Inversores institucionales aceleran la acumulación en fondos regulados, absorbiendo la oferta líquida en exchanges a su menor nivel en cuatro años.',
    institutionalAnalysis: 'Formación clásica de fase de Reacumulación Wyckoff en temporalidad diaria. Los pools de liquidez por encima de $70,000 representan el principal objetivo de los creadores de mercado.',
    category: 'Criptomercados',
    sentiment: 'Bullish',
    impact: 'Alto Impacto',
    source: 'CoinDesk Institutional / Glassnode Data',
    timeAgo: 'Hace 1 hora',
    relatedAsset: 'BTC/USDT',
  },
  {
    id: 'tech-earnings-nasdaq',
    title: 'Los gigantes tecnológicos de EE.UU. impulsan al Nasdaq 100 con récord de gasto en infraestructura IA',
    summary: 'Las inversiones de capital en centros de datos de alta densidad impulsan las proyecciones de utilidades operativas para el próximo trimestre fiscal.',
    institutionalAnalysis: 'US100 mantiene estructura alcista clara. Monitorear retrocesos a los Fair Value Gaps (FVG) de temporalidad 15M originados durante la sesión regular de Wall Street.',
    category: 'Wall St & Índices',
    sentiment: 'Bullish',
    impact: 'Medio Impacto',
    source: 'S&P Dow Jones Indices / CNBC Markets',
    timeAgo: 'Hace 1 hora y media',
    relatedAsset: 'US100 / Nasdaq',
  },
  {
    id: 'oil-opec-supply',
    title: 'OPEP+ ratifica cuotas de producción para estabilizar el barril Brent ante demanda asiática',
    summary: 'Los países exportadores mantendrán recortes voluntarios, buscando balancear inventarios globales de crudo y derivados energéticos.',
    institutionalAnalysis: 'Comportamiento en rango lateral para el petróleo WTI. Oportunidades de entrada en extremos de liquidez (Asian High/Low) con rápida toma de beneficios a RRR 1:2.',
    category: 'Oro & Commodities',
    sentiment: 'Neutral',
    impact: 'Estructural',
    source: 'OPEC Secretariat / Energy Intelligence',
    timeAgo: 'Hace 2 horas',
    relatedAsset: 'Petróleo WTI / Brent',
  },
];

export const MarketNewsSection: React.FC = () => {
  const [news, setNews] = useState<MarketNewsItem[]>(INITIAL_NEWS);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<MarketNewsItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Ahora mismo');

  // Simulated API fetch function
  const fetchMarketNews = async () => {
    setIsLoading(true);
    // Simulate real network request with 700ms latency
    await new Promise((resolve) => setTimeout(resolve, 750));

    // Fresh simulated article prepended
    const freshArticle: MarketNewsItem = {
      id: `live-update-${Date.now()}`,
      title: 'Flujos institucionales aceleran rotación hacia activos de refugio ante apertura de Tokio',
      summary: 'Volumen inusual detectado en contratos de futuros de divisas e índices asiáticos, reflejando rebalanceos de carteras soberanas.',
      institutionalAnalysis: 'Vigilar el barrido de mínimos de la sesión asiática (Asian Low) para identificar posibles entradas en mitigación durante la próxima Killzone de Londres.',
      category: 'Macro & FED',
      sentiment: 'Neutral',
      impact: 'Alto Impacto',
      source: 'Global Market Terminal Live Feed',
      timeAgo: 'Hace 1 min',
      relatedAsset: 'Nikkei 225 / USDJPY',
    };

    setNews((prev) => [freshArticle, ...prev.filter((item) => item.id !== freshArticle.id)]);
    setIsLoading(false);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const categories = ['Todos', 'Macro & FED', 'Oro & Commodities', 'Forex & Divisas', 'Criptomercados', 'Wall St & Índices'];

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.relatedAsset.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [news, selectedCategory, searchQuery]);

  return (
    <section className="section section--alt" id="noticias-mercado" aria-labelledby="news-heading">
      <div className="wrap">
        
        {/* Header de la Sección */}
        <div className="section-head" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: 'var(--emerald)',
                boxShadow: '0 0 10px var(--emerald)',
                animation: 'sessionPulse 2s infinite ease-in-out',
              }}
            ></span>
            <p className="eyebrow" style={{ marginBottom: 0 }}>
              Feed Financiero Global · En Tiempo Real
            </p>
          </div>
          <h2 className="h-section" id="news-heading">
            Noticias &amp; Catalizadores <span className="gradient-text">del Mercado Financiero</span>
          </h2>
          <p>
            Análisis de eventos macroeconómicos globales con interpretación directa para estrategias institucionales (SMC) y gestión de riesgo.
          </p>
        </div>

        {/* WIDGET DE SENTIMIENTO GLOBAL (FEAR VS GREED VIA RECHARTS) */}
        <MarketSentimentWidget />

        {/* Barra de Control: Búsqueda, Filtros y Botón de Actualizar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'var(--surface-3)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.4rem',
            marginBottom: '2rem',
          }}
        >
          {/* Categorías */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`quiz__btn ${selectedCategory === cat ? 'active' : ''}`}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Búsqueda y Botón Refrescar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', width: 'auto' }}>
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <label htmlFor="news-search" className="sr-only">
                Buscar noticias
              </label>
              <input
                id="news-search"
                type="text"
                placeholder="Filtrar por activo o tema…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.84rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line-strong)',
                  background: 'rgba(148, 163, 184, 0.08)',
                  color: 'var(--text)',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            <button
              type="button"
              className="btn btn--ghost"
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={fetchMarketNews}
              disabled={isLoading}
              title="Solicitar las noticias más recientes del mercado"
            >
              <span style={{ display: 'inline-block', transform: isLoading ? 'rotate(360deg)' : 'none', transition: 'transform 0.75s linear' }}>
                🔄
              </span>
              <span>{isLoading ? 'Actualizando feed…' : 'Actualizar Noticias'}</span>
            </button>

            <span style={{ fontSize: '0.75rem', color: 'var(--muted-2)', fontFamily: 'monospace' }}>
              Actualizado: {lastUpdated}
            </span>
          </div>
        </div>

        {/* Grid de Noticias */}
        {isLoading ? (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.8rem', animation: 'sessionPulse 1.2s infinite ease-in-out' }}>
              📡
            </div>
            <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-head)', fontWeight: 600 }}>
              Sincronizando con los proveedores de liquidez y cables de noticias globales…
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.86rem', marginTop: '0.3rem' }}>
              Extrayendo catalizadores de alta volatilidad y datos macroeconómicos.
            </p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--line)',
            }}
          >
            <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>
              No se encontraron noticias coincidentes con los filtros seleccionados.
            </p>
            <button
              type="button"
              className="btn btn--ghost"
              style={{ marginTop: '1rem', padding: '0.5rem 1.2rem', fontSize: '0.84rem' }}
              onClick={() => {
                setSelectedCategory('Todos');
                setSearchQuery('');
              }}
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.4rem',
            }}
          >
            {filteredNews.map((item) => {
              const isBull = item.sentiment === 'Bullish';
              const isBear = item.sentiment === 'Bearish';

              return (
                <article
                  key={item.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.6rem',
                    transition: 'transform 0.3s var(--ease), border-color 0.3s var(--ease), box-shadow 0.3s var(--ease)',
                  }}
                >
                  <div>
                    {/* Top Badges & Meta */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.9rem',
                      }}
                    >
                      <span className="badge" style={{ fontSize: '0.7rem', padding: '0.25rem 0.65rem' }}>
                        {item.category}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            background:
                              item.impact === 'Alto Impacto'
                                ? 'rgba(239, 68, 68, 0.18)'
                                : 'rgba(59, 130, 246, 0.15)',
                            color: item.impact === 'Alto Impacto' ? '#fca5a5' : '#93c5fd',
                            border: `1px solid ${item.impact === 'Alto Impacto' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(59, 130, 246, 0.3)'}`,
                          }}
                        >
                          {item.impact}
                        </span>

                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            background: isBull
                              ? 'rgba(16, 185, 129, 0.16)'
                              : isBear
                              ? 'rgba(239, 68, 68, 0.16)'
                              : 'rgba(148, 163, 184, 0.12)',
                            color: isBull ? 'var(--emerald)' : isBear ? '#ef4444' : 'var(--muted)',
                          }}
                        >
                          {item.sentiment === 'Bullish' ? '▲ Alcista' : item.sentiment === 'Bearish' ? '▼ Bajista' : '● Neutral'}
                        </span>
                      </div>
                    </div>

                    {/* Título de la noticia */}
                    <h3
                      className="h-card"
                      style={{
                        fontSize: '1.08rem',
                        lineHeight: 1.35,
                        marginBottom: '0.75rem',
                        color: 'var(--text)',
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Resumen */}
                    <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                      {item.summary}
                    </p>

                    {/* Badge de Activo Vinculado */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-2)' }}>Activo Clave:</span>
                      <strong style={{ fontSize: '0.78rem', color: 'var(--gold)', fontFamily: 'monospace' }}>
                        {item.relatedAsset}
                      </strong>
                    </div>
                  </div>

                  {/* Footer de Tarjeta con Fuente y Botón de Análisis */}
                  <div
                    style={{
                      paddingTop: '0.9rem',
                      borderTop: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      color: 'var(--muted-2)',
                    }}
                  >
                    <div>
                      <span>{item.source.split('/')[0]}</span> · <span>{item.timeAgo}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedArticle(item)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        color: 'var(--gold)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      Análisis SMC <span aria-hidden="true">&rarr;</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal de Detalle con Análisis SMC Institucional */}
        {selectedArticle && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 300,
              background: 'rgba(7, 11, 20, 0.88)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
            onClick={() => setSelectedArticle(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-news-title"
          >
            <div
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--gold)',
                borderRadius: 'var(--radius)',
                maxWidth: '650px',
                width: '100%',
                padding: 'clamp(1.75rem, 4vw, 2.5rem)',
                boxShadow: 'var(--shadow-glow)',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="badge badge--gold">{selectedArticle.category}</span>
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  style={{
                    background: 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid var(--line)',
                    color: 'var(--text)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                  aria-label="Cerrar análisis"
                >
                  ✕
                </button>
              </div>

              <h3 id="modal-news-title" className="h-card" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
                {selectedArticle.title}
              </h3>

              <div style={{ fontSize: '0.82rem', color: 'var(--muted-2)', marginBottom: '1.25rem' }}>
                Fuente: <strong style={{ color: 'var(--muted)' }}>{selectedArticle.source}</strong> · {selectedArticle.timeAgo} · Activo: <strong style={{ color: 'var(--gold)' }}>{selectedArticle.relatedAsset}</strong>
              </div>

              <p style={{ color: 'var(--text)', fontSize: '0.94rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                {selectedArticle.summary}
              </p>

              {/* Caja de Análisis Institucional SMC */}
              <div
                style={{
                  background: 'rgba(11, 17, 32, 0.85)',
                  border: '1px solid rgba(251, 191, 36, 0.45)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🎯</span>
                  <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-head)', fontSize: '0.92rem' }}>
                    Interpretación y Táctica Institucional (SMC)
                  </strong>
                </div>
                <p style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>
                  {selectedArticle.institutionalAnalysis}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <a
                  className="btn btn--emerald"
                  href="#simulador-d3"
                  onClick={() => setSelectedArticle(null)}
                  style={{ fontSize: '0.85rem', padding: '0.65rem 1.4rem' }}
                >
                  Ver Gráfico D3 en Vivo <span className="arrow">&darr;</span>
                </a>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setSelectedArticle(null)}
                  style={{ fontSize: '0.85rem', padding: '0.65rem 1.2rem' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
