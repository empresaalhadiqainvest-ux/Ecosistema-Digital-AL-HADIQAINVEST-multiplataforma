import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, query, orderBy, limit, addDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { LiveClassItem } from './LiveClassesSection';
import { parseStreamEmbedUrl } from '../utils/streamUrlParser';
import { executeResourceDownload, executeCapitalDownload } from '../utils/libraryDownloader';
import { LibraryResourceItem } from '../types';
import { CAPITAL_MODULES } from '../data/capitalCurriculum';
import { CapitalModule } from '../types/capital';

interface StudentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt?: unknown;
}

interface ChatMessage {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
}

export const StudentPortalModal: React.FC<StudentPortalModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'classroom' | 'notifications' | 'library' | 'bot' | 'profile'>('home');
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isGlobalChatMuted, setIsGlobalChatMuted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryResourceItem[]>([]);
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(null);
  const [downloadingCapitalId, setDownloadingCapitalId] = useState<string | null>(null);
  const [libFeedback, setLibFeedback] = useState<string | null>(null);
  const [capitalSubTab, setCapitalSubTab] = useState<'capital' | 'library'>('capital');
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [roomChatInput, setRoomChatInput] = useState('');
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);

  // Bot Assistant State
  const [botMessages, setBotMessages] = useState<{ sender: 'bot' | 'user'; text: string }[]>([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu Asistente Al-Hadiqa. Te guío en cómo entrar a clases en vivo, usar el chat, encontrar libros en la biblioteca y entender tus permisos. Contenido 100% pedagógico (sin asesoría financiera personalizada).',
    },
  ]);
  const [botQuery, setBotQuery] = useState('');

  // Countdown timer for next live class
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 1,
    hours: 18,
    minutes: 45,
    seconds: 20,
  });

  // Load Capital progress
  useEffect(() => {
    if (!isOpen || !currentUser?.uid) return;
    async function loadProgress() {
      try {
        const docRef = doc(db, 'capital_progress', currentUser!.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.completedLessonIds) {
            setCompletedLessonIds(data.completedLessonIds);
            return;
          }
        }
      } catch {
        // Fallback to local storage
      }
      const saved = localStorage.getItem('al_hadiqa_capital_progress');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.completedLessonIds) setCompletedLessonIds(parsed.completedLessonIds);
        } catch {
          // ignore
        }
      }
    }
    loadProgress();
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch classes - only approved classes visible to students
    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        const list: LiveClassItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<LiveClassItem, 'id'>) }));
        const visible = list.filter((c) =>
          ['en_vivo', 'programada', 'aprobada', 'finalizada', 'published', 'approved'].includes(c.status)
        );
        setClasses(visible);
        if (visible.length > 0 && !selectedClassId) {
          const live = visible.find((c) => c.status === 'en_vivo') || visible[0];
          setSelectedClassId(live.id);
        }
      },
      (err) => console.warn('StudentPortalModal - classes listener:', err)
    );

    // Listen to global chat mute setting
    const unsubSettings = onSnapshot(
      doc(db, 'system_settings', 'chat'),
      (snapshot) => {
        if (snapshot.exists()) {
          setIsGlobalChatMuted(!!snapshot.data().isGlobalMuted);
        }
      },
      (err) => console.warn('StudentPortalModal - settings listener:', err)
    );

    // Fetch notifications
    const unsubNotifs = onSnapshot(
      collection(db, 'notifications'),
      (snap) => {
        const list: NotificationItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) }));
        setNotifications(list);
      },
      (err) => console.warn('StudentPortalModal - notifications listener:', err)
    );

    // Fetch library items
    const unsubLib = onSnapshot(
      collection(db, 'library_resources'),
      (snap) => {
        const list: LibraryResourceItem[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<LibraryResourceItem, 'id'>) }));
        setLibraryItems(list);
      },
      (err) => console.warn('StudentPortalModal - library listener:', err)
    );

    // Fetch chat messages for virtual classroom
    const q = query(collection(db, 'chat_messages'), orderBy('createdAt', 'asc'), limit(30));
    const unsubChat = onSnapshot(
      q,
      (snap) => {
        const list: ChatMessage[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({ id: d.id, authorName: data.authorName || 'Alumno', authorRole: data.authorRole || 'alumno', text: data.text || '' });
        });
        setChatMessages(list);
      },
      (err) => console.warn('StudentPortalModal - chat listener:', err)
    );

    // Countdown tick
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => {
      unsubClasses();
      unsubSettings();
      unsubNotifs();
      unsubLib();
      unsubChat();
      clearInterval(timer);
    };
  }, [isOpen, selectedClassId]);

  const handleSendRoomChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomChatInput.trim() || !currentUser || isSubmittingChat) return;

    setIsSubmittingChat(true);
    try {
      await addDoc(collection(db, 'chat_messages'), {
        authorId: currentUser.uid,
        authorName: profile?.displayName || currentUser.displayName || 'Alumno',
        authorPhoto: profile?.photoURL || currentUser.photoURL || '',
        authorRole: profile?.role || 'alumno',
        text: roomChatInput.trim(),
        createdAt: serverTimestamp(),
      });
      setRoomChatInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chat_messages');
    } finally {
      setIsSubmittingChat(false);
    }
  };

  const handleAskBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botQuery.trim()) return;

    const userText = botQuery.trim();
    setBotMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setBotQuery('');

    // Answer logic
    setTimeout(() => {
      let botReply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('clase') || lower.includes('entrar') || lower.includes('vivo') || lower.includes('stream') || lower.includes('sala')) {
        botReply = '🎥 CÓMO ENTRAR A UNA CLASE EN VIVO:\nVe a la pestaña "Clases en Vivo" o a la sección del portal. Cuando el estado sea "🔴 EN VIVO", selecciona la clase para abrir el reproductor virtual y el chat simultáneo. Recuerda que todas las clases son aprobadas previamente por el socio JustMarkets para garantizar cumplimiento regulatorio.';
      } else if (lower.includes('chat') || lower.includes('mensaj') || lower.includes('comunidad') || lower.includes('spam') || lower.includes('silenciar')) {
        botReply = '💬 CÓMO USAR EL CHAT:\nPuedes participar en la sala de la clase en vivo o en las 4 salas temáticas (Forex, Cripto, Índices, Acciones). Soporta emojis, imágenes y documentos PDF. Existe un límite de 5 mensajes/minuto y filtro anti-spam. El administrador puede silenciar el chat si requiere modo solo lectura durante una explicación.';
      } else if (lower.includes('biblioteca') || lower.includes('libro') || lower.includes('descarg') || lower.includes('pdf')) {
        botReply = '📚 BIBLIOTECA & DESCARGAS:\nOrganizada en 5 categorías: Fundamentos, Trading Institucional, Scalping, Múltiples Estrategias y Análisis Técnico. El administrador asigna qué libros tienes habilitados. La descarga solo se activa si el administrador te otorga ese permiso, y cada descarga queda auditada con fecha y hora.';
      } else if (lower.includes('permiso') || lower.includes('cuenta') || lower.includes('activ') || lower.includes('pendiente')) {
        botReply = '🔑 PERMISOS DE ALUMNO:\nAl registrarte tu cuenta queda en estado "pendiente" hasta que Sr.smith valide tu perfil. Un alumno activo puede tener permisos para ver clases, comentar en el chat, descargar libros asignados y acceder a los módulos de Al-Hadiqa Capital.';
      } else if (lower.includes('broker') || lower.includes('justmarket') || lower.includes('registro broker')) {
        botReply = '🏛️ AUDITORÍA DEL BRÓKER JUSTMARKETS (Fecha de consulta: 30 de Octubre de 2026):\nAuditado en 5 fuentes líderes: WikiFX (8.42/10), Traders Union (14+ años, +10M de traders), FXVerify (4.6/5, cuentas islámicas Swap-Free), FXLeaders (CySEC, FSA, FSCA, FSC) y Sitio Oficial (spreds 0.0, 0% comisiones depósitos).\nRegistro oficial: https://one.justmarkets.link/a/kgi9s02uqu';
      } else if (lower.includes('asesoria') || lower.includes('señal') || lower.includes('invertir')) {
        botReply = '⚖️ AVISO REGULATORIO JUSTMARKETS:\nNo ofrecemos asesoría financiera personalizada ni señales de inversión. La academia imparte contenido 100% pedagógico y formativo a través de un socio independiente, no del bróker.';
      } else if (lower.includes('order block') || lower.includes('ob')) {
        botReply = 'Un Order Block (OB) es la última vela institucional contraria antes de un impulso con volumen que rompe estructura (BOS). Marca zonas de alta probabilidad donde las instituciones colocan órdenes masivas. Recomendamos operar solo aquellos que dejan un FVG (Fair Value Gap) y están en zona de descuento.';
      } else if (lower.includes('fvg') || lower.includes('gap') || lower.includes('imbalance')) {
        botReply = 'Un Fair Value Gap (FVG) es una ineficiencia o desequilibrio en el precio originado por compras o ventas agresivas en 3 velas consecutivas, donde la mecha de la vela 1 no toca la mecha de la vela 3. El algoritmo interbancario suele regresar a rellenar al menos el 50% de esta zona.';
      } else if (lower.includes('lote') || lower.includes('riesgo') || lower.includes('calculadora')) {
        botReply = 'Fórmula de Lote Institucional: Lote = (Balance de Cuenta * % Riesgo) / (Stop Loss en pips * Valor del Pip). En Al-Hadiqa Invest aconsejamos arriesgar entre 0.5% y 1% por operación.';
      } else if (lower.includes('capital') || lower.includes('50/30/20') || lower.includes('cuadrante') || lower.includes('kiyosaki')) {
        botReply = 'Al-Hadiqa Capital enseña educación financiera y mentalidad: el Cuadrante del Flujo del Dinero de Robert Kiyosaki (E, A, D, I), presupuestos 50/30/20, hábitos de presencia y psicotrading para dominar la disciplina.';
      } else {
        botReply = 'Entendido. Puedes consultarme cómo entrar a una clase, usar el chat, encontrar libros en la biblioteca, entender tus permisos o aprender conceptos de Smart Money Concepts (SMC). Recuerda que no proveemos asesoría financiera personalizada.';
      }

      setBotMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
    }, 450);
  };

  if (!isOpen || !currentUser) return null;

  const perms = profile?.permissions || {
    canAccessClasses: false,
    canAccessChat: false,
    canAccessLibrary: true,
    canAccessCapital: true,
  };

  const nextClass = classes[0] || {
    title: 'Masterclass SMC: Mitigación y Lectura de Liquidez en Directo',
    instructor: 'Sr.smith (Carlos Smith Zambrano)',
    category: 'SMC',
    scheduledAt: '2026-11-02 14:00 UTC',
    streamUrl: 'https://www.youtube.com/embed/live_stream',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        background: 'rgba(7, 11, 20, 0.94)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1rem, 2.5vw, 2.5rem)',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'linear-gradient(160deg, var(--surface-3), var(--surface))',
          border: '1px solid var(--emerald)',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth: '1150px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 60px -15px rgba(16, 185, 129, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 2rem',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={`Fotografía de perfil de ${profile.displayName || 'alumno de la academia'}`} style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--emerald)', color: '#07111f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {profile?.displayName?.charAt(0) || 'A'}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-head)', fontSize: '1.2rem', color: '#fff' }}>
                  {profile?.displayName}
                </h3>
                <span className="badge" style={{ fontSize: '0.7rem' }}>
                  Alumno Al-Hadiqa
                </span>
                <span style={{ fontSize: '0.72rem', color: profile?.status === 'active' ? 'var(--emerald)' : 'var(--gold)', fontWeight: 600 }}>
                  ● {profile?.status === 'active' ? 'Aprobado' : 'Revisión Pendiente'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                {profile?.email} · Sesión oficial protegida con Google OAuth 2.0
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                const el = document.getElementById('dashboard-estudiantes');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                background: 'rgba(212, 175, 55, 0.14)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                color: '#fde68a',
                borderRadius: '10px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              📊 Ver Dashboard Completo
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid var(--line)',
                color: 'var(--text)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Cerrar aula"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            padding: '0.75rem 2rem',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            background: 'var(--surface-2)',
          }}
        >
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            🏠 Inicio &amp; Próxima Clase
          </button>
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'classroom' ? 'active' : ''}`}
            onClick={() => setActiveTab('classroom')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            📺 Sala Virtual en Vivo + Chat
          </button>
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            📢 Avisos Oficiales ({notifications.length})
          </button>
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            📚 Biblioteca &amp; Capital
          </button>
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'bot' ? 'active' : ''}`}
            onClick={() => setActiveTab('bot')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            🤖 Bot Asistente SMC
          </button>
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
          >
            👤 Mi Perfil &amp; Permisos
          </button>
        </div>

        {/* Body Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>
          
          {/* TAB 1: INICIO & PRÓXIMA CLASE */}
          {activeTab === 'home' && (
            <div>
              {/* Featured Next Class Countdown Hero */}
              <div
                style={{
                  background: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.22), transparent 70%), var(--surface-3)',
                  border: '1px solid var(--emerald)',
                  borderRadius: 'var(--radius)',
                  padding: '2rem',
                  marginBottom: '2rem',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr',
                  gap: '2rem',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald)', boxShadow: '0 0 10px var(--emerald)' }}></span>
                    <span className="badge badge--gold" style={{ fontSize: '0.72rem' }}>Próxima Clase Oficial</span>
                  </div>
                  <h3 className="h-card" style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.6rem' }}>
                    {nextClass.title}
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {nextClass.description}
                  </p>
                  <p style={{ fontSize: '0.84rem', color: 'var(--gold-soft)', margin: 0 }}>
                    👨‍🏫 Instructor: <strong>{nextClass.instructor}</strong> · Horario: <strong>{nextClass.scheduledAt}</strong>
                  </p>
                  
                  {/* Mandatory Legal Disclaimer */}
                  <div
                    style={{
                      marginTop: '0.85rem',
                      padding: '0.55rem 0.8rem',
                      background: 'rgba(251, 191, 36, 0.08)',
                      border: '1px solid rgba(251, 191, 36, 0.25)',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      color: 'var(--gold)',
                      lineHeight: 1.45,
                    }}
                  >
                    ⚖️ <strong>Aviso legal:</strong> "Las clases son impartidas por un socio y no por el bróker. Contenido educativo, no constituye asesoría financiera."
                  </div>
                </div>

                {/* Live Countdown Box */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Tiempo Restante para Transmisión
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--emerald)' }}>
                        {String(timeLeft.days).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Días</div>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--muted-2)' }}>:</div>
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--emerald)' }}>
                        {String(timeLeft.hours).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Horas</div>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--muted-2)' }}>:</div>
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--emerald)' }}>
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Min</div>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--muted-2)' }}>:</div>
                    <div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--emerald)' }}>
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Seg</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn--emerald"
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                    onClick={() => setActiveTab('classroom')}
                  >
                    Ingresar a la Sala Virtual &rarr;
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      borderColor: '#ef4444',
                      color: '#fff',
                      fontWeight: 700,
                      boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
                    }}
                    onClick={() => {
                      onClose();
                      document.getElementById('streaming')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    🔴 Transmisión Streaming @AL-HADIQAINVEST &rarr;
                  </button>
                </div>
              </div>

              {/* Quick Access Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div
                  className="card"
                  onClick={() => setActiveTab('classroom')}
                  style={{ cursor: 'pointer', padding: '1.35rem' }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📺</div>
                  <h4 style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: '#fff', margin: 0 }}>Sala Virtual en Vivo</h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                    Reproductor incrustado de video con chat sincronizado en tiempo real.
                  </p>
                </div>

                <div
                  className="card"
                  onClick={() => setActiveTab('library')}
                  style={{ cursor: 'pointer', padding: '1.35rem' }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>📚</div>
                  <h4 style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: '#fff', margin: 0 }}>Biblioteca Especializada</h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                    Descarga libros oficiales de Smart Money Concepts y gestión de riesgo.
                  </p>
                </div>

                <div
                  className="card"
                  onClick={() => setActiveTab('bot')}
                  style={{ cursor: 'pointer', padding: '1.35rem' }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>🤖</div>
                  <h4 style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', color: '#fff', margin: 0 }}>Bot Asistente SMC</h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                    Consulta dudas sobre order blocks, FVG, ratio riesgo/beneficio y reglas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SALA VIRTUAL EN VIVO + CHAT INTEGRADO */}
          {activeTab === 'classroom' && (() => {
            const currentClass =
              classes.find((c) => c.id === selectedClassId) ||
              classes.find((c) => c.status === 'en_vivo') ||
              classes[0] || {
                id: 'default-live',
                title: 'Masterclass Institucional Al-Hadiqa: Liquidez & Smart Money',
                description: 'Sesión oficial de trading institucional transmitida en directo por Sr.smith.',
                instructor: 'Sr.smith (Carlos Smith Zambrano)',
                category: 'SMC' as const,
                scheduledAt: 'En directo ahora',
                streamUrl: 'https://www.youtube.com/watch?v=live_stream',
                status: 'en_vivo' as const,
                createdBy: 'admin',
              };

            const streamInfo = parseStreamEmbedUrl(currentClass.streamUrl);
            const isMuted = !!profile?.isMuted || isGlobalChatMuted;

            return (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.9fr 1.1fr',
                  gap: '1.5rem',
                  height: '100%',
                  minHeight: '540px',
                }}
              >
                {/* Embedded Mirror Player Area */}
                <div
                  style={{
                    background: '#070b14',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* Classroom Toolbar */}
                  <div
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: 'var(--surface-3)',
                      borderBottom: '1px solid var(--line)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: currentClass.status === 'en_vivo' ? '#ef4444' : 'var(--emerald)',
                          boxShadow: currentClass.status === 'en_vivo' ? '0 0 10px #ef4444' : '0 0 8px var(--emerald)',
                        }}
                      ></span>
                      <strong style={{ fontSize: '0.92rem', color: '#fff' }}>
                        {currentClass.status === 'en_vivo' ? '🔴 EN VIVO' : '📺 AULA AL-HADIQA'}
                      </strong>
                      <span className="badge badge--gold" style={{ fontSize: '0.68rem' }}>
                        {currentClass.category}
                      </span>
                    </div>

                    {/* Class Selector if multiple classes */}
                    {classes.length > 1 && (
                      <select
                        value={currentClass.id}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          background: 'var(--surface)',
                          color: '#fff',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          maxWidth: '260px',
                        }}
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.status === 'en_vivo' ? '🔴 ' : '📅 '} {c.title.substring(0, 32)}…
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Mirror Stream Player */}
                  <div style={{ flex: 1, position: 'relative', minHeight: '380px', background: '#050811' }}>
                    {streamInfo.embedUrl ? (
                      <iframe
                        src={streamInfo.embedUrl}
                        title={currentClass.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'radial-gradient(circle at 50% 50%, #111827, #070b14)',
                          padding: '2.5rem',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>📡</div>
                        <h4 style={{ color: 'var(--emerald)', fontFamily: 'var(--font-head)', margin: '0 0 0.5rem' }}>
                          Transmisión en Espera
                        </h4>
                        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 1rem' }}>
                          La clase de <strong>{currentClass.instructor}</strong> iniciará según el cronograma programado.
                          El reproductor espejo se sincronizará automáticamente.
                        </p>
                        <span className="badge badge--gold" style={{ fontSize: '0.75rem' }}>
                          Horario: {currentClass.scheduledAt}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stream Meta Footer */}
                  <div style={{ padding: '0.85rem 1.25rem', background: 'var(--surface-2)', borderTop: '1px solid var(--line)' }}>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#fff' }}>{currentClass.title}</h4>
                    <p style={{ margin: '0.3rem 0 0.5rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
                      Instructor: <strong style={{ color: 'var(--gold-soft)' }}>{currentClass.instructor}</strong> · Modo Espejo: {streamInfo.source.toUpperCase()} sin salir de Al-Hadiqa Invest.
                    </p>
                    <div
                      style={{
                        padding: '0.45rem 0.7rem',
                        background: 'rgba(251, 191, 36, 0.08)',
                        border: '1px solid rgba(251, 191, 36, 0.25)',
                        borderRadius: '5px',
                        fontSize: '0.72rem',
                        color: 'var(--gold)',
                        lineHeight: 1.4,
                      }}
                    >
                      ⚖️ <strong>Aviso legal:</strong> "Las clases son impartidas por un socio y no por el bróker. Contenido educativo, no constituye asesoría financiera."
                    </div>
                  </div>
                </div>

                {/* Synchronized Side Chat */}
                <div
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--line)', background: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--gold)' }}>💬 Chat en Vivo del Aula</strong>
                    {isGlobalChatMuted && (
                      <span className="badge badge--gold" style={{ fontSize: '0.65rem' }}>
                        🔇 Chat Silenciado
                      </span>
                    )}
                  </div>

                  {/* Chat Feed */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    {chatMessages.map((m) => (
                      <div key={m.id} style={{ background: 'var(--surface)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <strong style={{ fontSize: '0.82rem', color: m.authorRole === 'admin' ? 'var(--gold)' : '#fff' }}>
                            {m.authorName} {m.authorRole === 'admin' ? '(Sr.smith)' : ''}
                          </strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#e2e8f0' }}>{m.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Send Chat or Muted Notice */}
                  {isMuted ? (
                    <div
                      style={{
                        padding: '0.9rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderTop: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#fca5a5',
                        fontSize: '0.82rem',
                        textAlign: 'center',
                      }}
                    >
                      🔇 {profile?.isMuted ? 'Has sido silenciado individualmente por el Administrador.' : 'El chat ha sido silenciado temporalmente por Sr.smith.'}
                    </div>
                  ) : (
                    <form onSubmit={handleSendRoomChat} style={{ padding: '0.75rem', borderTop: '1px solid var(--line)', display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Preguntar al instructor…"
                        value={roomChatInput}
                        onChange={(e) => setRoomChatInput(e.target.value)}
                        disabled={isSubmittingChat}
                        style={{
                          flex: 1,
                          padding: '0.55rem 0.85rem',
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.85rem',
                        }}
                      />
                      <button type="submit" disabled={isSubmittingChat} className="btn btn--emerald" style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}>
                        Enviar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 3: AVISOS Y COMUNICADOS */}
          {activeTab === 'notifications' && (
            <div>
              <div className="section-head" style={{ marginBottom: '1.5rem', textAlign: 'left', marginInline: 0 }}>
                <h4 className="h-sub" style={{ color: 'var(--gold)' }}>Tablón de Anuncios Oficiales</h4>
                <p>Notificaciones directas de Sr.smith sobre clases, alertas de mercado y novedades.</p>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      background: 'var(--surface-3)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1.25rem',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{n.type === 'urgent' ? '🔴' : '📢'}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span className="badge" style={{ fontSize: '0.7rem' }}>{n.type.toUpperCase()}</span>
                        <h5 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>{n.title}</h5>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6 }}>{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BIBLIOTECA Y CAPITAL */}
          {activeTab === 'library' && (() => {
            const canDownload = !!profile?.permissions?.canDownload;
            const assignedIds = profile?.permissions?.assignedBookIds || [];

            const handleStudentDownload = async (book: LibraryResourceItem) => {
              if (!currentUser) return;
              if (!canDownload) {
                setLibFeedback('La descarga está bloqueada para tu cuenta. Solicita habilitación a Sr.smith.');
                return;
              }
              setDownloadingBookId(book.id);
              try {
                await executeResourceDownload({
                  resource: book,
                  userId: currentUser.uid,
                  userName: profile?.displayName || currentUser.displayName || 'Alumno',
                  userEmail: profile?.email || currentUser.email || '',
                });
                setLibFeedback(`✓ "${book.title}" descargado con éxito y registrado en la bitácora.`);
              } catch (err) {
                console.error(err);
                setLibFeedback('Error al generar la descarga.');
              } finally {
                setDownloadingBookId(null);
              }
            };

            const handleRequestBookAccess = async (bookTitle: string) => {
              if (!currentUser) return;
              try {
                await addDoc(collection(db, 'notifications'), {
                  title: `📢 Solicitud de Descarga: ${profile?.displayName || currentUser.displayName}`,
                  message: `El alumno solicita a Sr.smith habilitación para descargar: "${bookTitle}".`,
                  targetRole: 'admin',
                  type: 'info',
                  createdAt: serverTimestamp(),
                });
                setLibFeedback('Solicitud de activación enviada al administrador Sr.smith.');
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, 'notifications');
              }
            };

            const handleCapitalDownload = async (mod: CapitalModule) => {
              if (!canDownload) {
                setLibFeedback('🔒 Descarga bloqueada por el Administrador. Solicita la activación abajo.');
                return;
              }
              setDownloadingCapitalId(mod.id);
              try {
                await executeCapitalDownload({
                  moduleId: mod.id,
                  moduleTitle: mod.title,
                  pillarLabel: mod.pillarLabel,
                  docTitle: mod.executiveSummary.title,
                  filename: mod.executiveSummary.filename,
                  coreThesis: mod.executiveSummary.coreThesis,
                  actionChecklist: mod.executiveSummary.actionChecklist,
                  principles: mod.executiveSummary.principles,
                  userId: currentUser.uid,
                  userName: profile?.displayName || currentUser.displayName || 'Alumno Al-Hadiqa',
                  userEmail: currentUser.email || 'alumno@alhadiqainvest.com',
                });
                setLibFeedback(`✓ Descarga completada: ${mod.executiveSummary.title} (Registrado en auditoría).`);
              } catch (err) {
                console.error('Error in capital download:', err);
                setLibFeedback('Error al procesar la descarga.');
              } finally {
                setDownloadingCapitalId(null);
              }
            };

            const handleToggleCapitalLesson = async (lessonId: string) => {
              const isDone = completedLessonIds.includes(lessonId);
              const updated = isDone ? completedLessonIds.filter((id) => id !== lessonId) : [...completedLessonIds, lessonId];
              setCompletedLessonIds(updated);
              localStorage.setItem('al_hadiqa_capital_progress', JSON.stringify({ completedLessonIds: updated }));
              if (currentUser?.uid) {
                try {
                  await setDoc(doc(db, 'capital_progress', currentUser.uid), {
                    userId: currentUser.uid,
                    completedLessonIds: updated,
                    updatedAt: serverTimestamp(),
                  }, { merge: true });
                } catch {
                  // silent
                }
              }
            };

            const assignedCapitalIds = perms.assignedCapitalModuleIds || [];

            return (
              <div>
                <div className="section-head" style={{ marginBottom: '1.25rem', textAlign: 'left', marginInline: 0 }}>
                  <h4 className="h-sub" style={{ color: 'var(--gold)' }}>Al-Hadiqa Capital &amp; Biblioteca de Trading</h4>
                  <p>Educación financiera, desarrollo personal, psicotrading y libros institucionales asignados por el administrador.</p>
                </div>

                {/* Sub-tab Navigation */}
                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.8rem' }}>
                  <button
                    type="button"
                    className={`quiz__btn ${capitalSubTab === 'capital' ? 'active' : ''}`}
                    onClick={() => setCapitalSubTab('capital')}
                    style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', borderRadius: '6px' }}
                  >
                    🏛️ Al-Hadiqa Capital ({CAPITAL_MODULES.length} Módulos)
                  </button>
                  <button
                    type="button"
                    className={`quiz__btn ${capitalSubTab === 'library' ? 'active' : ''}`}
                    onClick={() => setCapitalSubTab('library')}
                    style={{ padding: '0.45rem 1rem', fontSize: '0.84rem', borderRadius: '6px' }}
                  >
                    📚 Libros de Trading ({libraryItems.length})
                  </button>
                </div>

                {/* Feedback Toast */}
                {libFeedback && (
                  <div
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid var(--blue)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{libFeedback}</span>
                    <button
                      type="button"
                      onClick={() => setLibFeedback(null)}
                      style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Permission Status Banner */}
                <div
                  style={{
                    background: canDownload ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.08)',
                    border: `1px solid ${canDownload ? 'var(--emerald)' : 'rgba(251, 191, 36, 0.3)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.6rem' }}>{canDownload ? '✅' : '🔒'}</span>
                    <div>
                      <strong style={{ color: canDownload ? 'var(--emerald)' : 'var(--gold)', fontSize: '0.92rem', display: 'block' }}>
                        {canDownload ? 'Permiso de Descarga Habilitado por el Administrador' : 'Descargas Sujetas a Aprobación Individual'}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {canDownload
                          ? 'Puedes descargar síntesis y libros autorizados. Cada descarga queda registrada en la bitácora de auditoría.'
                          : 'La descarga solo está disponible si el administrador la activa para tu perfil.'}
                      </span>
                    </div>
                  </div>

                  <span className={`badge ${canDownload ? 'badge--emerald' : 'badge--gold'}`} style={{ fontSize: '0.72rem' }}>
                    {canDownload ? '✓ Acceso Descarga Activo' : '🔒 Descarga Bloqueada'}
                  </span>
                </div>

                {/* SUBTAB 1: AL-HADIQA CAPITAL MODULES */}
                {capitalSubTab === 'capital' && (
                  <div>
                    {/* Overall Capital Progress Bar */}
                    <div
                      style={{
                        background: 'var(--surface-3)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1.25rem',
                        marginBottom: '1.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                          Progreso Total en Al-Hadiqa Capital:
                        </span>
                        <strong style={{ color: 'var(--emerald)', fontSize: '1rem' }}>
                          {Math.round((completedLessonIds.length / 20) * 100)}% ({completedLessonIds.length}/20 lecciones)
                        </strong>
                      </div>
                      <div style={{ background: 'var(--surface)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, (completedLessonIds.length / 20) * 100)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--gold), var(--emerald))',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Modules Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                      {CAPITAL_MODULES.map((mod) => {
                        const isAssigned = assignedCapitalIds.length === 0 || assignedCapitalIds.includes(mod.id);
                        const modCompleted = mod.lessons.filter((l) => completedLessonIds.includes(l.id));
                        const modProgress = Math.round((modCompleted.length / mod.lessons.length) * 100);
                        const isDownloading = downloadingCapitalId === mod.id;

                        return (
                          <div
                            key={mod.id}
                            className="card"
                            style={{
                              padding: '1.5rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              border: `1px solid ${isAssigned ? (modProgress === 100 ? 'var(--emerald)' : 'var(--line)') : 'rgba(239, 68, 68, 0.3)'}`,
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.06)', color: mod.colorVar }}>
                                  {mod.pillarLabel}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                                  ⏱️ {mod.estimatedHours}
                                </span>
                              </div>

                              <h5 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>{mod.icon}</span>
                                <span>{mod.title}</span>
                              </h5>
                              <p style={{ margin: '0.3rem 0 0.8rem', fontSize: '0.82rem', color: 'var(--gold-soft)' }}>
                                {mod.subtitle}
                              </p>

                              {/* Module Progress */}
                              <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                                  <span>Progreso del módulo:</span>
                                  <strong style={{ color: modProgress === 100 ? 'var(--emerald)' : 'var(--text)' }}>
                                    {modCompleted.length}/{mod.lessons.length} ({modProgress}%)
                                  </strong>
                                </div>
                                <div style={{ background: 'var(--surface-3)', height: '5px', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${modProgress}%`,
                                      height: '100%',
                                      background: modProgress === 100 ? 'var(--emerald)' : 'var(--gold)',
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Lessons checklist */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                                {mod.lessons.map((les) => {
                                  const isDone = completedLessonIds.includes(les.id);
                                  return (
                                    <div
                                      key={les.id}
                                      onClick={() => isAssigned && handleToggleCapitalLesson(les.id)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '4px',
                                        background: isDone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                        cursor: isAssigned ? 'pointer' : 'not-allowed',
                                        fontSize: '0.78rem',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                                        <span>{isDone ? '✅' : '⬜'}</span>
                                        <span style={{ color: isDone ? '#fff' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {les.title}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: '0.68rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                        {les.type.toUpperCase()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Download Action */}
                            <div>
                              {canDownload && isAssigned ? (
                                <button
                                  type="button"
                                  className="btn btn--emerald"
                                  style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem' }}
                                  disabled={isDownloading}
                                  onClick={() => handleCapitalDownload(mod)}
                                >
                                  {isDownloading ? 'Generando PDF...' : '📥 Descargar Síntesis en PDF (Auditada)'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn--ghost"
                                  style={{
                                    width: '100%',
                                    fontSize: '0.78rem',
                                    padding: '0.5rem',
                                    borderColor: 'var(--gold)',
                                    color: 'var(--gold)',
                                  }}
                                  onClick={() => handleRequestBookAccess(`Módulo Capital: ${mod.title}`)}
                                >
                                  🔒 Solicitar Habilitación de Descarga a Sr.smith
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: TRADING LIBRARY BOOKS */}
                {capitalSubTab === 'library' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    {libraryItems.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', background: 'var(--surface-3)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
                        Cargando recursos pedagógicos de la biblioteca...
                      </div>
                    ) : (
                      libraryItems.map((book) => {
                        const isAssigned = assignedIds.length === 0 || assignedIds.includes(book.id);
                        const isAllowed = canDownload && isAssigned;
                        const isDownloading = downloadingBookId === book.id;

                        return (
                          <div
                            key={book.id}
                            className="card"
                            style={{
                              padding: '1.5rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              border: `1px solid ${isAllowed ? 'var(--line)' : 'rgba(251, 191, 36, 0.25)'}`,
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                <span className="badge badge--gold" style={{ fontSize: '0.68rem' }}>
                                  {book.category}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                                  {book.format || 'PDF'}
                                </span>
                              </div>

                              <h5 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{book.title}</h5>
                              <p style={{ margin: '0.4rem 0 1rem', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                                {book.description}
                              </p>
                            </div>

                            <div>
                              {isAllowed ? (
                                <button
                                  type="button"
                                  className="btn btn--emerald"
                                  style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem' }}
                                  disabled={isDownloading}
                                  onClick={() => handleStudentDownload(book)}
                                >
                                  {isDownloading ? 'Generando PDF...' : '📥 Descargar PDF Oficial &rarr;'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn--ghost"
                                  style={{
                                    width: '100%',
                                    fontSize: '0.8rem',
                                    padding: '0.5rem',
                                    borderColor: 'var(--gold)',
                                    color: 'var(--gold)',
                                  }}
                                  onClick={() => handleRequestBookAccess(book.title)}
                                >
                                  🔒 Solicitar Habilitación a Sr.smith
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Mandatory Legal Disclaimer */}
                <div
                  style={{
                    padding: '0.9rem 1.25rem',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    color: 'var(--gold)',
                    lineHeight: 1.45,
                  }}
                >
                  ⚖️ <strong>Aviso legal:</strong> "Las clases y materiales de la biblioteca son impartidos por un socio y no por el bróker. Contenido educativo, no constituye asesoría financiera."
                </div>
              </div>
            );
          })()}

          {/* TAB 5: BOT ASISTENTE SMC */}
          {activeTab === 'bot' && (
            <div
              style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: '480px',
              }}
            >
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🤖</span>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: '#fff' }}>Bot Asistente Al-Hadiqa</strong>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>Especializado en Smart Money Concepts, Pips y Reglas de la Academia</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {botMessages.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      padding: '0.85rem 1.1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: m.sender === 'user' ? 'var(--emerald)' : 'var(--surface)',
                      color: m.sender === 'user' ? '#07111f' : '#e2e8f0',
                      border: m.sender === 'user' ? 'none' : '1px solid var(--line)',
                      fontSize: '0.88rem',
                      lineHeight: 1.55,
                    }}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              {/* Bot Input */}
              <form onSubmit={handleAskBot} style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--line)', display: 'flex', gap: '0.6rem' }}>
                <input
                  type="text"
                  placeholder="Pregúntame sobre Order Blocks, FVG, ratio RRR o cálculo de lote…"
                  value={botQuery}
                  onChange={(e) => setBotQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                />
                <button type="submit" className="btn btn--emerald" style={{ padding: '0.65rem 1.25rem', fontSize: '0.84rem' }}>
                  Preguntar &rarr;
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: PERFIL Y PERMISOS */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '650px', margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
              <div style={{ background: 'var(--surface-3)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '1.75rem' }}>
                <h4 style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', marginBottom: '1.25rem' }}>
                  Credenciales de Alumno Verificado
                </h4>

                <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <div>
                    Nombre completo: <strong style={{ color: '#fff' }}>{profile?.displayName}</strong>
                  </div>
                  <div>
                    Correo Google OAuth: <strong style={{ color: '#fff' }}>{profile?.email}</strong>
                  </div>
                  <div>
                    Rol asignado: <strong style={{ color: 'var(--gold)' }}>{profile?.role?.toUpperCase()}</strong>
                  </div>
                  <div>
                    Estado: <strong style={{ color: profile?.status === 'active' ? 'var(--emerald)' : 'var(--gold)' }}>● {profile?.status?.toUpperCase()}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--line)' }}>
                  <h5 style={{ fontFamily: 'var(--font-head)', color: '#fff', marginBottom: '0.8rem', fontSize: '0.9rem' }}>
                    Permisos de Plataforma (Configurados por Sr.smith):
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <div style={{ padding: '0.6rem', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.8rem' }}>
                      Clases en Vivo: <strong style={{ color: perms.canAccessClasses ? 'var(--emerald)' : 'var(--muted)' }}>{perms.canAccessClasses ? '✓ Sí' : '⏳ Pendiente'}</strong>
                    </div>
                    <div style={{ padding: '0.6rem', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.8rem' }}>
                      Chat en Vivo: <strong style={{ color: perms.canAccessChat ? 'var(--emerald)' : 'var(--muted)' }}>{perms.canAccessChat ? '✓ Sí' : '⏳ Pendiente'}</strong>
                    </div>
                    <div style={{ padding: '0.6rem', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.8rem' }}>
                      Biblioteca Oficial: <strong style={{ color: 'var(--emerald)' }}>✓ Sí</strong>
                    </div>
                    <div style={{ padding: '0.6rem', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '0.8rem' }}>
                      Al-Hadiqa Capital: <strong style={{ color: 'var(--emerald)' }}>✓ Sí</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    style={{ color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                    onClick={() => {
                      signOut();
                      onClose();
                    }}
                  >
                    Cerrar Sesión Global en Todos los Dispositivos
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 2rem',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(15, 23, 42, 0.7)',
          }}
        >
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cerrar Portal
          </button>
        </div>
      </div>
    </div>
  );
};
