export type PersonalDevPillar =
  | 'Autodisciplina'
  | 'Metas y Claridad'
  | 'Productividad'
  | 'Mentalidad y Liderazgo'
  | 'Hábitos Diarios'
  | 'Maestría Financiera';

export interface DailyPersonalDevMessage {
  id: string;
  pillar: PersonalDevPillar;
  mentor: string;
  title: string;
  message: string;
  dailyAction: string;
}

export const DAILY_PERSONAL_DEV_MESSAGES: DailyPersonalDevMessage[] = [
  {
    id: 'bt-frog-1',
    pillar: 'Productividad',
    mentor: 'Brian Tracy · ¡Tráguese ese sapo!',
    title: 'Empieza por tu tarea más difícil',
    message:
      'Si tu trabajo es tragarte un sapo, hazlo a primera hora de la mañana. Completar tu prioridad de mayor impacto antes del mediodía libera energía mental para todo el día.',
    dailyAction: 'Define hoy tu "sapo" número uno y dedícale los primeros 45 minutos sin distracciones.',
  },
  {
    id: 'bt-goals-2',
    pillar: 'Metas y Claridad',
    mentor: 'Brian Tracy · Metas',
    title: 'La claridad es el 80 % del éxito',
    message:
      'Una meta que no está escrita es simplemente un deseo. Escribir tus objetivos en presente y revisarlos cada mañana activa tu sistema de enfoque selectivo.',
    dailyAction: 'Escribe hoy en papel tus 3 metas financieras y personales más importantes en tiempo presente.',
  },
  {
    id: 'bt-excuses-3',
    pillar: 'Autodisciplina',
    mentor: 'Brian Tracy · ¡Sin excusas!',
    title: 'Autodisciplina: haz lo que debes cuando debes',
    message:
      'La autodisciplina es la capacidad de hacer lo que tienes que hacer, en el momento en que debes hacerlo, tengas o no tengas ganas de hacerlo.',
    dailyAction: 'Ejecuta hoy una tarea clave que hayas pospuesto durante la última semana.',
  },
  {
    id: 'bt-resp-4',
    pillar: 'Mentalidad y Liderazgo',
    mentor: 'Brian Tracy · Psicología del Logro',
    title: 'Responsabilidad total, cero quejas',
    message:
      'El momento en que aceptas el 100 % de responsabilidad por tus resultados, tu salud y tu capital, recuperas todo el poder para transformarlos.',
    dailyAction: 'Sustituye hoy cualquier queja o excusa por la pregunta: "¿Qué puedo hacer distinto a partir de ahora?"',
  },
  {
    id: 'bt-20-5',
    pillar: 'Productividad',
    mentor: 'Brian Tracy · Ley de Pareto 80/20',
    title: 'Enfócate en el 20 % que produce el 80 %',
    message:
      'No todas las tareas valen lo mismo. El 20 % de tus actividades estratégicas genera el 80 % de tus ingresos, aprendizaje y crecimiento real.',
    dailyAction: 'Identifica las dos únicas actividades de hoy que realmente acercan tus objetivos a largo plazo.',
  },
  {
    id: 'bt-learn-6',
    pillar: 'Maestría Financiera',
    mentor: 'Brian Tracy · Aprender más para ganar más',
    title: 'La regla de la hora dorada diaria',
    message:
      'Dedicar una hora cada día al estudio de tu oficio o mercado equivale a estudiar 365 horas al año: suficiente para ubicarte en el 10 % superior de tu sector.',
    dailyAction: 'Reserva 30 a 60 minutos hoy para estudiar gráficos, lectura financiera o tu módulo activo.',
  },
  {
    id: 'bt-self-talk-7',
    pillar: 'Mentalidad y Liderazgo',
    mentor: 'Brian Tracy · Diálogo Interno',
    title: 'Controla tu conversación interior',
    message:
      'El 95 % de tus emociones están determinadas por cómo te hablas a ti mismo ante los imprevistos. Háblate como un mentor firme, sereno y resolutivo.',
    dailyAction: 'Ante cualquier contratiempo de hoy, responde mentalmente: "Esto es temporal; busco la lección y sigo".',
  },
  {
    id: 'bt-time-8',
    pillar: 'Productividad',
    mentor: 'Brian Tracy · Regla 10/90',
    title: 'Planifica 10 minutos, ahorra 90 % de esfuerzo',
    message:
      'Cada minuto invertido en planificar por escrito antes de actuar ahorra diez minutos en la ejecución y evita decisiones impulsivas.',
    dailyAction: 'Antes de abrir pantallas o mercados, anota en orden de prioridad las 5 tareas exactas de tu jornada.',
  },
  {
    id: 'bt-saving-9',
    pillar: 'Maestría Financiera',
    mentor: 'Brian Tracy · 21 Secretos de los Millonarios',
    title: 'Págate a ti primero sin excepción',
    message:
      'La libertad financiera nace del hábito innegociable de apartar al menos el 10 % de cada ingreso para invertir en tu futuro antes de gastar en todo lo demás.',
    dailyAction: 'Audita tus gastos de la semana y asegura que tu porcentaje de reserva o inversión sea intocable.',
  },
  {
    id: 'bt-action-10',
    pillar: 'Autodisciplina',
    mentor: 'Brian Tracy · Orientación a la Acción',
    title: 'Velocidad de implementación',
    message:
      'Las personas de alto rendimiento tienen un sesgo hacia la acción: prueban, miden y ajustan rápido mientras otros siguen esperando condiciones perfectas.',
    dailyAction: 'Da hoy el primer paso concreto de una idea o plan en menos de 5 minutos.',
  },
  {
    id: 'bt-skill-11',
    pillar: 'Maestría Financiera',
    mentor: 'Brian Tracy · La Habilidad Limitante',
    title: 'Detecta y supera tu cuello de botella',
    message:
      'Siempre existe una sola habilidad que determina la velocidad a la que duplicas tus resultados. Identificarla y entrenarla multiplica todo lo demás.',
    dailyAction: 'Pregúntate hoy: "¿Qué habilidad, si la dominara al 100 %, tendría el mayor impacto positivo en mi año?"',
  },
  {
    id: 'bt-courage-12',
    pillar: 'Mentalidad y Liderazgo',
    mentor: 'Brian Tracy · El Hábito del Coraje',
    title: 'Actúa a pesar de la incomodidad',
    message:
      'El coraje no es ausencia de miedo, sino caminar hacia lo que importa mientras sientes incertidumbre. Cada vez que enfrentas lo incómodo, tu carácter crece.',
    dailyAction: 'Ten hoy esa conversación pendiente o ejecuta la decisión que sabías correcta pero te daba respeto.',
  },
  {
    id: 'jr-discipline-13',
    pillar: 'Autodisciplina',
    mentor: 'Jim Rohn · Filosofía de Vida',
    title: 'Disciplina o arrepentimiento',
    message:
      'Todos debemos enfrentar uno de dos dolores: el dolor pasajero de la disciplina o el dolor mucho más pesado del arrepentimiento.',
    dailyAction: 'Elige la opción disciplinada en tu alimentación, estudio y gestión de riesgo durante las próximas 24 horas.',
  },
  {
    id: 'jr-books-14',
    pillar: 'Hábitos Diarios',
    mentor: 'Jim Rohn · Desarrollo Continuo',
    title: 'Trabaja más duro en ti mismo que en tu empleo',
    message:
      'Si trabajas duro en tu trabajo te ganas la vida; si trabajas duro en ti mismo construyes una fortuna y una mente sólida.',
    dailyAction: 'Lee al menos 10 páginas de un libro de formación financiera o desarrollo personal antes de dormir.',
  },
  {
    id: 'jr-circle-15',
    pillar: 'Mentalidad y Liderazgo',
    mentor: 'Jim Rohn · Entorno Estratégico',
    title: 'Cuida tu círculo de influencia',
    message:
      'Eres el promedio de las cinco personas con las que más tiempo y conversaciones compartes. Rodéate de quienes construyen, estudian y elevan tu estándar.',
    dailyAction: 'Inicia hoy una conversación constructiva con alguien que admiremos por su disciplina y claridad.',
  },
  {
    id: 'en-nightingale-16',
    pillar: 'Mentalidad y Liderazgo',
    mentor: 'Earl Nightingale · El Secreto Más Extraño',
    title: 'Nos convertimos en lo que pensamos la mayor parte del tiempo',
    message:
      'Tu mente produce exactamente aquello que siembras con constancia. Si enfocas tus pensamientos en soluciones y metas claras, tu conducta seguirá esa dirección.',
    dailyAction: 'Alimenta hoy tu mente con un objetivo constructivo en lugar de noticias o ruido negativo.',
  },
  {
    id: 'en-success-17',
    pillar: 'Metas y Claridad',
    mentor: 'Earl Nightingale · Definición de Éxito',
    title: 'El éxito es la realización progresiva de un ideal valioso',
    message:
      'No tienes que llegar a la cima mañana para sentirte realizado: cualquier persona que avanza paso a paso hacia una meta digna ya está teniendo éxito hoy.',
    dailyAction: 'Reconoce un avance real que hayas logrado esta semana y define el siguiente micro-paso.',
  },
  {
    id: 'sc-covey-18',
    pillar: 'Autodisciplina',
    mentor: 'Stephen R. Covey · Los 7 Hábitos',
    title: 'Entre estímulo y respuesta existe un espacio',
    message:
      'En ese espacio vive tu libertad para elegir tu reacción. No operes ni negocies por impulso emocional; elige tu respuesta desde tus principios.',
    dailyAction: 'Respira 10 segundos antes de responder a cualquier provocación o señal urgente del mercado.',
  },
  {
    id: 'sc-important-19',
    pillar: 'Productividad',
    mentor: 'Stephen R. Covey · Cuadrante II',
    title: 'Prioriza lo importante sobre lo meramente urgente',
    message:
      'Lo urgente grita para robarte el día; lo importante —planificar, formarte, prevenir riesgos, cuidar tu salud— espera en silencio pero define tu futuro.',
    dailyAction: 'Bloquea hoy 60 minutos en tu calendario exclusivamente para una actividad importante no urgente.',
  },
  {
    id: 'jc-atomic-20',
    pillar: 'Hábitos Diarios',
    mentor: 'James Clear · Hábitos Atómicos',
    title: 'Mejora un 1 % diario',
    message:
      'No subestimes los cambios pequeños: mejorar un 1 % cada día durante un año te hace 37 veces mejor. Tú no subes al nivel de tus metas, caes al nivel de tus sistemas.',
    dailyAction: 'Asegura hoy la versión de 5 minutos de tu hábito clave para no romper la cadena.',
  },
  {
    id: 'jc-identity-21',
    pillar: 'Hábitos Diarios',
    mentor: 'James Clear · Hábitos basados en identidad',
    title: 'Cada acción es un voto por la persona en quien te conviertes',
    message:
      'Cuando respetas tu plan de trading o cumples tu rutina matutina aunque no tengas ganas, estás votando por convertirte en un profesional consistente.',
    dailyAction: 'Pregúntate hoy antes de decidir: "¿Qué haría una persona disciplinada e inversionista en este momento?"',
  },
  {
    id: 'nh-hill-22',
    pillar: 'Mentalidad y Liderazgo',
    mentor: 'Napoleon Hill · Piense y Hágase Rico',
    title: 'La persistencia vence donde el talento se rinde',
    message:
      'La mayoría de las derrotas temporales existen para probar si tu propósito es genuino. Quien ajusta su estrategia sin abandonar su meta termina ganando.',
    dailyAction: 'Si un intento falló recientemente, analízalo con frialdad y vuelve a intentarlo con un enfoque mejorado.',
  },
  {
    id: 'nh-mastermind-23',
    pillar: 'Metas y Claridad',
    mentor: 'Napoleon Hill · Propósito Definido',
    title: 'Transforma tus deseos en un plan concreto con fecha',
    message:
      'Un deseo difuso nunca moviliza tu creatividad. Un plan escrito con monto, fecha límite y pasos diarios despierta tu determinación.',
    dailyAction: 'Revisa una meta de este trimestre y asígnale una fecha exacta y dos pasos semanales medibles.',
  },
  {
    id: 'zz-ziglar-24',
    pillar: 'Mentalidad y Liderazgo',
    mentor: 'Zig Ziglar · Actitud y Constancia',
    title: 'Tu actitud, no tu aptitud, determinará tu altitud',
    message:
      'La motivación necesita renovarse todos los días igual que la higiene física. Alimentar una actitud positiva y resolutiva es una decisión diaria, no un rasgo pasivo.',
    dailyAction: 'Comienza tu jornada anotando tres logros o recursos por los que sientes gratitud activa.',
  },
  {
    id: 'rs-sharma-25',
    pillar: 'Hábitos Diarios',
    mentor: 'Robin Sharma · El Club de las 5 de la Mañana',
    title: 'Domina tu primera hora de la mañana',
    message:
      'Cómo comienzas la primera hora tras despertar marca el tono cognitivo de toda tu jornada. Protege tu mañana del celular y úsala para moverte, reflexionar y aprender.',
    dailyAction: 'Evita redes sociales los primeros 30 minutos de mañana y dedica ese tiempo a claridad y lectura.',
  },
  {
    id: 'bt-abcde-26',
    pillar: 'Productividad',
    mentor: 'Brian Tracy · Método ABCDE',
    title: 'Di "no" a las tareas C, D y E',
    message:
      'La verdadera productividad no consiste en hacer más cosas rápido, sino en hacer únicamente lo que importa y eliminar con firmeza todo lo secundario.',
    dailyAction: 'Elimina o pospón intencionalmente una actividad de bajo valor de tu agenda de hoy.',
  },
  {
    id: 'bt-single-27',
    pillar: 'Productividad',
    mentor: 'Brian Tracy · Manejo Único (Single Handling)',
    title: 'Una tarea a la vez hasta terminarla',
    message:
      'Cambiar de pestaña o tarea cada pocos minutos destruye hasta el 40 % de tu capacidad cognitiva. El trabajo profundo requiere una sola prioridad frente a ti.',
    dailyAction: 'Cierra pestañas innecesarias y completa hoy un bloque de 35 minutos en una sola tarea.',
  },
  {
    id: 'bt-integrity-28',
    pillar: 'Autodisciplina',
    mentor: 'Brian Tracy · Integridad Personal',
    title: 'Cumple las promesas que te haces en privado',
    message:
      'Tu autoestima y confianza operativa crecen en proporción exacta a cuántas veces cumples la palabra que te diste a ti mismo sin testigos.',
    dailyAction: 'Elige una promesa pequeña contigo mismo para hoy (horario, estudio o riesgo) y cúmplela al 100 %.',
  },
  {
    id: 'bt-optimism-29',
    pillar: 'Mentalidad y Liderazgo',
    mentor: 'Brian Tracy · Optimismo Estratégico',
    title: 'Busca lo valioso dentro de cada obstáculo',
    message:
      'Las personas resilientes esperan encontrar una semilla de ventaja o aprendizaje en cada dificultad. Ese hábito mental convierte errores costosos en capital intelectual.',
    dailyAction: 'Toma un revés reciente y anota una mejora concreta de proceso que te dejó como enseñanza.',
  },
  {
    id: 'bt-prep-30',
    pillar: 'Hábitos Diarios',
    mentor: 'Brian Tracy · La Regla del Día Anterior',
    title: 'Planifica mañana antes de terminar hoy',
    message:
      'Escribir tu lista de tareas la noche anterior permite que tu mente subconsciente procese soluciones mientras duermes y amanezcas listo para ejecutar.',
    dailyAction: 'Antes de cerrar tu jornada de hoy, deja anotadas tus 3 prioridades de mañana.',
  },
  {
    id: 'sen-stoic-31',
    pillar: 'Autodisciplina',
    mentor: 'Séneca · Disciplina Estoica',
    title: 'No nos falta tiempo, desperdiciamos demasiado',
    message:
      'La vida y las jornadas laborales son suficientemente amplias para realizar grandes obras si invertimos el tiempo con intención en vez de diluirlo en distracciones.',
    dailyAction: 'Revisa cuánto tiempo pasó en aplicaciones pasivas ayer y recupéralo hoy para tu formación.',
  },
  {
    id: 'bt-value-32',
    pillar: 'Maestría Financiera',
    mentor: 'Brian Tracy · Ley de Compensación',
    title: 'Tus ingresos reflejan el valor que aportas',
    message:
      'La recompensa económica a largo plazo depende de tres factores: la necesidad de lo que haces, tu nivel de maestría al hacerlo y lo difícil que sea reemplazarte.',
    dailyAction: 'Pregúntate hoy cómo puedes elevar un 10 % la calidad y precisión de tu trabajo actual.',
  },
  {
    id: 'bt-focus-33',
    pillar: 'Metas y Claridad',
    mentor: 'Brian Tracy · La Ley de los Resultados',
    title: 'Mide resultados, no solo horas ocupadas',
    message:
      'Estar ocupado todo el día no equivale a avanzar. La disciplina financiera y profesional se mide por progreso verificable, no por sensación de cansancio.',
    dailyAction: 'Define hoy cómo se ve una jornada "ganada" con un resultado tangible y verificable.',
  },
  {
    id: 'jr-seasons-34',
    pillar: 'Maestría Financiera',
    mentor: 'Jim Rohn · Las Estaciones de la Vida',
    title: 'No desees que sea más fácil, desea ser más hábil',
    message:
      'Los mercados y la economía cambian de ciclo inevitablemente. Tu seguridad no viene de pedir condiciones fáciles, sino de fortalecer tu criterio y gestión de riesgo.',
    dailyAction: 'Repasa hoy tus reglas de protección de capital antes de tomar cualquier decisión financiera.',
  },
  {
    id: 'bt-finish-35',
    pillar: 'Autodisciplina',
    mentor: 'Brian Tracy · Principio de Finalización',
    title: 'Terminar genera dopamina real y confianza',
    message:
      'Dejar proyectos al 80 % agota tu energía mental. Llevar una tarea importante hasta el 100 % libera claridad y fortalece tu impulso para el siguiente reto.',
    dailyAction: 'Elige una tarea abierta al 70–90 % hoy y llévala hasta su cierre completo.',
  },
  {
    id: 'bt-vision-36',
    pillar: 'Metas y Claridad',
    mentor: 'Brian Tracy · Perspectiva a Largo Plazo',
    title: 'Piensa a cinco años, actúa con precisión hoy',
    message:
      'Las personas que construyen patrimonio piensan en horizontes de cinco a diez años al tomar decisiones cotidianas. Sacrifican gratificación rápida por libertad duradera.',
    dailyAction: 'Antes de una compra o decisión impulsiva hoy, evalúa si tu versión de dentro de 5 años te la agradecerá.',
  },
];
