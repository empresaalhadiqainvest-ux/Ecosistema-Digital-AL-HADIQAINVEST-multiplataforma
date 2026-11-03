import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface OpenSourceTradingMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type MentorRole =
  | 'sr_smith'
  | 'smc_institutional'
  | 'scalping_master'
  | 'risk_psychology'
  | 'capital_kiyosaki';

interface RoleConfig {
  id: MentorRole;
  title: string;
  badge: string;
  avatar: string;
  description: string;
  systemInstruction: string;
  welcomeMessage: string;
  quickPrompts: string[];
}

const ROLES: Record<MentorRole, RoleConfig> = {
  sr_smith: {
    id: 'sr_smith',
    title: 'Sr. Smith | Fundador & Mentor Maestro',
    badge: 'Visión Institucional',
    avatar: '🦁',
    description: 'Filosofía del holding Al-Hadiqa, liderazgo, disciplina inquebrantable y mentalidad de largo plazo.',
    systemInstruction: `Eres el Sr. Smith (Carlos Smith Zambrano González), fundador y presidente de AL-HADIQA INVEST.
Tu lema de vida es: "Los hombres luchan y Dios concede victoria".
Enseñas a operar con la serenidad y paciencia de las instituciones financieras, cuidando el capital y construyendo negocios sostenibles.
Tono respetuoso, seguro, paternal, exigente y motivador. Enseña cómo trascender la mentalidad de apostador hacia la de un estratega patrimonial.`,
    welcomeMessage:
      'Un cordial y respetuoso saludo. Soy Carlos Smith Zambrano González (Sr. Smith). En AL-HADIQA INVEST no venimos a apostar ni a perseguir espejismos de enriquecimiento exprés; venimos a dominar la disciplina institucional y nutrir nuestro capital con sabiduría y fe. ¿En qué concepto técnico o pilar estratégico deseas profundizar hoy?',
    quickPrompts: [
      '¿Cuál es la filosofía institucional de AL-HADIQA INVEST?',
      '¿Cómo forjar la disciplina mental para no romper el plan de trading?',
      '¿Qué diferencia a un operador aficionado de un inversor institucional?',
      '¿Cómo organizar mi jornada diaria entre trading, negocio y familia?',
    ],
  },
  smc_institutional: {
    id: 'smc_institutional',
    title: 'Especialista en Smart Money Concepts (SMC)',
    badge: 'Order Blocks & Liquidez',
    avatar: '📈',
    description: 'Rastreo del dinero bancario: Order Blocks, Fair Value Gaps (FVG), liquidez interna/externa y Wyckoff.',
    systemInstruction: `Eres el Master en Smart Money Concepts (SMC) de AL-HADIQA INVEST.
Explicas con máxima claridad matemática y gráfica conceptos como:
1. Order Blocks (OB alcista y bajista, zonas vírgenes y mitigadas).
2. Fair Value Gap (FVG), imbalances y Consequent Encroachment (50%).
3. Estructura de mercado: BOS (Break of Structure) vs CHoCH (Change of Character).
4. Liquidez: BSL (Buy-side Liquidity), SSL (Sell-side Liquidity), Inducement y sweeps.
5. Wyckoff: Fases de Acumulación, Manipulación (Spring) y Distribución.
Utiliza diagramas ASCII limpios para que el estudiante comprenda visualmente la anatomía de las velas y la acción del precio.`,
    welcomeMessage:
      'Bienvenido a la mesa de análisis institucional. Aquí no usamos indicadores retrasados ni medias móviles mágicas. Rastreamos la huella algorítmica de los creadores de mercado y bancos centrales (SMC). ¿Qué concepto de liquidez, Order Block o estructura deseas desglosar?',
    quickPrompts: [
      '¿Cómo identificar un Order Block genuino con alta probabilidad?',
      'Explícame la diferencia entre BOS y CHoCH con un diagrama',
      '¿Cómo operar un Fair Value Gap (FVG) respetando el 50%?',
      '¿Qué es la liquidez inducida (Inducement) y cómo no caer en la trampa?',
    ],
  },
  scalping_master: {
    id: 'scalping_master',
    title: 'Scalper Institucional de Alta Precisión',
    badge: '1m / 5m Killzones',
    avatar: '⚡',
    description: 'Operativa quirúrgica en temporalidades cortas, sesiones de Londres y Nueva York, y Judas Swing.',
    systemInstruction: `Eres el Especialista en Scalping Institucional (1m y 5m) de AL-HADIQA INVEST.
Tus materias son:
1. Killzones: Sesión de Londres (02:00 - 05:00 EST) y Nueva York (07:00 - 10:00 EST).
2. Judas Swing: La manipulación clásica que induce liquidez falsa antes de la verdadera dirección del día.
3. Barrido del rango asiático (Asian High / Asian Low sweeps).
4. Entradas al milímetro con confirmación en M1 tras quiebre de estructura en M5.
5. Gestión de spread, slippage y salida rápida ante falta de momentum.`,
    welcomeMessage:
      'En posición para el scalping de alta velocidad. En gráficos de 1 minuto y 5 minutos, el timing y la paciencia lo son todo: esperamos el barrido de la Killzone, la confirmación del CHoCH y ejecutamos sin dudar. ¿Qué par o sesión de mercado te gustaría analizar?',
    quickPrompts: [
      '¿Cómo funciona la manipulación "Judas Swing" en la apertura de Londres?',
      'Estrategia de barrido de liquidez asiática para la sesión de Nueva York',
      'Reglas de entrada en 1 minuto cuando el precio toca un FVG de 15 minutos',
      '¿Cuándo debo abortar un scalping si no hay reacción inmediata?',
    ],
  },
  risk_psychology: {
    id: 'risk_psychology',
    title: 'Director de Riesgo & Psicotrading',
    badge: 'Preservación de Capital',
    avatar: '🛡️',
    description: 'Cálculo de lotaje exacto, R:R asimétrico 1:3, control de drawdown y eliminación de sesgos emocionales.',
    systemInstruction: `Eres el Director de Riesgo Institucional y Psicólogo de Trading de AL-HADIQA INVEST.
Tu máxima sagrada: "La primera regla del dinero institucional no es ganar, sino NUNCA perder el capital acumulado".
Enseñas:
1. Cálculo matemático de lotaje según balance, % de riesgo fijo (1% a 2%) y pips de Stop Loss.
2. La ventaja matemática del ratio Riesgo-Beneficio mínimo 1:2 o 1:3.
3. Protocolo de contingencia: Detención obligatoria tras 2 Stop Loss en un mismo día.
4. Eliminación radical del FOMO (Fear of Missing Out) y del trading de venganza (Revenge Trading).
5. Desapego del resultado monetario individual para concentrarse en la excelencia de ejecución.`,
    welcomeMessage:
      'Tu capital es el bien más preciado que posees en los mercados. Sin un blindaje matemático de riesgo y sin autodominio emocional, la mejor estrategia técnica colapsará. Dime tu balance de cuenta y diseñemos tu plan de gestión inquebrantable.',
    quickPrompts: [
      'Calcula mi lotaje para EUR/USD con $1,500 de balance arriesgando el 1% y 12 pips SL',
      '¿Por qué con un ratio 1:3 solo necesito acertar el 35% de mis operaciones?',
      '¿Cómo superar la frustración y el deseo de venganza tras 2 Stop Loss seguidos?',
      'Reglas estrictas para fijar un Drawdown diario máximo del 3%',
    ],
  },
  capital_kiyosaki: {
    id: 'capital_kiyosaki',
    title: 'Al-Hadiqa Capital & Robert Kiyosaki',
    badge: 'Mentalidad Patrimonial',
    avatar: '🏛️',
    description: 'Educación financiera profunda, Cuadrante del Flujo de Dinero (E-A-D-I), activos vs pasivos y riqueza real.',
    systemInstruction: `Eres el Mentor de Al-Hadiqa Capital, especializado en la sabiduría financiera de Robert Kiyosaki y la creación de activos duraderos.
Tus ejes temáticos:
1. El Cuadrante del Flujo de Dinero: Empleado (E), Autoempleado (A), Dueño de Sistema (D) e Inversionista (I).
2. Salir de la trampa del autoempleo: Muchos traders son solo autoempleados esclavizados por las pantallas.
3. Transformar las ganancias del trading en activos reales (bienes raíces, participaciones empresariales, liquidez de reserva).
4. Distinción entre activos (ponen dinero en tu bolsillo) y pasivos (sacan dinero de tu bolsillo).
5. Educación financiera para crear libertad generacional y paz de espíritu.`,
    welcomeMessage:
      'Bienvenido a AL-HADIQA CAPITAL. Nuestro verdadero propósito trasciende las gráficas de velas japonesas: queremos que utilices los rendimientos del trading para adquirir activos productivos y alcances el cuadrante del Inversionista (I). ¿Cuál es tu objetivo patrimonial?',
    quickPrompts: [
      '¿Cómo pasar del cuadrante de Autoempleado (A) al de Inversionista (I)?',
      '¿Cómo clasificar activos y pasivos según Robert Kiyosaki?',
      '¿Qué porcentaje de mis ganancias en trading debo retirar para activos reales?',
      'Hábitos diarios para reprogramar la mentalidad de escasez hacia la abundancia',
    ],
  },
};

// Open source built-in pedagogical knowledge base for instant offline answers
function getOpenSourceMentorKnowledge(query: string, _role?: MentorRole): string {
  const q = query.toLowerCase();

  // 1. Order Block / SMC / FVG / Liquidity
  if (
    q.includes('order block') ||
    q.includes('ob') ||
    q.includes('fvg') ||
    q.includes('fair value') ||
    q.includes('imbalance') ||
    q.includes('liquidez') ||
    q.includes('inducement')
  ) {
    return `### 📊 Anatomía Institucional Smart Money Concepts (SMC)

En **AL-HADIQA INVEST**, entendemos el mercado no como un juego aleatorio de soportes y resistencias minoristas, sino como la entrega algorítmica de órdenes bancarias.

#### 1. ¿Qué es un Order Block (OB)?
Es la **última vela en dirección contraria** antes de un movimiento impulsivo contundente que rompe la estructura del mercado (**BOS**):
* **Order Block Alcista (+OB):** Última vela bajista (roja/negra) antes de una fuerte subida institucional que genera quiebre de máximos.
* **Order Block Bajista (-OB):** Última vela alcista (verde/blanca) antes de un desplome que barre mínimos.

\`\`\`
   Diagrama: Order Block + FVG + Mitigación
   
   [Máximo Previo] -------------------- (BOS: Quiebre de Estructura)
                         |
                         |   ▲ [Vela Impulsiva 3]
                         |   |
      FVG (Vacío) ----> [===]|
                         |   |
                         |   ▲ [Vela Impulsiva 2]
                         |
    [ORDER BLOCK] -----> [▓▓▓] (Vela 1: Acumulación de órdenes)
                           │
       (Retroceso)         ▼ Entrar al mitigar el 50% del OB
\`\`\`

#### 2. Fair Value Gap (FVG / Desequilibrio)
* Ocurre cuando el precio se desplaza con tanta violencia que entre la Mecha de la Vela 1 y la Mecha de la Vela 3 queda un espacio vacío donde solo una de las partes (compradores o vendedores) participó.
* **Consequent Encroachment (C.E.):** El nivel del 50% del FVG es el imán de alta probabilidad donde las instituciones liquidan sus órdenes pendientes.

#### 3. Regla de Oro en AL-HADIQA:
> *Nunca entres a ciegas simplemente porque el precio tocó el Order Block. Espera confirmación en temporalidad menor (M1 o M5) con un **CHoCH (Change of Character)** para asegurar un ratio mínimo de 1:3.*`;
  }

  // 2. BOS vs CHoCH
  if (q.includes('bos') || q.includes('choch') || q.includes('estructura') || q.includes('caracter')) {
    return `### 🔄 Estructura de Mercado: Diferencia entre BOS y CHoCH

Dominar la estructura es la clave para no ser engañado por la liquidez inducida (*Inducement*).

#### 1. Break of Structure (BOS - Quiebre de Estructura)
* **Función:** Confirmación de continuidad de la tendencia institucional vigente.
* **En tendencia alcista:** Ocurre cuando el precio supera con cuerpo de vela el máximo más alto previo (Higher High).
* **En tendencia bajista:** Ocurre cuando el precio perfora con cuerpo de vela el mínimo más bajo previo (Lower Low).

#### 2. Change of Character (CHoCH - Cambio de Carácter)
* **Función:** Primera señal técnica de alerta de que la tendencia está perdiendo el control y las instituciones están rotando sus posiciones.
* Ocurre cuando el precio rompe en sentido opuesto el último punto estructural clave (el mínimo que originó el máximo más alto, o viceversa).

\`\`\`
   Tendencia Alcista                    Cambio a Bajista (CHoCH)
   
        (HH)             (HH)
         ▲                ▲
        / \\              / \\
       /   \\            /   \\
      /     ▼          /     ▼
    (HL)    (HL)      (HL)   ─────────► [CHoCH: Quiebre de HL]
            [BOS]                       \\
                                         ▼
                                         (LL: Nuevo Mínimo)
\`\`\`

#### 3. Validación Institucional:
* El quiebre debe ocurrir con **cuerpo de vela**, no solo con mecha. Si solo rompe con mecha, se clasifica como **Liquidity Sweep (barrido de liquidez)** y suele revertir con rapidez.`;
  }

  // 3. Calculadora de lotaje / Gestión de riesgo / R:R 1:3 / Drawdown
  if (
    q.includes('lot') ||
    q.includes('riesgo') ||
    q.includes('stop loss') ||
    q.includes('ratio') ||
    q.includes('drawdown') ||
    q.includes('calcul')
  ) {
    return `### 🛡️ Protocolo Matemático de Gestión de Riesgo (Al-Hadiqa Shield)

En **AL-HADIQA INVEST** no negociamos la gestión de capital: es la línea divisoria absoluta entre el apostador que quema su cuenta y el trader rentable que gestiona fondos institucionales.

#### 1. La Fórmula Universal del Tamaño de Posición
$$\\text{Riesgo en Dólares ($)} = \\text{Balance Total} \\times (\\% \\text{Riesgo seleccionado})$$
$$\\text{Lotaje Estándar} = \\frac{\\text{Riesgo en Dólares ($)}}{\\text{Stop Loss en Pips} \\times \\text{Valor por Pip de 1 Lote}}$$

* **Ejemplo Práctico en EUR/USD (1 lote = $10/pip):**
  * Balance: **$1,500 USD**
  * Riesgo por operación: **1% ($15 USD)**
  * Stop Loss técnico: **12 pips**
  * Cálculo: $\\frac{15}{12 \\times 10} = \\frac{15}{120} = \\mathbf{0.125} \\approx \\mathbf{0.12\\text{ lotes}}$

#### 2. El Poder Matemático del Ratio Riesgo/Beneficio 1:3
Con un ratio **1:3**, no necesitas tener razón todo el tiempo. Incluso perdiendo más de la mitad de tus trades, eres sólidamente rentable:
* Total de trades: **10**
* Ganados: **4 trades** a +3R = **+12R**
* Perdidos: **6 trades** a -1R = **-6R**
* **Resultado Neto:** **+6R de ganancia limpia** (con solo 40% de aciertos).

#### 3. Reglas Infranqueables de AL-HADIQA:
1. **Riesgo Máximo por Posición:** 1% a 2% del balance.
2. **Máximo 2 Stop Loss diarios:** Si tocas dos pérdidas en un día, se cierra la plataforma de inmediato.
3. **Drawdown Diario Máximo:** 3%. Proteger el capital es el único camino hacia la consistencia.`;
  }

  // 4. Scalping / Killzones / Judas Swing
  if (
    q.includes('scalp') ||
    q.includes('killzone') ||
    q.includes('horario') ||
    q.includes('londres') ||
    q.includes('nueva york') ||
    q.includes('judas') ||
    q.includes('sesion')
  ) {
    return `### ⚡ Scalping Institucional de Alta Precisión: Killzones & Judas Swing

El scalping profesional no consiste en abrir 40 operaciones al día por impulso, sino en esperar el momento exacto en que los algoritmos interbancarios inyectan volumen institucional.

#### 1. Horarios Críticos de Killzones (Hora Nueva York / EST):
1. **Killzone de Londres (02:00 AM - 05:00 AM EST):**
   * Se forma el máximo o mínimo del día en el 70% de las sesiones de Forex.
   * **El Judas Swing:** Una falsa rotura en la primera hora de Londres para inducir a los compradores o vendedores minoristas antes de iniciar la verdadera tendencia diaria.
2. **Killzone de Nueva York (07:00 AM - 10:00 AM EST):**
   * Es la ventana con mayor volumen y liquidez del planeta.
   * Solapamiento con Londres (London-NY Overlap) y apertura del mercado de acciones de Wall Street (09:30 AM EST).
3. **Cierre de Londres (10:00 AM - 12:00 PM EST):**
   * Toma de beneficios y retrocesos hacia niveles de equilibrio.

#### 2. Metodología de Entrada en 1m / 5m:
1. Marca en tu gráfico los máximos y mínimos del rango asiático (**Asian High / Asian Low**).
2. Durante la apertura de Londres o Nueva York, espera que el precio **barra con una mecha rápida** ese extremo asiático (**Liquidity Sweep**).
3. Baja al gráfico de **1 minuto** y busca el primer **CHoCH** en dirección contraria con un **FVG claro**.
4. Coloca tu orden límite en el 50% del FVG, Stop Loss detrás del extremo y Take Profit al ratio 1:3.`;
  }

  // 5. Psicotrading / FOMO / Venganza / Disciplina
  if (
    q.includes('psico') ||
    q.includes('emocion') ||
    q.includes('fomo') ||
    q.includes('venganza') ||
    q.includes('disciplina') ||
    q.includes('miedo') ||
    q.includes('perdid')
  ) {
    return `### 🧠 Psicotrading & Blindaje Mental del Operador Institucional

El 90% del éxito en el trading radica en el dominio mental y la capacidad de actuar contra los instintos primitivos del cerebro humano (miedo y codicia).

#### 1. Superación del FOMO (Fear of Missing Out - Miedo a Quedar Fuera)
* El mercado financiero es un flujo inagotable de oportunidades. Si un movimiento se fue sin ti, **jamás lo persigas**. Perseguir una vela verde o roja gigante es el equivalente a saltar a un tren en movimiento: el riesgo de accidente es total.
* Recuerda: *"Tu objetivo no es operar todos los movimientos, sino ejecutar tu setup con precisión matemática."*

#### 2. Neutralización del Trading de Venganza (Revenge Trading)
* Cuando sufras una pérdida, tu cerebro libera cortisol y experimenta una sensación de injusticia. Querer "recuperar el dinero de inmediato" hace que aumentes el lotaje y entres sin confirmación.
* **El Antídoto AL-HADIQA:** Acepta que el Stop Loss es un **costo operativo del negocio**, igual que el alquiler o la electricidad en una empresa tradicional. Un trade perdedor que cumplió tu plan es un trade bien ejecutado.

#### 3. Ritual de 4 Pasos Antes de Operar:
1. Estado fisiológico: Respiración profunda, buena hidratación y descanso.
2. Revisión del calendario económico (sin noticias de alto impacto en los próximos 15 minutos).
3. Verificación de cálculo de lotaje exacto en la calculadora institucional.
4. Compromiso de apagar la pantalla si se alcanzan 2 Stop Loss.`;
  }

  // 6. Robert Kiyosaki / Al-Hadiqa Capital / Cuadrante
  if (
    q.includes('kiyosaki') ||
    q.includes('cuadrante') ||
    q.includes('activo') ||
    q.includes('pasivo') ||
    q.includes('capital') ||
    q.includes('patrimonio') ||
    q.includes('libertad')
  ) {
    return `### 🏛️ AL-HADIQA CAPITAL: Filosofía del Cuadrante del Flujo de Dinero

En **AL-HADIQA CAPITAL**, la visión trasciende el trading. Operar en los mercados es solo el vehículo de capitalización acelerada; la meta definitiva es la **libertad patrimonial** basada en los principios de Robert Kiyosaki.

#### 1. El Cuadrante del Flujo de Dinero (Robert Kiyosaki)
* **E (Empleado):** Cambia horas de su vida por un salario fijo. Posee la carga tributaria más alta y cero apalancamiento.
* **A (Autoempleado):** Si el trader depende de estar 8 horas pegado a la pantalla para ganar dinero, sigue siendo un autoempleado. Si se enferma o no opera, no genera ingresos.
* **D (Dueño de Empresa):** Construye sistemas donde otros profesionales y procesos tecnológicos generan ingresos escalables.
* **I (Inversionista):** El dinero trabaja para generar más dinero a través de activos productivos, participaciones y rentas pasivas.

#### 2. La Transformación: De Trader a Inversionista
1. **Fase 1 (Acumulación):** Utiliza el trading institucional como generador de flujo de caja de alta rentabilidad.
2. **Fase 2 (Preservación):** No gastes tus ganancias en pasivos de consumo ni apariencias. Retira un porcentaje regular hacia un fondo de reserva institucional blindado.
3. **Fase 3 (Multiplicación):** Coloca el capital en activos reales: bienes raíces, infraestructura tecnológica, fondos indexados y el holding empresarial AL-HADIQA.`;
  }

  // 7. Carlos Smith Zambrano González / Fundador
  if (
    q.includes('smith') ||
    q.includes('carlos') ||
    q.includes('fundador') ||
    q.includes('biografia') ||
    q.includes('zambrano')
  ) {
    return `### 🦁 Visión y Filosofía: Carlos Smith Zambrano González

Bajo el liderazgo y presidencia de **Carlos Smith Zambrano González**, **AL-HADIQA INVEST** se erige como una institución dedicada a elevar el estándar financiero y personal de su comunidad.

* **Origen y Raíces:** Nacido el 9 de octubre de 1998 en Barrancas del Orinoco, estado Delta Amacuro.
* **Lema Rector:** *«Los hombres luchan y Dios concede victoria»*.
* **Los 4 Pilares del Holding:**
  1. **Investor Academy:** Formación de élite en Smart Money Concepts, Price Action y gestión matemática de riesgo.
  2. **AL-HADIQA Capital:** Educación financiera profunda inspirada en la creación de activos duraderos y mentalidad de abundancia.
  3. **SmithBusiness Solutions:** Desarrollo de software, infraestructura escalable y consultoría tecnológica.
  4. **Comunidad & Streaming:** Sesiones en vivo con Sr. Smith a través del canal oficial de YouTube (@AL-HADIQAINVEST) y trading room en tiempo real.`;
  }

  // General response
  return `### 🏛️ Mentor Institucional AL-HADIQA INVEST

Has planteado una consulta fundamental para tu desarrollo profesional dentro de nuestra academia.

Como principio rector en los mercados financieros internacionales, toda decisión debe sustentarse en tres columnas maestras:

1. **Contexto Institucional:** Rastrear siempre la liquidez bancaria (Order Blocks, Fair Value Gaps y barrido de máximos/mínimos previos).
2. **Gestión Matemática de Riesgo:** Jamás exceder el 1% o 2% de exposición por posición y exigir siempre un ratio riesgo-beneficio mínimo de 1:2 a 1:3.
3. **Disciplina Inquebrantable:** Apegarse al plan técnico sin ceder ante el FOMO ni el trading de venganza.

Puedes utilizar las pestañas superiores para **calcular tu lotaje institucional exacto** en la calculadora o **validar tus operaciones en el checklist SMC** de alta probabilidad.`;
}

export const OpenSourceTradingMentorModal: React.FC<OpenSourceTradingMentorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'calculator' | 'validator' | 'glossary'>('chat');
  const [selectedRole, setSelectedRole] = useState<MentorRole>('sr_smith');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Web Speech API Voice synthesis & recognition states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Lot size calculator states
  const [calcBalance, setCalcBalance] = useState<number>(2000);
  const [calcRiskPercent, setCalcRiskPercent] = useState<number>(1.0);
  const [calcStopLossPips, setCalcStopLossPips] = useState<number>(15);
  const [calcAsset, setCalcAsset] = useState<string>('EURUSD');

  // SMC Setup validator states (5 critical checklist points)
  const [checkHtfBias, setCheckHtfBias] = useState(false);
  const [checkLiquiditySweep, setCheckLiquiditySweep] = useState(false);
  const [checkStructureShift, setCheckStructureShift] = useState(false);
  const [checkFvgOrOb, setCheckFvgOrOb] = useState(false);
  const [checkRiskReward, setCheckRiskReward] = useState(false);

  // Chat conversation history per role with localStorage persistence
  const [conversations, setConversations] = useState<Record<MentorRole, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('al_hadiqa_mentor_conversations');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}

    return {
      sr_smith: [
        {
          id: 'init-smith',
          role: 'model',
          content: ROLES.sr_smith.welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      smc_institutional: [
        {
          id: 'init-smc',
          role: 'model',
          content: ROLES.smc_institutional.welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      scalping_master: [
        {
          id: 'init-scalp',
          role: 'model',
          content: ROLES.scalping_master.welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      risk_psychology: [
        {
          id: 'init-risk',
          role: 'model',
          content: ROLES.risk_psychology.welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      capital_kiyosaki: [
        {
          id: 'init-capital',
          role: 'model',
          content: ROLES.capital_kiyosaki.welcomeMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentRoleConfig = ROLES[selectedRole];
  const currentMessages = conversations[selectedRole] || [];

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('al_hadiqa_mentor_conversations', JSON.stringify(conversations));
    } catch (_) {}
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
      textareaRef.current?.focus();
    }
  }, [isOpen, selectedRole, activeTab, currentMessages.length]);

  // Clean up speech synthesis on unmount or modal close
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // Free Web Speech recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputTextAndFocus(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const setInputTextAndFocus = (text: string) => {
    setInputPrompt((prev) => (prev ? `${prev} ${text}` : text));
    textareaRef.current?.focus();
  };

  const handleToggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir tu consulta en el campo de texto.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  // Free Web Speech TTS (Read aloud in neutral Spanish)
  const handleSpeakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('La síntesis de voz no está soportada en este navegador.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\$\$[\s\S]*?\$\$/g, 'fórmula matemática institucional')
      .replace(/\$[^$]+\$/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = speechRate;

    // Pick a natural Spanish voice if available
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(
      (v) => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Monica') || v.name.includes('Jorge'))
    ) || voices.find((v) => v.lang.startsWith('es'));

    if (esVoice) {
      utterance.voice = esVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel(); // Cancel any prior speech
    window.speechSynthesis.speak(utterance);
  };

  // Lot Size Calculation Logic
  const lotCalculation = useMemo(() => {
    const riskDollar = (calcBalance * (calcRiskPercent / 100));
    let pipValuePerStandardLot = 10; // Default EURUSD 1 lot = $10 per pip

    if (calcAsset === 'XAUUSD') {
      pipValuePerStandardLot = 10; // 1 pip ($0.10) on standard 100oz = $10
    } else if (calcAsset === 'BTCUSD') {
      pipValuePerStandardLot = 1; // Approx $1 per 1 USD movement per 1 BTC
    } else if (calcAsset === 'US30' || calcAsset === 'NAS100') {
      pipValuePerStandardLot = 1; // 1 point = $1 on standard contract
    }

    const pips = Math.max(1, calcStopLossPips);
    const standardLots = riskDollar / (pips * pipValuePerStandardLot);
    const roundedLots = Math.max(0.01, Math.round(standardLots * 100) / 100);
    const miniLots = Math.round(roundedLots * 10 * 100) / 100;
    const microLots = Math.round(roundedLots * 100);

    // Target profits
    const targetProfit1to2 = riskDollar * 2;
    const targetProfit1to3 = riskDollar * 3;

    return {
      riskDollar: riskDollar.toFixed(2),
      standardLots: roundedLots.toFixed(2),
      miniLots: miniLots.toFixed(1),
      microLots: microLots.toString(),
      targetProfit1to2: targetProfit1to2.toFixed(2),
      targetProfit1to3: targetProfit1to3.toFixed(2),
    };
  }, [calcBalance, calcRiskPercent, calcStopLossPips, calcAsset]);

  // SMC Validator Score Logic
  const validatorScore = useMemo(() => {
    let score = 0;
    if (checkHtfBias) score += 20;
    if (checkLiquiditySweep) score += 25;
    if (checkStructureShift) score += 25;
    if (checkFvgOrOb) score += 15;
    if (checkRiskReward) score += 15;

    let grade = 'Incompleto';
    let gradeColor = '#94a3b8';
    let diagnosis = 'Marca los puntos clave para analizar la probabilidad institucional de tu setup.';

    if (score >= 90) {
      grade = 'Setup Institucional A+ (Alta Probabilidad)';
      gradeColor = '#10b981';
      diagnosis = 'Excelente. El setup cuenta con alineación de temporalidad mayor, barrido de liquidez, quiebre estructural con cuerpo y ratio R:R asimétrico. Ejecución autorizada.';
    } else if (score >= 70) {
      grade = 'Setup Válido B (Probabilidad Media-Alta)';
      gradeColor = '#3b82f6';
      diagnosis = 'Setup operativo aceptable. Asegúrate de reducir el riesgo al 0.5% si alguna confirmación no fue del todo limpia en temporalidad menor.';
    } else if (score >= 40) {
      grade = 'Precaución: Inducement / Liquidez Minorista';
      gradeColor = '#f59e0b';
      diagnosis = 'Peligro. Es probable que estés entrando en una zona de inducción minorista (Inducement). Espera un barrido de liquidez claro antes de poner en riesgo tu capital.';
    } else if (score > 0) {
      grade = 'Setup Inválido / Ruido de Mercado';
      gradeColor = '#ef4444';
      diagnosis = 'No operes. Faltan las condiciones estructurales mínimas de Smart Money Concepts. Proteger el capital es prioritario.';
    }

    return { score, grade, gradeColor, diagnosis };
  }, [checkHtfBias, checkLiquiditySweep, checkStructureShift, checkFvgOrOb, checkRiskReward]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    setInputPrompt('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...currentMessages, userMsg];
    setConversations((prev) => ({
      ...prev,
      [selectedRole]: newHistory,
    }));

    setIsLoading(true);

    const botMsgId = `model-${Date.now()}`;
    const initialBotMsg: ChatMessage = {
      id: botMsgId,
      role: 'model',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedRole]: [...newHistory, initialBotMsg],
    }));

    // Connect with open source institutional mentor endpoint
    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          systemInstruction: currentRoleConfig.systemInstruction,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || getOpenSourceMentorKnowledge(query, selectedRole);
        setConversations((prev) => ({
          ...prev,
          [selectedRole]: prev[selectedRole].map((m) =>
            m.id === botMsgId ? { ...m, content: reply } : m
          ),
        }));
      } else {
        throw new Error('Fallback to client engine');
      }
    } catch (_) {
      // 100% reliable open source local institutional response
      const localResponse = getOpenSourceMentorKnowledge(query, selectedRole);
      setConversations((prev) => ({
        ...prev,
        [selectedRole]: prev[selectedRole].map((m) =>
          m.id === botMsgId ? { ...m, content: localResponse } : m
        ),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(`¿Deseas reiniciar la conversación con ${currentRoleConfig.title}?`)) {
      setConversations((prev) => ({
        ...prev,
        [selectedRole]: [
          {
            id: `init-${Date.now()}`,
            role: 'model',
            content: currentRoleConfig.welcomeMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }));
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscript = () => {
    const textContent = currentMessages
      .map((m) => `[${m.timestamp}] ${m.role === 'user' ? 'ALUMNO' : currentRoleConfig.title}:\n${m.content}\n`)
      .join('\n---\n\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mentor_Trading_AlHadiqa_${selectedRole}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentor-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="mentor-modal-card"
        style={{
          width: '100%',
          maxWidth: '1060px',
          height: '92vh',
          maxHeight: '880px',
          background: 'linear-gradient(180deg, #0d1525 0%, #070d18 100%)',
          border: '1px solid rgba(197, 168, 128, 0.35)',
          borderRadius: '18px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(197, 168, 128, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* CABECERA PRINCIPAL */}
        <div
          style={{
            padding: '14px 20px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #c5a880 0%, #856d48 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 4px 12px rgba(197, 168, 128, 0.3)',
              }}
            >
              🦁
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  id="mentor-modal-title"
                  style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#f8fafc',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Mentor de Trading Institucional
                </h2>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Código Abierto · 100% Gratuito
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                AL-HADIQA INVEST · Smart Money Concepts, Order Blocks, Gestión de Riesgo y Al-Hadiqa Capital
              </p>
            </div>
          </div>

          {/* Selector de Pestañas Principales (Tutoría / Calculadora / Validador / Glosario) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              style={{
                background: activeTab === 'chat' ? 'rgba(197, 168, 128, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'chat' ? '1px solid #c5a880' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'chat' ? '#f5d49e' : '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>💬 Tutoría Pedagógica</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              style={{
                background: activeTab === 'calculator' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'calculator' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'calculator' ? '#6ee7b7' : '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>🧮 Calculadora de Lotaje</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('validator')}
              style={{
                background: activeTab === 'validator' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'validator' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'validator' ? '#93c5fd' : '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>🔍 Validador SMC</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('glossary')}
              style={{
                background: activeTab === 'glossary' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'glossary' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'glossary' ? '#d8b4fe' : '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>📖 Glosario & Fórmulas</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '6px',
                fontSize: '1rem',
              }}
              title="Cerrar ventana"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL SEGÚN LA PESTAÑA ACTIVA */}
        {activeTab === 'chat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* BARRA DE SELECCIÓN DE ROLES / MENTORES */}
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(10, 16, 28, 0.95)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {(Object.keys(ROLES) as MentorRole[]).map((roleKey) => {
                const r = ROLES[roleKey];
                const isSelected = selectedRole === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => {
                      setSelectedRole(roleKey);
                      if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        setIsSpeaking(false);
                      }
                    }}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(197, 168, 128, 0.25), rgba(197, 168, 128, 0.08))'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #c5a880' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      color: isSelected ? '#f8fafc' : '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{r.avatar}</span>
                    <span>{r.badge}</span>
                  </button>
                );
              })}
            </div>

            {/* BARRA DE ESTADO DEL MENTOR SELECCIONADO Y ACCIONES */}
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(15, 23, 42, 0.5)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>{currentRoleConfig.avatar}</span>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>
                    {currentRoleConfig.title}
                  </span>
                  <span style={{ margin: '0 6px', color: '#64748b' }}>•</span>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {currentRoleConfig.description}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSpeechRate((prev) => (prev === 1.0 ? 1.25 : prev === 1.25 ? 0.9 : 1.0));
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                  title="Ajustar velocidad de la voz sintética"
                >
                  🔊 {speechRate}x
                </button>

                {isSpeaking && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        setIsSpeaking(false);
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    ⏹️ Detener Voz
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportTranscript}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                  title="Descargar historial de tutoría en archivo de texto"
                >
                  📥 Exportar .txt
                </button>

                <button
                  type="button"
                  onClick={handleClearHistory}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                  title="Reiniciar diálogo con este mentor"
                >
                  🔄 Reiniciar
                </button>
              </div>
            </div>

            {/* CHAT MESSAGES CONTAINER */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'rgba(5, 10, 20, 0.4)',
              }}
            >
              {currentMessages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: isUser ? '82%' : '88%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                        fontSize: '0.7rem',
                        color: '#64748b',
                      }}
                    >
                      <span>{isUser ? '👤 Alumno' : `${currentRoleConfig.avatar} ${currentRoleConfig.title}`}</span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isUser
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'rgba(20, 30, 48, 0.88)',
                        color: isUser ? '#07111f' : '#f1f5f9',
                        border: isUser ? 'none' : '1px solid rgba(197, 168, 128, 0.2)',
                        boxShadow: isUser
                          ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                          : '0 4px 16px rgba(0, 0, 0, 0.35)',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.content}
                    </div>

                    {/* Botones de acción del mensaje (Copiar / Escuchar por voz) */}
                    {!isUser && m.content && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleSpeakText(m.content)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            color: '#94a3b8',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Escuchar explicación con voz sintética gratuita"
                        >
                          <span>🔊</span>
                          <span>Escuchar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.content)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            color: copiedId === m.id ? '#34d399' : '#94a3b8',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                          }}
                          title="Copiar texto de la lección"
                        >
                          {copiedId === m.id ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      padding: '10px 16px',
                      borderRadius: '16px',
                      background: 'rgba(20, 30, 48, 0.7)',
                      border: '1px solid rgba(197, 168, 128, 0.2)',
                      color: '#cbd5e1',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span className="brand-lion-icon" style={{ animation: 'spin 1.5s infinite linear' }}>
                      🦁
                    </span>
                    <span>El mentor institucional está sintetizando la respuesta pedagógica...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* CHIPS DE PREGUNTAS RÁPIDAS */}
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(10, 16, 28, 0.85)',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {currentRoleConfig.quickPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(promptText)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '999px',
                    padding: '5px 12px',
                    color: '#cbd5e1',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  ⚡ {promptText}
                </button>
              ))}
            </div>

            {/* ÁREA DE ENTRADA DE TEXTO Y MICRÓFONO */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{
                padding: '12px 18px',
                background: 'rgba(15, 23, 42, 0.95)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              {/* Botón de Dictado por Voz (Web Speech API) */}
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: isListening ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                  background: isListening ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 41, 59, 0.8)',
                  color: isListening ? '#fca5a5' : '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
                title={isListening ? 'Escuchando... haz click para detener' : 'Hablar por micrófono (Dictado de voz gratuito)'}
              >
                {isListening ? '🛑' : '🎙️'}
              </button>

              <textarea
                ref={textareaRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Pregunta a ${currentRoleConfig.title} sobre SMC, lotaje, psicología o activos...`}
                rows={1}
                style={{
                  flex: 1,
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  resize: 'none',
                  outline: 'none',
                }}
              />

              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                style={{
                  height: '40px',
                  padding: '0 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: inputPrompt.trim() && !isLoading
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(148, 163, 184, 0.2)',
                  color: inputPrompt.trim() && !isLoading ? '#07111f' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: inputPrompt.trim() && !isLoading ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Enviar</span>
                <span>&rarr;</span>
              </button>
            </form>
          </div>
        )}

        {/* PESTAÑA 2: CALCULADORA DE LOTAJE INSTITUCIONAL */}
        {activeTab === 'calculator' && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
              <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc', fontWeight: 700 }}>
                    🧮 Calculadora de Lotaje Institucional (Al-Hadiqa Shield)
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.86rem' }}>
                    Determina con precisión matemática el tamaño de tu lote según tu capital y distancia de Stop Loss para no sobreapalancarte jamás.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('al_hadiqa_open_smc_suite'));
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    color: '#03140e',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
                  }}
                >
                  ⚡ Abrir Suite SMC Completa No Simulada &rarr;
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                {/* Balance de cuenta */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    💰 BALANCE DE LA CUENTA (USD)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="100"
                    value={calcBalance}
                    onChange={(e) => setCalcBalance(Number(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '1rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Porcentaje de riesgo */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    🛡️ RIESGO POR TRADE (% RECOMENDADO 1% - 2%)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0.25"
                      max="10"
                      step="0.25"
                      value={calcRiskPercent}
                      onChange={(e) => setCalcRiskPercent(Number(e.target.value) || 0)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '1rem',
                        fontWeight: 700,
                        outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0.5, 1.0, 1.5, 2.0].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setCalcRiskPercent(pct)}
                          style={{
                            padding: '6px 8px',
                            background: calcRiskPercent === pct ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                            border: 'none',
                            borderRadius: '6px',
                            color: calcRiskPercent === pct ? '#07111f' : '#cbd5e1',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stop Loss en pips */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    🎯 STOP LOSS TÉCNICO (PIPS / PUNTOS)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={calcStopLossPips}
                    onChange={(e) => setCalcStopLossPips(Number(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '1rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Activo / Mercado */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                    📊 INSTRUMENTO / PAR
                  </label>
                  <select
                    value={calcAsset}
                    onChange={(e) => setCalcAsset(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  >
                    <option value="EURUSD">EUR/USD (Forex Mayor)</option>
                    <option value="GBPUSD">GBP/USD (Forex Mayor)</option>
                    <option value="XAUUSD">XAU/USD (Oro Spot)</option>
                    <option value="US30">US30 / Dow Jones (Índice)</option>
                    <option value="NAS100">NAS100 / Nasdaq (Índice)</option>
                    <option value="BTCUSD">BTC/USD (Cripto)</option>
                  </select>
                </div>
              </div>

              {/* RESULTADO DE LA CALCULADORA */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
                  border: '1px solid #10b981',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '20px',
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.15)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>
                    Riesgo Monetario Máximo
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                    ${lotCalculation.riskDollar} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>USD</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#6ee7b7', marginTop: '2px' }}>
                    {calcRiskPercent}% exacto de tu balance
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>
                    Tamaño de Posición (Lotes)
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                    {lotCalculation.standardLots} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Lotes</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#6ee7b7', marginTop: '2px' }}>
                    o {lotCalculation.miniLots} Minilotes ({lotCalculation.microLots} Microlotes)
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>
                    Beneficio con Ratio 1:2
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                    +${lotCalculation.targetProfit1to2} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>USD</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                    Target a {calcStopLossPips * 2} pips
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase' }}>
                    Beneficio con Ratio 1:3 (Óptimo)
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>
                    +${lotCalculation.targetProfit1to3} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>USD</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#fde68a', marginTop: '2px' }}>
                    Target a {calcStopLossPips * 3} pips
                  </div>
                </div>
              </div>

              {/* Botón para transferir a la tutoría */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    const prompt = `Calculé un riesgo de $${lotCalculation.riskDollar} (${calcRiskPercent}%) con un lotaje de ${lotCalculation.standardLots} lotes para ${calcAsset} con ${calcStopLossPips} pips de Stop Loss. ¿Es adecuado este tamaño de posición y qué ratio R:R me recomiendas según Smart Money Concepts?`;
                    setActiveTab('chat');
                    setSelectedRole('risk_psychology');
                    setTimeout(() => handleSendMessage(prompt), 100);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #c5a880 0%, #a68254 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    color: '#07111f',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(197, 168, 128, 0.3)',
                  }}
                >
                  <span>Consultar este cálculo con el Director de Riesgo</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: VALIDADOR DE SETUPS SMC */}
        {activeTab === 'validator' && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
              <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc', fontWeight: 700 }}>
                    🔍 Validador de Setups Institucionales (Checklist SMC)
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.86rem' }}>
                    Evalúa la calidad probabilística de tu operación antes de arriesgar capital. No entres al mercado si tu setup no cumple al menos el 70%.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('al_hadiqa_open_smc_suite'));
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    color: '#03140e',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
                  }}
                >
                  ⚡ Abrir Suite SMC Completa No Simulada &rarr;
                </button>
              </div>

              {/* LISTA DE PUNTOS CRÍTICOS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {/* 1. HTF Bias */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: checkHtfBias ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                    border: checkHtfBias ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checkHtfBias}
                    onChange={(e) => setCheckHtfBias(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10b981' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                      1. Sesgo en Temporalidad Mayor Alineado (HTF Bias: 4H / Diario)
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>
                      ¿El flujo de órdenes en 4H o Diario respalda la dirección de tu trade? Operar a favor del sesgo mayor eleva drásticamente la tasa de éxito.
                    </div>
                  </div>
                </label>

                {/* 2. Liquidity Sweep */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: checkLiquiditySweep ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                    border: checkLiquiditySweep ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checkLiquiditySweep}
                    onChange={(e) => setCheckLiquiditySweep(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10b981' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                      2. Barrido de Liquidez Evidente (Liquidity Sweep de BSL o SSL)
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>
                      ¿El precio tomó los Stop Loss de máximos o mínimos anteriores (ej. rango asiático o máximos del día previo) mediante una mecha rápida de rechazo?
                    </div>
                  </div>
                </label>

                {/* 3. Structure Shift / CHoCH */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: checkStructureShift ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                    border: checkStructureShift ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checkStructureShift}
                    onChange={(e) => setCheckStructureShift(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10b981' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                      3. Cambio de Carácter Confirmado (CHoCH / MSS con Cuerpo de Vela)
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>
                      ¿El precio quebró con cuerpo contundente en M5 o M15 el último fractal clave que originó la toma de liquidez?
                    </div>
                  </div>
                </label>

                {/* 4. FVG or Order Block */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: checkFvgOrOb ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                    border: checkFvgOrOb ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checkFvgOrOb}
                    onChange={(e) => setCheckFvgOrOb(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10b981' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                      4. Zona de Entrada Institucional Clara (Fair Value Gap o Order Block Virgen)
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>
                      ¿La entrada se sitúa en el 50% de un FVG no mitigado o en un Order Block con imbalance previo en zona de descuento/prima?
                    </div>
                  </div>
                </label>

                {/* 5. Risk-to-Reward >= 1:2.5 */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: checkRiskReward ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                    border: checkRiskReward ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checkRiskReward}
                    onChange={(e) => setCheckRiskReward(e.target.checked)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10b981' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                      5. Ratio Riesgo/Beneficio Mínimo 1:2.5 o 1:3
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>
                      ¿El objetivo técnico (Take Profit) se ubica en el siguiente grupo de liquidez opuesta garantizando un retorno de al menos el triple de tu riesgo?
                    </div>
                  </div>
                </label>
              </div>

              {/* DIAGNÓSTICO EN TIEMPO REAL */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: `2px solid ${validatorScore.gradeColor}`,
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: `conic-gradient(${validatorScore.gradeColor} ${validatorScore.score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '66px',
                      height: '66px',
                      borderRadius: '50%',
                      background: '#0d1525',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      color: validatorScore.gradeColor,
                    }}
                  >
                    {validatorScore.score}%
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Diagnóstico Institucional
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: validatorScore.gradeColor, marginTop: '2px' }}>
                    {validatorScore.grade}
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {validatorScore.diagnosis}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: GLOSARIO & FÓRMULAS */}
        {activeTab === 'glossary' && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc', fontWeight: 700 }}>
                  📖 Glosario & Manual de Fórmulas Institucionales
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.86rem' }}>
                  Referencias rápidas de conceptos Smart Money Concepts y principios de Al-Hadiqa Capital.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {/* OB */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c5a880', fontWeight: 700, fontSize: '0.95rem' }}>
                    <span>📦</span>
                    <span>Order Block (OB)</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '8px 0', lineHeight: 1.5 }}>
                    Última vela contraria previa a un impulso fuerte que rompe estructura (BOS). Marca la zona de mitigación donde las instituciones rebalancean sus órdenes.
                  </p>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '8px', borderRadius: '6px', fontSize: '0.74rem', color: '#a7f3d0' }}>
                    Tip: Valida que el OB haya generado un FVG inmediato y no haya sido mitigado previamente.
                  </div>
                </div>

                {/* FVG */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>
                    <span>⚡</span>
                    <span>Fair Value Gap (FVG)</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '8px 0', lineHeight: 1.5 }}>
                    Espacio de ineficiencia entre la mecha de la vela 1 y la vela 3. El nivel del 50% (Consequent Encroachment) actúa como imán institucional.
                  </p>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '8px', borderRadius: '6px', fontSize: '0.74rem', color: '#a7f3d0' }}>
                    Fórmula C.E.: (Precio Máximo FVG + Precio Mínimo FVG) / 2
                  </div>
                </div>

                {/* BOS & CHoCH */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: 700, fontSize: '0.95rem' }}>
                    <span>🔄</span>
                    <span>BOS vs CHoCH</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '8px 0', lineHeight: 1.5 }}>
                    <strong>BOS:</strong> Continuación de la tendencia vigente.<br />
                    <strong>CHoCH:</strong> Primer aviso de cambio de dirección al quebrar el último mínimo o máximo clave.
                  </p>
                </div>

                {/* Cuadrante Kiyosaki */}
                <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontWeight: 700, fontSize: '0.95rem' }}>
                    <span>🏛️</span>
                    <span>Cuadrante de Flujo (Robert Kiyosaki)</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '8px 0', lineHeight: 1.5 }}>
                    <strong>E:</strong> Empleado · <strong>A:</strong> Autoempleado · <strong>D:</strong> Dueño de Sistema · <strong>I:</strong> Inversionista.<br />
                    El trading institucional capitaliza; los activos en el cuadrante I generan la libertad definitiva.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
