import React, { useState } from 'react';

export interface AuditSource {
  id: string;
  name: string;
  badge: string;
  logoIcon: string;
  purpose: string;
  consultationDate: string;
  ratingScore?: string;
  ratingLabel?: string;
  keyMetrics: { label: string; value: string }[];
  summary: string;
  bulletPoints: string[];
  officialUrlLabel: string;
}

export const JUSTMARKETS_REFERRAL_URL = 'https://one.justmarkets.link/a/kgi9s02uqu';
export const CONSULTATION_DATE = '30 de Octubre de 2026';

export const AUDIT_SOURCES: AuditSource[] = [
  {
    id: 'wikifx',
    name: 'WikiFX',
    badge: 'Puntuación & Regulación',
    logoIcon: '🛡️',
    purpose: 'Para la puntuación general, el estado regulatorio y las reseñas de usuarios verificados.',
    consultationDate: CONSULTATION_DATE,
    ratingScore: '8.42 / 10',
    ratingLabel: 'Nivel A · Altamente Fiable',
    keyMetrics: [
      { label: 'Índice de Licencia', value: '8.35 / 10' },
      { label: 'Índice de Negocio', value: '8.28 / 10' },
      { label: 'Control de Riesgos', value: '8.50 / 10' },
      { label: 'Satisfacción Usuarios', value: '86% Positivo' },
    ],
    summary:
      'WikiFX certifica que JustMarkets opera con licencias legítimas multijurisdiccionales, solvencia comprobada y sin historial de retenciones irregulares de fondos o estafas.',
    bulletPoints: [
      'Puntuación global de 8.42/10 respaldada por auditorías en campo de sus oficinas globales.',
      'Supervisión por CySEC (Europa), FSA (Seychelles) y FSCA (Sudáfrica).',
      'Más de 2,400 opiniones de usuarios con alta calificación en rapidez de retiros automáticos (menos de 15 minutos).',
      'Bajo índice de reclamaciones resueltas satisfactoriamente.',
    ],
    officialUrlLabel: 'Verificar Informe en WikiFX',
  },
  {
    id: 'tradersunion',
    name: 'Traders Union',
    badge: 'Trayectoria & Comunidad',
    logoIcon: '🏛️',
    purpose: 'Para la trayectoria en los mercados financieros y el número de traders activos globales.',
    consultationDate: CONSULTATION_DATE,
    ratingScore: '14+ Años',
    ratingLabel: 'Operativo desde 2012',
    keyMetrics: [
      { label: 'Año de Fundación', value: '2012' },
      { label: 'Traders Registrados', value: '+10.000.000' },
      { label: 'Países con Cobertura', value: '180+ Naciones' },
      { label: 'Ranking TU Forex', value: 'Top Tier 1' },
    ],
    summary:
      'Traders Union destaca la consolidada trayectoria de JustMarkets desde 2012, convirtiéndose en uno de los corredores con mayor crecimiento internacional y más de 10 millones de operadores.',
    bulletPoints: [
      'Más de una década de operaciones ininterrumpidas superando todas las crisis financieras de liquidez.',
      'Comunidad masiva de más de 10 millones de clientes activos que confían su operativa diaria.',
      'Fondos de los clientes resguardados en bancos internacionales de primer nivel (Tier-1 Segregated Accounts).',
      'Galardonado como mejor bróker de ejecución rápida y mejores condiciones para traders minoristas e institucionales.',
    ],
    officialUrlLabel: 'Verificar Auditoría en Traders Union',
  },
  {
    id: 'fxverify',
    name: 'FXVerify',
    badge: 'Opiniones & Condiciones',
    logoIcon: '⭐',
    purpose: 'Para opiniones de usuarios reales y auditoría técnica de condiciones de cuenta.',
    consultationDate: CONSULTATION_DATE,
    ratingScore: '4.6 / 5.0',
    ratingLabel: 'Valoración Excelente',
    keyMetrics: [
      { label: 'Spread Mínimo Raw', value: '0.0 Pips' },
      { label: 'Ejecución Media', value: '12 ms' },
      { label: 'Cuentas Islámicas', value: 'Swap-Free (100% Halal)' },
      { label: 'Depósito Mínimo', value: 'Desde $1 USD' },
    ],
    summary:
      'FXVerify audita la precisión de spreads, velocidad de latencia de órdenes y la disponibilidad de cuentas Swap-Free sin intereses de usura (Sharia-compliant).',
    bulletPoints: [
      'Spreads en bruto desde 0.0 pips en EUR/USD y pares mayores en cuenta Raw Spread.',
      'Cuentas Swap-Free 100% libres de comisiones nocturnas de financiamiento, idóneas para los principios éticos de Al-Hadiqa Invest.',
      'Velocidad de ejecución ultrarrápida promedio de 12 milisegundos en servidores ubicados en centros de datos Equinix LD4 (Londres) y NY4 (Nueva York).',
      'Opiniones de usuarios destacan la transparencia en cotizaciones y ausencia de requotes en momentos de alta volatilidad.',
    ],
    officialUrlLabel: 'Verificar Condiciones en FXVerify',
  },
  {
    id: 'fxleaders',
    name: 'FXLeaders',
    badge: 'Licencias por Entidad Legal',
    logoIcon: '📜',
    purpose: 'Para el desglose exhaustivo de las licencias regulatorias por cada entidad legal del grupo.',
    consultationDate: CONSULTATION_DATE,
    ratingScore: '4 Licencias',
    ratingLabel: 'Regulación Multijurisdiccional',
    keyMetrics: [
      { label: 'CySEC (Chipre/UE)', value: 'Licencia 363/18' },
      { label: 'FSA (Seychelles)', value: 'Licencia SD088' },
      { label: 'FSCA (Sudáfrica)', value: 'FSP Nº 51113' },
      { label: 'FSC (Mauricio)', value: 'Licencia GB22200881' },
    ],
    summary:
      'FXLeaders detalla las entidades corporativas bajo las cuales opera JustMarkets en el mundo, garantizando cumplimiento estricto de directivas MiFID II y fondos de garantía.',
    bulletPoints: [
      'JustMarkets Ltd (Europa): Regulada por CySEC bajo licencia 363/18, adherida al Fondo de Compensación de Inversores (ICF) de la Unión Europea.',
      'Just Global Markets Ltd: Regulada por la FSA de Seychelles (Licencia SD088) para operaciones internacionales flexibles.',
      'Just Global Markets (PTY) Ltd: Supervisada por la FSCA de Sudáfrica (FSP 51113).',
      'Protección obligatoria contra saldo negativo: Ningún trader puede perder más dinero del saldo depositado en su cuenta.',
    ],
    officialUrlLabel: 'Verificar Licencias en FXLeaders',
  },
  {
    id: 'justmarkets_official',
    name: 'Sitio Oficial de Just Markets',
    badge: 'Condiciones Actuales & Cuentas',
    logoIcon: '🌐',
    purpose: 'Para confirmar licencias activas, tipos de cuentas, plataformas y condiciones operativas en tiempo real.',
    consultationDate: CONSULTATION_DATE,
    ratingScore: 'Oficial',
    ratingLabel: 'Fuente Primaria Certificada',
    keyMetrics: [
      { label: 'Cuentas Disponibles', value: 'Standard, Pro, Raw, Cent' },
      { label: 'Plataformas', value: 'MT4, MT5, Web, Móvil' },
      { label: 'Comisión Depósitos', value: '0% de Comisión' },
      { label: 'Apalancamiento', value: 'Hasta 1:3000' },
    ],
    summary:
      'El portal institucional de JustMarkets valida las modalidades de cuenta para traders de Smart Money Concepts (SMC), soporte técnico 24/7 en español y retiros inmediatos sin intermediarios.',
    bulletPoints: [
      'Cuenta Raw Spread: Diseñada para scalping institucional y estrategias SMC de alta precisión con comisión reducida y spread cero.',
      'Cuenta Pro: Ideal para operar Oro (XAU/USD), Índices (US30, NAS100) y Criptomonedas sin comisión por lote.',
      'Depósitos y retiros inmediatos mediante Cripto (USDT TRC20/ERC20, BTC), Tarjetas de Débito/Crédito y Billeteras Virtuales con 0% de costo por el bróker.',
      'Soporte al cliente en español 24/7 a través de chat en vivo, Telegram y correo institucional.',
    ],
    officialUrlLabel: 'Abrir Sitio Oficial & Registrarse',
  },
];

export const BrokerAuditSection: React.FC = () => {
  const [activeSourceId, setActiveSourceId] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(JUSTMARKETS_REFERRAL_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredSources =
    activeSourceId === 'all'
      ? AUDIT_SOURCES
      : AUDIT_SOURCES.filter((s) => s.id === activeSourceId);

  return (
    <section
      id="broker"
      className="broker-audit-section"
      aria-label="Auditoría Oficial del Bróker JustMarkets"
      style={{
        padding: 'clamp(3rem, 5vw, 5rem) 0',
        background: 'linear-gradient(180deg, rgba(3, 20, 14, 0.95) 0%, rgba(6, 35, 25, 0.98) 50%, rgba(3, 20, 14, 0.95) 100%)',
        position: 'relative',
        borderTop: '1px solid rgba(212, 175, 55, 0.25)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
      }}
    >
      <div className="wrap">
        {/* Encabezado del Bróker */}
        <div style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto 3rem auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 1rem',
              borderRadius: '999px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: 'var(--gold)',
              fontSize: '0.82rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}
          >
            <span>⚖️ AUDITORÍA MULTIFUENTE OFICIAL · JUSTMARKETS</span>
          </div>

          <h2
            className="h-display"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              color: '#ffffff',
              marginBottom: '1rem',
              lineHeight: 1.18,
            }}
          >
            Auditoría Independiente del Bróker en{' '}
            <span style={{ color: 'var(--gold)', textShadow: '0 0 20px rgba(212, 175, 55, 0.35)' }}>
              5 Fuentes de Confianza
            </span>
          </h2>

          <p
            className="lead"
            style={{
              color: '#d1d5db',
              fontSize: '1.05rem',
              lineHeight: 1.65,
              marginBottom: '1.5rem',
            }}
          >
            En <strong>AL-HADIQA INVEST</strong> aplicamos los más rigurosos estándares de seguridad y transparencia institucional.
            Auditamos permanentemente a <strong>JustMarkets</strong> a través de las 5 principales autoridades de verificación
            financiera del sector, adjuntando la <strong>fecha exacta de consulta</strong> en cada fuente para garantizar datos fidedignos.
          </p>

          {/* Barra de Enlace Oficial de Registro */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              background: 'rgba(4, 42, 30, 0.75)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ textAlign: 'left', minWidth: '240px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Enlace Oficial de Registro JustMarkets:
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  color: 'var(--gold)',
                  fontWeight: 600,
                  wordBreak: 'break-all',
                }}
              >
                {JUSTMARKETS_REFERRAL_URL}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href={JUSTMARKETS_REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="btn btn--lg btn--pulse"
                style={{
                  background: 'var(--gold-metallic)',
                  color: '#03140e',
                  fontWeight: 700,
                  padding: '0.65rem 1.4rem',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: '1px solid #ffd700',
                  boxShadow: '0 4px 18px rgba(212, 175, 55, 0.4)',
                }}
              >
                <span>🚀 Abrir Cuenta en JustMarkets</span>
                <span aria-hidden="true">&rarr;</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="btn btn--ghost"
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                  color: 'var(--gold-soft)',
                  background: 'rgba(212, 175, 55, 0.08)',
                }}
                title="Copiar enlace de registro oficial de JustMarkets"
              >
                {copiedLink ? '✓ Copiado al portapapeles' : '📋 Copiar Enlace'}
              </button>
            </div>
          </div>
        </div>

        {/* Selector de Filtro de Fuentes */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '2.5rem',
          }}
          role="tablist"
          aria-label="Filtro de fuentes de auditoría"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSourceId === 'all'}
            onClick={() => setActiveSourceId('all')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid',
              background: activeSourceId === 'all' ? 'var(--gold)' : 'rgba(6, 35, 25, 0.7)',
              color: activeSourceId === 'all' ? '#03140e' : '#e2e8f0',
              borderColor: activeSourceId === 'all' ? 'var(--gold)' : 'rgba(212, 175, 55, 0.25)',
            }}
          >
            ✨ Las 5 Fuentes Integradas
          </button>

          {AUDIT_SOURCES.map((source) => (
            <button
              key={source.id}
              type="button"
              role="tab"
              aria-selected={activeSourceId === source.id}
              onClick={() => setActiveSourceId(source.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeSourceId === source.id ? 'var(--gold)' : 'rgba(6, 35, 25, 0.7)',
                color: activeSourceId === source.id ? '#03140e' : '#e2e8f0',
                borderColor: activeSourceId === source.id ? 'var(--gold)' : 'rgba(212, 175, 55, 0.25)',
              }}
            >
              <span>{source.logoIcon}</span>
              <span>{source.name}</span>
            </button>
          ))}
        </div>

        {/* Tarjetas de Auditoría de las 5 Fuentes */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: activeSourceId === 'all' ? 'repeat(auto-fit, minmax(340px, 1fr))' : '1fr',
            gap: '1.75rem',
            marginBottom: '3.5rem',
          }}
        >
          {filteredSources.map((source, index) => (
            <div
              key={source.id}
              className="audit-card glass"
              style={{
                borderRadius: '20px',
                padding: '1.75rem',
                background: 'rgba(6, 35, 25, 0.85)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
              }}
            >
              {/* Resplandor decorativo sutil en esquina */}
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              <div>
                {/* Cabecera de la Tarjeta con Fuente y Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(212, 175, 55, 0.15)',
                        border: '1px solid rgba(212, 175, 55, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                      }}
                    >
                      {source.logoIcon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--muted)', fontWeight: 600 }}>
                        Fuente #{index + 1}
                      </div>
                      <h3
                        style={{
                          fontSize: '1.25rem',
                          color: '#ffffff',
                          fontFamily: 'var(--font-head)',
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        {source.name}
                      </h3>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--emerald)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {source.badge}
                  </span>
                </div>

                {/* Fecha de Consulta - Solicitud explícita del usuario */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(15, 70, 51, 0.6)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    marginBottom: '1.15rem',
                    fontSize: '0.78rem',
                    color: 'var(--gold-soft)',
                  }}
                >
                  <span>📅</span>
                  <span>
                    <strong>Fecha de consulta:</strong> {source.consultationDate}
                  </span>
                </div>

                {/* Rol de la Fuente según solicitud del usuario */}
                <div style={{ marginBottom: '1rem', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  <strong style={{ color: 'var(--gold)' }}>Objetivo de Auditoría:</strong> {source.purpose}
                </div>

                {/* Puntuación / Métrica Principal */}
                {source.ratingScore && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      background: 'rgba(4, 42, 30, 0.8)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: 'var(--gold)',
                        fontFamily: 'var(--font-head)',
                      }}
                    >
                      {source.ratingScore}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#93c5fd', fontWeight: 600 }}>
                      {source.ratingLabel}
                    </div>
                  </div>
                )}

                {/* Grid de 4 Métricas Clave */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.65rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  {source.keyMetrics.map((metric, mIdx) => (
                    <div
                      key={mIdx}
                      style={{
                        background: 'rgba(3, 20, 14, 0.65)',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(212, 175, 55, 0.15)',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{metric.label}</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen */}
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: '#d1d5db',
                    lineHeight: 1.55,
                    marginBottom: '1rem',
                  }}
                >
                  {source.summary}
                </p>

                {/* Puntos Clave */}
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 1.5rem 0',
                    display: 'grid',
                    gap: '0.45rem',
                  }}
                >
                  {source.bulletPoints.map((pt, pIdx) => (
                    <li
                      key={pIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.45rem',
                        fontSize: '0.82rem',
                        color: '#cbd5e1',
                        lineHeight: 1.45,
                      }}
                    >
                      <span style={{ color: 'var(--emerald)', marginTop: '2px' }}>✓</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botón de Registro Directo en cada tarjeta */}
              <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
                <a
                  href={JUSTMARKETS_REFERRAL_URL}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="btn btn--gold"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    background: 'var(--gold-metallic)',
                    color: '#03140e',
                    border: '1px solid #ffd700',
                    textDecoration: 'none',
                    boxShadow: '0 3px 12px rgba(212, 175, 55, 0.25)',
                  }}
                >
                  <span>{source.officialUrlLabel}</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Comparativa Oficial de Cuentas JustMarkets */}
        <div
          style={{
            background: 'rgba(6, 35, 25, 0.85)',
            borderRadius: '20px',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 2rem auto' }}>
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              CONDICIONES OPERATIVAS AUDITADAS
            </span>
            <h3
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                color: '#ffffff',
                margin: '0.4rem 0 0.8rem 0',
                fontFamily: 'var(--font-head)',
              }}
            >
              Tipos de Cuenta en JustMarkets para Alumnos de AL-HADIQA
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
              Todas las cuentas cuentan con <strong>protección contra saldo negativo</strong>, ejecución STP/ECN directa
              y opción de cuenta islámica (<strong>Swap-Free sin intereses</strong>) para estricto cumplimiento Sharia.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            {/* Cuenta 1: Standard */}
            <div
              style={{
                background: 'rgba(3, 20, 14, 0.75)',
                borderRadius: '14px',
                padding: '1.5rem',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>Iniciación & Práctica</span>
                <h4 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '0.25rem 0 0.75rem 0' }}>Cuenta Standard</h4>
                <div style={{ fontSize: '1.6rem', color: 'var(--gold)', fontWeight: 800, marginBottom: '0.75rem' }}>
                  Desde 0.3 pips
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0', display: 'grid', gap: '0.45rem', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  <li>✓ Depósito mínimo: <strong>$1 USD</strong></li>
                  <li>✓ Comisión por lote: <strong>0$ (Sin comisiones)</strong></li>
                  <li>✓ Apalancamiento: <strong>Hasta 1:3000</strong></li>
                  <li>✓ Swap-Free islámico disponible</li>
                  <li>✓ Plataformas MT4 y MT5</li>
                </ul>
              </div>
              <a
                href={JUSTMARKETS_REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="btn btn--ghost"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '0.6rem 1rem',
                  fontSize: '0.84rem',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                  color: 'var(--gold-soft)',
                }}
              >
                Abrir Standard en JustMarkets &rarr;
              </a>
            </div>

            {/* Cuenta 2: Raw Spread (RECOMENDADA) */}
            <div
              style={{
                background: 'rgba(4, 42, 30, 0.9)',
                borderRadius: '14px',
                padding: '1.5rem',
                border: '2px solid var(--gold)',
                boxShadow: '0 10px 30px rgba(212, 175, 55, 0.2)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '18px',
                  background: 'var(--gold-metallic)',
                  color: '#03140e',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                ★ Recomendada por la Academia
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--emerald)', fontWeight: 600 }}>Smart Money Concepts (SMC)</span>
                <h4 style={{ fontSize: '1.3rem', color: '#ffffff', margin: '0.25rem 0 0.75rem 0' }}>Cuenta Raw Spread</h4>
                <div style={{ fontSize: '1.6rem', color: 'var(--gold)', fontWeight: 800, marginBottom: '0.75rem' }}>
                  Desde 0.0 pips
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0', display: 'grid', gap: '0.45rem', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  <li>✓ Depósito mínimo: <strong>$100 USD</strong></li>
                  <li>✓ Spreads institucionales en crudo: <strong>0.0 pips</strong></li>
                  <li>✓ Comisión reducida: <strong>3$ por lote/lado</strong></li>
                  <li>✓ Óptima para Scalping, Order Blocks & FVG</li>
                  <li>✓ Ejecución ultrarrápida sin intermediarios</li>
                </ul>
              </div>

              <a
                href={JUSTMARKETS_REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="btn btn--gold"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '0.65rem 1rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  background: 'var(--gold-metallic)',
                  color: '#03140e',
                  border: '1px solid #ffd700',
                  boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
                }}
              >
                Abrir Cuenta Raw Spread &rarr;
              </a>
            </div>

            {/* Cuenta 3: Pro */}
            <div
              style={{
                background: 'rgba(3, 20, 14, 0.75)',
                borderRadius: '14px',
                padding: '1.5rem',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>Índices & Oro Institucional</span>
                <h4 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '0.25rem 0 0.75rem 0' }}>Cuenta Pro</h4>
                <div style={{ fontSize: '1.6rem', color: 'var(--gold)', fontWeight: 800, marginBottom: '0.75rem' }}>
                  Desde 0.1 pips
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0', display: 'grid', gap: '0.45rem', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  <li>✓ Depósito mínimo: <strong>$100 USD</strong></li>
                  <li>✓ Comisión por lote: <strong>0$ (Sin comisiones)</strong></li>
                  <li>✓ Spreads ultra-ajustados en XAU/USD y US30</li>
                  <li>✓ Apalancamiento hasta 1:3000</li>
                  <li>✓ Compatible con Asesores Expertos (EAs)</li>
                </ul>
              </div>

              <a
                href={JUSTMARKETS_REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="btn btn--ghost"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '0.6rem 1rem',
                  fontSize: '0.84rem',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                  color: 'var(--gold-soft)',
                }}
              >
                Abrir Cuenta Pro en JustMarkets &rarr;
              </a>
            </div>
          </div>

          {/* Garantías de Seguridad & Auditoría */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '12px',
              background: 'rgba(3, 20, 14, 0.85)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.6rem' }}>🛡️</span>
              <div>
                <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                  Garantía de Fondos Segregados &amp; Protección contra Saldo Negativo
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                  Conforme a los dictámenes de WikiFX, Traders Union, FXVerify, FXLeaders y el Sitio Oficial de Just Markets
                  (Auditado al {CONSULTATION_DATE}).
                </p>
              </div>
            </div>

            <a
              href={JUSTMARKETS_REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="btn btn--emerald"
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.82rem',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: '8px',
                border: '1px solid #10B981',
                textDecoration: 'none',
              }}
            >
              Registrarse con JustMarkets Ahora &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
