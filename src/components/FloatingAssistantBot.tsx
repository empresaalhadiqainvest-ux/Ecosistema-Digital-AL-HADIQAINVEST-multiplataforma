import React, { useState, useRef, useEffect } from 'react';

interface FloatingAssistantBotProps {
  onOpenStudentPortal?: () => void;
  onOpenAdvisorChat?: () => void;
  onOpenLiveVoice?: () => void;
}

interface MessageItem {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  action?: {
    label: string;
    target: string;
    onClick?: () => void;
  };
}

interface QuickTopic {
  id: string;
  label: string;
  icon: string;
  query: string;
}

const QUICK_TOPICS: QuickTopic[] = [
  { id: 'roadmap', icon: '🧭', label: '¿Cuál es la ruta de estudio / Roadmap?', query: 'cual es la ruta o roadmap de aprendizaje' },
  { id: 'clases', icon: '🎥', label: '¿Cómo entrar a una clase?', query: 'como entrar a una clase' },
  { id: 'chat', icon: '💬', label: '¿Cómo usar el chat?', query: 'como usar el chat' },
  { id: 'biblioteca', icon: '📚', label: '¿Dónde está la biblioteca?', query: 'donde esta la biblioteca y descargar' },
  { id: 'permisos', icon: '🔑', label: '¿Cómo funcionan los permisos?', query: 'como funcionan los permisos de alumno' },
  { id: 'capital', icon: '🏛️', label: '¿Qué es Al-Hadiqa Capital?', query: 'que es al-hadiqa capital y kiyosaki' },
  { id: 'broker', icon: '⚖️', label: '¿Cómo está auditado el bróker JustMarkets?', query: 'auditoria y 5 fuentes del broker justmarkets registro' },
  { id: 'asesoria', icon: '⚖️', label: '¿Ofrecen asesoría financiera?', query: 'ofrecen asesoria financiera personalizada' },
  { id: 'fundador', icon: '🦁', label: '¿Quién es Carlos Smith Zambrano?', query: 'quien es carlos smith zambrano biografia fundador' },
  { id: 'notificaciones', icon: '🔔', label: '¿Cómo funcionan las alertas?', query: 'como funcionan las notificaciones y correos' },
];

export const FloatingAssistantBot: React.FC<FloatingAssistantBotProps> = ({
  onOpenStudentPortal,
  onOpenAdvisorChat,
  onOpenLiveVoice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [hasNewTip, setHasNewTip] = useState(true);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '¡Hola y bienvenido a AL-HADIQA INVEST! 🦁\n«Cultivando el crecimiento, nutriendo su capital»\n\nSoy tu Asistente Pedagógico integrado. Estoy aquí para guiarte en el uso de la plataforma: cómo entrar a una clase en vivo, interactuar en el chat, encontrar libros en la biblioteca y comprender tus permisos de alumno.',
      timestamp: 'Ahora',
    },
    {
      id: 'welcome-compliance',
      sender: 'bot',
      text: '⚖️ AVISO DE COMPLIANCE JUSTMARKETS:\nTodo el contenido de la plataforma es estrictamente educativo. No ofrezco asesoría financiera personalizada ni señales de inversión.',
      timestamp: 'Ahora',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasNewTip(false);
    }
  }, [isOpen, messages]);

  const navigateToSection = (elementId: string) => {
    setIsOpen(false);
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const processBotResponse = (rawQuery: string): { reply: string; action?: MessageItem['action'] } => {
    const q = rawQuery.toLowerCase().trim();

    // 0. Roadmap & Ruta de Aprendizaje
    if (q.includes('roadmap') || q.includes('ruta') || q.includes('paso') || q.includes('camino') || q.includes('empezar') || q.includes('onboarding')) {
      return {
        reply:
          '🧭 ROADMAP DEL ALUMNO: DEL ONBOARDING AL TRADING INSTITUCIONAL:\n\n' +
          'Nuestra metodología se estructura en 5 fases progresivas:\n' +
          '• Paso 01: Onboarding, Cimientos de Seguridad & Configuración de Cuenta.\n' +
          '• Paso 02: Acción del Precio, Estructura de Mercado (BOS, CHoCH) & Velas Japonesas.\n' +
          '• Paso 03: Psicotrading, Cuadrante de Kiyosaki & la Regla del 1% de Riesgo (Al-Hadiqa Capital).\n' +
          '• Paso 04: Smart Money Concepts (SMC): Order Blocks, Fair Value Gaps (FVG) & Killzones.\n' +
          '• Paso 05: Scalping de Alta Precisión en 1m y Aprobación de Cuentas Fondeadas.\n\n' +
          'Puedes interactuar con los hitos en el componente interactivo de la página principal para marcar tu progreso.',
        action: {
          label: 'Explorar Roadmap Interactivo 🧭',
          target: 'roadmap',
          onClick: () => navigateToSection('roadmap'),
        },
      };
    }

    // 0.5 Biografía de Carlos Smith Zambrano González (Fundador & CEO)
    if (q.includes('carlos smith') || q.includes('zambrano') || q.includes('fundador') || q.includes('cara') || q.includes('biografia') || q.includes('quien es') || q.includes('presidente') || q.includes('ceo')) {
      return {
        reply:
          '🦁 CARLOS SMITH ZAMBRANO GONZÁLEZ (FUNDADOR, CEO & PRESIDENTE):\n\n' +
          '• Orígenes y Raíces: Nacido el 9 de octubre de 1998 en Delta Amacuro, natural de Barrancas del Orinoco (la población habitada más antigua de Venezuela y América, vinculada a las culturas barrancoide, saladoide y el pueblo Warao).\n' +
          '• Formación y Temple: Creció en educación pública; obtuvo el título de TSU en Investigación Penal y formó parte como militar venezolano. Afrontó con temple y resiliencia ser ex preso político del régimen venezolano, forjando un espíritu inquebrantable de lucha por la libertad.\n' +
          '• AL-HADIQA INVEST: Lidera el holding empresarial y ecosistema digital enfocado en soluciones tecnológicas, desarrollo de software, comercio electrónico y educación financiera institucional autosostenible.\n' +
          '• Filosofía: «Los hombres luchan y Dios concede victoria».',
        action: {
          label: 'Ver Biografía Completa y Retrato 🦁',
          target: 'fundador',
          onClick: () => navigateToSection('fundador'),
        },
      };
    }

    // 1. Sala de Streaming & Clases en Vivo Oficiales
    if (q.includes('streaming') || q.includes('youtube') || q.includes('canal') || q.includes('@al-hadiqa') || q.includes('clase') || q.includes('entrar') || q.includes('en vivo') || q.includes('transmision') || q.includes('stream') || q.includes('sala')) {
      return {
        reply:
          '🔴 SALA DE STREAMING & TRANSMISIONES OFICIALES:\n\n' +
          '• Canal Oficial de Emisión: www.youtube.com/@AL-HADIQAINVEST\n' +
          '• Emisión Controlada por el Admin: Sr.smith inicia los directos, añade enlaces manuales de YouTube Live según la sesión y emite notificaciones instantáneas a toda la academia.\n' +
          '• Acceso de los Alumnos: Los estudiantes registrados acceden desde sus cuentas para desbloquear el reproductor en tiempo real, interactuar con preguntas en directo y recibir alertas automáticas con sonido.\n' +
          '• Clases Grabadas: El archivo completo de masterclasses de SMC, liquidez y psicotrading queda disponible para su repaso en cualquier momento.',
        action: {
          label: 'Ir a Sala de Streaming 🔴',
          target: 'streaming',
          onClick: () => navigateToSection('streaming'),
        },
      };
    }

    // 2. Chat comunitario
    if (q.includes('chat') || q.includes('mensaj') || q.includes('comunidad') || q.includes('reglas') || q.includes('spam') || q.includes('silenciar')) {
      return {
        reply:
          '💬 CÓMO USAR EL CHAT COMUNITARIO:\n\n' +
          '• Salas Disponibles: Tienes la Sala General de la Clase en Vivo y 4 Salas Temáticas de Mercado (Forex Institucional, Cripto & DeFi, Índices Bursátiles y Acciones & Commodities).\n' +
          '• Multimedia: Puedes enviar emojis, imágenes de análisis técnico y documentos PDF (hasta 10 MB).\n' +
          '• Normas de Seguridad: Está activo un filtro anti-spam, bloqueo de enlaces sospechosos y límite de 5 mensajes por minuto para garantizar una convivencia profesional.\n' +
          '• Moderación: El administrador puede silenciar el chat de forma global o aplicar modo solo lectura cuando se está explicando una lección clave.',
        action: {
          label: 'Abrir Chat Comunitario 💬',
          target: 'chat',
          onClick: () => navigateToSection('chat'),
        },
      };
    }

    // 3. Biblioteca de trading y descargas
    if (q.includes('biblioteca') || q.includes('libro') || q.includes('descargar') || q.includes('pdf') || q.includes('descarga') || q.includes('guia')) {
      return {
        reply:
          '📚 BIBLIOTECA DE TRADING Y REGLAS DE DESCARGA:\n\n' +
          '• Categorías: Fundamentos de Trading, Trading Institucional (SMC), Scalping de Alta Frecuencia, Estrategias Múltiples (Swing, Day Trading) y Análisis Técnico Avanzado.\n' +
          '• Asignación de Recursos: El administrador (Sr.smith) asigna manualmente a cada alumno qué libros y guías tiene autorizados.\n' +
          '• Descargas Protegidas: El botón de descarga solo estará habilitado si el administrador activó el permiso para tu cuenta. Todo proceso de descarga genera un registro de auditoría con fecha, hora y usuario.\n' +
          '• Acceso Web: Aunque no tengas la descarga habilitada, siempre puedes leer los temarios, síntesis y capítulos directamente en pantalla.',
        action: {
          label: 'Explorar Biblioteca 📚',
          target: 'biblioteca',
          onClick: () => navigateToSection('biblioteca'),
        },
      };
    }

    // 4. Permisos de alumno
    if (q.includes('permiso') || q.includes('cuenta') || q.includes('estado') || q.includes('pendiente') || q.includes('activo') || q.includes('activar') || q.includes('bloque')) {
      return {
        reply:
          '🔑 CÓMO FUNCIONAN LOS PERMISOS EN AL-HADIQA INVEST:\n\n' +
          '• Registro Inicial: Al registrarte con Google OAuth, tu cuenta queda en estado "PENDIENTE" de verificación.\n' +
          '• Activación por Sr.smith: El administrador revisa tu perfil y aprueba tu acceso como Alumno Activo.\n' +
          '• Permisos Granulares:\n' +
          '  1. Acceso a Clases en Vivo (reproductor y transmisiones).\n' +
          '  2. Acceso al Chat de la Comunidad.\n' +
          '  3. Habilitación de Descarga de Libros en PDF.\n' +
          '  4. Asignación de Libros y Módulos de Al-Hadiqa Capital autorizados.\n' +
          '• Puedes consultar el estado actual de tus permisos en tu Portal de Alumno.',
        action: onOpenStudentPortal
          ? {
              label: 'Ver Mi Perfil de Alumno 👤',
              target: 'portal',
              onClick: () => {
                setIsOpen(false);
                onOpenStudentPortal();
              },
            }
          : undefined,
      };
    }

    // 5. Al-Hadiqa Capital & Kiyosaki
    if (q.includes('capital') || q.includes('flujo') || q.includes('cuadrante') || q.includes('kiyosaki') || q.includes('habito') || q.includes('presencia') || q.includes('psicotrading')) {
      return {
        reply:
          '🏛️ AL-HADIQA CAPITAL (EDUCACIÓN FINANCIERA & MENTALIDAD):\n\n' +
          'Diseñado para transformar al trader de ejecutor técnico a inversor patrimonial libre:\n' +
          '1. Flujo del Dinero: Cuadrante del flujo de efectivo de Robert Kiyosaki (Empleado, Autoempleado, Dueño, Inversionista).\n' +
          '2. Argumentos de Grandes Inversores: Buffett, Dalio, Graham y principios de asignación de capital.\n' +
          '3. Presencia, Hábitos y Mentalidad: Rutinas matutinas de alta disciplina, control de dopamina y presencia corporal.\n' +
          '4. Psicotrading: Gestión de la avaricia, el miedo al FOMO y aceptación emocional del stop loss.\n\n' +
          'Incluye seguimiento de lecciones completadas y síntesis ejecutivas descargables.',
        action: {
          label: 'Ver Al-Hadiqa Capital 🏛️',
          target: 'capital',
          onClick: () => navigateToSection('capital'),
        },
      };
    }

    // 5.5 Bróker JustMarkets & 5 Fuentes de Auditoría Independiente
    if (
      q.includes('broker') ||
      q.includes('justmarket') ||
      q.includes('just markets') ||
      q.includes('wikifx') ||
      q.includes('traders union') ||
      q.includes('fxverify') ||
      q.includes('fxleaders') ||
      q.includes('auditoria') ||
      (q.includes('abrir') && q.includes('cuenta')) ||
      (q.includes('link') && q.includes('registro')) ||
      q.includes('spread')
    ) {
      return {
        reply:
          '🏛️ AUDITORÍA MULTIFUENTE DEL BRÓKER JUSTMARKETS\n' +
          '📅 Fecha de Consulta Oficial: 30 de Octubre de 2026\n\n' +
          'Para garantizar total transparencia y seguridad a la comunidad de AL-HADIQA INVEST, auditamos permanentemente a JustMarkets en 5 fuentes líderes:\n\n' +
          '1. 🛡️ WikiFX (Puntuación & Regulación): Puntuación 8.42/10 (Nivel A). Regulación supervisada, alta solvencia y 86% de satisfacción en retiros rápidos.\n' +
          '2. 🏛️ Traders Union (Trayectoria & Traders): Operatividad desde 2012 (14+ años) y más de 10.000.000 de traders en 180+ países con cuentas segregadas Tier-1.\n' +
          '3. ⭐ FXVerify (Opiniones & Condiciones): 4.6/5 estrellas. Spreads en crudo desde 0.0 pips, ejecución de 12 ms y cuentas islámicas Swap-Free (100% Halal sin intereses).\n' +
          '4. 📜 FXLeaders (Licencias por Entidad): Desglose legal completo: CySEC (Chipre/UE 363/18), FSA (Seychelles SD088), FSCA (Sudáfrica 51113) y FSC (Mauricio GB22200881), con protección contra saldo negativo.\n' +
          '5. 🌐 Sitio Oficial de Just Markets (Condiciones Actuales): Cuentas Standard, Pro, Raw Spread y Cent; plataformas MT4/MT5 y 0% de comisión en depósitos/retiros (Cripto USDT, bancos).\n\n' +
          '🔗 Enlace Oficial de Registro: https://one.justmarkets.link/a/kgi9s02uqu',
        action: {
          label: 'Ver Auditoría del Bróker ⚖️',
          target: 'broker',
          onClick: () => navigateToSection('broker'),
        },
      };
    }

    // 6. Asesoría financiera / Señales (COMPLIANCE ESTRICTO)
    if (q.includes('asesoria') || q.includes('financiera') || q.includes('señal') || q.includes('senales') || q.includes('invertir') || q.includes('recomiend')) {
      return {
        reply:
          '⚖️ AVISO REGULATORIO Y POLÍTICA DE ASESORÍA:\n\n' +
          '¿Ofrecemos asesoría financiera personalizada o señales de trading?\n' +
          '❌ ROTUNDAMENTE NO.\n\n' +
          '• Las clases y contenidos son impartidos por un socio independiente y NO por el bróker JustMarkets.\n' +
          '• Todo el material entregado tiene fines exclusivamente educativos y formativos.\n' +
          '• Ninguna lección, gráfico, análisis o comentario constituye una recomendación personalizada de inversión ni gestión de capital ajeno.\n' +
          '• El trading de divisas y derivados financieros conlleva riesgo elevado. Opera únicamente con capital que estés dispuesto a arriesgar.',
      };
    }

    // 7. Notificaciones y Correos
    if (q.includes('notific') || q.includes('correo') || q.includes('email') || q.includes('campana') || q.includes('alerta') || q.includes('baja') || q.includes('unsubscribe')) {
      return {
        reply:
          '🔔 NOTIFICACIONES Y CORREOS TRANSACCIONALES:\n\n' +
          '• Campana de Notificaciones: Ubicada en la barra superior. Te alerta en tiempo real sobre inicios de transmisiones, nuevos libros y avisos urgentes.\n' +
          '• Correos Transaccionales Oficiales: Recibes correos automáticos ante: 1) Bienvenida a la academia, 2) Clases en vivo, 3) Nuevos libros publicados y 4) Cambios en tus permisos.\n' +
          '• Preferencias y Baja: En tu perfil puedes activar o silenciar cada tipo de alerta o pulsar "Darse de baja" si prefieres no recibir correos.',
      };
    }

    // 8. Conceptos de Smart Money (SMC)
    if (q.includes('order block') || q.includes('ob') || q.includes('fvg') || q.includes('bos') || q.includes('choch') || q.includes('liquidez')) {
      return {
        reply:
          '📊 CONCEPTOS CLAVE DE SMART MONEY (SMC):\n\n' +
          '• Order Block (OB): La última vela previa a un impulso agresivo que causa ruptura de estructura (BOS). Marca zona institucional de mitigación.\n' +
          '• Fair Value Gap (FVG): Desequilibrio o ineficiencia entre 3 velas donde el precio se desplazó con fuerza y suele regresar a balancearse.\n' +
          '• Break of Structure (BOS): Confirmación de continuidad de la tendencia institucional en la temporalidad analizada.\n' +
          '• Consulta los libros correspondientes en la categoría "Trading Institucional" de nuestra biblioteca.',
        action: {
          label: 'Ir a la Biblioteca 📚',
          target: 'biblioteca',
          onClick: () => navigateToSection('biblioteca'),
        },
      };
    }

    // 9. Sr.smith / Soporte
    if (q.includes('smith') || q.includes('carlos') || q.includes('quien') || q.includes('contacto') || q.includes('soporte') || q.includes('ceo')) {
      return {
        reply:
          '👑 SOBRE EL FUNDADOR & CONTACTO:\n\n' +
          '• Sr.smith (Carlos Smith Zambrano González) es el CEO y Fundador de Al-Hadiqa Invest.\n' +
          '• Dirige personalmente las transmisiones de análisis institucional y la formulación del currículo de Al-Hadiqa Capital.\n' +
          '• Correo oficial institucional: empresaalhadiqainvest@gmail.com\n' +
          '• Lema de la Academia: "Los hombres luchan y Dios concede la victoria."',
      };
    }

    // Default Fallback
    return {
      reply:
        'He recibido tu consulta. Como asistente de la plataforma, puedo ayudarte con:\n\n' +
        '1. Cómo entrar a una clase en vivo 🎥\n' +
        '2. Cómo participar en el chat comunitario y normas 💬\n' +
        '3. Cómo encontrar y descargar libros de la biblioteca 📚\n' +
        '4. Cómo funcionan tus permisos y estado de cuenta 🔑\n' +
        '5. Qué comprende Al-Hadiqa Capital (Kiyosaki, hábitos) 🏛️\n' +
        '6. Consultas sobre notificaciones y correos 🔔\n\n' +
        '¿Sobre cuál de estos temas te gustaría recibir orientación?',
    };
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text) return;

    const userMessage: MessageItem = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    setTimeout(() => {
      const response = processBotResponse(text);
      const botMessage: MessageItem = {
        id: `msg-${Date.now()}-b`,
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        action: response.action,
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 450);
  };

  const handleQuickTopic = (topic: QuickTopic) => {
    handleSend(topic.query);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: '¡Conversación reiniciada! ¿En qué puedo orientarte hoy sobre la plataforma Al-Hadiqa Invest?',
        timestamp: 'Ahora',
      },
      {
        id: 'compliance-reset',
        sender: 'bot',
        text: '⚖️ Recordatorio de Compliance JustMarkets: No entrego asesoría financiera personalizada ni señales de inversión. Contenido formativo.',
        timestamp: 'Ahora',
      },
    ]);
  };

  return (
    <>
      {/* Botón Flotante en la esquina inferior derecha */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 550,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {!isOpen && hasNewTip && (
          <div
            onClick={() => setIsOpen(true)}
            style={{
              marginBottom: '10px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '1px solid var(--gold)',
              borderRadius: '999px',
              padding: '6px 14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'bounce 2s infinite',
            }}
          >
            <span style={{ fontSize: '1rem' }}>💡</span>
            <span>¿Nuevo alumno? Te guío por la plataforma</span>
            <span style={{ color: 'var(--gold)' }}>&rarr;</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            border: '2px solid #34d399',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            position: 'relative',
          }}
          aria-label="Abrir Asistente Bot Al-Hadiqa"
          title="Asistente Integrado para Nuevos Alumnos"
        >
          {isOpen ? (
            <span style={{ fontSize: '1.6rem', color: '#07111f', fontWeight: 'bold' }}>✕</span>
          ) : (
            <span style={{ fontSize: '1.75rem' }}>🤖</span>
          )}

          {/* Online green indicator badge */}
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: '2px solid #0f172a',
              boxShadow: '0 0 8px #10b981',
            }}
          />
        </button>
      </div>

      {/* Ventana Flotante del Asistente */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: '600px',
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 550,
            background: 'linear-gradient(175deg, #0f172a 0%, #070b14 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          role="dialog"
          aria-label="Asistente Al-Hadiqa"
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  border: '1px solid #34d399',
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                    Bot Asistente Al-Hadiqa
                  </h3>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      display: 'inline-block',
                    }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                  Guía para Alumnos &amp; Respuestas Frecuentes
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleClearChat}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: 'var(--muted)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
                title="Limpiar chat"
              >
                ↺ Reiniciar
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                }}
                aria-label="Cerrar asistente"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Compliance Banner */}
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
              fontSize: '0.71rem',
              color: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              lineHeight: 1.35,
            }}
          >
            <span>⚖️</span>
            <span>
              <strong>Educativo:</strong> No constituye asesoría financiera ni señales. Contenido impartido por socio independiente.
            </span>
          </div>

          {/* Gemini AI Mentor Quick Actions */}
          <div
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(90deg, rgba(197, 168, 128, 0.12), rgba(16, 185, 129, 0.12))',
              borderBottom: '1px solid rgba(197, 168, 128, 0.25)',
              display: 'flex',
              gap: '6px',
            }}
          >
            {onOpenAdvisorChat && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAdvisorChat();
                }}
                style={{
                  flex: 1,
                  background: 'rgba(197, 168, 128, 0.2)',
                  border: '1px solid #C5A880',
                  color: '#C5A880',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <span>🦁</span>
                <span>Mentor Trading</span>
              </button>
            )}
            {onOpenLiveVoice && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenLiveVoice();
                }}
                style={{
                  flex: 1,
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <span>🧮</span>
                <span>Lotaje &amp; SMC</span>
              </button>
            )}
          </div>

          {/* Quick Topics Scrollable Strip */}
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleQuickTopic(topic)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{topic.icon}</span>
                <span>{topic.label}</span>
              </button>
            ))}
          </div>

          {/* Message List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '86%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isUser
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'rgba(30, 41, 59, 0.85)',
                      color: isUser ? '#07111f' : '#f1f5f9',
                      border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.84rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      boxShadow: isUser ? '0 4px 12px rgba(16, 185, 129, 0.25)' : '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    {m.text}

                    {m.action && (
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
                        <button
                          type="button"
                          onClick={m.action.onClick}
                          style={{
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid #f59e0b',
                            borderRadius: '6px',
                            padding: '5px 12px',
                            color: '#fbbf24',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          {m.action.label} &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '3px', padding: '0 4px' }}>
                    {m.timestamp}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '10px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 23, 42, 0.8)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pregunta sobre clases, chat, biblioteca o permisos..."
              style={{
                flex: 1,
                padding: '9px 12px',
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              style={{
                background: inputText.trim()
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(148, 163, 184, 0.2)',
                color: inputText.trim() ? '#07111f' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                padding: '0 14px',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: inputText.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
            >
              Enviar &rarr;
            </button>
          </form>
        </div>
      )}
    </>
  );
};
