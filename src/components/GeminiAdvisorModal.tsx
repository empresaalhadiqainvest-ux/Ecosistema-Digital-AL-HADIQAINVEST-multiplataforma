import React, { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface GeminiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveVoice?: () => void;
}

export type MentorRole = 'sr_smith' | 'smc_institutional' | 'scalping_master' | 'risk_psychology' | 'capital_kiyosaki';

interface RoleConfig {
  id: MentorRole;
  title: string;
  badge: string;
  avatar: string;
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
    systemInstruction: `Eres el Sr. Smith, fundador y director de Al-Hadiqa Invest. Tu filosofía combina la disciplina férrea del trading institucional, la visión del holding empresarial y el lema: "Cultivando el crecimiento, nutriendo su capital". Tu tono es sereno, seguro, exigente pero mentor y motivador. Guías en principios clave de negocios, trading de alta precisión y mentalidad de inversor.`,
    welcomeMessage: 'Un cordial saludo. Soy el Sr. Smith. En Al-Hadiqa Invest no buscamos apostar en el mercado, sino operar con la precisión de las instituciones financieras y cultivar un capital duradero. ¿En qué aspecto de tu formación o análisis deseas profundizar hoy?',
    quickPrompts: [
      '¿Cuál es la filosofía institucional de Al-Hadiqa?',
      '¿Cómo desarrollar disciplina férrea para operar?',
      '¿Qué requisitos debo cumplir para el rango de Alumno Verificado?',
      '¿Cómo estructurar mi rutina diaria de trading?',
    ],
  },
  smc_institutional: {
    id: 'smc_institutional',
    title: 'Especialista SMC & Liquidez',
    badge: 'Smart Money Concepts',
    avatar: '📈',
    systemInstruction: `Eres el Master en Smart Money Concepts (SMC) de Al-Hadiqa Invest. Eres un analista institucional experto en Order Blocks (OB), Breakers, Mitigation Blocks, Fair Value Gaps (FVG), liquidez interna y externa (BSL / SSL), estructura de mercado (BOS y CHoCH), y Wyckoff (Acumulación/Distribución). Explicas con diagramas ASCII y conceptos claros paso a paso.`,
    welcomeMessage: 'Bienvenido a la mesa institucional. Aquí rastreamos la huella del dinero inteligente (bancos y fondos). Analizamos estructuras, vacíos de liquidez y zonas de alta probabilidad. ¿Qué activo o concepto técnico estás evaluando?',
    quickPrompts: [
      '¿Cómo diferenciar un Order Block genuino de uno débil?',
      'Explícame la diferencia entre BOS y CHoCH con un ejemplo',
      '¿Cómo utilizar un Fair Value Gap (FVG) para entradas óptimas?',
      '¿Cómo identificar tomas de liquidez (liquidity sweeps)?',
    ],
  },
  scalping_master: {
    id: 'scalping_master',
    title: 'Scalper de Alta Precisión',
    badge: '1m / 5m Execution',
    avatar: '⚡',
    systemInstruction: `Eres el Scalper Senior de Al-Hadiqa Invest. Te especializas en ejecuciones rápidas en temporalidades de 1 minuto a 5 minutos, Price Action puro, lectura de volumen y velas institucionales, sesiones operativas (Londres y New York Killzones), y gestión milimétrica de ratios R:R.`,
    welcomeMessage: 'Listo para la acción en temporalidades cortas. En scalping, los spreads, las Killzones y el timing milimétrico lo son todo. Dime: ¿cuál es tu par o índice favorito y qué sesión operas?',
    quickPrompts: [
      '¿Cuáles son los mejores horarios para la Killzone de Nueva York?',
      'Estrategia de scalping en 1m basada en barrido de liquidez',
      '¿Cómo evitar el deslizamiento (slippage) y sobreoperar?',
      'Reglas de salida rápida si el trade no reacciona al instante',
    ],
  },
  risk_psychology: {
    id: 'risk_psychology',
    title: 'Gestión de Riesgo & Psicotrading',
    badge: 'Preservación de Capital',
    avatar: '🛡️',
    systemInstruction: `Eres el Director de Riesgo y Psicólogo de Trading de Al-Hadiqa Invest. Tu regla de oro es: "La primera regla del dinero institucional no es ganar, es NUNCA perder el capital". Dominas el cálculo de tamaño de posición, ratios asimétricos (mínimo 1:2 o 1:3), control de drawdown, manejo de rachas de pérdidas, eliminación del FOMO y del trading de venganza.`,
    welcomeMessage: 'Tu capital es tu oxígeno en el mercado. Sin gestión de riesgo y sin control emocional, hasta la mejor estrategia fracasará. Calcularemos juntos tus parámetros de riesgo y blindaremos tu psicología.',
    quickPrompts: [
      'Calcula mi lotaje para EUR/USD con $2,000 arriesgando el 1% y 15 pips SL',
      '¿Cómo superar la frustración de 3 pérdidas consecutivas?',
      '¿Qué reglas debo poner en mi plan de trading para frenar el FOMO?',
      '¿Por qué un ratio 1:3 te hace rentable con solo el 40% de aciertos?',
    ],
  },
  capital_kiyosaki: {
    id: 'capital_kiyosaki',
    title: 'Al-Hadiqa Capital & Mentalidad',
    badge: 'Kiyosaki & Activos',
    avatar: '🏛️',
    systemInstruction: `Eres el Creador del programa Al-Hadiqa Capital, especializado en educación financiera profunda, mentalidad de riqueza, el Cuadrante del Flujo de Dinero de Robert Kiyosaki (E, A, D, I), generación de activos frente a pasivos, y la transformación de traders en empresarios e inversionistas patrimoniales.`,
    welcomeMessage: 'Bienvenido a Al-Hadiqa Capital. Nuestro objetivo trasciende el gráfico: transformamos los rendimientos del trading en activos productivos y negocios sostenibles según los principios de los grandes inversionistas. ¿Qué meta financiera estás persiguiendo?',
    quickPrompts: [
      '¿Cómo transicionar del cuadrante Autoempleado (A) al de Inversionista (I)?',
      '¿Cuál es la diferencia entre un activo real y un pasivo según Kiyosaki?',
      '¿Cómo reinvertir los beneficios del trading en fuentes de ingreso pasivo?',
      'Hábitos diarios para cultivar mentalidad de abundancia y riqueza',
    ],
  },
};

export const GeminiAdvisorModal: React.FC<GeminiAdvisorModalProps> = ({ isOpen, onClose, onOpenLiveVoice }) => {
  const [selectedRole, setSelectedRole] = useState<MentorRole>('sr_smith');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Chat history per role
  const [conversations, setConversations] = useState<Record<MentorRole, ChatMessage[]>>(() => ({
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
  }));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentRoleConfig = ROLES[selectedRole];
  const currentMessages = conversations[selectedRole] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      textareaRef.current?.focus();
    }
  }, [isOpen, selectedRole, currentMessages.length]);

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

    // Optimistically insert placeholder message
    setConversations((prev) => ({
      ...prev,
      [selectedRole]: [...newHistory, initialBotMsg],
    }));

    try {
      // Build server request payload
      const messagesPayload = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Try streaming endpoint first
      const res = await fetch('/api/gemini/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload,
          model: selectedModel,
          systemInstruction: currentRoleConfig.systemInstruction,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setConversations((prev) => ({
                    ...prev,
                    [selectedRole]: prev[selectedRole].map((m) =>
                      m.id === botMsgId ? { ...m, content: accumulatedText } : m
                    ),
                  }));
                } else if (parsed.error) {
                  const isKeyError =
                    typeof parsed.error === 'string' &&
                    (parsed.error.includes('API key') ||
                      parsed.error.includes('API_KEY_INVALID') ||
                      parsed.error.includes('GEMINI_API_KEY'));
                  const friendlyNotice = isKeyError
                    ? '💡 Para habilitar respuestas en vivo con Gemini 3.8 Flash, puedes configurar tu clave en el panel de **Settings > Secrets**.'
                    : `⚠️ ${parsed.error}`;
                  accumulatedText = accumulatedText ? `${accumulatedText}\n\n${friendlyNotice}` : friendlyNotice;
                  setConversations((prev) => ({
                    ...prev,
                    [selectedRole]: prev[selectedRole].map((m) =>
                      m.id === botMsgId ? { ...m, content: accumulatedText } : m
                    ),
                  }));
                }
              } catch (_) {
                // Ignore partial JSON parse chunks
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('Streaming notice, switching to institutional mentor endpoint:', err?.message || err);
      try {
        const fallbackRes = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
            model: selectedModel,
            systemInstruction: currentRoleConfig.systemInstruction,
          }),
        });
        const fallbackData = await fallbackRes.json();
        const reply =
          fallbackData.reply ||
          '### 🏛️ Mentor Institucional Al-Hadiqa\n\nEl mercado institucional recompensa la paciencia y el rigor técnico. Aplica siempre tu ratio 1:3 y valida las estructuras en Smart Money Concepts.\n\n*Nota: Para sincronizar Gemini 3.8 Flash en vivo, puedes verificar tu clave en Settings > Secrets.*';

        setConversations((prev) => ({
          ...prev,
          [selectedRole]: prev[selectedRole].map((m) =>
            m.id === botMsgId ? { ...m, content: reply } : m
          ),
        }));
      } catch (_fallbackErr: any) {
        setConversations((prev) => ({
          ...prev,
          [selectedRole]: prev[selectedRole].map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content:
                    '🏛️ **Mentoría Institucional Al-Hadiqa Invest**\n\nRecuerda la regla de oro: *"La primera regla del capital institucional no es ganar, sino nunca perder el capital acumulado."* Mantén siempre tu gestión de riesgo de 1% a 2% por trade.\n\n*(Puedes continuar consultando las estrategias de SMC, Scalping o Al-Hadiqa Capital en este chat).*',
                }
              : m
          ),
        }));
      }
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
    a.download = `AlHadiqa-Mentor-${selectedRole}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemini-advisor-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '960px',
          height: '92vh',
          maxHeight: '850px',
          backgroundColor: 'var(--navy-dark, #080E1E)',
          border: '1px solid rgba(197, 168, 128, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px rgba(197, 168, 128, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#E2E8F0',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '1rem 1.4rem',
            background: 'linear-gradient(90deg, rgba(11, 19, 43, 0.98), rgba(20, 32, 60, 0.98))',
            borderBottom: '1px solid rgba(197, 168, 128, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #C5A880, #9A7B4F)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 4px 12px rgba(197, 168, 128, 0.35)',
              }}
            >
              {currentRoleConfig.avatar}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  id="gemini-advisor-title"
                  style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#FFF',
                    letterSpacing: '0.02em',
                  }}
                >
                  {currentRoleConfig.title}
                </h2>
                <span
                  style={{
                    backgroundColor: 'rgba(197, 168, 128, 0.18)',
                    color: '#C5A880',
                    border: '1px solid rgba(197, 168, 128, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                  }}
                >
                  {currentRoleConfig.badge}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                Asistente y Mentor Educativo con Google Gemini | Al-Hadiqa Invest
              </p>
            </div>
          </div>

          {/* Right Action Controls: Voice button & Model Switcher & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {onOpenLiveVoice && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLiveVoice();
                }}
                className="btn btn--emerald"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  borderColor: '#10B981',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                }}
                title="Iniciar conversación hablada en tiempo real (gemini-3.8-live)"
              >
                <span>🎙️</span>
                <span style={{ fontWeight: 600 }}>Modo Voz en Vivo</span>
              </button>
            )}

            {/* Model Selector Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <label htmlFor="gemini-model-select" style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Modelo:
              </label>
              <select
                id="gemini-model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#C5A880',
                  border: '1px solid rgba(197, 168, 128, 0.3)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Recomendado)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Rápido)</option>
                <option value="gemini-4-argon">gemini-4-argon (Razonamiento Complejo)</option>
              </select>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'all 0.15s ease',
              }}
              aria-label="Cerrar modal de mentor IA"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Roles Navigation Bar */}
        <div
          style={{
            padding: '0.5rem 1.4rem',
            backgroundColor: 'rgba(11, 19, 43, 0.75)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {(Object.keys(ROLES) as MentorRole[]).map((roleKey) => {
            const role = ROLES[roleKey];
            const isActive = selectedRole === roleKey;
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => setSelectedRole(roleKey)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  border: isActive
                    ? '1px solid #C5A880'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isActive
                    ? 'rgba(197, 168, 128, 0.15)'
                    : 'rgba(15, 23, 42, 0.6)',
                  color: isActive ? '#C5A880' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{role.avatar}</span>
                <span>{role.title.split('|')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            backgroundColor: '#070D1B',
          }}
        >
          {currentMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    maxWidth: isUser ? '85%' : '90%',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isUser ? '#1E293B' : 'rgba(197, 168, 128, 0.2)',
                      border: isUser ? '1px solid rgba(255,255,255,0.1)' : '1px solid #C5A880',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {isUser ? '👤' : currentRoleConfig.avatar}
                  </div>

                  <div
                    style={{
                      backgroundColor: isUser
                        ? '#1E293B'
                        : 'rgba(15, 23, 42, 0.85)',
                      border: isUser
                        ? '1px solid rgba(148, 163, 184, 0.25)'
                        : '1px solid rgba(197, 168, 128, 0.22)',
                      padding: '0.9rem 1.1rem',
                      borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                      color: isUser ? '#F8FAFC' : '#E2E8F0',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    }}
                  >
                    {/* Header info inside message */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        marginBottom: '0.4rem',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        paddingBottom: '0.25rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: isUser ? '#94A3B8' : '#C5A880',
                        }}
                      >
                        {isUser ? 'Tú (Estudiante)' : currentRoleConfig.title}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{msg.timestamp}</span>
                    </div>

                    {/* Content */}
                    <div
                      style={{
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.content || (
                        <span style={{ color: '#94A3B8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="live-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#C5A880' }}></span>
                          Pensando y redactando análisis institucional...
                        </span>
                      )}
                    </div>

                    {/* Actions on model message */}
                    {!isUser && msg.content && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          marginTop: '0.65rem',
                          paddingTop: '0.4rem',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedId === msg.id ? '#10B981' : '#94A3B8',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            padding: '2px 4px',
                          }}
                          title="Copiar respuesta"
                        >
                          {copiedId === msg.id ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Chips */}
        <div
          style={{
            padding: '0.55rem 1.4rem',
            backgroundColor: 'rgba(11, 19, 43, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '0.45rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {currentRoleConfig.quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(promptText)}
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(197, 168, 128, 0.25)',
                color: '#CBD5E1',
                padding: '0.35rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.73rem',
                whiteSpace: 'nowrap',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) (e.currentTarget.style.borderColor = '#C5A880');
              }}
              onMouseLeave={(e) => {
                if (!isLoading) (e.currentTarget.style.borderColor = 'rgba(197, 168, 128, 0.25)');
              }}
            >
              💡 {promptText}
            </button>
          ))}
        </div>

        {/* Input Bar Area */}
        <div
          style={{
            padding: '0.9rem 1.4rem 1.1rem 1.4rem',
            backgroundColor: 'rgba(8, 14, 30, 0.98)',
            borderTop: '1px solid rgba(197, 168, 128, 0.2)',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{
                flex: 1,
                position: 'relative',
                backgroundColor: '#0F172A',
                border: '1px solid rgba(197, 168, 128, 0.3)',
                borderRadius: '12px',
                padding: '0.45rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
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
                placeholder={`Consulta a ${currentRoleConfig.title}... (Shift+Enter para salto de línea)`}
                rows={2}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#FFF',
                  fontSize: '0.86rem',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.68rem',
                  color: '#64748B',
                  marginTop: '4px',
                }}
              >
                <span>Google Gemini Engine ({selectedModel})</span>
                <span>Enter para enviar</span>
              </div>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="btn btn--primary"
              style={{
                height: '52px',
                padding: '0 1.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #C5A880, #9A7B4F)',
                borderColor: '#C5A880',
                color: '#080E1E',
                fontWeight: 700,
                borderRadius: '12px',
                opacity: isLoading || !inputPrompt.trim() ? 0.6 : 1,
                cursor: isLoading || !inputPrompt.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <span>⏳</span>
              ) : (
                <>
                  <span>Enviar</span>
                  <span>➤</span>
                </>
              )}
            </button>
          </form>

          {/* Footer controls: Clear chat, export transcript, disclaimer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.65rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleClearHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Reiniciar conversación
              </button>
              <button
                type="button"
                onClick={handleExportTranscript}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Descargar transcripción (.txt)
              </button>
            </div>

            <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
              ⚖️ Contenido pedagógico institucional. Sin asesoría financiera individualizada.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
