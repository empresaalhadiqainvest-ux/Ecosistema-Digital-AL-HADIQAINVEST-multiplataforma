import React, { useState, useEffect } from 'react';
import { D3LiveTradingChart } from './D3LiveTradingChart';
import { BrokerAuditSection } from './BrokerAuditSection';

interface SessionState {
  name: string;
  country: string;
  isOpen: boolean;
  hoursUtc: string;
}

export const TradingPlatformClone: React.FC = () => {
  // Live market sessions calculation based on UTC
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [utcTimeStr, setUtcTimeStr] = useState('');

  // Interactive pre-trade checklist state
  const [checkedRules, setCheckedRules] = useState<Record<number, boolean>>({});

  // Active currency filter for economic overview
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');

  // Book download toast state
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  useEffect(() => {
    const updateSessions = () => {
      const now = new Date();
      const horaUTC = now.getUTCHours() + now.getUTCMinutes() / 60;
      setUtcTimeStr(now.toUTCString().slice(17, 22) + ' UTC');

      const sydneyOpen = horaUTC >= 22 || horaUTC < 7;
      const tokyoOpen = horaUTC >= 0 && horaUTC < 9;
      const londonOpen = horaUTC >= 8 && horaUTC < 16.5;
      const nyOpen = horaUTC >= 13 && horaUTC < 21;

      setSessions([
        { name: 'Sídney', country: 'Australia', isOpen: sydneyOpen, hoursUtc: '22:00 - 07:00 UTC' },
        { name: 'Tokio', country: 'Japón', isOpen: tokyoOpen, hoursUtc: '00:00 - 09:00 UTC' },
        { name: 'Londres', country: 'Reino Unido', isOpen: londonOpen, hoursUtc: '08:00 - 16:30 UTC' },
        { name: 'Nueva York', country: 'EE.UU.', isOpen: nyOpen, hoursUtc: '13:00 - 21:00 UTC' },
      ]);
    };

    updateSessions();
    const interval = setInterval(updateSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleCheck = (idx: number) => {
    setCheckedRules((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleBookDownload = (bookTitle: string) => {
    setDownloadNotice(`Iniciando descarga segura de "${bookTitle}" desde el repositorio AL-HADIQAINVEST...`);
    setTimeout(() => {
      setDownloadNotice(null);
    }, 4500);
  };

  const completedCount = Object.values(checkedRules).filter(Boolean).length;

  return (
    <section className="trading-platform-section" id="trading-plataforma-completa" aria-label="Plataforma de Trading Institucional">
      <div className="wrap">
        
        {/* Banner de integración y navegación */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div className="badge badge--gold" style={{ marginBottom: '0.8rem' }}>
            Plataforma Matriz · Trading Institucional Integrada
          </div>
          <h2 className="h-display" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)' }}>
            Ecosistema de Trading &amp; <span className="gradient-text">Smart Money Concepts</span>
          </h2>
          <p className="lead" style={{ margin: '0.8rem auto 0', maxWidth: '68ch' }}>
            Toda la arquitectura, operativas SMC, tabla de spreads ECN, horarios de liquidez y condiciones oficiales de ejecución
            directamente en el ecosistema AL-HADIQAINVEST.
          </p>
        </div>

        {/* 1. HERO TRADING INSTITUCIONAL */}
        <div className="trading-hero">
          <div className="hero__grid">
            <div className="hero__copy">
              <span className="badge">Partnership oficial AL-HADIQAINVEST</span>
              <h3 className="h-display" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)' }}>
                Domina el Mercado con<br />
                <span className="gradient-text">Trading Institucional</span>
              </h3>
              <p className="lead" style={{ fontSize: '1rem', color: '#d1d5db' }}>
                Deja de operar como minorista. Aplica Smart Money Concepts (SMC), análisis técnico avanzado y fundamentales
                en tiempo real con spreads desde 0.0 pips.
              </p>
              <div>
                <a
                  className="btn btn--lg btn--pulse"
                  href="https://one.justmarkets.link/a/kgi9s02uqu"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                >
                  Operar con JustMarkets <span className="arrow" aria-hidden="true">&rarr;</span>
                </a>
              </div>
              <ul className="inline-facts">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Ejecución STP/ECN
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Retiros rápidos
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Soporte 24/5
                </li>
              </ul>
            </div>

            {/* Widget Glass con Gráfico SVG de Análisis Técnico */}
            <aside className="widget glass" aria-label="Ejemplo de análisis técnico">
              <span className="badge badge--gold widget__flag">Top broker 2026</span>
              <div className="widget__head">
                <div className="widget__pair">
                  XAUUSD <small>Oro vs Dólar</small>
                </div>
                <div className="widget__delta">
                  +12.4%
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>

              <div className="chart">
                <svg viewBox="0 0 420 240" role="img" aria-label="Gráfico representativo de order block y liquidez">
                  <path d="M0 60h420 M0 120h420 M0 180h420" stroke="rgba(148,163,184,.08)" strokeDasharray="4 4" fill="none" />
                  <path d="M84 0v240 M168 0v240 M252 0v240 M336 0v240" stroke="rgba(148,163,184,.08)" strokeDasharray="4 4" fill="none" />
                  <rect x="50" y="150" width="60" height="40" fill="rgba(59,130,246,.12)" />
                  <rect x="50" y="150" width="2" height="40" fill="#3b82f6" />
                  <text x="56" y="182" fontFamily="monospace" fontSize="10" fill="#3b82f6" fontWeight="600">
                    ORDER BLOCK (OB)
                  </text>
                  <path
                    d="M0 160 C40 160, 60 170, 80 170 C110 170, 140 80, 180 80 C210 80, 240 140, 270 110 C300 80, 340 100, 370 70 C400 40, 420 40, 420 40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <path d="M120 120 L220 120" stroke="#ef4444" strokeDasharray="4 4" fill="none" />
                  <text x="140" y="112" fontFamily="monospace" fontSize="10" fill="#ef4444" fontWeight="600">
                    CHoCH / LIQ. SWEEP
                  </text>
                  <circle cx="270" cy="110" r="4" fill="#fbbf24" />
                  <text x="280" y="113" fontFamily="monospace" fontSize="10" fill="#fbbf24" fontWeight="600">
                    FVG
                  </text>
                </svg>
                <span className="chart__note">Gráfico ilustrativo M15</span>
                <span className="chart__tp">TARGET (TP)</span>
              </div>
              <p className="stat__hint">
                No operes rupturas falsas, opera zonas de ineficiencia y rastro institucional (Smart Money).
              </p>
            </aside>
          </div>
        </div>

        {/* SIMULADOR INTERACTIVO D3: ANÁLISIS TÉCNICO Y VOLATILIDAD */}
        <div style={{ marginBottom: '4.5rem' }} id="simulador-d3">
          <div className="section-head" style={{ marginBottom: '1.5rem' }}>
            <p className="eyebrow">Motor D3.js · Simulación en Vivo</p>
            <h3 className="h-section">
              Simulador de Volatilidad &amp; <span className="gradient-text">Análisis Técnico SMC</span>
            </h3>
            <p>
              Explora en tiempo real la acción del precio con velas japonesas generadas mediante D3, detección de bloques de órdenes (OB),
              ineficiencias (FVG), bandas dinámicas de volatilidad y volumen institucional.
            </p>
          </div>

          <D3LiveTradingChart />
        </div>

        {/* 2. FUNDAMENTALES EN VIVO & ESTRATEGIAS POR ACTIVO */}
        <div style={{ marginBottom: '4.5rem' }} id="fundamentales">
          <div className="section-head">
            <p className="eyebrow">Macroeconomía Aplicada</p>
            <h3 className="h-section">Fundamentales en Vivo &amp; Estrategias por Activo</h3>
            <p>
              Conecta la acción del precio con los catalizadores macroeconómicos globales. Selecciona un activo para ver sus reglas institucionales.
            </p>
          </div>

          {/* Selector de divisa / filtro interactivo */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
            {['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'XAU', 'BTC'].map((curr) => (
              <button
                key={curr}
                type="button"
                className={`quiz__btn ${selectedCurrency === curr ? 'active' : ''}`}
                onClick={() => setSelectedCurrency(curr)}
              >
                {curr === 'ALL' ? 'Todos los Mercados' : curr}
              </button>
            ))}
          </div>

          <div className="grid-cards">
            {(selectedCurrency === 'ALL' || selectedCurrency === 'XAU' || selectedCurrency === 'USD') && (
              <div className="card-item">
                <span className="badge badge--gold" style={{ marginBottom: '1rem' }}>Materia Prima Tier-1</span>
                <h4 className="h-sub" style={{ color: 'var(--gold)', marginBottom: '0.75rem' }}>
                  XAUUSD (Oro Institucional)
                </h4>
                <p className="body-text" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Sensible a las tasas de interés reales de la FED, datos de inflación (IPC/PCE) y tensiones geopolíticas globales.
                </p>
                <ul className="checklist">
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      <strong>Estrategia:</strong> Operar barridos de liquidez en Asia (Turtle Soup) y entradas en FVG durante la sesión de Nueva York.
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {(selectedCurrency === 'ALL' || selectedCurrency === 'EUR' || selectedCurrency === 'USD') && (
              <div className="card-item">
                <span className="badge" style={{ marginBottom: '1rem' }}>Divisas Mayores</span>
                <h4 className="h-sub" style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>
                  Forex (Pares Mayores EUR/USD)
                </h4>
                <p className="body-text" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Impulsado por divergencias en políticas monetarias entre Bancos Centrales (BCE vs FED) y flujos de balanza comercial.
                </p>
                <ul className="checklist">
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      <strong>Estrategia:</strong> Cambios de carácter (ChoCh) en temporalidades de 1H respaldados por Order Blocks diarios (HTF).
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {(selectedCurrency === 'ALL' || selectedCurrency === 'BTC' || selectedCurrency === 'USD') && (
              <div className="card-item">
                <span className="badge" style={{ marginBottom: '1rem', background: 'rgba(16,185,129,.15)', color: 'var(--emerald)' }}>
                  Activos Digitales
                </span>
                <h4 className="h-sub" style={{ color: 'var(--emerald)', marginBottom: '0.75rem' }}>
                  Criptomonedas (BTC / Alts)
                </h4>
                <p className="body-text" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Alta correlación con la liquidez global M2, ciclos de halving y flujos institucionales en ETFs spot.
                </p>
                <ul className="checklist">
                  <li>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      <strong>Estrategia:</strong> Acumulación Wyckoff y mitigación de bloques de órdenes en temporalidad de 4 horas (4H).
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 3. GUÍA DE SMC, PIPS, RRR & CHECKLIST */}
        <div style={{ marginBottom: '4.5rem' }} id="estrategias">
          <div className="section-head">
            <p className="eyebrow">Maestría Operativa</p>
            <h3 className="h-section">Guía Efectiva de SMC, Pips, RRR &amp; Checklist</h3>
            <p>Evita trampas de mercado, calcula tu riesgo con precisión milimétrica y opera con ventaja matemática.</p>
          </div>

          <div className="split" style={{ marginBottom: '2rem' }}>
            <div className="card-item">
              <h4 className="h-sub" style={{ color: 'var(--accent)', marginBottom: '1rem' }}>
                Aplicación Efectiva del SMC &amp; Trampas
              </h4>
              <p className="body-text" style={{ fontSize: '0.92rem', marginBottom: '1rem' }}>
                El mercado minorista entra por soporte y resistencia visibles. Los institucionales usan esto como{' '}
                <strong>Inducement (inducción)</strong> para acumular posiciones contrarias.
              </p>
              <ul className="checklist">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    <strong>Evita la trampa del doble techo:</strong> Espera siempre que el precio barra los máximos anteriores antes de buscar un Order Block bajista.
                  </span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    <strong>Mitigación:</strong> No operes cada Order Block, solo aquellos que rompen estructura con fuerza (BOS institucional).
                  </span>
                </li>
              </ul>
            </div>

            <div className="card-item">
              <h4 className="h-sub" style={{ color: 'var(--gold)', marginBottom: '1rem' }}>
                Cálculo de Pips y Ratio Riesgo-Beneficio (RRR)
              </h4>
              <p className="body-text" style={{ fontSize: '0.92rem', marginBottom: '1rem' }}>
                <strong>¿Qué es un Pip?</strong> Es la mínima variación de precio (ej. en EURUSD el 4to decimal 0.0001; en XAUUSD el segundo decimal 0.01).
                <br />
                <strong>Cálculo del RRR:</strong> Es la proporción entre lo que arriesgas (Stop Loss en pips) frente a lo que buscas ganar (Take Profit).
              </p>
              <div
                style={{
                  background: 'var(--surface)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  border: '1px solid var(--line)',
                  color: 'var(--gold-soft)',
                }}
              >
                Fórmula RRR = (Distancia Entrada a TP en pips) / (Distancia Entrada a SL en pips)
                <br />
                <span style={{ color: 'var(--emerald)' }}>*Buscamos siempre un RRR mínimo de 1:2 o 1:3 en cada operativa.</span>
              </div>
            </div>
          </div>

          {/* Check-List Interactivo con Barra de Progreso */}
          <div className="card-item" style={{ background: 'var(--surface-3)', borderColor: 'var(--accent)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', gap: '0.8rem' }}>
              <h4 className="h-card" style={{ fontSize: '1.2rem', color: 'var(--text)' }}>
                📋 Check-List Obligatorio Antes de Abrir Operación
              </h4>
              <span className="badge" style={{ background: completedCount === 4 ? 'rgba(16,185,129,.2)' : 'rgba(59,130,246,.15)', color: completedCount === 4 ? 'var(--emerald)' : '#93c5fd' }}>
                {completedCount} de 4 comprobaciones {completedCount === 4 ? '✓ Listo para ejecutar' : ''}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {[
                { id: 1, text: '1. ¿Identifiqué la tendencia en temporalidad mayor (HTF - 4H/Diario)?' },
                { id: 2, text: '2. ¿El precio barrió la liquidez previa (Asian High/Low o PDH/PDL)?' },
                { id: 3, text: '3. ¿Existe un Order Block o FVG claro en zona de descuento (Discount)?' },
                { id: 4, text: '4. ¿El riesgo de la operación es menor al 1% - 2% de mi cuenta total?' },
              ].map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '0.85rem 1rem',
                    background: checkedRules[item.id] ? 'rgba(16,185,129,0.08)' : 'rgba(15,23,42,0.6)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${checkedRules[item.id] ? 'var(--emerald)' : 'var(--line)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s var(--ease)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedRules[item.id]}
                    onChange={() => toggleCheck(item.id)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--emerald)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: checkedRules[item.id] ? 'var(--text)' : 'var(--muted)' }}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                ¿Deseas verificar matemáticamente tu lotaje exacto, ratio R:R y confluencias algorítmicas sin simulaciones?
              </p>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('al_hadiqa_open_smc_suite'));
                  }
                }}
                className="btn btn--emerald"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #047857)',
                  borderColor: '#10B981',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
                  fontSize: '0.88rem',
                  padding: '0.65rem 1.25rem',
                  cursor: 'pointer',
                }}
              >
                <span>🧮 Abrir Calculador &amp; Validador SMC No Simulado</span>
                <span className="arrow" aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. HORARIOS DE SESIONES BURSÁTILES GLOBALES (TIEMPO REAL) */}
        <div style={{ marginBottom: '4.5rem' }} id="sesiones">
          <div className="section-head">
            <p className="eyebrow">Geolocalización de Liquidez · {utcTimeStr}</p>
            <h3 className="h-section">Horarios de Sesiones Bursátiles Globales</h3>
            <p>
              El mercado opera 24/5. Conoce en tiempo real qué sesiones financieras se encuentran abiertas y dónde se concentra el volumen institucional.
            </p>
          </div>

          <div className="sessions-grid">
            {sessions.map((ses) => (
              <div key={ses.name} className={`session-box ${ses.isOpen ? 'is-active' : ''}`}>
                <h4 className="h-card" style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>
                  {ses.name} ({ses.country})
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-2)', marginBottom: '0.6rem' }}>
                  {ses.hoursUtc}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <span className={`session-status ${ses.isOpen ? 'status-open' : 'status-closed'}`}></span>
                  {ses.isOpen ? (
                    <strong style={{ color: 'var(--emerald)', fontSize: '0.88rem' }}>Abierta (Alta Liquidez)</strong>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Cerrada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. CONDICIONES DE TRADING DE ALTO NIVEL & TRANSPARENCIA ECN */}
        <div style={{ marginBottom: '4.5rem' }} id="resultados">
          <div className="section-head">
            <p className="eyebrow">Ejecución Profesional</p>
            <h3 className="h-section">Condiciones de Trading de Alto Nivel</h3>
            <p>
              No basta con tener una estrategia rentable; necesitas un entorno donde tus órdenes se ejecuten sin fricción,
              sin requotes y con latencia ultrabaja.
            </p>
          </div>

          <div className="split">
            <div className="stack">
              <h4 className="h-sub">Transparencia ECN</h4>
              <p className="body-text">
                Nuestros traders operan con cuentas Raw Spread. Las comisiones están estandarizadas y tus órdenes van directo
                a los proveedores de liquidez tier-1, protegiendo tu análisis de manipulaciones del broker.
              </p>

              <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de spreads promedio por activo">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Activo / Par</th>
                      <th scope="col">Spread Prom.</th>
                      <th scope="col">Comisión (Lote)</th>
                      <th scope="col">Swap Corto</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>EUR/USD</strong></td>
                      <td className="num pos">0.0 pips</td>
                      <td className="num">$3.00</td>
                      <td className="num pos">+0.45</td>
                    </tr>
                    <tr>
                      <td><strong>GBP/JPY</strong></td>
                      <td className="num pos">0.2 pips</td>
                      <td className="num">$3.00</td>
                      <td className="num neg">-1.20</td>
                    </tr>
                    <tr>
                      <td><strong>XAU/USD</strong></td>
                      <td className="num pos">0.8 pips</td>
                      <td className="num">$3.00</td>
                      <td className="num neg">-2.10</td>
                    </tr>
                    <tr>
                      <td><strong>US100</strong></td>
                      <td className="num pos">1.0 pts</td>
                      <td className="num">Cero</td>
                      <td className="num neg">-3.50</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="stat-grid">
              <div className="stat">
                <p className="stat__value">&lt; 10ms</p>
                <p className="stat__label">Latencia de ejecución</p>
                <p className="stat__hint">En servidores NY4 (Equinix), vital para Scalping y HFT.</p>
              </div>
              <div className="stat">
                <p className="stat__value">1:3000</p>
                <p className="stat__label">Apalancamiento Max</p>
                <p className="stat__hint">Uso responsable. Libera margen para gestionar múltiples posiciones.</p>
              </div>
              <div className="stat">
                <p className="stat__value">0%</p>
                <p className="stat__label">Comisiones de retiro</p>
                <p className="stat__hint">Retiros aprobados el mismo día vía Crypto, USDT o Transferencia.</p>
              </div>
              <div className="stat">
                <p className="stat__value">A+</p>
                <p className="stat__label">Liquidez</p>
                <p className="stat__hint">Sin límite de volumen. Perfecto para cuentas financiadas o fondeos altos.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. BIBLIOTECA DE LIBROS DE TRADING & FINANZAS */}
        <div style={{ marginBottom: '4.5rem' }} id="educacion">
          <div className="section-head">
            <p className="eyebrow">Recursos Educativos Especializados</p>
            <h3 className="h-section">Biblioteca de Libros PDF sobre Trading &amp; Finanzas</h3>
            <p>
              Descarga material especializado para consolidar tu formación técnica, análisis fundamental y control psicológico en los mercados.
            </p>
          </div>

          {downloadNotice && (
            <div
              style={{
                maxWidth: '650px',
                margin: '0 auto 1.5rem',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid var(--emerald)',
                color: 'var(--emerald)',
                textAlign: 'center',
                fontSize: '0.9rem',
              }}
              role="status"
            >
              ✓ {downloadNotice}
            </div>
          )}

          <div className="grid-cards">
            <div className="card-item">
              <span className="badge" style={{ marginBottom: '1rem' }}>PDF Oficial</span>
              <h4 className="h-card" style={{ marginBottom: '0.5rem' }}>
                Smart Money Concepts: Guía Definitiva
              </h4>
              <p className="body-text" style={{ fontSize: '0.88rem', marginBottom: '1.2rem' }}>
                Domina la estructura de mercado, order blocks avanzados y mitigación institucional.
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => handleBookDownload('Smart Money Concepts: Guía Definitiva')}
              >
                Descargar PDF (Gratis)
              </button>
            </div>

            <div className="card-item">
              <span className="badge" style={{ marginBottom: '1rem' }}>PDF Oficial</span>
              <h4 className="h-card" style={{ marginBottom: '0.5rem' }}>
                Psicología del Trading y Gestión de Riesgo
              </h4>
              <p className="body-text" style={{ fontSize: '0.88rem', marginBottom: '1.2rem' }}>
                Controla el apalancamiento, elimina la avaricia y opera como un fondo de cobertura.
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => handleBookDownload('Psicología del Trading y Gestión de Riesgo')}
              >
                Descargar PDF (Gratis)
              </button>
            </div>

            <div className="card-item">
              <span className="badge" style={{ marginBottom: '1rem' }}>PDF Oficial</span>
              <h4 className="h-card" style={{ marginBottom: '0.5rem' }}>
                Manual de Análisis Técnico &amp; Acción del Precio
              </h4>
              <p className="body-text" style={{ fontSize: '0.88rem', marginBottom: '1.2rem' }}>
                Patrones de velas japonesas, chartismo moderno y confluencias institucionales paso a paso.
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => handleBookDownload('Manual de Análisis Técnico & Acción del Precio')}
              >
                Descargar PDF (Gratis)
              </button>
            </div>
          </div>
        </div>

        {/* 7. AUDITORÍA OFICIAL MULTIFUENTE DEL BRÓKER JUSTMARKETS (5 FUENTES) */}
        <BrokerAuditSection />

        {/* 8. DINÁMICA DE MERCADO: FUERZAS DEL OSO Y EL TORO */}
        <div className="market-forces">
          <div className="wrap">
            <div className="section-head" style={{ marginBottom: '1.5rem' }}>
              <h3 className="h-section">
                Dinámica de Mercado: <span className="text-accent">Fuerzas del Oso y el Toro</span>
              </h3>
              <p>
                El eterno equilibrio entre la presión compradora institucional (Toro) y la toma de beneficios o distribución bajista (Oso).
              </p>
            </div>

            <div className="forces-container">
              <div className="force-card">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🐂</div>
                <h4 className="h-card" style={{ color: 'var(--emerald)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Fuerza Alcista (Bull Market)
                </h4>
                <p className="body-text" style={{ fontSize: '0.88rem' }}>
                  Dominio de order blocks de demanda, mitigación de desequilibrios al alza y ruptura institucional de máximos previos (BOS).
                </p>
              </div>

              <div className="force-card">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🐻</div>
                <h4 className="h-card" style={{ color: '#ef4444', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Fuerza Bajista (Bear Market)
                </h4>
                <p className="body-text" style={{ fontSize: '0.88rem' }}>
                  Barrido de liquidez de stops minoristas, inyección de oferta institucional y cambio de carácter (ChoCh) hacia rangos de descuento.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 9. BANDA CTA INSTITUCIONAL & AVISO LEGAL DE RIESGO */}
        <div className="cta-band">
          <h3 className="h-section" style={{ maxWidth: '24ch' }}>
            ¿Listo para operar con la mentalidad institucional?
          </h3>
          <p className="lead" style={{ maxWidth: '65ch', textAlign: 'center' }}>
            Únete bajo nuestra red oficial de AL-HADIQAINVEST. Abre tu cuenta hoy y comienza a operar con spread cero y condiciones premium.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {/* ENLACE DE REFERIDO OFICIAL INTACTO */}
            <a
              className="btn btn--lg btn--pulse"
              href="https://one.justmarkets.link/a/kgi9s02uqu"
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              Abrir Cuenta Raw Spread <span className="arrow" aria-hidden="true">&rarr;</span>
            </a>

            <a className="btn btn--lg btn--comunidad" href="#newsletter">
              <strong>Únete a la Comunidad</strong>
              <small>Aprende con nosotros</small>
            </a>

            <a className="btn btn--lg btn--ghost" href="#capital">
              Conoce más de nosotros
            </a>
          </div>

          <div className="notice" style={{ marginTop: '2.5rem', maxWidth: '820px' }}>
            <h3>Aviso Legal de Riesgo (Risk Warning)</h3>
            <p>
              Los CFD son instrumentos complejos y conllevan un alto riesgo de perder dinero rápidamente debido al apalancamiento.
              Una gran mayoría de las cuentas de inversores minoristas pierden dinero al operar con CFD. Debes considerar si comprendes
              cómo funcionan los CFD y si puedes permitirte asumir el alto riesgo de perder tu capital.{' '}
              <strong>No somos asesores financieros; la información provista es puramente educativa.</strong>
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
