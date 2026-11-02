import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';

interface SentimentFactor {
  indicator: string;
  score: number;
  fullMark: number;
  status: string;
}

const RADAR_DATA: SentimentFactor[] = [
  { indicator: 'Momento S&P 500', score: 78, fullMark: 100, status: 'Codicia Extrema' },
  { indicator: 'Amplitud de Mercado', score: 65, fullMark: 100, status: 'Codicia' },
  { indicator: 'Ratio Put / Call', score: 58, fullMark: 100, status: 'Codicia Moderada' },
  { indicator: 'Volatilidad VIX', score: 48, fullMark: 100, status: 'Neutral' },
  { indicator: 'Demanda de Bonos', score: 52, fullMark: 100, status: 'Neutral' },
  { indicator: 'Oro Refugio Seguro', score: 72, fullMark: 100, status: 'Codicia Alta' },
];

export const MarketSentimentWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gauge' | 'radar'>('gauge');
  const [sentimentScore, setSentimentScore] = useState<number>(68);

  // Dynamic status based on score
  const getStatus = (val: number) => {
    if (val <= 25) return { label: 'Miedo Extremo', color: '#ef4444', desc: 'Los inversores capitulan. Posibles zonas de acumulación institucional (Descuento).' };
    if (val <= 45) return { label: 'Miedo', color: '#f97316', desc: 'Aversión al riesgo moderada. Precaución con posiciones largas sin confirmación.' };
    if (val <= 55) return { label: 'Neutral', color: 'var(--gold)', desc: 'Equilibrio temporal entre oferta y demanda. Esperar rompimientos de estructura (BOS).' };
    if (val <= 75) return { label: 'Codicia', color: 'var(--emerald)', desc: 'Optimismo generalizado. Alta liquidez en compras; vigilar barridos de máximos.' };
    return { label: 'Codicia Extrema', color: '#059669', desc: 'Euforia y FOMO minorista. Creadores de mercado buscan distribuir posiciones.' };
  };

  const status = getStatus(sentimentScore);

  // Gauge data: semi-circular pie chart (180 degrees)
  const gaugeNeedleData = [
    { name: 'Miedo Extremo (0-25)', value: 25, color: '#ef4444' },
    { name: 'Miedo (25-45)', value: 20, color: '#f97316' },
    { name: 'Neutral (45-55)', value: 10, color: '#eab308' },
    { name: 'Codicia (55-75)', value: 20, color: '#10b981' },
    { name: 'Codicia Extrema (75-100)', value: 25, color: '#059669' },
  ];

  const handleSimulateTick = () => {
    const delta = Math.floor((Math.random() - 0.48) * 8);
    setSentimentScore((prev) => Math.min(95, Math.max(12, prev + delta)));
  };

  return (
    <div
      className="card"
      style={{
        marginBottom: '2.5rem',
        padding: 'clamp(1.5rem, 3.5vw, 2.2rem)',
        background: 'linear-gradient(160deg, var(--surface-3), var(--surface))',
        border: '1px solid var(--line-strong)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Top Header of Sentiment Widget */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--line)',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: status.color,
                boxShadow: `0 0 10px ${status.color}`,
              }}
            ></span>
            <p className="eyebrow" style={{ marginBottom: 0 }}>
              Termómetro de Sentimiento Global
            </p>
          </div>
          <h3 className="h-card" style={{ fontSize: '1.35rem' }}>
            Índice de Miedo vs. Codicia (<span style={{ color: status.color }}>Fear &amp; Greed Index</span>)
          </h3>
        </div>

        {/* View Switcher & Live Simulation Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--surface-2)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('gauge')}
              style={{
                background: activeTab === 'gauge' ? 'var(--gold)' : 'transparent',
                color: activeTab === 'gauge' ? 'var(--ink)' : 'var(--muted)',
                fontWeight: 600,
                border: 0,
                borderRadius: '6px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s var(--ease)',
              }}
            >
              Velocímetro (Gauge)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              style={{
                background: activeTab === 'radar' ? 'var(--gold)' : 'transparent',
                color: activeTab === 'radar' ? 'var(--ink)' : 'var(--muted)',
                fontWeight: 600,
                border: 0,
                borderRadius: '6px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s var(--ease)',
              }}
            >
              Radar Multidimensional
            </button>
          </div>

          <button
            type="button"
            className="btn btn--ghost"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={handleSimulateTick}
            title="Calcular variación instantánea de sentimiento"
          >
            ⚡ Simular Ticks
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '2rem',
          alignItems: 'center',
        }}
      >
        {/* Chart View (Gauge or Radar via Recharts) */}
        <div
          style={{
            position: 'relative',
            height: '270px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {activeTab === 'gauge' ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeNeedleData}
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius="65%"
                    outerRadius="95%"
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {gaugeNeedleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(11, 18, 32, 0.95)',
                      border: '1px solid var(--line-strong)',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Central Value Overlay inside Gauge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-head)',
                    fontSize: '2.8rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: status.color,
                  }}
                >
                  {sentimentScore}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-head)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: status.color,
                    marginTop: '0.2rem',
                  }}
                >
                  {status.label}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted-2)' }}>Escala 0 - 100</div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={RADAR_DATA}>
                  <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
                  <PolarAngleAxis
                    dataKey="indicator"
                    tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-body)' }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: 'var(--muted-2)', fontSize: 9 }}
                    stroke="rgba(148, 163, 184, 0.2)"
                  />
                  <Radar
                    name="Puntaje de Sentimiento"
                    dataKey="score"
                    stroke="var(--gold)"
                    fill="var(--gold)"
                    fillOpacity={0.35}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(11, 18, 32, 0.95)',
                      border: '1px solid var(--gold)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      color: '#fff',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Narrative & Institutional Strategy Insights */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Historical comparison pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <span
              style={{
                fontSize: '0.78rem',
                padding: '0.3rem 0.75rem',
                background: 'rgba(148, 163, 184, 0.08)',
                border: '1px solid var(--line)',
                borderRadius: '999px',
                color: 'var(--muted)',
              }}
            >
              Ayer: <strong style={{ color: 'var(--text)' }}>65 (Codicia)</strong>
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                padding: '0.3rem 0.75rem',
                background: 'rgba(148, 163, 184, 0.08)',
                border: '1px solid var(--line)',
                borderRadius: '999px',
                color: 'var(--muted)',
              }}
            >
              Semana previa: <strong style={{ color: 'var(--text)' }}>58 (Neutral+)</strong>
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                padding: '0.3rem 0.75rem',
                background: 'rgba(148, 163, 184, 0.08)',
                border: '1px solid var(--line)',
                borderRadius: '999px',
                color: 'var(--muted)',
              }}
            >
              Mes previo: <strong style={{ color: 'var(--text)' }}>48 (Miedo Leve)</strong>
            </span>
          </div>

          {/* Institutional interpretation */}
          <div
            style={{
              padding: '1.1rem 1.3rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(15, 23, 42, 0.75)',
              border: `1px solid ${status.color}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1rem' }}>🧠</span>
              <h4 style={{ fontFamily: 'var(--font-head)', fontSize: '0.92rem', color: status.color, margin: 0 }}>
                Diagnóstico Táctico AL-HADIQA
              </h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.6, margin: 0 }}>
              {status.desc}
            </p>
          </div>

          {/* Quick checklist for sentiment trading */}
          <div style={{ display: 'grid', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: 'var(--emerald)' }}>✓</span>
              <span><strong>Miedo Extremo:</strong> No perseguir ventas en mínimos; buscar barridos de liquidez y mitigación.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: 'var(--gold)' }}>✓</span>
              <span><strong>Codicia Extrema:</strong> Vigilar divergencias RSI y toma de utilidades de manos fuertes.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
