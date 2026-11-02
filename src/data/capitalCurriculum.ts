import { CapitalModule } from '../types/capital';

export const CAPITAL_MODULES: CapitalModule[] = [
  {
    id: 'cap-mod-1',
    pillar: 'educacion_financiera',
    pillarLabel: 'Educación Financiera',
    title: 'El Cuadrante del Flujo de Dinero & Filosofía Kiyosaki',
    subtitle: 'La transición matemática de la Carrera de la Rata hacia la Libertad Financiera',
    description: 'Comprende la diferencia estructural entre ingresos activos y pasivos. Descubre cómo pasar del cuadrante izquierdo (Empleado/Autoempleado) al cuadrante derecho (Dueño de Sistema/Inversor), el uso estratégico de deuda buena y la arquitectura de estados financieros personales.',
    badge: 'Módulo Fundamental',
    colorVar: 'var(--gold)',
    icon: '🧭',
    lessonsCount: 5,
    estimatedHours: '4.5 horas',
    lessons: [
      {
        id: 'cap-1-les-1',
        moduleId: 'cap-mod-1',
        title: 'Masterclass: Anatomía de los 4 Cuadrantes (E, A, D, I)',
        type: 'clase',
        durationMinutes: 45,
        instructorOrAuthor: 'Sr.smith (Carlos Smith Zambrano)',
        summary: 'Desglose exhaustivo de cómo genera dinero cada cuadrante y por qué el 95% de la población compite por el 5% de la riqueza en el lado izquierdo.',
        keyTakeaways: [
          'Empleado (E): Vende tiempo por dinero; asume el 100% del riesgo fiscal.',
          'Autoempleado (A): Es el sistema; si no trabaja, no factura; sufre el síndrome del profesional agotado.',
          'Dueño de Negocio (D): Posee un sistema que funciona y delega con apalancamiento de talento.',
          'Inversionista (I): El dinero trabaja 24/7 sin presencia física; aprovecha el interés compuesto y exenciones impositivas legales.'
        ],
        readingContentMarkdown: `### Los 4 Cuadrantes del Flujo de Dinero

Para Robert Kiyosaki, la diferencia entre los ricos y la clase media no es cuánto dinero ganan, sino **de qué cuadrante proviene su flujo de efectivo**:

1. **E (Empleado):**
   - Motivación nuclear: "Seguridad y estabilidad".
   - Realidad fiscal: Es el sector que paga la mayor tasa impositiva efectiva. Si enferma o es despedido, su flujo se detiene inmediatamente.

2. **A (Autoempleado / Especialista):**
   - Motivación nuclear: "Nadie lo hace mejor que yo".
   - Trampa: Es dueño de un empleo, no de un negocio. Trabaja 14 horas al día para no tener jefe, pero se convierte en el peor jefe de sí mismo.

3. **D (Dueño de Negocio con Sistema):**
   - Posee un sistema automatizado y contrata a los mejores (muchos de ellos cuadrante A o E).
   - Puede ausentarse 6 meses y el negocio sigue facturando y creciendo.

4. **I (Inversionista):**
   - El dinero es un soldado que trabaja sin dormir, sin pedir vacaciones y generando más soldados.
   - Usa la velocidad del dinero y el apalancamiento para reinvertir en activos reales.

> **Regla de Oro:** Tu meta no es renunciar precipitadamente, sino construir el puente: usar los ingresos del cuadrante E o A para financiar activos en el cuadrante D e I.`,
        videoOrAudioUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        downloadableDocTitle: 'Guía de Transición del Cuadrante (E->D->I)',
        downloadableDocSize: '2.4 MB PDF',
        badge: 'Clase Magistral'
      },
      {
        id: 'cap-1-les-2',
        moduleId: 'cap-mod-1',
        title: 'Lectura Profunda: Activos Reales vs. Pasivos Disfrazados',
        type: 'lectura',
        durationMinutes: 30,
        instructorOrAuthor: 'Robert Kiyosaki (Adaptación Al-Hadiqa)',
        summary: 'La definición más simple y revolucionaria: un activo pone dinero en tu bolsillo; un pasivo saca dinero de tu bolsillo.',
        keyTakeaways: [
          'Tu residencia principal habitada genera gastos continuos (impuestos, hipoteca, mantenimiento) y es un pasivo contable a menos que produzca rentas netas.',
          'La inflación es un impuesto silencioso que castiga a los ahorradores de efectivo fiduciario.',
          'Diferencia entre Deuda Tóxica (financiar placeres que se devalúan) y Deuda Buena (financiar activos donde el flujo del inquilino/negocio paga el préstamo).'
        ],
        readingContentMarkdown: `### Activos vs Pasivos: La Verdad que los Bancos Ocultan

La clase media compra pasivos pensando que son activos.

* **Activo Real:** Inmuebles de renta comercial/residencial con flujo neto positivo, carteras de acciones con dividendos crecientes, empresas automatizadas, propiedad intelectual y commodities refugio.
* **Pasivo Disfrazado:** El automóvil de lujo financiado a 60 meses, la ropa de marca a plazos, suscripciones innecesarias y créditos de consumo.

#### La Ecuación del Estado Financiero:
Ingresos - Gastos = **Flujo de Caja Libre (Cashflow)**.
Si tu Cashflow se destina a comprar más Activos, el valor de tus ingresos pasivos crecerá exponencialmente hasta superar tu coste de vida. En ese instante exacto: **has alcanzado la Libertad Financiera**.`,
        badge: 'Lectura Esencial'
      },
      {
        id: 'cap-1-les-3',
        moduleId: 'cap-mod-1',
        title: 'Masterclass: La Deuda Buena como Multiplicador de Riqueza',
        type: 'clase',
        durationMinutes: 50,
        instructorOrAuthor: 'Sr.smith (Carlos Smith Zambrano)',
        summary: 'Cómo los inversores sofisticados utilizan el dinero de otros (OPM - Other People\'s Money) para acelerar el crecimiento patrimonial con riesgo controlado.',
        keyTakeaways: [
          'El concepto de LTV (Loan-to-Value) y ratios de cobertura de deuda.',
          'Cómo blindarse ante subidas de tipos de interés mediante amortizaciones estructuradas.',
          'Por qué la deuda amortizada por terceros genera retornos sobre capital propio (ROE) superiores al 30%.'
        ],
        readingContentMarkdown: `### Ingeniería de la Deuda Buena

La deuda buena cumple tres condiciones estrictas:
1. **Flujo de caja positivo asegurado:** El rendimiento del activo supera holgadamente el coste de la deuda más margen de seguridad del 25%.
2. **Auto-liquidación:** El consumidor, inquilino o cliente abona la cuota mensual, no tus ahorros personales.
3. **Optimización fiscal:** Los intereses de deuda de inversión son deducibles en casi todas las jurisdicciones modernas.`,
        videoOrAudioUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        badge: 'Clase Avanzada'
      },
      {
        id: 'cap-1-les-4',
        moduleId: 'cap-mod-1',
        title: 'Lectura: La Trampa de la Carrera de la Rata y Cómo Romperla',
        type: 'lectura',
        durationMinutes: 35,
        instructorOrAuthor: 'Equipo de Investigación Al-Hadiqa',
        summary: 'El ciclo psicológico de: más sueldo -> más gastos -> mayor estilo de vida -> más deudas -> necesidad obligada de más sueldo.',
        keyTakeaways: [
          'La inflación del estilo de vida (lifestyle creep) arruina a profesionales con sueldos de 6 cifras.',
          'La regla del 50/30/20 modificada para inversores: 40% necesidades, 10% ocio, 50% inversión en activos.',
          'El horizonte temporal de 5 a 10 años para la emancipación financiera completa.'
        ],
        badge: 'Lectura Estratégica'
      },
      {
        id: 'cap-1-les-5',
        moduleId: 'cap-mod-1',
        title: 'Resumen Ejecutivo & Matriz de Transición del Cuadrante',
        type: 'resumen',
        durationMinutes: 20,
        instructorOrAuthor: 'Al-Hadiqa Capital Insights',
        summary: 'Plantilla condensada para auditar tu estado financiero mensual, clasificar cada gasto y trazar tu plan de 90 días para adquirir tu primer activo productor.',
        keyTakeaways: [
          'Checklist de auditoría de gastos vampiro.',
          'Matriz de cálculo del ratio de independencia financiera (Ingresos Pasivos / Gastos Básicos).',
          '3 pasos inmediatos para activar tu primer vehículo en el cuadrante D/I.'
        ],
        downloadableDocTitle: 'Resumen Ejecutivo: Matriz de Kiyosaki y Plantilla de Cashflow',
        downloadableDocSize: '1.8 MB PDF',
        badge: 'Ficha Ejecutiva'
      }
    ],
    executiveSummary: {
      title: 'Síntesis Maestra: El Cuadrante del Flujo de Dinero',
      filename: 'Al_Hadiqa_Capital_Cuadrante_Kiyosaki.pdf',
      size: '2.8 MB',
      pages: 18,
      coreThesis: 'La riqueza no depende de la habilidad técnica para trabajar duro, sino de la arquitectura jurídica y financiera del vehículo que genera tu flujo de efectivo.',
      actionChecklist: [
        'Calcular el Ratio de Emancipación: (Ingresos Pasivos / Gastos Vitales) x 100.',
        'Eliminar el 100% de la deuda tóxica con el método bola de nieve.',
        'Separar el 20% de cada ingreso bruto hacia la Cuenta de Activos Intocables.',
        'Diseñar un activo digital o de inversión que no requiera más de 2 horas semanales para operar.'
      ],
      principles: [
        { title: 'Págate a ti primero', explanation: 'Antes de transferir a caseros, servicios o bancos, destina tu cuota de inversión.' },
        { title: 'Distingue precio de valor', explanation: 'El precio es lo que pagas; el flujo neto de efectivo es lo que realmente compras.' },
        { title: 'Apalancamiento de sistemas', explanation: 'Un negocio sin sistema es un autoempleo con sobrecarga; el sistema es el activo.' }
      ]
    }
  },
  {
    id: 'cap-mod-2',
    pillar: 'educacion_financiera',
    pillarLabel: 'Educación Financiera',
    title: 'Seminarios y Filosofía de los Titanes de la Inversión',
    subtitle: 'Buffett, Munger, Dalio, Graham y Lynch: Modelos Mentales y Margen de Seguridad',
    description: 'Analiza los principios atemporales probados durante más de 80 años de ciclos económicos. Aprende la fórmula del margen de seguridad de Benjamin Graham, el círculo de competencia de Warren Buffett, los modelos mentales de Charlie Munger y la máquina económica de Ray Dalio.',
    badge: 'Seminario de Élite',
    colorVar: 'var(--emerald)',
    icon: '🏛️',
    lessonsCount: 5,
    estimatedHours: '5.2 horas',
    lessons: [
      {
        id: 'cap-2-les-1',
        moduleId: 'cap-mod-2',
        title: 'Seminario Magistral: Benjamin Graham y el Inversor Inteligente',
        type: 'clase',
        durationMinutes: 55,
        instructorOrAuthor: 'Benjamin Graham (Cátedra Al-Hadiqa)',
        summary: 'La parábola del Señor Mercado, el concepto matemático del Margen de Seguridad y por qué el inversor defensivo supera al especulador compulsivo.',
        keyTakeaways: [
          'El Señor Mercado es un maníaco-depresivo que te ofrece precios todos los días: tu ventaja es decidir cuándo comprar y cuándo ignorarlo.',
          'El Margen de Seguridad es la diferencia entre el valor intrínseco conservador y el precio de cotización.',
          'Inversor vs Especulador: el inversor protege el principal y busca un rendimiento adecuado; el especulador apuesta al precio futuro a corto plazo.'
        ],
        readingContentMarkdown: `### El Legado de Benjamin Graham

Graham sentó las bases del análisis fundamental moderno con dos premisas inquebrantables:

1. **El Señor Mercado (Mr. Market):**
   No veas las fluctuaciones diarias de precios como una orden sobre cuánto vale tu activo. Si compraste un negocio sólido por $50 cuando vale $100, que el Señor Mercado se despierte deprimido y te ofrezca $40 no cambia la realidad de tu inversión: te otorga la oportunidad de comprar más.

2. **Margen de Seguridad (Margin of Safety):**
   El propósito del margen de seguridad es hacer innecesario un pronóstico exacto del futuro. Si calculas que una compañía vale 100 y la compras a 60, incluso si tu estimación se desvía un 25%, seguirás teniendo ganancias.`,
        badge: 'Cátedra Maestra'
      },
      {
        id: 'cap-2-les-2',
        moduleId: 'cap-mod-2',
        title: 'Seminario: Warren Buffett & Charlie Munger — Fosos Defensivos (Moats)',
        type: 'clase',
        durationMinutes: 60,
        instructorOrAuthor: 'Warren Buffett & Charlie Munger (Análisis)',
        summary: 'Cómo Berkshire Hathaway pasó de comprar colillas de puro baratas a comprar negocios maravillosos a precios razonables con ventajas competitivas duraderas.',
        keyTakeaways: [
          'Un foso económico (Economic Moat) es la barrera que protege los retornos sobre capital: marcas insustituibles, costes de cambio, patentes o efecto red.',
          'Círculo de Competencia: Saber qué NO entiendes es mucho más valioso que ser brillante en 100 cosas distintas.',
          'La regla número 1: Nunca pierdas dinero. La regla número 2: Nunca olvides la regla número 1.'
        ],
        badge: 'Seminario Clave'
      },
      {
        id: 'cap-2-les-3',
        moduleId: 'cap-mod-2',
        title: 'Lectura: Ray Dalio y Cómo Funciona la Máquina Económica',
        type: 'lectura',
        durationMinutes: 40,
        instructorOrAuthor: 'Ray Dalio (Síntesis Al-Hadiqa)',
        summary: 'Comprende el ciclo de deuda a corto plazo (5-8 años), el ciclo de deuda a largo plazo (75-100 años) y las 4 fuerzas que mueven toda la economía global.',
        keyTakeaways: [
          'El gasto de una persona es el ingreso de otra; cuando el crédito se expande, la economía vuela; cuando se contrae, se produce el desapalancamiento.',
          'El concepto del Portafolio All-Weather: diversificación basada en regímenes económicos (crecimiento alcista/bajista, inflación alcista/bajista).',
          'La correlación entre activos: cómo reducir el riesgo un 80% sin reducir el rendimiento esperado combinando 15 fuentes de retorno no correlacionadas.'
        ],
        badge: 'Lectura Macroeconómica'
      },
      {
        id: 'cap-2-les-4',
        moduleId: 'cap-mod-2',
        title: 'Seminario: Peter Lynch — Un Paso por Delante de Wall Street',
        type: 'clase',
        durationMinutes: 45,
        instructorOrAuthor: 'Peter Lynch (Estudio de Casos)',
        summary: 'Cómo el inversor individual tiene una ventaja natural sobre los gestores de fondos institucionales al observar la economía real y sus hábitos de consumo.',
        keyTakeaways: [
          'Las 6 categorías de empresas según Lynch: Crecimiento lento, Incondicionales, Crecimiento rápido, Cíclicas, En recuperación y Activos ocultos.',
          'El ratio PEG (Price/Earnings to Growth): pagar múltiplos justos por empresas con tasas de crecimiento sostenibles.',
          'No cortes las flores para regar las malas hierbas: deja correr tus mejores ganadoras.'
        ],
        badge: 'Seminario Práctico'
      },
      {
        id: 'cap-2-les-5',
        moduleId: 'cap-mod-2',
        title: 'Resumen Ejecutivo: Checklist de Validación de Activos de Grandes Inversores',
        type: 'resumen',
        durationMinutes: 25,
        instructorOrAuthor: 'Al-Hadiqa Capital Research',
        summary: 'La lista de verificación de 10 puntos inspirada en Charlie Munger para auditar cualquier activo antes de comprometer capital.',
        keyTakeaways: [
          'Filtro de comprensibilidad del modelo de negocio.',
          'Evaluación de honestidad y alineación de intereses de los directivos/fundadores.',
          'Margen de seguridad numérico y prueba de estrés ante recesiones prolongadas.'
        ],
        downloadableDocTitle: 'Checklist de Validación Munger-Buffett-Graham',
        downloadableDocSize: '2.1 MB PDF',
        badge: 'Plantilla Práctica'
      }
    ],
    executiveSummary: {
      title: 'Compendio de Grandes Inversores: Principios Atemporales de Capital',
      filename: 'Al_Hadiqa_Capital_Grandes_Inversores.pdf',
      size: '3.4 MB',
      pages: 24,
      coreThesis: 'El éxito en la inversión no requiere un coeficiente intelectual prodigioso ni información privilegiada, sino un marco intelectual sólido para tomar decisiones y la disciplina emocional para no dejar que el pánico lo destruya.',
      actionChecklist: [
        'Definir tu Círculo de Competencia por escrito (lo que dominas al 100%).',
        'Exigir un margen de seguridad mínimo del 25% sobre el valor intrínseco estimado.',
        'Diversificar mediante el método de descorrelación de Dalio (All-Weather Framework).',
        'Evitar el sobreapalancamiento que obligue a liquidar posiciones en los peores momentos.'
      ],
      principles: [
        { title: 'Inversión basada en Valor', explanation: 'Comprar una participación en un negocio real con activos tangibles y ventajas competitivas.' },
        { title: 'Paciencia Agresiva', explanation: 'Esperar meses en silencio sin operar hasta que aparezca la oportunidad perfecta con asimetría positiva.' },
        { title: 'Inversión Inversa', explanation: 'Munger: Invertir siempre. ¿Qué es lo que causaría la quiebra del negocio? Evítalo a toda costa.' }
      ]
    }
  },
  {
    id: 'cap-mod-3',
    pillar: 'desarrollo_personal',
    pillarLabel: 'Desarrollo Personal',
    title: 'Presencia, Hábitos Atómicos & Mentalidad Inquebrantable',
    subtitle: 'La forja del carácter: el mayor activo del inversor eres tú mismo',
    description: 'Ningún sistema financiero compensa la falta de disciplina personal. Desarrolla presencia ejecutiva y oratoria persuasiva, construye hábitos atómicos que protejan tu energía y entrena una mentalidad estoica de abundancia capaz de resistir cualquier volatilidad.',
    badge: 'Desarrollo Integral',
    colorVar: 'var(--amber)',
    icon: '👑',
    lessonsCount: 5,
    estimatedHours: '4.8 horas',
    lessons: [
      {
        id: 'cap-3-les-1',
        moduleId: 'cap-mod-3',
        title: 'Masterclass: Presencia Ejecutiva y Autoridad Tranquila',
        type: 'clase',
        durationMinutes: 50,
        instructorOrAuthor: 'Sr.smith (Carlos Smith Zambrano)',
        summary: 'Cómo proyectar convicción y seguridad en reuniones, negociaciones con socios y toma de decisiones de alto impacto sin necesidad de levantar la voz.',
        keyTakeaways: [
          'La serenidad calculada: la persona más tranquila en la sala domina la conversación.',
          'Lenguaje no verbal: postura erguida, contacto visual deliberado, pausas estratégicas y eliminación de muletillas de inseguridad.',
          'Cómo transmitir certeza cuando manejas capital y presentas propuestas de valor a inversores o clientes.'
        ],
        readingContentMarkdown: `### La Presencia Ejecutiva y el Liderazgo Financiero

La presencia no es arrogancia; es la manifestación externa de una competencia interna profunda y una serenidad indestructible.

1. **El Ritmo de la Palabra:**
   Las personas inseguras apresuran sus palabras temiendo ser interrumpidas. Un líder financiero habla despacio, utiliza el silencio como puntuación de poder y no busca la validación inmediata del interlocutor.

2. **La Postura del Titán:**
   Los hombros relajados hacia atrás, los pies bien plantados y la respiración diafragmática reducen el cortisol en sangre y elevan la testosterona de manera natural.

3. **La Autoridad del que no Necesita Nada:**
   En cualquier negociación o cierre de acuerdos, el que demuestra mayor desapego emocional y está dispuesto a levantarse de la mesa tiene el poder absoluto.`,
        badge: 'Clase de Liderazgo'
      },
      {
        id: 'cap-3-les-2',
        moduleId: 'cap-mod-3',
        title: 'Lectura: Hábitos Atómicos Aplicados a las Finanzas',
        type: 'lectura',
        durationMinutes: 35,
        instructorOrAuthor: 'Equipo Pedagógico Al-Hadiqa',
        summary: 'El interés compuesto aplicado a tu conducta: una mejora del 1% diario te hace 37 veces mejor en 12 meses.',
        keyTakeaways: [
          'No te elevas al nivel de tus metas, caes al nivel de tus sistemas diarios.',
          'Las 4 leyes del cambio de conducta de James Clear para crear hábitos de ahorro e inversión automáticos.',
          'Diseño de entorno: cómo eliminar los disparadores de compras compulsivas y distracciones digitales.'
        ],
        badge: 'Lectura Transformadora'
      },
      {
        id: 'cap-3-les-3',
        moduleId: 'cap-mod-3',
        title: 'Masterclass: La Rutina Matutina del Inversor de Alto Rendimiento',
        type: 'clase',
        durationMinutes: 40,
        instructorOrAuthor: 'Sr.smith (Carlos Smith Zambrano)',
        summary: 'Estructura paso a paso de las primeras 2 horas del día: hidratación, lectura formativa, revisión de métricas y preparación mental antes de abrir los mercados.',
        keyTakeaways: [
          'Regla de Cero Pantallas en los primeros 30 minutos tras despertar para proteger el estado de flujo.',
          'El bloque de lectura profunda: 30 minutos diarios equivalen a leer 25 libros de finanzas y negocios al año.',
          'La bitácora de intención: anotar las 3 prioridades inviolables del día antes del mediodía.'
        ],
        badge: 'Protocolo Diario'
      },
      {
        id: 'cap-3-les-4',
        moduleId: 'cap-mod-3',
        title: 'Lectura: Estoicismo Financiero — La Dicotomía del Control',
        type: 'lectura',
        durationMinutes: 30,
        instructorOrAuthor: 'Marco Aurelio & Séneca (Enfoque Al-Hadiqa)',
        summary: 'Distingue con claridad lo que depende de ti (tu esfuerzo, tu gestión de riesgo, tus hábitos) de lo que no depende de ti (el mercado, las tasas de interés, las opiniones ajenas).',
        keyTakeaways: [
          'Amor Fati: Aceptar las caídas del mercado y las pérdidas controladas como oportunidades de aprendizaje y forja de carácter.',
          'Premeditatio Malorum: Visualizar los peores escenarios económicos de antemano para que el pánico nunca nuble tu juicio.',
          'Gratificación Postergada (Delayed Gratification): La habilidad humana más correlacionada con el éxito patrimonial a largo plazo.'
        ],
        badge: 'Filosofía Práctica'
      },
      {
        id: 'cap-3-les-5',
        moduleId: 'cap-mod-3',
        title: 'Resumen Ejecutivo: Bitácora de Hábitos y Protocolo de Presencia',
        type: 'resumen',
        durationMinutes: 20,
        instructorOrAuthor: 'Al-Hadiqa Mentorship',
        summary: 'Plantilla de seguimiento semanal de hábitos atómicos, calibrador de presencia ejecutiva y ejercicios de respiración para calmar el sistema nervioso.',
        keyTakeaways: [
          'Rastreador de hábitos semanal imprimible.',
          'Checklist de 3 minutos para antes de entrar a una reunión o negociación.',
          'Ejercicios diarios de agradecimiento y reencuadre mental.'
        ],
        downloadableDocTitle: 'Bitácora Imprimible de Hábitos y Presencia Ejecutiva',
        downloadableDocSize: '1.9 MB PDF',
        badge: 'Herramienta de Vida'
      }
    ],
    executiveSummary: {
      title: 'Manual de Presencia, Hábitos & Mentalidad de Alto Impacto',
      filename: 'Al_Hadiqa_Capital_Habitos_Y_Presencia.pdf',
      size: '2.9 MB',
      pages: 20,
      coreThesis: 'Tu cuenta bancaria rara vez superará tu desarrollo personal. El dinero huye de la mente caótica e indisciplinada y fluye naturalmente hacia la persona centrada, con presencia, hábitos férreos y claridad de propósito.',
      actionChecklist: [
        'Instaurar la rutina matutina de 60 minutos con cero notificaciones.',
        'Automatizar transferencias de inversión el mismo día que ingresas capital.',
        'Practicar la oratoria con pausas deliberadas y postura de autoridad tranquila.',
        'Llevar un registro diario de las decisiones clave y aprendizajes del día.'
      ],
      principles: [
        { title: 'Sistemas sobre Metas', explanation: 'Las metas marcan la dirección; los hábitos diarios ejecutan el viaje.' },
        { title: 'Dicotomía del Control', explanation: 'Enfócate con obsesión en lo que controlas y despréndete con serenidad de lo que no.' },
        { title: 'Presencia como Imán', explanation: 'La tranquilidad y la certeza atraen socios, oportunidades y respeto en los negocios.' }
      ]
    }
  },
  {
    id: 'cap-mod-4',
    pillar: 'psicotrading_negocios',
    pillarLabel: 'Psicotrading y Negocios',
    title: 'Psicotrading de Élite & Psicología en los Negocios',
    subtitle: 'Domina los 4 monstruos emocionales, supera el sesgo cognitivo y toma decisiones bajo presión',
    description: 'El 90% del trading y los negocios no es análisis técnico ni hojas de cálculo: es gestión de emociones en tiempo real. Aprende a neutralizar el FOMO, la avaricia, el miedo y la venganza operativa. Domina la psicología de negociación de alto valor y la resiliencia ante el rechazo comercial.',
    badge: 'Maestría Mental',
    colorVar: 'var(--cyan)',
    icon: '⚖️',
    lessonsCount: 5,
    estimatedHours: '5.0 horas',
    lessons: [
      {
        id: 'cap-4-les-1',
        moduleId: 'cap-mod-4',
        title: 'Masterclass Psicotrading: El Dominio de los Cuatro Monstruos',
        type: 'clase',
        durationMinutes: 55,
        instructorOrAuthor: 'Sr.smith (Carlos Smith Zambrano)',
        summary: 'Cómo desactivar biológicamente el FOMO (miedo a perderse una subida), la Avaricia (cerrar tarde por querer más), el Miedo (dudar al disparar) y el Revenge Trading (operar por revancha tras una pérdida).',
        keyTakeaways: [
          'La amígdala cerebral se activa exactamente igual ante una pérdida financiera que ante un depredador en la selva.',
          'El concepto de Trading Estadístico: tú eres el casino, no el apostador; una pérdida individual no significa nada en una serie de 100 operaciones.',
          'Protocolo de Enfriamiento Obligatorio: 2 pérdidas seguidas exigen apagar las pantallas durante mínimo 4 horas.'
        ],
        readingContentMarkdown: `### Los 4 Enemigos Mentales del Trader

1. **FOMO (Fear of Missing Out):**
   Ves una vela alcista descomunal y entras tarde en el pico más alto. El antídoto: entender que el mercado ofrece oportunidades todos los días. Perderte un movimiento no te quita un solo centavo de tu cuenta.

2. **Avaricia:**
   El precio llega a tu Take Profit técnico, pero decides mover el objetivo porque crees que "subirá hasta la luna". El precio se gira bruscamente y sales en pérdidas. El antídoto: respetar el plan original como una ley sagrada.

3. **Miedo a la Pérdida:**
   Ves una configuración de alta probabilidad con todas tus confluencias, pero recuerdas la pérdida anterior y no disparas. Cuando el trade va a target, te frustras. El antídoto: aceptar el riesgo en dólares ANTES de entrar; si no puedes perder esos $50 con una sonrisa, reduce el loteaje.

4. **Trading de Venganza (Revenge Trading):**
   Pierdes una operación y en lugar de reflexionar, subes el lotaje al doble para "recuperar lo que el mercado te quitó". Es la causa número 1 de cuentas quemadas en el mundo. El antídoto: el mercado no te conoce ni tiene nada contra ti; el protocolo anti-tilt apaga la terminal.`,
        badge: 'Cátedra Psicológica'
      },
      {
        id: 'cap-4-les-2',
        moduleId: 'cap-mod-4',
        title: 'Masterclass Negocios: Psicología de la Negociación de Alto Valor',
        type: 'clase',
        durationMinutes: 45,
        instructorOrAuthor: 'Sr.smith & Especialistas Al-Hadiqa',
        summary: 'Estrategias psicológicas probadas de negociación: anclaje de precios, escucha táctica, empatía estratégica y el arte de hacer que la otra parte diga "NO" primero para sentirse en control.',
        keyTakeaways: [
          'El sesgo de anclaje: quien pone el primer marco numérico define el campo de batalla de la negociación.',
          'Etiquetado de emociones (Emotional Labeling): desactivar objeciones reconociendo los miedos del cliente antes de que los exprese.',
          'El poder del rechazo constructivo: cómo transformar objeciones en acuerdos beneficiosos para ambas partes.'
        ],
        badge: 'Negociación Estratégica'
      },
      {
        id: 'cap-4-les-3',
        moduleId: 'cap-mod-4',
        title: 'Lectura: Pensar en Apuestas — Toma de Decisiones en Incertidumbre',
        type: 'lectura',
        durationMinutes: 35,
        instructorOrAuthor: 'Basado en Annie Duke & Daniel Kahneman',
        summary: 'Por qué evaluar una decisión únicamente por su resultado final ("Resulting") es un error fatal. Aprende a separar la calidad del proceso de la suerte aleatoria.',
        keyTakeaways: [
          'Una buena decisión puede tener un mal resultado a corto plazo debido a la varianza estadística.',
          'Una mala decisión (como sobreapalancarse sin stop loss) puede dar dinero una vez por suerte, pero te llevará a la ruina en el largo plazo.',
          'Pensamiento probabilístico: asignar rangos de probabilidad en lugar de certezas dogmáticas.'
        ],
        badge: 'Lectura Cognitiva'
      },
      {
        id: 'cap-4-les-4',
        moduleId: 'cap-mod-4',
        title: 'Lectura: El Manual de la Resiliencia Empresarial y Manejo del Fracaso',
        type: 'lectura',
        durationMinutes: 30,
        instructorOrAuthor: 'Cuerpo Docente Al-Hadiqa',
        summary: 'Cómo los mejores empresarios y traders transforman los errores en activos de datos. La construcción de antifragilidad empresarial según Nassim Nicholas Taleb.',
        keyTakeaways: [
          'Lo frágil se rompe con el caos; lo robusto resiste; lo antifrágil se vuelve más fuerte y rentable con el estrés.',
          'Diseñar tu negocio y tu operativa de trading para que ningún evento singular pueda destruirte jamás.',
          'La cultura de la autopsia sin culpa: analizar por qué falló un proyecto o una operación para refinar el algoritmo.'
        ],
        badge: 'Resiliencia Aplicada'
      },
      {
        id: 'cap-4-les-5',
        moduleId: 'cap-mod-4',
        title: 'Resumen Ejecutivo: Plan Anti-Tilt de Rescate Psicotrading y Negocios',
        type: 'resumen',
        durationMinutes: 20,
        instructorOrAuthor: 'Comité Psicológico Al-Hadiqa',
        summary: 'Protocolo de emergencia de 5 pasos para cuando sientas frustración o euforia desmedida en tus operaciones o negociaciones.',
        keyTakeaways: [
          'Regla de desconexión física de 20 minutos.',
          'Ficha de descompresión emocional: preguntas clave antes de tocar el teclado.',
          'Checklist de reactivación tras pérdidas consecutivas.'
        ],
        downloadableDocTitle: 'Protocolo de Rescate Anti-Tilt y Plan de Trading Mental',
        downloadableDocSize: '2.0 MB PDF',
        badge: 'Protocolo de Emergencia'
      }
    ],
    executiveSummary: {
      title: 'Manual Maestro de Psicotrading y Psicología en los Negocios',
      filename: 'Al_Hadiqa_Capital_Psicotrading_Y_Negocios.pdf',
      size: '3.1 MB',
      pages: 22,
      coreThesis: 'El mercado y los negocios son espejos implacables de tu inconsciente: si eres impaciente, te cobrarán por tu prisa; si eres codicioso, te despojarán de tu capital; si eres disciplinado y probabilístico, te recompensarán con libertad.',
      actionChecklist: [
        'Aceptar la pérdida máxima permitida por día (Daily Loss Limit) y no alterarla jamás.',
        'Llevar un diario emocional donde anotes tu estado mental antes, durante y después de cada trade o reunión.',
        'Establecer un límite estricto de máximo 2 a 3 operaciones por día para evitar la fatiga decisoria.',
        'Celebrar el seguimiento estricto del plan de gestión, independientemente de si el trade fue ganador o perdedor.'
      ],
      principles: [
        { title: 'Mentalidad de Probabilidades', explanation: 'Ninguna operación individual define tu valor; el resultado de una muestra de 100 operaciones sí.' },
        { title: 'Desapego al Resultado', explanation: 'Enfócate en la perfección del proceso de ejecución; el dinero es una consecuencia inevitable.' },
        { title: 'Antifragilidad', explanation: 'Utiliza cada revés temporal para fortalecer tu sistema de gestión de riesgos y carácter.' }
      ]
    }
  }
];
