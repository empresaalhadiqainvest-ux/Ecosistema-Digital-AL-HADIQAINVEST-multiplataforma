import React, { useState, useEffect, useRef } from 'react';
import { float32ToPCM16, arrayBufferToBase64, LiveAudioPlayer } from '../utils/audioUtils';

interface GeminiLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdvisorChat?: () => void;
}

type LiveStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error';

export const GeminiLiveVoiceModal: React.FC<GeminiLiveVoiceModalProps> = ({
  isOpen,
  onClose,
  onOpenAdvisorChat,
}) => {
  const [status, setStatus] = useState<LiveStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Listo para iniciar sesión de voz');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [transcriptLog, setTranscriptLog] = useState<Array<{ sender: 'user' | 'mentor'; text: string; time: string }>>([]);
  const [liveVolume, setLiveVolume] = useState<number>(0);

  // References for Web Audio, WebSocket & Player
  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Clean up resources
  const cleanUpAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (_) {}
      scriptProcessorRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (_) {}
      inputAudioCtxRef.current = null;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.close();
      audioPlayerRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_) {}
      wsRef.current = null;
    }
  };

  const startLiveSession = async () => {
    cleanUpAudio();

    setStatus('connecting');
    setStatusMessage('Estableciendo enlace de baja latencia con Gemini Live (gemini-3.8-live)...');

    try {
      // 1. Initialize audio player (24kHz)
      audioPlayerRef.current = new LiveAudioPlayer();
      audioPlayerRef.current.init();

      // 2. Request mic permission and setup 16kHz input context
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtxClass({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const micSource = inputCtx.createMediaStreamSource(stream);
      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Script processor for capturing PCM chunks (buffer size 4096 = ~256ms at 16kHz)
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      micSource.connect(analyser);
      analyser.connect(processor);
      processor.connect(inputCtx.destination);

      // 3. Connect WebSocket to server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/gemini/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setStatusMessage('En vivo • Habla con el Mentor de Al-Hadiqa');
        setTranscriptLog((prev) => [
          ...prev,
          {
            sender: 'mentor',
            text: 'Conexión de voz establecida. Te escucho atentamente. ¿Qué consulta o estrategia deseas evaluar hoy?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.audio) {
            setStatus('speaking');
            audioPlayerRef.current?.playChunk(data.audio, () => {
              setStatus('listening');
            });
          }

          if (data.text) {
            setTranscriptLog((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'mentor') {
                return [...prev.slice(0, -1), { ...last, text: last.text + ' ' + data.text }];
              } else {
                return [
                  ...prev,
                  {
                    sender: 'mentor',
                    text: data.text,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ];
              }
            });
          }

          if (data.interrupted) {
            audioPlayerRef.current?.interrupt();
            setStatus('listening');
            setStatusMessage('Interrupción detectada: escuchando al alumno...');
          }

          if (data.error) {
            console.error('Gemini Live server error:', data.error);
            setStatus('error');
            setStatusMessage(`Error del servidor: ${data.error}`);
          }
        } catch (err) {
          console.error('Error handling WebSocket live message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket live error:', err);
        setStatus('error');
        setStatusMessage('Error de conexión con el servidor de voz.');
      };

      ws.onclose = () => {
        setStatus('idle');
        setStatusMessage('Sesión de voz finalizada.');
      };

      // 4. Send audio chunks on audio process
      processor.onaudioprocess = (e) => {
        if (isMicMuted || ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate simple volume level for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setLiveVolume(Math.min(1, rms * 5));

        const pcm16 = float32ToPCM16(inputData);
        const base64 = arrayBufferToBase64(pcm16);

        ws.send(JSON.stringify({ audio: base64 }));
      };

      // Start Visualizer Canvas loop
      drawVisualizer();
    } catch (err: any) {
      console.error('Failed to start Live session:', err);
      setStatus('error');
      setStatusMessage(
        err.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado. Permite el acceso al micrófono en el navegador para hablar.'
          : `Error al iniciar voz: ${err.message || 'Error desconocido'}`
      );
    }
  };

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyser && status !== 'idle' && status !== 'error') {
        analyser.getByteFrequencyData(dataArray);
      }

      // Draw pulsing center orb and wave rings
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 55;
      const pulse = liveVolume * 35;

      // Glow gradient background
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        baseRadius + pulse + 40
      );
      if (status === 'speaking') {
        glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
        glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        glowGrad.addColorStop(0, 'rgba(197, 168, 128, 0.4)');
        glowGrad.addColorStop(1, 'rgba(197, 168, 128, 0)');
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + pulse + 40, 0, Math.PI * 2);
      ctx.fill();

      // Outer animated ripple rings
      ctx.strokeStyle = status === 'speaking' ? '#10B981' : '#C5A880';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Draw radial frequency bars
      const numBars = 36;
      for (let i = 0; i < numBars; i++) {
        const angle = (i * 2 * Math.PI) / numBars;
        const val = dataArray[i % bufferLength] || 0;
        const barHeight = (val / 255) * 45 * (isMicMuted ? 0.1 : 1);

        const x1 = centerX + Math.cos(angle) * (baseRadius + 5);
        const y1 = centerY + Math.sin(angle) * (baseRadius + 5);
        const x2 = centerX + Math.cos(angle) * (baseRadius + 10 + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + 10 + barHeight);

        ctx.strokeStyle = status === 'speaking' ? 'rgba(52, 211, 153, 0.8)' : 'rgba(197, 168, 128, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Center solid core
      ctx.fillStyle = status === 'speaking' ? '#059669' : '#C5A880';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
      ctx.fill();

      // Icon in center
      ctx.fillStyle = '#080E1E';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(status === 'speaking' ? '🔊' : isMicMuted ? '🔇' : '🎙️', centerX, centerY);
    };

    render();
  };

  const toggleMicMute = () => {
    setIsMicMuted((prev) => !prev);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.setMuted(!isMicMuted);
    }
  };

  const handleInterruptNow = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.interrupt();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: '[El usuario interrumpió la respuesta]' }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      startLiveSession();
    } else {
      cleanUpAudio();
      setStatus('idle');
    }
    return () => {
      cleanUpAudio();
    };
  }, [isOpen]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptLog]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemini-live-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(5, 10, 20, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          backgroundColor: 'var(--navy-dark, #080E1E)',
          border: '1px solid rgba(197, 168, 128, 0.4)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(197, 168, 128, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#E2E8F0',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.6rem',
            background: 'linear-gradient(90deg, #0B132B, #172554)',
            borderBottom: '1px solid rgba(197, 168, 128, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              }}
            >
              🎙️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  id="gemini-live-title"
                  style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#FFF',
                  }}
                >
                  Mentor de Voz en Tiempo Real
                </h2>
                <span
                  style={{
                    backgroundColor:
                      status === 'connected' || status === 'listening' || status === 'speaking'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    color:
                      status === 'connected' || status === 'listening' || status === 'speaking'
                        ? '#34D399'
                        : '#F87171',
                    border: '1px solid currentColor',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'currentColor',
                      display: 'inline-block',
                    }}
                  ></span>
                  {status === 'speaking'
                    ? 'Mentor Hablando'
                    : status === 'listening' || status === 'connected'
                    ? 'En Vivo (Live)'
                    : status === 'connecting'
                    ? 'Conectando...'
                    : 'Desconectado'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                Powered by Gemini Live API (gemini-3.8-live) • Audio PCM bidireccional
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#CBD5E1',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
            aria-label="Cerrar sesión de voz"
          >
            ✕
          </button>
        </div>

        {/* Visualizer Area */}
        <div
          style={{
            position: 'relative',
            height: '240px',
            backgroundColor: '#050A14',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            width={700}
            height={240}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Overlay Status Message */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              backgroundColor: 'rgba(11, 19, 43, 0.85)',
              border: '1px solid rgba(197, 168, 128, 0.3)',
              borderRadius: '20px',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              color: '#F1F5F9',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'none',
            }}
          >
            {statusMessage}
          </div>
        </div>

        {/* Live Transcript / Dialogue Box */}
        <div
          style={{
            height: '180px',
            overflowY: 'auto',
            padding: '1rem 1.4rem',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            fontSize: '0.84rem',
          }}
        >
          {transcriptLog.length === 0 ? (
            <div style={{ margin: 'auto', color: '#64748B', textAlign: 'center', fontStyle: 'italic' }}>
              Comienza a hablar al micrófono. Tus palabras y las respuestas habladas del mentor aparecerán aquí.
            </div>
          ) : (
            transcriptLog.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: entry.sender === 'user' ? '#93C5FD' : '#C5A880',
                    whiteSpace: 'nowrap',
                    fontSize: '0.75rem',
                  }}
                >
                  {entry.sender === 'user' ? 'Tú:' : 'Mentor:'}
                </span>
                <span style={{ color: '#E2E8F0', flex: 1, lineHeight: 1.5 }}>{entry.text}</span>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{entry.time}</span>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Interactive Controls Bar */}
        <div
          style={{
            padding: '1.2rem 1.6rem',
            backgroundColor: '#0B132B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Left Controls: Mute toggle & Interrupt */}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={toggleMicMute}
              style={{
                backgroundColor: isMicMuted ? '#EF4444' : '#1E293B',
                color: '#FFF',
                border: isMicMuted ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.55rem 1.1rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <span>{isMicMuted ? '🔇 Desactivar silencio' : '🎙️ Silenciar micro'}</span>
            </button>

            {status === 'speaking' && (
              <button
                type="button"
                onClick={handleInterruptNow}
                style={{
                  backgroundColor: 'rgba(234, 179, 8, 0.2)',
                  color: '#FACC15',
                  border: '1px solid #EAB308',
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span>✋ Interrumpir</span>
              </button>
            )}
          </div>

          {/* Right Controls: Switch to Chat & End Call */}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            {onOpenAdvisorChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdvisorChat();
                }}
                style={{
                  backgroundColor: 'rgba(197, 168, 128, 0.15)',
                  color: '#C5A880',
                  border: '1px solid rgba(197, 168, 128, 0.35)',
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span>💬 Cambiar a Chat de Texto</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#DC2626',
                color: '#FFF',
                border: 'none',
                padding: '0.55rem 1.3rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Finalizar Llamada
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '0.5rem 1.6rem',
            backgroundColor: '#070D1B',
            fontSize: '0.7rem',
            color: '#64748B',
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          Para una mejor experiencia con la voz en tiempo real, utiliza auriculares. Formación institucional Al-Hadiqa Invest.
        </div>
      </div>
    </div>
  );
};
