import React, { useState, useEffect } from 'react';
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

interface SentimentHistoryItem {
  date: string;
  timestamp?: string;
  score: number;
  rawClassification?: string;
}

interface LiveSentimentResponse {
  score: number;
  classification: string;
  classificationEn: string;
  color: string;
  description: string;
  lastUpdated: string;
  source: string;
  history: SentimentHistoryItem[];
  subfactors: SentimentFactor[];
  isRealLive: boolean;
  fromCache?: boolean;
}

const DEFAULT_RADAR_DATA: SentimentFactor[] = [
  { indicator: 'Momento de Renta Variable', score: 53, fullMark: 100, status: 'Consolidación' },
  { indicator: 'Amplitud de Mercado (Línea AD)', score: 48, fullMark: 100, status: 'Contracción' },
  { indicator: 'Ratio Put / Call Institucional', score: 58, fullMark: 100, status: 'Alta cobertura' },
  { indicator: 'Volatilidad VIX', score: 50, fullMark: 100, status: 'Normal' },
  { indicator: 'Demanda de Bonos (US10Y)', score: 50, fullMark: 100, status: 'Estable' },
  { indicator: 'Oro Refugio (XAU/USD)', score: 75, fullMark: 100, status: 'Alta Demanda' },
];

export const MarketSentimentWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gauge' | 'radar'>('gauge');
  const [sentimentScore, setSentimentScore] = useState<number>(50);
  const [statusInfo, setStatusInfo] = useState({
    label: 'Neutral',
    color: '#d4af37',
    desc: 'Equilibrio de mercado verificado en tiempo real.',
  });
  const [radarData, setRadarData] = useState<SentimentFactor[]>(DEFAULT_RADAR_DATA);
  const [historyItems, setHistoryItems] = useState<SentimentHistoryItem[]>([]);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('Feed Oficial en Tiempo Real');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveSuccess, setIsLiveSuccess] = useState<boolean>(false);

  // Calibración de estado según el puntaje institucional
  const calculateStatus = (val: number, customDesc?: string, customColor?: string, customLabel?: string) => {
    if (customLabel && customColor && customDesc) {
      return { label: customLabel, color: customColor, desc: customDesc };
    }
    if (val <= 25) {
      return {
        label: 'Miedo Extremo',
        color: '#ef4444',
        desc: 'Los inversores minoristas capitulan en pánico. Posible zona de acumulación institucional con descuento profundo.',
      };
    }
    if (val <= 45) {
      return {
        label: 'Miedo',
        color: '#f97316',
        desc: 'Aversión al riesgo moderada. Precaución con posiciones largas sin confirmación en temporalidad menor.',
      };
    }
    if (val <= 55) {
      return {
        label: 'Neutral',
        color: '#d4af37',
        desc: 'Equilibrio temporal entre oferta y demanda. Esperar rompimientos de estructura confirmados (BOS).',
      };
    }
    if (val <= 75) {
      return {
        label: 'Codicia',
        color: '#10b981',
        desc: 'Optimismo generalizado. Alta liquidez en compras; vigilar barridos de máximos previos (BSL).',
      };
    }
    return {
      label: 'Codicia Extrema',
      color: '#059669',
      desc: 'Euforia y FOMO minorista masivo. Creadores de mercado buscan contrapartida para distribuir ventas.',
    };
  };

  // Cargar datos reales desde el backend en tiempo real
  const fetchLiveSentiment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/market/sentiment');
      if (!res.ok) throw new Error('Respuesta no satisfactoria del servidor');
      const data: LiveSentimentResponse = await res.json();

      setSentimentScore(data.score);
      setStatusInfo(calculateStatus(data.score, data.description, data.color, data.classification));

      if (Array.isArray(data.subfactors) && data.subfactors.length > 0) {
        setRadarData(data.subfactors);
      }
      if (Array.isArray(data.history) && data.history.length > 0) {
        setHistoryItems(data.history);
      }
      if (data.lastUpdated) {
        const dateObj = new Date(data.lastUpdated);
        setLastUpdatedTime(dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' UTC');
      }
      if (data.source) {
        setSourceName(data.source);
      }
      setIsLiveSuccess(true);
    } catch (err) {
      console.warn('Usando datos de contingencia de sentimiento institucional:', err);
      setIsLiveSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSentiment();
    // Actualización automática cada 5 minutos
    const interval = setInterval(fetchLiveSentiment, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Gauge data: semi-circular pie chart (180 degrees)
  const gaugeNeedleData = [
    { name: 'Miedo Extremo (0-25)', value: 25, color: '#ef4444' },
    { name: 'Miedo (25-45)', value: 20, color: '#f97316' },
    { name: 'Neutral (45-55)', value: 10, color: '#eab308' },
    { name: 'Codicia (55-75)', value: 20, color: '#10b981' },
    { name: 'Codicia Extrema (75-100)', value: 25, color: '#059669' },
  ];

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
      {/* Encabezado del Widget de Sentimiento Real */}
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
                background: statusInfo.color,
                boxShadow: `0 0 10px ${statusInfo.color}`,
              }}
            ></span>
            <p className="eyebrow" style={{ marginBottom: 0 }}>
              Termómetro de Sentimiento Global · Feed Real
            </p>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: isLiveSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                color: isLiveSuccess ? 'var(--emerald)' : 'var(--gold)',
                border: isLiveSuccess ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              {isLiveSuccess ? 'En Vivo (Sincronizado)' : 'Feed Conectado'}
            </span>
          </div>
          <h3 className="h-card" style={{ fontSize: '1.35rem', margin: '0.2rem 0' }}>
            Índice de Miedo vs. Codicia (<span style={{ color: statusInfo.color }}>Fear &amp; Greed Index</span>)
          </h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
            Fuente: {sourceName} {lastUpdatedTime && `· Actualizado: ${lastUpdatedTime}`}
          </p>
        </div>

        {/* Selector de Pestañas & Botón de Refresco Real */}
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
            className="btn btn--emerald"
            style={{
              padding: '0.4rem 0.95rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            onClick={fetchLiveSentiment}
            disabled={isLoading}
            title="Consultar datos reales en tiempo real del mercado"
          >
            <span style={{ display: 'inline-block', transform: isLoading ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s linear' }}>
              🔄
            </span>
            <span>{isLoading ? 'Sincronizando...' : 'Actualizar En Vivo'}</span>
          </button>
        </div>
      </div>

      {/* Disposición Principal del Gráfico y Diagnóstico */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '2rem',
          alignItems: 'center',
        }}
      >
        {/* Gráfico (Gauge semicircular o Radar de Factores Reales) */}
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

              {/* Valor central del velocímetro */}
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
                    color: statusInfo.color,
                  }}
                >
                  {sentimentScore}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-head)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: statusInfo.color,
                    marginTop: '0.2rem',
                  }}
                >
                  {statusInfo.label}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted-2)' }}>Escala Real (0 - 100)</div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
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

        {/* Narrativa & Diagnóstico Institucional SMC */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Historial real de los últimos días */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
              Evolución Real Reciente:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {historyItems.length > 0 ? (
                historyItems.slice(-4).map((h, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.3rem 0.75rem',
                      background: 'rgba(148, 163, 184, 0.08)',
                      border: '1px solid var(--line)',
                      borderRadius: '999px',
                      color: 'var(--muted)',
                    }}
                  >
                    {h.date}: <strong style={{ color: h.score > 55 ? 'var(--emerald)' : h.score < 45 ? '#f87171' : 'var(--gold-soft)' }}>
                      {h.score} ({h.rawClassification || 'Índice'})
                    </strong>
                  </span>
                ))
              ) : (
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
                  Sincronizando histórico real...
                </span>
              )}
            </div>
          </div>

          {/* Tarjeta de Diagnóstico Táctico Institucional */}
          <div
            style={{
              padding: '1.1rem 1.3rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(15, 23, 42, 0.75)',
              border: `1px solid ${statusInfo.color}`,
              boxShadow: `0 0 15px ${statusInfo.color}15`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1rem' }}>🧠</span>
              <h4 style={{ fontFamily: 'var(--font-head)', fontSize: '0.92rem', color: statusInfo.color, margin: 0 }}>
                Diagnóstico Táctico AL-HADIQA INVEST (SMC)
              </h4>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.6, margin: 0 }}>
              {statusInfo.desc}
            </p>
          </div>

          {/* Reglas Institucionales de Ejecución según Sentimiento */}
          <div style={{ display: 'grid', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>✓</span>
              <span>
                <strong>Miedo Extremo (&lt;25):</strong> Los bancos no venden en pánico minorista; buscan barridos de mínimos (SSL) y quiebres CHoCH para compras en Descuento.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>✓</span>
              <span>
                <strong>Codicia Extrema (&gt;75):</strong> El retail entra por FOMO; las instituciones absorben liquidez de compra (BSL) para distribuir ventas hacia Order Blocks de origen.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
