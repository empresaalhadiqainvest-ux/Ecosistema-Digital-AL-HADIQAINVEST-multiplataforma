import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client (uses process.env.GEMINI_API_KEY)
const ai = new GoogleGenAI();

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
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Gemini Multi-turn Chat endpoint (Streaming with SSE)
app.post('/api/gemini/chat/stream', async (req, res) => {
  try {
    const { messages, model = 'gemini-3.8-flash', systemInstruction } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    // Prepare contents array
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }));

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const streamResponse = await ai.models.generateContentStream({
      model: model,
      contents,
      config: {
        systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
      }
    });

    for await (const chunk of streamResponse) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini chat streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Error generating response' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream error' })}\n\n`);
      res.end();
    }
  }
});

// Gemini Standard Chat endpoint (non-streaming fallback)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, model = 'gemini-3.8-flash', systemInstruction } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: model,
      contents,
      config: {
        systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({ error: error.message || 'Error communicating with Gemini' });
  }
});

// Setup WebSocket server for Gemini Live Voice API (gemini-3.8-live)
const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Gemini Live] Client connected');

  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `Eres el Mentor de Trading y Educación Financiera por voz de Al-Hadiqa Invest.
Tu personalidad es profesional, institucional, serena, enfocada y motivadora.
Hablas en español neutro fluido.
Explica conceptos como Smart Money Concepts, Order Blocks, Liquidez, FVG, gestión de riesgo de manera concisa y hablada (1 a 3 frases por intervención para que la conversación sea natural y dinámica).
No des respuestas excesivamente largas al hablar. Mantén el ritmo conversacional como un mentor privado de trading al lado del alumno.`,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          for (const part of message.serverContent?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (part.text) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ text: part.text }));
              }
            }
          }
          if (message.serverContent?.interrupted) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ closed: true }));
          }
        },
        onerror: (err: any) => {
          console.error('[Gemini Live Session Error]', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err.message || 'Live session error' }));
          }
        }
      },
    });

    clientWs.send(JSON.stringify({ type: 'ready', message: 'Conexión con Mentor de Voz Al-Hadiqa lista' }));

    clientWs.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio && session) {
          session.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (payload.text && session) {
          session.send({
            clientContent: {
              turns: [{
                role: 'user',
                parts: [{ text: payload.text }],
              }],
              turnComplete: true,
            }
          });
        }
      } catch (e: any) {
        console.error('[Gemini Live Error parsing message]', e);
      }
    });

    clientWs.on('close', () => {
      console.log('[Gemini Live] Client disconnected');
      try {
        if (session) session.close();
      } catch (_) {}
    });

    clientWs.on('error', (err) => {
      console.error('[Gemini Live Client WebSocket Error]', err);
    });

  } catch (error: any) {
    console.error('[Gemini Live Setup Error]', error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: error.message || 'Failed to initialize Live Session' }));
      clientWs.close();
    }
  }
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
    app.get('*', (_req, res) => {
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
