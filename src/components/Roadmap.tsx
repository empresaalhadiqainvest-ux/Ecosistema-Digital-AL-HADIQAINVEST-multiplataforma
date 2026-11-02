import React, { useState, useEffect } from 'react';

export interface MilestoneItem {
  id: string;
  stepNumber: string;
  phaseTitle: string;
  levelBadge: string;
  levelCategory: 'onboarding' | 'fundamentals' | 'psychology' | 'institutional' | 'elite';
  duration: string;
  icon: string;
  tagline: string;
  summary: string;
  syllabus: {
    title: string;
    description: string;
    isKeyConcept?: boolean;
  }[];
  deliverables: string[];
  recommendedBooks: {
    title: string;
    category: string;
    libraryRef: string;
  }[];
  actionTarget: string;
  actionLabel: string;
  practicalTask: string;
}

export const MILESTONES: MilestoneItem[] = [
  {
    id: 'm1-onboarding',
    stepNumber: '01',
    phaseTitle: 'Onboarding & Cimientos de Seguridad',
    levelBadge: 'Inducción · Semana 1',
    levelCategory: 'onboarding',
    duration: 'Semana 1',
    icon: '🛡️',
    tagline: 'Configuración segura, credenciales y lenguaje esencial del mercado',
    summary:
      'El punto de partida de todo alumno en AL-HADIQA INVEST. Asegura tu entorno de trabajo, familiarízate con los protocolos de seguridad OWASP y comprende la terminología base antes de arriesgar capital.',
    syllabus: [
      {
        title: 'Autenticación & Configuración de Cuenta',
        description: 'Inicio de sesión único y blindado con Google OAuth 2.0, verificación de perfil de alumno y conocimiento de permisos de descarga en la biblioteca.',
      },
      {
        title: 'Glosario Esencial de Mercado',
        description: 'Comprensión cabal de Pips, Spreads, Apalancamiento, Tipos de órdenes (Market, Limit, Stop), Bid vs. Ask y Margin Call.',
        isKeyConcept: true,
      },
      {
        title: 'Entorno de Gráficos & TradingView',
        description: 'Configuración de espacio de trabajo limpio sin indicadores ruidosos, personalización de colores institucionales y atajos de teclado.',
      },
      {
        title: 'Código de Conducta & Cumplimiento',
        description: 'Entendimiento de las políticas educativas y normativas del socio JustMarkets: formación pura sin promesas falsas de rentabilidad.',
      },
    ],
    deliverables: [
      'Entorno TradingView configurado en modo institucional limpio',
      'Perfil de alumno verificado en AL-HADIQA INVEST',
      'Dominio de cálculo de valor del pip según divisa',
      'Familiarización con el bot asistente pedagógico y las salas de chat',
    ],
    recommendedBooks: [
      {
        title: 'Fundamentos de Trading y Mercados Financieros',
        category: 'Fundamentos',
        libraryRef: '#biblioteca',
      },
      {
        title: 'Guía de Seguridad y Protección de Capital',
        category: 'Gestión de Riesgo',
        libraryRef: '#biblioteca',
      },
    ],
    actionTarget: '#comunidad-chat',
    actionLabel: 'Presentarse en el Chat Comunitario',
    practicalTask: 'Calcula el riesgo en dólares de 15 pips con 0.10 lotes en EUR/USD y compártelo en el chat de consultas.',
  },
  {
    id: 'm2-price-action',
    stepNumber: '02',
    phaseTitle: 'Acción del Precio & Estructura de Mercado',
    levelBadge: 'Fundamentos · Semanas 2-3',
    levelCategory: 'fundamentals',
    duration: 'Semanas 2-3',
    icon: '📊',
    tagline: 'Aprender a leer el gráfico desnudo mediante fractales y quiebres reales',
    summary:
      'Eliminamos los indicadores rezagados (RSI, MACD, medias móviles cruzadas). Aprendemos la física del precio: máximos más altos, mínimos más bajos, rupturas de estructura (BOS) y cambios de carácter (CHoCH).',
    syllabus: [
      {
        title: 'Anatomía de las Velas Japonesas',
        description: 'Cuerpo, mechas de rechazo, volumen implícito e intención de los participantes institucionales en aperturas y cierres.',
      },
      {
        title: 'Estructura de Mercado (BOS & CHoCH)',
        description: 'Mapeo riguroso de Break of Structure (continuación de tendencia) y Change of Character (primera señal de giro).',
        isKeyConcept: true,
      },
      {
        title: 'Multi-Timeframe Analysis (MTFA)',
        description: 'Conexión fractal desde temporalidades mayores (HTF: Diario / 4H) para dirección macro hasta temporales de entrada (LTF: 15m / 5m).',
      },
      {
        title: 'Zonas de Oferta y Demanda Reales',
        description: 'Diferenciación entre niveles psicológicos minoristas y verdaderos puntos de origen donde se inyectó liquidez bancaria.',
      },
    ],
    deliverables: [
      'Mapeo estructural completo de 3 activos principales (EUR/USD, XAU/USD, US30)',
      'Identificación clara de BOS y CHoCH en temporalidades 4H y 15m',
      'Elaboración de plantilla de análisis pre-mercado semanal',
    ],
    recommendedBooks: [
      {
        title: 'Price Action Institucional: La Verdad del Gráfico',
        category: 'Estrategias',
        libraryRef: '#biblioteca',
      },
      {
        title: 'Análisis Técnico Avanzado y Lectura de Mechas',
        category: 'Análisis Técnico',
        libraryRef: '#biblioteca',
      },
    ],
    actionTarget: '#clases-en-vivo',
    actionLabel: 'Ver Clases de Estructura de Mercado',
    practicalTask: 'Toma una captura de EUR/USD en temporalidad 1H, marca con etiquetas el último BOS y CHoCH, y súbela al canal de análisis.',
  },
  {
    id: 'm3-capital-mindset',
    stepNumber: '03',
    phaseTitle: 'Psicotrading & Gestión de Capital (Al-Hadiqa Capital)',
    levelBadge: 'Mentalidad · Semanas 4-5',
    levelCategory: 'psychology',
    duration: 'Semanas 4-5',
    icon: '🏛️',
    tagline: 'La regla del 1%, educación financiera de Kiyosaki y bitácora inviolable',
    summary:
      'El 90% del éxito en el trading radica en el dominio mental y la preservación del capital. Fusionamos las enseñanzas de Robert Kiyosaki (Cuadrante del Flujo de Dinero) con la regla matemática del riesgo.',
    syllabus: [
      {
        title: 'Cuadrante del Flujo de Dinero (Kiyosaki)',
        description: 'La transición mental de autoempleado o apostador a verdadero Inversionista (I), donde el dinero trabaja como empleado fiel.',
        isKeyConcept: true,
      },
      {
        title: 'La Regla de Oro del 1% de Riesgo',
        description: 'Cálculo dinámico del tamaño de posición según el Stop Loss. Jamás arriesgar más del 0.5% - 1% del balance por trade.',
        isKeyConcept: true,
      },
      {
        title: 'Ratio Riesgo/Beneficio Mínimo 1:3 (R:R)',
        description: 'Por qué una tasa de acierto del 40% es extremadamente rentable con un R:R 1:3, y cómo neutraliza el miedo a perder.',
      },
      {
        title: 'Bitácora & Diario de Psicotrading',
        description: 'Registro de emociones pre y post-operación, control de la racha perdedora y erradicación del "Revenge Trading".',
      },
    ],
    deliverables: [
      'Calculadora de lotaje automático integrada con límite del 1%',
      'Diario de trading con al menos 20 operaciones en demo documentadas',
      'Test del Cuadrante Financiero completado con plan de libertad a 12 meses',
    ],
    recommendedBooks: [
      {
        title: 'Trading en la Zona - Mark Douglas',
        category: 'Psicotrading',
        libraryRef: '#capital',
      },
      {
        title: 'El Cuadrante del Flujo del Dinero - Robert Kiyosaki',
        category: 'Educación Financiera',
        libraryRef: '#capital',
      },
      {
        title: 'Gestión de Riesgo y Preservación de Capital',
        category: 'Gestión de Riesgo',
        libraryRef: '#biblioteca',
      },
    ],
    actionTarget: '#capital',
    actionLabel: 'Explorar Módulo AL-HADIQA Capital',
    practicalTask: 'Simula una racha de 5 pérdidas consecutivas con un 1% de riesgo y demuestra matemáticamente cómo recuperar el drawdown con solo 2 trades de 1:3.',
  },
  {
    id: 'm4-smart-money',
    stepNumber: '04',
    phaseTitle: 'Trading Institucional & Smart Money Concepts (SMC)',
    levelBadge: 'Institucional · Semanas 6-8',
    levelCategory: 'institutional',
    duration: 'Semanas 6-8',
    icon: '🦁',
    tagline: 'Order Blocks, Fair Value Gaps (FVG) y captura de liquidez bancaria',
    summary:
      'Aprende a rastrear las huellas dejadas por los creadores de mercado e instituciones financieras. Deja de ser la liquidez que ellos cazan para convertirte en quien se suma a su dirección.',
    syllabus: [
      {
        title: 'Order Blocks (OB) & Zonas de Decisión',
        description: 'Velas institucionales de alta absorción, identificación de bloques válidos vs. no mitigados y puntos de origen de movimientos explosivos.',
        isKeyConcept: true,
      },
      {
        title: 'Fair Value Gaps (FVG) & Desequilibrios',
        description: 'Vaciados de liquidez causados por órdenes institucionales a mercado, y cómo el algoritmo bursátil regresa a rellenarlos.',
        isKeyConcept: true,
      },
      {
        title: 'Piscinas de Liquidez (BSL & SSL)',
        description: 'Identificación de dobles techos y dobles suelos como zonas donde el público minorista pone sus Stop Loss, listas para ser barridas.',
      },
      {
        title: 'Killzones de Londres & New York',
        description: 'Horarios específicos (London Open 02:00-05:00 EST / New York Open 07:00-10:00 EST) donde se concentra el 80% del volumen mundial.',
      },
    ],
    deliverables: [
      'Mapa de liquidez diario identificando BSL, SSL y FVGs activos',
      'Estrategia de entrada de alta probabilidad: Toma de liquidez + CHoCH + FVG Retest',
      'Backtesting de 50 setups SMC con métricas de Sharpe Ratio y R:R documentadas',
    ],
    recommendedBooks: [
      {
        title: 'Manual de Trading Institucional Al-Hadiqa',
        category: 'Trading Institucional',
        libraryRef: '#biblioteca',
      },
      {
        title: 'Smart Money Concepts: La Guía Maestra',
        category: 'Trading Institucional',
        libraryRef: '#biblioteca',
      },
    ],
    actionTarget: '#trading-plataforma-completa',
    actionLabel: 'Ver Simulador Institucional',
    practicalTask: 'Identifica un Fair Value Gap no mitigado en el gráfico de Oro (XAU/USD) en 15m y programa una alerta de precio en TradingView.',
  },
  {
    id: 'm5-elite-scalping',
    stepNumber: '05',
    phaseTitle: 'Scalping de Alta Precisión & Fondeo Institucional',
    levelBadge: 'Elite · Semanas 9+',
    levelCategory: 'elite',
    duration: 'Semanas 9+',
    icon: '⚡',
    tagline: 'Operativa en 1m/5m, consistencia profesional y aprobación de cuentas fondeadas',
    summary:
      'La cúspide de la formación en AL-HADIQA INVEST. Operativa en vivo con Sr.smith, afinación de entradas con Stop Loss milimétricos (3-5 pips) y superación de fases de evaluación de cuentas fondeadas.',
    syllabus: [
      {
        title: 'Scalping Institucional en 1m y 3m',
        description: 'Entradas con confirmación de segundo nivel tras barrida de liquidez, maximizando el ratio a 1:5 o 1:10 con mínima exposición temporal.',
        isKeyConcept: true,
      },
      {
        title: 'Protocolo de Cuentas Fondeadas (Prop Firms)',
        description: 'Estrategia matemática para superar retos de $50k a $200k respetando los límites de pérdida diaria (4%) y drawdown máximo (8-10%).',
        isKeyConcept: true,
      },
      {
        title: 'Operativa en Vivo con la Sala de Clases',
        description: 'Transmisión interactiva en tiempo real durante la apertura de Wall Street con análisis contextualizado y retroalimentación directa.',
      },
      {
        title: 'Auditoría & Transición a Capital Real',
        description: 'Mantenimiento de drawdown bajo, retiros periódicos y reinversión según el modelo de riqueza integral de AL-HADIQA INVEST.',
      },
    ],
    deliverables: [
      'Plan de Trading Institucional impreso y firmado por el alumno',
      'Registro de consistencia de 30 días con curva de capital positiva',
      'Simulación de examen de fondeo aprobada sin violar reglas de riesgo',
    ],
    recommendedBooks: [
      {
        title: 'Protocolo de Evaluación para Cuentas Fondeadas',
        category: 'Scalping',
        libraryRef: '#biblioteca',
      },
      {
        title: 'Estrategias de Scalping Institucional en Minuto 1',
        category: 'Scalping',
        libraryRef: '#biblioteca',
      },
    ],
    actionTarget: '#clases-en-vivo',
    actionLabel: 'Ingresar a la Masterclass en Directo',
    practicalTask: 'Diseña tu plan de fondeo indicando: activo principal, horario exacto de trading, riesgo fijo por operación (ej. 0.5%) y objetivo de beneficio semanal.',
  },
];

export const Roadmap: React.FC = () => {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('m1-onboarding');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('alhadiqa_roadmap_progress');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { 'm1-onboarding': true };
  });

  const [activeTab, setActiveTab] = useState<'syllabus' | 'deliverables' | 'books' | 'task'>('syllabus');

  // Guardar progreso en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('alhadiqa_roadmap_progress', JSON.stringify(completedMilestones));
    } catch {
      // fallback
    }
  }, [completedMilestones]);

  const toggleMilestoneComplete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectedMilestone = MILESTONES.find((m) => m.id === selectedMilestoneId) || MILESTONES[0];

  const totalSteps = MILESTONES.length;
  const completedCount = Object.values(completedMilestones).filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  const getReadinessLevel = (pct: number) => {
    if (pct >= 100) return { title: 'Trader Institucional Acreditado', color: '#fbbf24', icon: '👑' };
    if (pct >= 80) return { title: 'Operador Smart Money Avanzado', color: '#10b981', icon: '🦁' };
    if (pct >= 60) return { title: 'Estratega de Capital & Psicotrading', color: '#38bdf8', icon: '🏛️' };
    if (pct >= 40) return { title: 'Analista de Estructura de Mercado', color: '#a78bfa', icon: '📊' };
    if (pct >= 20) return { title: 'Iniciado en Fundamentos Bursátiles', color: '#f59e0b', icon: '🛡️' };
    return { title: 'Onboarding Inicial Requerido', color: '#94a3b8', icon: '🌱' };
  };

  const readiness = getReadinessLevel(progressPercentage);

  const filteredMilestones = MILESTONES.filter((m) => {
    if (activeCategoryFilter === 'all') return true;
    if (activeCategoryFilter === 'early') return m.levelCategory === 'onboarding' || m.levelCategory === 'fundamentals';
    if (activeCategoryFilter === 'capital') return m.levelCategory === 'psychology';
    if (activeCategoryFilter === 'advanced') return m.levelCategory === 'institutional' || m.levelCategory === 'elite';
    return true;
  });

  return (
    <section className="section section--alt roadmap-section" id="roadmap">
      {/* Resplandor ambiental coherente con el mármol y oro */}
      <div className="glow glow--gold" style={{ top: '10%', left: '50%', transform: 'translateX(-50%)', opacity: 0.12 }} aria-hidden="true"></div>
      <div className="glow glow--amber" style={{ bottom: '5%', right: '5%', opacity: 0.1 }} aria-hidden="true"></div>

      <div className="wrap">
        {/* Encabezado Editorial de Sección */}
        <div className="section-head" style={{ maxWidth: '780px', margin: '0 auto 2.5rem auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🧭</span>
            <p className="eyebrow" style={{ marginBottom: 0 }}>Ruta de Formación Bursátil · De 0 a Institucional</p>
          </div>
          <h2 className="h-section" style={{ textWrap: 'balance' }}>
            Roadmap del Alumno: <span className="gradient-text">Del Onboarding al Trading Institucional</span>
          </h2>
          <p style={{ color: 'var(--muted)', marginTop: '0.85rem', fontSize: '1.02rem', lineHeight: '1.7' }}>
            Una metodología progresiva de 5 hitos estructurados. Cada paso consolida habilidades críticas: desde la configuración segura de tu entorno hasta la lectura institucional de liquidez y preparación para cuentas de fondeo.
          </p>
        </div>

        {/* Barra de Progreso Personal del Alumno & Nivel de Preparación */}
        <div className="roadmap-readiness-panel">
          <div className="readiness-info">
            <div className="readiness-header">
              <span className="readiness-badge" style={{ borderColor: readiness.color, color: readiness.color }}>
                <span>{readiness.icon}</span>
                <span>{readiness.title}</span>
              </span>
              <div className="readiness-stats">
                <span className="readiness-metric">
                  <strong>{completedCount}</strong> de <strong>{totalSteps}</strong> hitos completados
                </span>
                <span className="readiness-percentage" style={{ color: 'var(--gold)' }}>
                  {progressPercentage}% Preparación
                </span>
              </div>
            </div>

            {/* Barra de progreso visual con gradiente dorado */}
            <div className="readiness-track" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="readiness-fill"
                style={{
                  width: `${progressPercentage}%`,
                  background: 'linear-gradient(90deg, #d97706, #fbbf24, #fde68a)',
                  boxShadow: '0 0 16px rgba(251, 191, 36, 0.45)',
                }}
              ></div>
            </div>
          </div>

          {/* Filtros rápidos por etapa */}
          <div className="roadmap-filter-tabs" role="tablist" aria-label="Filtrar etapas del Roadmap">
            <button
              type="button"
              className={`filter-tab ${activeCategoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('all')}
              role="tab"
              aria-selected={activeCategoryFilter === 'all'}
            >
              Todos los Hitos (05)
            </button>
            <button
              type="button"
              className={`filter-tab ${activeCategoryFilter === 'early' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('early')}
              role="tab"
              aria-selected={activeCategoryFilter === 'early'}
            >
              Fase 1: Onboarding &amp; Estructura
            </button>
            <button
              type="button"
              className={`filter-tab ${activeCategoryFilter === 'capital' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('capital')}
              role="tab"
              aria-selected={activeCategoryFilter === 'capital'}
            >
              Fase 2: Psicotrading &amp; Capital
            </button>
            <button
              type="button"
              className={`filter-tab ${activeCategoryFilter === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('advanced')}
              role="tab"
              aria-selected={activeCategoryFilter === 'advanced'}
            >
              Fase 3: Smart Money &amp; Scalping
            </button>
          </div>
        </div>

        {/* Stepper / Timeline de Hitos Clickeables */}
        <div className="roadmap-stepper-container">
          <div className="roadmap-stepper-track" aria-hidden="true"></div>

          <div className="roadmap-milestones-grid">
            {filteredMilestones.map((milestone) => {
              const isSelected = milestone.id === selectedMilestoneId;
              const isCompleted = !!completedMilestones[milestone.id];

              return (
                <div
                  key={milestone.id}
                  className={`roadmap-milestone-card ${isSelected ? 'is-selected' : ''} ${isCompleted ? 'is-completed' : ''}`}
                  onClick={() => setSelectedMilestoneId(milestone.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedMilestoneId(milestone.id);
                    }
                  }}
                  aria-label={`Hito ${milestone.stepNumber}: ${milestone.phaseTitle}`}
                >
                  {/* Conector circular con número e icono */}
                  <div className="milestone-node">
                    <span className="milestone-number">{milestone.stepNumber}</span>
                    {isCompleted && <span className="milestone-check-badge" title="Hito completado">✓</span>}
                  </div>

                  <div className="milestone-card-body">
                    <div className="milestone-meta">
                      <span className="milestone-level-badge">{milestone.levelBadge}</span>
                      <span className="milestone-duration">{milestone.duration}</span>
                    </div>

                    <div className="milestone-header">
                      <span className="milestone-icon">{milestone.icon}</span>
                      <h3 className="milestone-title">{milestone.phaseTitle}</h3>
                    </div>

                    <p className="milestone-tagline">{milestone.tagline}</p>

                    <div className="milestone-hover-reveal">
                      <span className="milestone-explore-cta">
                        {isSelected ? 'Explorando detalles ↓' : 'Click para ver temario & ejercicios →'}
                      </span>
                    </div>

                    {/* Botón de marcar completado */}
                    <div className="milestone-status-toggle">
                      <button
                        type="button"
                        className={`status-pill ${isCompleted ? 'status-pill--completed' : ''}`}
                        onClick={(e) => toggleMilestoneComplete(milestone.id, e)}
                        title={isCompleted ? 'Marcar como pendiente' : 'Marcar hito como completado'}
                      >
                        {isCompleted ? '✓ Hito Dominado' : '○ Marcar como completado'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Interactivo de Inmersión Profunda (Stage Deep-Dive) */}
        {selectedMilestone && (
          <div className="roadmap-deepdive-panel">
            <div className="deepdive-header">
              <div className="deepdive-header-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className="deepdive-step-badge">Paso {selectedMilestone.stepNumber}</span>
                  <span className="deepdive-phase-badge">{selectedMilestone.levelBadge}</span>
                </div>
                <h3 className="deepdive-title">
                  <span style={{ marginRight: '8px' }}>{selectedMilestone.icon}</span>
                  {selectedMilestone.phaseTitle}
                </h3>
                <p className="deepdive-tagline">«{selectedMilestone.tagline}»</p>
              </div>

              <div className="deepdive-header-actions">
                <button
                  type="button"
                  className={`btn ${completedMilestones[selectedMilestone.id] ? 'btn--ghost' : ''}`}
                  onClick={() => toggleMilestoneComplete(selectedMilestone.id)}
                  style={{
                    padding: '0.55rem 1.15rem',
                    fontSize: '0.84rem',
                    borderColor: completedMilestones[selectedMilestone.id] ? 'var(--emerald)' : 'var(--gold)',
                    color: completedMilestones[selectedMilestone.id] ? 'var(--emerald)' : 'var(--ink)',
                    background: completedMilestones[selectedMilestone.id] ? 'transparent' : 'var(--gold)',
                  }}
                >
                  {completedMilestones[selectedMilestone.id] ? '✓ Paso Dominado' : 'Marcar Paso como Completado'}
                </button>
                <a
                  href={selectedMilestone.actionTarget}
                  className="btn btn--ghost"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem' }}
                >
                  {selectedMilestone.actionLabel} &rarr;
                </a>
              </div>
            </div>

            {/* Resumen Ejecutivo */}
            <div className="deepdive-summary-card">
              <p>{selectedMilestone.summary}</p>
            </div>

            {/* Pestañas de Detalle */}
            <div className="deepdive-tabs" role="tablist">
              <button
                type="button"
                className={`deepdive-tab ${activeTab === 'syllabus' ? 'active' : ''}`}
                onClick={() => setActiveTab('syllabus')}
                role="tab"
                aria-selected={activeTab === 'syllabus'}
              >
                📖 Temario &amp; Conceptos Clave ({selectedMilestone.syllabus.length})
              </button>
              <button
                type="button"
                className={`deepdive-tab ${activeTab === 'deliverables' ? 'active' : ''}`}
                onClick={() => setActiveTab('deliverables')}
                role="tab"
                aria-selected={activeTab === 'deliverables'}
              >
                🎯 Entregables &amp; Competencias ({selectedMilestone.deliverables.length})
              </button>
              <button
                type="button"
                className={`deepdive-tab ${activeTab === 'books' ? 'active' : ''}`}
                onClick={() => setActiveTab('books')}
                role="tab"
                aria-selected={activeTab === 'books'}
              >
                📚 Bibliografía &amp; Manuales ({selectedMilestone.recommendedBooks.length})
              </button>
              <button
                type="button"
                className={`deepdive-tab ${activeTab === 'task' ? 'active' : ''}`}
                onClick={() => setActiveTab('task')}
                role="tab"
                aria-selected={activeTab === 'task'}
              >
                ⚡ Desafío Práctico de Validación
              </button>
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div className="deepdive-tab-content">
              {activeTab === 'syllabus' && (
                <div className="syllabus-grid">
                  {selectedMilestone.syllabus.map((topic, idx) => (
                    <div key={idx} className={`syllabus-item ${topic.isKeyConcept ? 'is-key-concept' : ''}`}>
                      <div className="syllabus-item-header">
                        <span className="syllabus-number">0{idx + 1}</span>
                        <h4 className="syllabus-title">{topic.title}</h4>
                        {topic.isKeyConcept && <span className="key-concept-tag">★ Concepto Clave</span>}
                      </div>
                      <p className="syllabus-desc">{topic.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'deliverables' && (
                <div className="deliverables-list">
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Para considerar este hito oficialmente superado, el alumno debe verificar las siguientes evidencias prácticas:
                  </p>
                  <ul className="checklist">
                    {selectedMilestone.deliverables.map((item, idx) => (
                      <li key={idx} style={{ color: '#e2e8f0', fontSize: '0.92rem' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'books' && (
                <div className="recommended-books-grid">
                  {selectedMilestone.recommendedBooks.map((book, idx) => (
                    <div key={idx} className="roadmap-book-card">
                      <div className="roadmap-book-icon">📖</div>
                      <div className="roadmap-book-info">
                        <span className="roadmap-book-cat">{book.category}</span>
                        <h5 className="roadmap-book-title">{book.title}</h5>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0.3rem 0 0.6rem 0' }}>
                          Disponible en la Biblioteca oficial de AL-HADIQA INVEST sujeta a permisos concedidos por el Administrador.
                        </p>
                        <a href={book.libraryRef} className="roadmap-book-link">
                          Solicitar lectura en Biblioteca &rarr;
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'task' && (
                <div className="practical-task-box">
                  <div className="practical-task-header">
                    <span className="task-badge">Misión Operativa Obligatoria</span>
                    <span className="task-review">Evaluación por Sr.smith / Comunidad</span>
                  </div>
                  <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: '0.65rem 0' }}>
                    Desafío de Consolidación del Paso {selectedMilestone.stepNumber}
                  </h4>
                  <p style={{ color: '#fde68a', fontSize: '0.96rem', lineHeight: '1.6', background: 'rgba(251, 191, 36, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                    {selectedMilestone.practicalTask}
                  </p>
                  <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <a href="#comunidad-chat" className="btn btn--ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                      💬 Publicar en Sala de Análisis
                    </a>
                    <a href="#clases-en-vivo" className="btn btn--ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                      🎥 Preguntar en Clase en Directo
                    </a>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      ✓ Todos los análisis son revisados respetando las pautas de riesgo y sin ofrecer asesoría financiera.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Aviso de Cumplimiento JustMarkets */}
            <div className="roadmap-compliance-footer">
              <span>⚖️ <strong>Aviso JustMarkets:</strong> Este roadmap constituye una guía formativa de autodesarrollo analítico. El trading de activos financieros conlleva riesgo y no garantiza rentabilidad futura. Las clases son impartidas por un socio independiente.</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
export default Roadmap;
