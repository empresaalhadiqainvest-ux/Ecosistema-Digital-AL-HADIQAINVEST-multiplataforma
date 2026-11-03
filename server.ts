import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Comprehensive Open-Source Institutional Mentor Engine for Al-Hadiqa Invest
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
