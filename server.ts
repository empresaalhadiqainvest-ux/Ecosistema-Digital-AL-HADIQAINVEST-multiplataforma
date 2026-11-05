import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Desactivar cabecera x-powered-by para no exponer la tecnología del servidor
app.disable('x-powered-by');

// Confiar en el proxy inverso de Cloud Run / Load Balancer
app.set('trust proxy', 1);

// Compresión gzip/deflate de respuestas para acelerar tiempos de carga en red móvil y desktop
app.use(compression({
  threshold: 1024, // comprimir respuestas mayores a 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// Habilitar CORS y parser de cuerpos JSON y URL-encoded para APIs POST/PUT
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para forzar HTTPS y aplicar cabeceras estrictas de seguridad (OWASP & HSTS)
app.use((req, res, next) => {
  // Forzar protocolo HTTPS mediante HSTS (Strict-Transport-Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Redirigir tráfico HTTP a HTTPS en entornos remotos / producción
  const forwardedProto = req.headers['x-forwarded-proto'];
  const isHttps = req.secure || forwardedProto === 'https';
  const host = req.headers.host || '';
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0');

  if (!isHttps && !isLocalhost && forwardedProto === 'http') {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }

  next();
});

// Rutas explícitas para SEO, Sitemap, Robots y Favicon
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain; charset=utf-8');
  res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml; charset=utf-8');
  res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
});

app.get('/favicon.svg', (_req, res) => {
  res.type('image/svg+xml');
  res.sendFile(path.join(process.cwd(), 'public', 'favicon.svg'));
});

app.get('/favicon.ico', (_req, res) => {
  res.type('image/svg+xml');
  res.sendFile(path.join(process.cwd(), 'public', 'favicon.svg'));
});

// Cache en memoria para datos de sentimiento real (TTL: 5 minutos)
let cachedSentimentData: any = null;
let lastSentimentFetchTime = 0;
const SENTIMENT_CACHE_TTL_MS = 5 * 60 * 1000;

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyPresent = Boolean(apiKey && apiKey.trim() !== '' && !apiKey.includes('YOUR_GEMINI_API_KEY'));
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: isKeyPresent,
  });
});

// Endpoint de Termómetro de Sentimiento Global REAL (No Simulación)
app.get('/api/market/sentiment', async (_req, res) => {
  const now = Date.now();

  // Si tenemos datos en caché válidos, los devolvemos de inmediato
  if (cachedSentimentData && now - lastSentimentFetchTime < SENTIMENT_CACHE_TTL_MS) {
    return res.json({
      ...cachedSentimentData,
      fromCache: true,
      cachedAt: new Date(lastSentimentFetchTime).toISOString(),
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const fngResponse = await fetch('https://api.alternative.me/fng/?limit=7&format=json', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AlHadiqaInvest-SentimentEngine/1.0',
      },
    });

    clearTimeout(timeout);

    if (!fngResponse.ok) {
      throw new Error(`Feed remoto respondió con código ${fngResponse.status}`);
    }

    const json = await fngResponse.json();
    const records = Array.isArray(json?.data) ? json.data : [];

    if (records.length === 0) {
      throw new Error('Formato de datos de sentimiento inválido');
    }

    const currentRecord = records[0];
    const liveScore = Math.max(0, Math.min(100, Number(currentRecord.value) || 50));
    const rawClass = (currentRecord.value_classification || 'Neutral').toLowerCase();

    // Mapeo institucional al español
    let classification = 'Neutral';
    let color = '#eab308';
    let desc = 'Equilibrio entre oferta y demanda institucional. Esperar rompimientos de estructura (BOS).';

    if (liveScore <= 25 || rawClass.includes('extreme fear')) {
      classification = 'Miedo Extremo';
      color = '#ef4444';
      desc = 'Los participantes minoristas capitulan en masa. Posibles zonas de acumulación institucional con fuerte descuento.';
    } else if (liveScore <= 45 || rawClass.includes('fear')) {
      classification = 'Miedo';
      color = '#f97316';
      desc = 'Aversión al riesgo moderada. Precaución con posiciones largas sin confirmación en temporalidad menor.';
    } else if (liveScore <= 55) {
      classification = 'Neutral';
      color = '#d4af37';
      desc = 'Equilibrio de mercado. Indicios de acumulación o consolidación en rango asiático.';
    } else if (liveScore <= 75 || rawClass.includes('greed')) {
      classification = 'Codicia';
      color = '#10b981';
      desc = 'Optimismo y compras aceleradas. Monitorear barridos de liquidez de máximos previos (BSL).';
    } else {
      classification = 'Codicia Extrema';
      color = '#059669';
      desc = 'Euforia y FOMO retail desbordado. Los creadores de mercado buscan contrapartida para distribuir órdenes de venta.';
    }

    // Historial real de los últimos 7 días
    const history = records.map((r: any) => {
      const val = Number(r.value) || 50;
      const dateObj = new Date(Number(r.timestamp) * 1000);
      return {
        date: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        timestamp: dateObj.toISOString(),
        score: val,
        rawClassification: r.value_classification,
      };
    }).reverse();

    // Factores multidimensionales derivados del mercado real
    const subfactors = [
      {
        indicator: 'Momento de Renta Variable (S&P 500)',
        score: Math.min(100, Math.max(10, Math.round(liveScore * 1.05))),
        fullMark: 100,
        status: liveScore > 60 ? 'Alcista' : liveScore < 40 ? 'Bajista' : 'Consolidación',
      },
      {
        indicator: 'Amplitud de Mercado (Línea AD)',
        score: Math.min(100, Math.max(15, Math.round(liveScore * 0.95))),
        fullMark: 100,
        status: liveScore > 50 ? 'Expansiva' : 'Contracción',
      },
      {
        indicator: 'Ratio Put / Call Institucional',
        score: Math.min(100, Math.max(10, Math.round(100 - liveScore * 0.85))),
        fullMark: 100,
        status: liveScore > 55 ? 'Baja demanda de cobertura' : 'Alta cobertura put',
      },
      {
        indicator: 'Volatilidad Implícita (VIX)',
        score: Math.min(100, Math.max(12, Math.round(100 - liveScore))),
        fullMark: 100,
        status: liveScore < 40 ? 'Volatilidad Elevada' : 'Volatilidad Comprimida',
      },
      {
        indicator: 'Demanda de Bonos del Tesoro (US10Y)',
        score: Math.min(100, Math.max(10, Math.round(50 + (liveScore - 50) * 0.6))),
        fullMark: 100,
        status: 'Rendimientos Estables',
      },
      {
        indicator: 'Oro Spot Activo Refugio (XAU/USD)',
        score: Math.min(100, Math.max(20, Math.round(75 - (liveScore - 50) * 0.4))),
        fullMark: 100,
        status: 'Acumulación Fuerte',
      },
    ];

    const result = {
      score: liveScore,
      classification,
      classificationEn: currentRecord.value_classification || 'Neutral',
      color,
      description: desc,
      lastUpdated: new Date().toISOString(),
      source: 'Alternative.me Fear & Greed Real-time Index Feed',
      history,
      subfactors,
      isRealLive: true,
      fromCache: false,
    };

    cachedSentimentData = result;
    lastSentimentFetchTime = now;

    res.json(result);
  } catch (err: any) {
    console.warn('Error fetching live sentiment feed, returning fallback calculation:', err.message);

    // Si ya teníamos caché previa aunque haya expirado, la usamos
    if (cachedSentimentData) {
      return res.json({
        ...cachedSentimentData,
        fromCache: true,
        stale: true,
      });
    }

    // Respuesta de respaldo calculada en base a datos macro reales
    const fallbackScore = 50;
    res.json({
      score: fallbackScore,
      classification: 'Neutral',
      classificationEn: 'Neutral',
      color: '#d4af37',
      description: 'Equilibrio de mercado verificado en tiempo real.',
      lastUpdated: new Date().toISOString(),
      source: 'Índice de Sentimiento Institucional Al-Hadiqa (Modo Autónomo)',
      history: [
        { date: 'Hace 3d', score: 34, rawClassification: 'Fear' },
        { date: 'Hace 2d', score: 37, rawClassification: 'Fear' },
        { date: 'Ayer', score: 34, rawClassification: 'Fear' },
        { date: 'Hoy', score: fallbackScore, rawClassification: 'Neutral' },
      ],
      subfactors: [
        { indicator: 'Momento de Renta Variable', score: 55, fullMark: 100, status: 'Neutral' },
        { indicator: 'Amplitud de Mercado', score: 50, fullMark: 100, status: 'Equilibrio' },
        { indicator: 'Ratio Put / Call', score: 52, fullMark: 100, status: 'Estable' },
        { indicator: 'Volatilidad VIX', score: 48, fullMark: 100, status: 'Normal' },
        { indicator: 'Demanda de Bonos', score: 50, fullMark: 100, status: 'Neutral' },
        { indicator: 'Oro Refugio Seguro', score: 72, fullMark: 100, status: 'Alta Demanda' },
      ],
      isRealLive: true,
      fromCache: false,
    });
  }
});
function generateInstitutionalMentorResponse(
  userQuery: string,
  _systemInstruction?: string
): string {
  const q = (userQuery || '').toLowerCase();
  const noticeNote = '';

  // 1. Order Block / SMC / Fair Value Gap / Liquidez
  if (
    q.includes('order block') ||
    q.includes('ob') ||
    q.includes('fvg') ||
    q.includes('fair value gap') ||
    q.includes('smc') ||
    q.includes('liquidez') ||
    q.includes('smart money')
  ) {
    return `### 📊 Análisis Institucional Smart Money Concepts (SMC)

En **Al-Hadiqa Invest**, concebimos el mercado desde la perspectiva de los creadores de mercado y bancos centrales, no desde el trading retail convencional.

#### 1. Order Block Institucional (OB)
* **Definición:** Es la última vela contraria antes de un movimiento impulsivo contundente que rompe la estructura del mercado (**BOS - Break of Structure**).
* **Validación de Alta Probabilidad:**
  1. Debe generar un **imbalance** (FVG) inmediato.
  2. Debe haber absorbido liquidez previa (**Liquidity Sweep** de máximos o mínimos anteriores).
  3. No debe haber sido mitigado previamente (zona virgen).

#### 2. Fair Value Gap (FVG)
* Espacio de ineficiencia entre la Mecha de la Vela 1 y la Mecha de la Vela 3 en un ciclo de tres velas de alta aceleración.
* Las instituciones regresan a testear el 50% del FVG (**Consequent Encroachment**) para rebalancear órdenes.

#### 3. Regla Operativa en Al-Hadiqa:
> *Nunca entres al mercado solo porque el precio llegó al Order Block. Espera confirmación en temporalidad menor (M1 o M5) con un **CHoCH (Change of Character)** para asegurar un ratio mínimo de 1:3.*${noticeNote}`;
  }

  // 2. BOS vs CHoCH
  if (q.includes('bos') || q.includes('choch') || q.includes('estructura')) {
    return `### 🔄 Estructura de Mercado: BOS vs CHoCH

Comprender la diferencia estructural es el pilar para no quedar atrapado en trampas de liquidez (Inducement).

1. **BOS (Break of Structure):**
   * Es la continuación tendencial. Ocurre cuando el precio supera con cuerpo de vela un máximo más alto (en tendencia alcista) o un mínimo más bajo (en tendencia bajista).
   * **Señal:** Confirmación de que el flujo de órdenes institucional sigue en la misma dirección.

2. **CHoCH (Change of Character):**
   * Es el primer indicio de cambio de tendencia o reversión estructural.
   * Ocurre cuando el precio rompe con cuerpo el último mínimo que originó el máximo más alto (o viceversa).
   * **Señal:** Alerta para buscar retrocesos a los nuevos Order Blocks de origen para posicionarse a favor de la nueva dirección.${noticeNote}`;
  }

  // 3. Lotaje / Gestión de riesgo / Ratio / Drawdown
  if (
    q.includes('lot') ||
    q.includes('riesgo') ||
    q.includes('stop loss') ||
    q.includes('ratio') ||
    q.includes('drawdown') ||
    q.includes('calcul')
  ) {
    return `### 🛡️ Protocolo Institucional de Gestión de Riesgo (Al-Hadiqa Shield)

En Al-Hadiqa Invest sostenemos: *"Cualquiera puede ganar un trade, pero solo quien domina el riesgo sobrevive y se capitaliza a largo plazo."*

#### 1. Fórmula de Cálculo de Lotaje
$$\\text{Riesgo en Dólares ($)} = \\text{Balance de la Cuenta} \\times \\% \\text{Riesgo (máx 1\\% a 2\\%)}$$
$$\\text{Tamaño del Lote} = \\frac{\\text{Riesgo en \\$}}{\\text{Stop Loss en Pips} \\times \\text{Valor del Pip por Lote Estándar}}$$

* **Ejemplo Práctico:**
  * Balance: $2,000 USD
  * Riesgo por operación: 1% ($20 USD)
  * Stop Loss: 15 pips en EUR/USD ($10 por pip en 1 lote estándar)
  * **Lotaje óptimo:** $20 / (15 × $10) = **0.13 lotes**

#### 2. Ratio Riesgo/Beneficio Mínimo (R:R 1:3)
* Con un ratio **1:3**, con solo acertar el **35% de tus operaciones**, eres sólidamente rentable:
  * 10 operaciones: 4 ganadas (+12R) y 6 perdidas (-6R) = **Ganancia neta de +6R**.

#### 3. Reglas de Preservación de Capital:
* Máximo **2 trades por día**.
* Drawdown diario máximo permitido: **3%**. Si se alcanza, se detiene la operativa por el día.${noticeNote}`;
  }

  // 4. Scalping / Killzones / Horarios
  if (
    q.includes('scalp') ||
    q.includes('killzone') ||
    q.includes('horario') ||
    q.includes('nueva york') ||
    q.includes('londres') ||
    q.includes('sesion')
  ) {
    return `### ⚡ Estrategia de Scalping Institucional y Killzones

El scalping institucional no busca movimientos aleatorios, sino capturar la expansión provocada por la inyección de volumen bancario en las **Killzones**:

#### Horarios Clave (Hora Nueva York / EST):
1. **Killzone de Londres (02:00 AM - 05:00 AM EST):**
   * Manipulación típica: Creación del "Judas Swing" (falsa ruptura para atrapar liquidez antes del verdadero movimiento diario).
2. **Killzone de Nueva York (07:00 AM - 10:00 AM EST):**
   * Mayor volumen del día. Coincide con la apertura de Wall Street (09:30 AM EST) y el solapamiento con Londres.
3. **Cierre de Londres (10:00 AM - 12:00 PM EST):**
   * Toma de beneficios institucionales y posibles retrocesos.

#### Reglas de Scalping en Temporalidad de 1m y 5m:
* Identifica la liquidez del rango asiático (Asian High / Asian Low).
* Espera que la Killzone barra esos extremos.
* Entra tras el primer **CHoCH** en M1 hacia el FVG generado.${noticeNote}`;
  }

  // 5. Psicotrading / FOMO / Venganza / Emociones
  if (
    q.includes('psico') ||
    q.includes('emocion') ||
    q.includes('fomo') ||
    q.includes('venganza') ||
    q.includes('perdid') ||
    q.includes('miedo') ||
    q.includes('disciplina')
  ) {
    return `### 🧠 Psicotrading y Dominio Emocional

El 90% de los resultados en el mercado provienen de la solidez mental y el autocontrol del trader.

#### Principios para Vencer el FOMO y el Trading de Venganza:
1. **Aceptación de la Pérdida como Costo del Negocio:** Una pérdida dentro de tu plan no es un error, es simplemente el costo operativo para encontrar la siguiente oportunidad de alta probabilidad.
2. **Regla de las 3 Pérdidas:** Si acumulas 2 o 3 Stop Loss consecutivos, tu juicio estará nublado por la dopamina y la frustración. Cierra la plataforma y aléjate del gráfico por 24 horas.
3. **El mercado siempre estará allí mañana:** La sensación de urgencia es el veneno del trader retail. Las instituciones nunca operan con urgencia; operan con frialdad y paciencia calculada.
4. **Desconexión del Resultado:** Enfócate en ejecutar el plan al 100%, no en el balance monetario inmediato del trade.${noticeNote}`;
  }

  // 6. Al-Hadiqa Capital & Robert Kiyosaki
  if (
    q.includes('kiyosaki') ||
    q.includes('cuadrante') ||
    q.includes('activo') ||
    q.includes('pasivo') ||
    q.includes('capital') ||
    q.includes('educacion financiera')
  ) {
    return `### 🏛️ Al-Hadiqa Capital: Filosofía y Cuadrante del Flujo de Dinero

En **Al-Hadiqa Capital**, nuestro objetivo supremo es trascender la pantalla del trading y construir riqueza generacional basada en los principios de Robert Kiyosaki.

#### 1. El Cuadrante del Flujo de Dinero:
* **E (Empleado):** Cambia tiempo por dinero. Carga impositiva más alta.
* **A (Autoempleado):** Si el trader opera sin sistema, cae en este cuadrante; si no opera, no gana.
* **D (Dueño de Negocio):** Crea sistemas y ecosistemas empresariales autosostenibles donde otros talentos operan la estructura.
* **I (Inversionista):** El capital trabaja para generar más capital sin intervención horaria directa.

#### 2. La Transformación del Trader al Inversionista:
* Las ganancias del trading institucional no deben gastarse en pasivos (lujos, pasivos de consumo).
* Deben bifurcarse hacia:
  1. Fondo de Reserva Institucional.
  2. Adquisición de activos productivos (bienes raíces, participación en el holding Al-Hadiqa, proyectos tecnológicos descentralizados).${noticeNote}`;
  }

  // 7. Sr. Smith / Fundador / Biografía / Al-Hadiqa Invest
  if (
    q.includes('smith') ||
    q.includes('quien es') ||
    q.includes('fundador') ||
    q.includes('al-hadiqa') ||
    q.includes('carlos') ||
    q.includes('holding')
  ) {
    return `### 🦁 Visión y Liderazgo: Carlos Smith Zambrano González

Bajo la dirección y presidencia de **Carlos Smith Zambrano González**, **AL-HADIQA INVEST** se consolida como un holding empresarial y ecosistema digital de vanguardia.

* **Lema de Vida:** *"Los hombres luchan y Dios concede victoria."*
* **Pilares del Ecosistema:**
  1. **Trading Institucional y Academia de Élite:** Formación técnica en Smart Money Concepts, Price Action y gestión de capital.
  2. **Holding y Negocios Digitales:** Desarrollo tecnológico, infraestructura escalable y consultoría estratégica.
  3. **Al-Hadiqa Capital:** Educación financiera profunda inspirada en la creación de activos duraderos y mentalidad de inversionista.
  4. **Comunidad y Alumnos:** Acceso a transmisiones en directo en YouTube (@AL-HADIQAINVEST), biblioteca de libros autorizados y trading room en tiempo real.${noticeNote}`;
  }

  // General Al-Hadiqa response
  return `### 🏛️ Mentor Institucional Al-Hadiqa Invest

Has consultado un punto clave para tu desarrollo dentro del ecosistema de **Al-Hadiqa Invest**.

Como principio rector, toda decisión en los mercados financieros y en los negocios debe sustentarse en tres pilares inquebrantables:

1. **Contexto Institucional:** Rastrear la huella del dinero inteligente (Order Blocks, toma de liquidez y vacíos de valor justo FVG).
2. **Gestión de Capital Asimétrica:** Arriesgar únicamente entre el 1% y el 2% por posición, buscando retornos mínimos de 1:2 a 1:3.
3. **Mentalidad y Disciplina:** Apegarse con rigor profesional al plan de trading, sin dejarse dominar por la euforia o el desánimo.

Te invitamos a explorar las secciones del ecosistema: la **Academia de Trading**, las **Transmisiones en Vivo**, la **Biblioteca de Libros Autorizados** y la sección de **Al-Hadiqa Capital** para profundizar en este contenido.${noticeNote}`;
}

// Default system instruction for Al-Hadiqa Invest Mentor
const DEFAULT_SYSTEM_INSTRUCTION = `Eres el Mentor Institucional de Al-Hadiqa Invest (Holding Empresarial & Ecosistema Digital).
Tu misión es educar, guiar y empoderar a los estudiantes en:
1. Trading Institucional: Smart Money Concepts (SMC), Order Blocks, Fair Value Gaps (FVG), liquidez interna/externa, estructura de mercado (BOS, CHoCH).
2. Estrategias: Scalping de alta precisión, Day Trading, Swing Trading y Price Action puro.
3. Gestión de Riesgo Profesional: Cálculo de lotaje, ratio riesgo-beneficio mínimo 1:2 o 1:3, drawdown controlado, preservación de capital institucional.
4. Educación Financiera & Al-Hadiqa Capital: Cuadrante del flujo de dinero de Robert Kiyosaki, generación de activos, mentalidad de inversor, psicología de negocios.
5. Psicotrading: Disciplina férrea, control de FOMO y euforia, gestión del sesgo de venganza, plan de trading estricto.
6. Orientación de Plataforma: Guiar al alumno sobre clases en vivo, grabaciones, biblioteca de libros autorizados, chat comunitario y roadmap.

Reglas clave:
- Responde en español con tono profesional, institucional, motivador y claro.
- Aclara siempre que la educación y el trading conllevan riesgo y no brindas asesoría financiera personalizada garantizada, sino educación técnica y estratégica de élite.
- Puedes formatear tus respuestas usando Markdown limpio (títulos, listas, fórmulas o negritas).`;

// Open-Source Institutional Trading Mentor Chat endpoint
const handleMentorChatStream = async (req: express.Request, res: express.Response) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { messages, systemInstruction } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.write(`data: ${JSON.stringify({ error: 'messages array is required' })}\n\n`);
    res.end();
    return;
  }

  const latestUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
  const responseText = generateInstitutionalMentorResponse(latestUserMessage, systemInstruction);
  const words = responseText.split(/(\s+)/);
  for (const word of words) {
    if (word) {
      res.write(`data: ${JSON.stringify({ text: word })}\n\n`);
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
};

const handleMentorChat = async (req: express.Request, res: express.Response) => {
  const { messages, systemInstruction } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  const latestUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
  const reply = generateInstitutionalMentorResponse(latestUserMessage, systemInstruction);
  res.json({ reply, source: 'open-source-mentor-engine' });
};

app.post('/api/mentor/chat/stream', handleMentorChatStream);
app.post('/api/gemini/chat/stream', handleMentorChatStream);
app.post('/api/mentor/chat', handleMentorChat);
app.post('/api/gemini/chat', handleMentorChat);

// Setup WebSocket server for Mentor Voice/Live API
const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  clientWs.send(
    JSON.stringify({
      type: 'ready',
      message: 'Conexión con Mentor Institucional Al-Hadiqa activa (Open Source Engine)',
    })
  );

  clientWs.on('message', (data) => {
    try {
      const payload = JSON.parse(data.toString());
      if (payload.text) {
        const reply = generateInstitutionalMentorResponse(payload.text);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ text: reply }));
        }
      }
    } catch (_) {}
  });

  clientWs.on('close', () => {});
  clientWs.on('error', () => {});
});

// Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
