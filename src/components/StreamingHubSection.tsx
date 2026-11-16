import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { parseStreamEmbedUrl } from '../utils/streamUrlParser';
import { verifyStreamUrlIntegrity } from '../services/streamCryptoService';
import { socService } from '../services/socService';

export const OFFICIAL_CHANNEL_URL = 'https://www.youtube.com/@AL-HADIQAINVEST';
export const OFFICIAL_CHANNEL_NAME = '@AL-HADIQAINVEST';
export const OFFICIAL_TIKTOK_URL = 'https://www.tiktok.com/@alhadiqa.capital';
export const OFFICIAL_TIKTOK_LIVE_URL = 'https://www.tiktok.com/@alhadiqa.capital/live';
export const OFFICIAL_TIKTOK_NAME = '@alhadiqa.capital';

export interface LiveBroadcastState {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  channelUrl: string;
  status: 'en_vivo' | 'programada' | 'finalizada' | 'standby';
  instructor: string;
  category: string;
  isLive: boolean;
  viewerCount: number;
  scheduledAt: string;
  startedAt?: string;
  updatedAt?: string;
  lastNotificationSent?: string;
}

const DEFAULT_BROADCAST: LiveBroadcastState = {
  id: 'current',
  title: 'Masterclass SMC: Order Blocks, FVG y Liquidez Institucional en Vivo',
  description: 'Sesión oficial impartida por Sr.smith. Análisis del flujo de órdenes en New York, barridos de liquidez asiática en XAU/USD y EUR/USD, y dimensionamiento de posición.',
  youtubeUrl: 'https://www.youtube.com/@AL-HADIQAINVEST',
  channelUrl: OFFICIAL_CHANNEL_URL,
  status: 'en_vivo',
  instructor: 'Sr.smith (Carlos Smith Zambrano)',
  category: 'SMC Institucional',
  isLive: true,
  viewerCount: 142,
  scheduledAt: 'En Vivo Ahora',
  startedAt: '2026-11-01T18:00:00Z',
};

// Clases grabadas de respaldo del canal oficial
interface RecordedClass {
  id: string;
  title: string;
  category: string;
  duration: string;
  youtubeUrl: string;
  description: string;
  thumbnailPlaceholderColor: string;
}

const RECORDED_CLASSES: RecordedClass[] = [
  {
    id: 'rec-1',
    title: 'Masterclass SMC: Detección de Order Blocks Institucionales y FVG',
    category: 'SMC',
    duration: '1h 24m',
    youtubeUrl: 'https://www.youtube.com/watch?v=live_stream',
    description: 'Apertura de New York, lectura de velas de absorción y zonas de descuento con ratio riesgo-beneficio 1:3+.',
    thumbnailPlaceholderColor: '#064e3b',
  },
  {
    id: 'rec-2',
    title: 'Estrategia de Liquidez Turtle Soup en XAU/USD (Oro)',
    category: 'Forex / Metales',
    duration: '58m',
    youtubeUrl: 'https://www.youtube.com/watch?v=live_stream_2',
    description: 'Cómo operar los barridos de máximos y mínimos asiáticos evitando las trampas de rompimiento en falso.',
    thumbnailPlaceholderColor: '#1e3a8a',
  },
  {
    id: 'rec-3',
    title: 'Psicología Operativa y Blindaje del Capital ante Alta Volatilidad',
    category: 'Psicología',
    duration: '1h 12m',
    youtubeUrl: 'https://www.youtube.com/watch?v=live_stream_3',
    description: 'Reglas de gestión de riesgo, reducción de apalancamiento y control emocional durante noticias de alto impacto.',
    thumbnailPlaceholderColor: '#451a03',
  },
  {
    id: 'rec-4',
    title: 'El Cuadrante del Flujo de Dinero aplicado al Trading Institucional',
    category: 'Capital & Mentalidad',
    duration: '45m',
    youtubeUrl: 'https://www.youtube.com/watch?v=live_stream_4',
    description: 'De autoempleado a inversionista: cómo construir patrimonio diversificado con Al-Hadiqa Capital.',
    thumbnailPlaceholderColor: '#311042',
  },
];

// Sonido sutil para alertas de inicio de clase
function playChimeAlert() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch {
    // ignore audio policy errors
  }
}

export const StreamingHubSection: React.FC = () => {
  const { currentUser, isAdmin, signInWithGoogle } = useAuth();
  const [broadcast, setBroadcast] = useState<LiveBroadcastState>(DEFAULT_BROADCAST);
  const [activeUrl, setActiveUrl] = useState<string>(DEFAULT_BROADCAST.youtubeUrl);
  const [activeTitle, setActiveTitle] = useState<string>(DEFAULT_BROADCAST.title);
  const [activeDesc, setActiveDesc] = useState<string>(DEFAULT_BROADCAST.description);

  // Admin form state
  const [adminManualLink, setAdminManualLink] = useState<string>('');
  const [adminTitle, setAdminTitle] = useState<string>('');
  const [adminDesc, setAdminDesc] = useState<string>('');
  const [adminCategory, setAdminCategory] = useState<string>('SMC Institucional');
  const [adminStatus, setAdminStatus] = useState<LiveBroadcastState['status']>('en_vivo');
  const [adminScheduledDate, setAdminScheduledDate] = useState<string>('Hoy a las 18:00 UTC');
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Student features
  const [studentNotifsActive, setStudentNotifsActive] = useState<boolean>(true);
  const [studentFeedback, setStudentFeedback] = useState<string | null>(null);
  const [studentQuestion, setStudentQuestion] = useState<string>('');
  const [studentQuestionsList, setStudentQuestionsList] = useState<
    Array<{ id: string; author: string; text: string; time: string }>
  >([
    {
      id: 'q1',
      author: 'David R. (Alumno)',
      text: 'Sr.smith, ¿el FVG en el gráfico de 15m de XAU/USD ya se considera mitigado al 50%?',
      time: 'Hace 3 min',
    },
    {
      id: 'q2',
      author: 'Elena G. (Alumna)',
      text: '¿En JustMarkets el spread de la cuenta Raw Spread se mantuvo en 0.0 pips durante el barrido?',
      time: 'Hace 1 min',
    },
  ]);

  const [tiktokIsLive, setTiktokIsLive] = useState<boolean>(false);
  const [tiktokStatusNote, setTiktokStatusNote] = useState<string>('Monitoreo automático activo');

  // Sincronización en tiempo real desde Firestore (YouTube y TikTok)
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'live_broadcasts', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as LiveBroadcastState;
          setBroadcast(data);
          setActiveUrl(data.youtubeUrl || DEFAULT_BROADCAST.youtubeUrl);
          setActiveTitle(data.title || DEFAULT_BROADCAST.title);
          setActiveDesc(data.description || DEFAULT_BROADCAST.description);

          // Inicializar formulario de admin si está vacío
          if (!adminManualLink) {
            setAdminManualLink(data.youtubeUrl || '');
            setAdminTitle(data.title || '');
            setAdminDesc(data.description || '');
            setAdminCategory(data.category || 'SMC Institucional');
            setAdminStatus(data.status || 'en_vivo');
          }
        } else if (isAdmin) {
          // Crear documento por defecto si no existe
          setDoc(doc(db, 'live_broadcasts', 'current'), DEFAULT_BROADCAST).catch(console.error);
        }
      },
      (err) => {
        console.warn('Live broadcast listener:', err.message);
      }
    );

    const unsubTikTok = onSnapshot(
      doc(db, 'live_broadcasts', 'tiktok_alhadiqa_capital'),
      (snap) => {
        if (snap.exists()) {
          const tData = snap.data() as { isLive?: boolean; status?: string; title?: string };
          if (tData.isLive || tData.status === 'en_vivo') {
            setTiktokIsLive(true);
            setTiktokStatusNote(tData.title || 'Transmitiendo en directo en TikTok');
          } else {
            setTiktokIsLive(false);
          }
        }
      },
      () => {}
    );

    fetch('/api/channels/tiktok/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { isLive?: boolean; liveTitle?: string; latestVideoTitle?: string } | null) => {
        if (!d) return;
        if (d.isLive) {
          setTiktokIsLive(true);
          setTiktokStatusNote(d.liveTitle || 'Live detectado en TikTok @alhadiqa.capital');
        } else if (d.latestVideoTitle) {
          setTiktokStatusNote(`Último: ${d.latestVideoTitle.slice(0, 50)}`);
        }
      })
      .catch(() => {});

    return () => {
      unsub();
      unsubTikTok();
    };
  }, [isAdmin]);

  // Parse embed URL
  const { embedUrl, source: activeStreamSource, isChannelLive: isTikTokChannelLive } = parseStreamEmbedUrl(activeUrl);

  // ADMIN: Iniciar / Actualizar Transmisión y Notificar a los Alumnos
  const handleAdminPublishBroadcast = async (customStatus?: LiveBroadcastState['status']) => {
    setIsSaving(true);
    setAdminFeedback(null);

    const targetStatus = customStatus || adminStatus;
    const rawUrl = adminManualLink.trim() || OFFICIAL_CHANNEL_URL;
    const urlCheck = verifyStreamUrlIntegrity(rawUrl);

    if (!urlCheck.valid) {
      setAdminFeedback(`🛡️ Bloqueado por Seguridad: ${urlCheck.reason}`);
      setIsSaving(false);
      return;
    }

    const finalUrl = urlCheck.sanitizedUrl;
    const finalTitle = adminTitle.trim() || 'Transmisión Oficial en Vivo @AL-HADIQAINVEST';
    const finalDesc =
      adminDesc.trim() ||
      'Clase magistral en vivo impartida por Sr.smith. Conéctate para el análisis institucional y sesión de preguntas.';

    const updatedData: Partial<LiveBroadcastState> = {
      title: finalTitle,
      description: finalDesc,
      youtubeUrl: finalUrl,
      channelUrl: OFFICIAL_CHANNEL_URL,
      status: targetStatus,
      isLive: targetStatus === 'en_vivo',
      category: adminCategory,
      scheduledAt: targetStatus === 'programada' ? adminScheduledDate : 'En Vivo Ahora',
      updatedAt: new Date().toISOString(),
      startedAt: targetStatus === 'en_vivo' ? new Date().toISOString() : broadcast.startedAt,
      lastNotificationSent: new Date().toISOString(),
    };

    try {
      // 1. Actualizar estado de la transmisión en vivo
      await setDoc(doc(db, 'live_broadcasts', 'current'), updatedData, { merge: true });

      // 2. Emitir notificación a la colección /notifications para todos los alumnos
      const notificationTitle =
        targetStatus === 'en_vivo'
          ? `🔴 ¡ESTAMOS EN VIVO! ${finalTitle}`
          : targetStatus === 'programada'
          ? `⏳ Nueva Clase Programada: ${finalTitle}`
          : `📢 Actualización de Transmisión: ${finalTitle}`;

      const notificationMessage =
        targetStatus === 'en_vivo'
          ? `Sr.smith ha iniciado la transmisión en directo desde el canal ${OFFICIAL_CHANNEL_NAME}. Accede ahora desde tu cuenta de alumno para participar.`
          : `Se ha programado una nueva sesión formativa (${adminScheduledDate}) en el canal ${OFFICIAL_CHANNEL_NAME}.`;

      await addDoc(collection(db, 'notifications'), {
        title: notificationTitle,
        message: notificationMessage,
        type: 'class',
        targetRole: 'all',
        createdAt: new Date().toISOString(),
        link: '#streaming',
      });

      // 3. Audio Chime
      playChimeAlert();

      setAdminFeedback(
        `✅ Transmisión actualizada exitosamente en estado [${targetStatus.toUpperCase()}]. Notificación enviada a todos los alumnos.`
      );
      setTimeout(() => setAdminFeedback(null), 6000);
    } catch (err: unknown) {
      console.error('Error al actualizar broadcast:', err);
      setAdminFeedback('❌ Error al actualizar la transmisión en Firestore. Revisa tu conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  // ADMIN: Notificar emisión o nuevo contenido en TikTok (@alhadiqa.capital)
  const handleNotifyTikTokBroadcast = async (mode: 'en_vivo' | 'nuevo_contenido') => {
    setIsSaving(true);
    setAdminFeedback(null);
    const nowIso = new Date().toISOString();
    const targetUrl =
      adminManualLink.includes('tiktok.com')
        ? adminManualLink.trim()
        : mode === 'en_vivo'
        ? OFFICIAL_TIKTOK_LIVE_URL
        : OFFICIAL_TIKTOK_URL;
    const customTitle =
      adminTitle.trim() ||
      (mode === 'en_vivo'
        ? `Live en Directo desde TikTok ${OFFICIAL_TIKTOK_NAME}`
        : `Nuevo Contenido Financiero en TikTok ${OFFICIAL_TIKTOK_NAME}`);

    try {
      await setDoc(
        doc(db, 'live_broadcasts', 'tiktok_alhadiqa_capital'),
        {
          id: 'tiktok_alhadiqa_capital',
          title: customTitle,
          description:
            adminDesc.trim() ||
            `Transmisión y contenido oficial en TikTok ${OFFICIAL_TIKTOK_NAME}. Toca para ver en directo.`,
          youtubeUrl: targetUrl,
          channelUrl: OFFICIAL_TIKTOK_URL,
          status: mode === 'en_vivo' ? 'en_vivo' : 'standby',
          isLive: mode === 'en_vivo',
          instructor: 'Sr.smith (Carlos Smith Zambrano)',
          category: adminCategory || 'Al-Hadiqa Capital',
          updatedAt: nowIso,
          lastNotificationSent: nowIso,
        },
        { merge: true }
      );

      await addDoc(collection(db, 'notifications'), {
        title:
          mode === 'en_vivo'
            ? `🔴 ¡EN VIVO en TikTok ${OFFICIAL_TIKTOK_NAME}! ${customTitle}`
            : `🎵 Nuevo contenido en TikTok ${OFFICIAL_TIKTOK_NAME}: ${customTitle}`,
        message: `El canal oficial de TikTok (${OFFICIAL_TIKTOK_URL}) ha emitido nuevo contenido. Haz clic para verlo en directo.`,
        type: 'class',
        category: mode === 'en_vivo' ? 'clase' : 'contenido',
        targetRole: 'all',
        createdAt: nowIso,
        actionUrl: targetUrl,
        actionLabel: 'Abrir en TikTok',
        link: targetUrl,
      });

      playChimeAlert();
      setAdminFeedback(
        `✅ Notificación de TikTok (${OFFICIAL_TIKTOK_NAME}) emitida en toda la web y campanita.`
      );
      setTimeout(() => setAdminFeedback(null), 6000);
    } catch (err) {
      console.error('Error notificando TikTok:', err);
      setAdminFeedback('❌ No se pudo emitir la notificación de TikTok en Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  // ADMIN: Enviar alerta manual rápida a los alumnos
  const handleSendQuickAlert = async () => {
    try {
      await addDoc(collection(db, 'notifications'), {
        title: `🔴 Recordatorio en Vivo: ${broadcast.title}`,
        message: `Sr.smith está respondiendo preguntas de alumnos y analizando gráficos en tiempo real en la sala de streaming.`,
        type: 'class',
        targetRole: 'all',
        createdAt: new Date().toISOString(),
        link: '#streaming',
      });
      playChimeAlert();
      setAdminFeedback('🔔 ¡Alerta instantánea emitida a todos los alumnos conectados!');
      setTimeout(() => setAdminFeedback(null), 4000);
    } catch (err) {
      console.error(err);
      setAdminFeedback('❌ No se pudo enviar la alerta instantánea.');
    }
  };

  // STUDENT: Enviar pregunta en vivo al instructor (con inspección heurística SOC EXCAISRES anti-XSS/SQLi)
  const handleStudentSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = studentQuestion.trim();
    if (!cleaned || !currentUser) return;

    const threat = socService.inspectPayload(cleaned);
    if (threat.isThreat && threat.vector) {
      socService.detectAndMitigate({
        attackVector: threat.vector,
        severity: 'HIGH',
        targetEndpoint: '/streaming/live-qa',
        payloadSample: threat.sample || cleaned.slice(0, 120),
        details: 'Payload malicioso neutralizado en preguntas en vivo de transmisión.',
      });
      setStudentFeedback('🛡️ Mensaje bloqueado por SOC EXCAISRES por contener sintaxis no permitida.');
      setTimeout(() => setStudentFeedback(null), 5000);
      return;
    }

    const newQ = {
      id: 'q_' + Date.now(),
      author: `${currentUser.displayName || 'Alumno'}`,
      text: cleaned.slice(0, 400),
      time: 'Justo ahora',
    };

    setStudentQuestionsList((prev) => [newQ, ...prev]);
    setStudentQuestion('');
    setStudentFeedback('✅ Tu pregunta ha sido enviada a Sr.smith para ser respondida en la clase.');
    setTimeout(() => setStudentFeedback(null), 4000);
  };

  return (
    <section id="streaming" className="streaming-hub-section" aria-labelledby="streaming-section-title">
      <div className="wrap">
        {/* ENCABEZADO DE LA SECCIÓN */}
        <div className="section-head text-center" style={{ maxWidth: '880px', margin: '0 auto 2.5rem' }}>
          <div className="streaming-badge-row">
            {broadcast.status === 'en_vivo' ? (
              <span className="streaming-live-pill">
                <span className="live-pulsing-dot" aria-hidden="true"></span>
                <span>TRANSMISIÓN EN VIVO AHORA</span>
              </span>
            ) : broadcast.status === 'programada' ? (
              <span className="streaming-scheduled-pill">
                <span>⏳ CLASE PROGRAMADA ({broadcast.scheduledAt})</span>
              </span>
            ) : (
              <span className="streaming-standby-pill">
                <span>📺 SALA DE TRANSMISIÓN OFICIAL</span>
              </span>
            )}

            <a
              href={OFFICIAL_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="streaming-channel-badge"
              title="Abrir canal oficial en YouTube"
            >
              <span>YouTube:</span>
              <strong style={{ color: 'var(--gold)' }}>{OFFICIAL_CHANNEL_NAME}</strong>
              <span aria-hidden="true">↗</span>
            </a>

            <a
              href={OFFICIAL_TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="streaming-channel-badge"
              title="Abrir canal oficial de TikTok @alhadiqa.capital"
              style={{ borderColor: tiktokIsLive ? 'rgba(244, 63, 94, 0.7)' : 'rgba(16, 185, 129, 0.4)' }}
            >
              <span>{tiktokIsLive ? '🔴 LIVE TikTok:' : '🎵 TikTok:'}</span>
              <strong style={{ color: '#6ee7b7' }}>{OFFICIAL_TIKTOK_NAME}</strong>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <h2 id="streaming-section-title" className="streaming-title">
            Sala de Streaming &amp; <span className="gold-text">Transmisiones Oficiales</span>
          </h2>
          <p className="streaming-subtitle">
            Sesiones interactivas de trading institucional, análisis SMC en vivo y psicotrading impartidas
            directamente por <strong>Sr.smith</strong>. Los alumnos registrados reciben alertas en tiempo real y
            acceso exclusivo desde sus cuentas.
          </p>
        </div>

        {/* =========================================================================
            PANEL DE CONTROL EXCLUSIVO DEL ADMINISTRADOR (Sr.smith)
            Permite iniciar lives, añadir links de forma manual y notificar alumnos
           ========================================================================= */}
        {isAdmin && (
          <div className="admin-streaming-control-panel">
            <div className="admin-panel-top">
              <div className="admin-panel-header-info">
                <span className="admin-panel-crown">👑</span>
                <div>
                  <h3 className="admin-panel-title">Panel Maestro de Transmisión (Control del Admin)</h3>
                  <p className="admin-panel-sub">
                    Configura la emisión en directo, añade el link manual de YouTube y dispara notificaciones
                    automáticas a toda la academia.
                  </p>
                </div>
              </div>
              <span className="admin-tag-live">Admin Verificado · Sr.smith</span>
            </div>

            {adminFeedback && (
              <div className="admin-feedback-banner" role="status">
                {adminFeedback}
              </div>
            )}

            <div className="admin-controls-grid">
              {/* Campo 1: Añadir Link Manual de Live */}
              <div className="admin-field-group">
                <label className="admin-label">
                  <span>🔗 Enlace Manual de YouTube Live / Video ID:</span>
                  <span className="admin-label-hint">Pega el link del directo o video</span>
                </label>
                <div className="admin-input-with-button">
                  <input
                    type="text"
                    className="admin-text-input"
                    placeholder="Ej: https://www.youtube.com/live/... o https://www.tiktok.com/@alhadiqa.capital"
                    value={adminManualLink}
                    onChange={(e) => setAdminManualLink(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn--ghost admin-quick-btn"
                    onClick={() => setAdminManualLink(OFFICIAL_CHANNEL_URL)}
                    title="Usar canal oficial de YouTube"
                  >
                    YouTube
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost admin-quick-btn"
                    onClick={() => setAdminManualLink(OFFICIAL_TIKTOK_URL)}
                    title="Usar canal oficial de TikTok @alhadiqa.capital"
                  >
                    TikTok
                  </button>
                </div>
                <span className="admin-input-helper">
                  Canales oficiales: <code>{OFFICIAL_CHANNEL_NAME}</code> (YouTube) · <code>{OFFICIAL_TIKTOK_NAME}</code> (TikTok)
                </span>
              </div>

              {/* Campo 2: Estado de Transmisión */}
              <div className="admin-field-group">
                <label className="admin-label">
                  <span>📡 Estado de la Transmisión:</span>
                </label>
                <select
                  className="admin-select-input"
                  value={adminStatus}
                  onChange={(e) => setAdminStatus(e.target.value as LiveBroadcastState['status'])}
                >
                  <option value="en_vivo">🔴 EN VIVO AHORA (Emitiendo en directo)</option>
                  <option value="programada">⏳ PROGRAMADA (Próxima sesión)</option>
                  <option value="standby">⏸️ STANDBY (Canal / Repetición)</option>
                  <option value="finalizada">🏁 FINALIZADA (Clase Concluida)</option>
                </select>
              </div>

              {/* Campo 3: Título de la Clase */}
              <div className="admin-field-group">
                <label className="admin-label">
                  <span>📝 Título de la Sesión en Vivo:</span>
                </label>
                <input
                  type="text"
                  className="admin-text-input"
                  placeholder="Ej: Masterclass SMC: Liquidez en Apertura de Londres..."
                  value={adminTitle}
                  onChange={(e) => setAdminTitle(e.target.value)}
                />
              </div>

              {/* Campo 4: Categoría y Fecha */}
              <div className="admin-field-group">
                <label className="admin-label">
                  <span>🏷️ Categoría de Trading:</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    className="admin-select-input"
                    value={adminCategory}
                    onChange={(e) => setAdminCategory(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="SMC Institucional">SMC Institucional</option>
                    <option value="Forex & Metales">Forex &amp; Metales (XAU/USD)</option>
                    <option value="Cuentas de Fondeo">Cuentas de Fondeo</option>
                    <option value="Psicotrading">Psicología &amp; Disciplina</option>
                    <option value="Al-Hadiqa Capital">Al-Hadiqa Capital &amp; Kiyosaki</option>
                  </select>

                  <input
                    type="text"
                    className="admin-text-input"
                    placeholder="Fecha / Hora programada"
                    value={adminScheduledDate}
                    onChange={(e) => setAdminScheduledDate(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Campo 5: Temario / Descripción */}
              <div className="admin-field-group admin-field-group--full">
                <label className="admin-label">
                  <span>📋 Temario y Puntos Clave de la Transmisión:</span>
                </label>
                <textarea
                  className="admin-textarea-input"
                  rows={2}
                  placeholder="Detalla qué conceptos se abordarán (ej: mitigación de Order Blocks, spreads en JustMarkets, gestión 1:3)..."
                  value={adminDesc}
                  onChange={(e) => setAdminDesc(e.target.value)}
                />
              </div>
            </div>

            {/* Botones de Acción de Publicación y Alerta */}
            <div className="admin-actions-bar">
              <button
                type="button"
                className="btn btn--gold admin-publish-btn"
                onClick={() => handleAdminPublishBroadcast('en_vivo')}
                disabled={isSaving}
              >
                <span>🔴 Iniciar Transmisión EN VIVO &amp; Notificar a Alumnos</span>
              </button>

              <button
                type="button"
                className="btn btn--ghost admin-schedule-btn"
                onClick={() => handleAdminPublishBroadcast('programada')}
                disabled={isSaving}
              >
                <span>⏳ Programar Clase &amp; Avisar</span>
              </button>

              <button
                type="button"
                className="btn btn--ghost admin-alert-btn"
                onClick={handleSendQuickAlert}
                title="Disparar recordatorio push a los alumnos"
              >
                <span>🔔 Enviar Alerta Push</span>
              </button>

              <button
                type="button"
                className="btn btn--emerald admin-alert-btn"
                onClick={() => handleNotifyTikTokBroadcast('en_vivo')}
                disabled={isSaving}
                title="Notificar en la web que @alhadiqa.capital está transmitiendo en vivo en TikTok"
              >
                <span>🎵 Notificar Live TikTok @alhadiqa.capital</span>
              </button>

              <button
                type="button"
                className="btn btn--ghost admin-alert-btn"
                onClick={() => handleNotifyTikTokBroadcast('nuevo_contenido')}
                disabled={isSaving}
                title="Notificar en la web un nuevo video/contenido de @alhadiqa.capital en TikTok"
              >
                <span>📢 Avisar Nuevo Video TikTok</span>
              </button>

              <button
                type="button"
                className="btn btn--ghost admin-finish-btn"
                onClick={() => handleAdminPublishBroadcast('finalizada')}
                disabled={isSaving}
              >
                <span>🏁 Finalizar Transmisión</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SALA DE STREAMING PRINCIPAL (ZONA DEL REPRODUCTOR & ACCESO DE ALUMNOS)
           ========================================================================= */}
        <div className="streaming-player-layout">
          {/* Columna Izquierda: Reproductor Principal o Candado de Alumno */}
          <div className="streaming-main-viewport">
            {currentUser ? (
              /* ALUMNO CONECTADO: REPRODUCTOR ACTIVO */
              <div className="streaming-video-container">
                <div className="streaming-aspect-ratio-box">
                  {activeStreamSource === 'tiktok' && isTikTokChannelLive ? (
                    <div className="streaming-empty-fallback" style={{ padding: '2rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '3rem' }}>🎵</span>
                      <h4 style={{ color: '#fff', fontSize: '1.15rem', margin: '0.5rem 0' }}>
                        Canal Oficial TikTok: {OFFICIAL_TIKTOK_NAME}
                      </h4>
                      <p style={{ maxWidth: '460px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        {tiktokStatusNote}. Por políticas de reproducción directa de TikTok LIVE, abre la señal
                        oficial en directo con un clic:
                      </p>
                      <a
                        href={activeUrl.includes('tiktok.com') ? activeUrl : OFFICIAL_TIKTOK_LIVE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--emerald"
                      >
                        <span>🔴 Ver Transmisión en Vivo en TikTok ({OFFICIAL_TIKTOK_NAME}) ↗</span>
                      </a>
                    </div>
                  ) : embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={activeTitle}
                      className="streaming-iframe"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="streaming-empty-fallback">
                      <span style={{ fontSize: '3rem' }}>📺</span>
                      <p>Cargando señal de transmisión de {OFFICIAL_CHANNEL_NAME}...</p>
                    </div>
                  )}
                </div>

                {/* Barra de Estado en Tiempo Real de la Transmisión */}
                <div className="streaming-live-status-bar">
                  <div className="streaming-status-left">
                    {broadcast.status === 'en_vivo' ? (
                      <span className="badge-live-pulse">
                        <span className="pulse-red-glow"></span>
                        <span>EN DIRECTO</span>
                      </span>
                    ) : (
                      <span className="badge-standby">STANDBY</span>
                    )}
                    <span className="streaming-viewers-count">
                      <span>👥</span>
                      <strong>{broadcast.viewerCount || 140} alumnos en sala</strong>
                    </span>
                    <span className="streaming-resolution-badge">1080p HD 60fps</span>
                  </div>

                  <div className="streaming-status-right">
                    <a
                      href={activeUrl || OFFICIAL_CHANNEL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-open-youtube"
                    >
                      <span>Ver en YouTube</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* USUARIO NO AUTENTICADO: CANDADO INSTITUCIONAL */
              <div className="streaming-auth-lock-card">
                <div className="lock-card-backdrop" aria-hidden="true"></div>
                <div className="lock-card-content">
                  <div className="lock-icon-bubble">🔒</div>
                  <h3 className="lock-title">Sala de Transmisión Exclusiva para Alumnos</h3>
                  <p className="lock-desc">
                    Las clases y transmisiones en vivo son impartidas por <strong>Sr.smith</strong> a través de
                    nuestro canal oficial <strong>{OFFICIAL_CHANNEL_NAME}</strong>. Accede desde tu cuenta de
                    alumno para desbloquear el reproductor en tiempo real, interactuar con el docente y recibir
                    las notificaciones automáticas de inicio de clase.
                  </p>

                  <div className="lock-cta-wrap">
                    <button
                      type="button"
                      className="btn lock-google-btn"
                      onClick={() => signInWithGoogle()}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.89c2.27-2.09 3.655-5.17 3.655-9.15z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3.05c-1.08.72-2.45 1.16-4.04 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.26 21.4 7.36 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.32 14.24c-.25-.72-.39-1.49-.39-2.24s.14-1.52.39-2.24V6.61H1.21C.44 8.14 0 9.87 0 12s.44 3.86 1.21 5.39l4.11-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.6 1.21 6.61l4.11 3.15c.94-2.85 3.57-5.01 6.68-5.01z"
                        />
                      </svg>
                      <span>Acceder con Google para Ver la Clase</span>
                    </button>
                    <span className="lock-guarantee-note">
                      ✓ Acceso 100% gratuito para alumnos de la academia · Sincronización instantánea
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Metadatos y Descripción de la Clase Activa */}
            <div className="streaming-class-meta-card">
              <div className="streaming-meta-header">
                <div>
                  <span className="streaming-category-tag">{broadcast.category}</span>
                  <h3 className="streaming-active-title">{activeTitle}</h3>
                </div>
                <div className="streaming-instructor-box">
                  <div className="instructor-avatar-mini">🦁</div>
                  <div>
                    <div className="instructor-name">{broadcast.instructor}</div>
                    <div className="instructor-title">Fundador &amp; Master Trader</div>
                  </div>
                </div>
              </div>

              <p className="streaming-active-desc">{activeDesc}</p>

              {/* Barra de Notificaciones y Recursos para el Alumno */}
              <div className="streaming-student-toolbar">
                <div className="student-alert-toggle">
                  <button
                    type="button"
                    className={`btn btn--ghost student-notif-btn ${studentNotifsActive ? 'is-active' : ''}`}
                    onClick={async () => {
                      const next = !studentNotifsActive;
                      setStudentNotifsActive(next);
                      if (next && 'Notification' in window && window.Notification.permission === 'default') {
                        try {
                          await window.Notification.requestPermission();
                        } catch {
                          // ignore permission denial
                        }
                      }
                      playChimeAlert();
                      setStudentFeedback(
                        next
                          ? '🔔 Alertas activadas: Recibirás avisos en la web cuando transmitan @AL-HADIQAINVEST (YouTube) o @alhadiqa.capital (TikTok).'
                          : '🔕 Notificaciones de transmisión silenciadas.'
                      );
                      setTimeout(() => setStudentFeedback(null), 5000);
                    }}
                  >
                    <span>{studentNotifsActive ? '🔔 Notificaciones Activadas' : '🔕 Activar Alertas'}</span>
                  </button>

                  <a
                    href="https://one.justmarkets.link/a/kgi9s02uqu"
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="btn btn--emerald student-broker-btn"
                  >
                    <span>Abrir Gráfico en JustMarkets</span>
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>

                {studentFeedback && (
                  <div className="student-feedback-banner" role="status">
                    {studentFeedback}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Interacción en Vivo & Preguntas Pedagógicas */}
          <div className="streaming-side-panel">
            <div className="side-panel-card">
              <div className="side-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>💬</span>
                  <h4 className="side-panel-title">Preguntas a Sr.smith</h4>
                </div>
                <span className="side-panel-live-tag">En Directo</span>
              </div>

              <div className="side-panel-desc">
                Haz tus preguntas técnicas sobre Order Blocks, FVG o gestión. Sr.smith las responde durante la transmisión.
              </div>

              {/* Formulario de Pregunta del Alumno */}
              {currentUser ? (
                <form onSubmit={handleStudentSubmitQuestion} className="student-question-form">
                  <textarea
                    className="student-question-input"
                    rows={2}
                    placeholder="Escribe tu consulta para Sr.smith..."
                    value={studentQuestion}
                    onChange={(e) => setStudentQuestion(e.target.value)}
                  />
                  <button type="submit" className="btn btn--gold student-question-send-btn">
                    <span>Enviar Pregunta</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </form>
              ) : (
                <div className="student-login-to-chat">
                  <span>Inicia sesión para enviar preguntas durante la clase.</span>
                </div>
              )}

              {/* Feed de Preguntas de los Alumnos */}
              <div className="student-questions-feed">
                {studentQuestionsList.map((q) => (
                  <div key={q.id} className="question-bubble">
                    <div className="question-bubble-top">
                      <strong className="question-author">{q.author}</strong>
                      <span className="question-time">{q.time}</span>
                    </div>
                    <p className="question-text">{q.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjeta de Acceso Directo al Canal de YouTube */}
            <div className="youtube-channel-highlight-card">
              <div className="yt-card-header">
                <span className="yt-icon-red">▶</span>
                <div>
                  <div className="yt-channel-name">{OFFICIAL_CHANNEL_NAME}</div>
                  <div className="yt-channel-sub">Canal Oficial de Transmisión</div>
                </div>
              </div>
              <p className="yt-channel-text">
                Suscríbete y activa la campana para recibir alertas directas en YouTube de todas nuestras
                transmisiones públicas y privadas.
              </p>
              <a
                href={OFFICIAL_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost yt-subscribe-btn"
              >
                <span>Visitar Canal Oficial de YouTube</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            {/* Tarjeta de Acceso Directo al Canal Oficial de TikTok (@alhadiqa.capital) */}
            <div className="youtube-channel-highlight-card" style={{ marginTop: '1rem', borderColor: tiktokIsLive ? 'rgba(244, 63, 94, 0.65)' : 'rgba(16, 185, 129, 0.35)' }}>
              <div className="yt-card-header">
                <span className="yt-icon-red" style={{ background: 'linear-gradient(135deg, #0f172a, #10b981)', color: '#fff' }}>🎵</span>
                <div>
                  <div className="yt-channel-name">{OFFICIAL_TIKTOK_NAME}</div>
                  <div className="yt-channel-sub">
                    {tiktokIsLive ? '🔴 Transmitiendo en Vivo en TikTok' : 'Canal Oficial TikTok · Monitoreo Activo'}
                  </div>
                </div>
              </div>
              <p className="yt-channel-text">
                Sigue nuestro TikTok oficial para recibir notificaciones instantáneas en esta web cada vez que
                publiquemos análisis rápidos o iniciemos transmisiones en vivo.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a
                  href={OFFICIAL_TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--emerald yt-subscribe-btn"
                >
                  <span>Visitar TikTok {OFFICIAL_TIKTOK_NAME}</span>
                  <span aria-hidden="true">↗</span>
                </a>
                <button
                  type="button"
                  className="btn btn--ghost yt-subscribe-btn"
                  onClick={async () => {
                    if ('Notification' in window && window.Notification.permission !== 'granted') {
                      await window.Notification.requestPermission().catch(() => {});
                    }
                    setStudentNotifsActive(true);
                    playChimeAlert();
                    setStudentFeedback('🔔 Alertas de TikTok @alhadiqa.capital activadas en tiempo real.');
                    setTimeout(() => setStudentFeedback(null), 4000);
                  }}
                >
                  <span>🔔 Activar Alertas de TikTok en Web</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SELECCIÓN DE CLASES GRABADAS DEL CANAL @AL-HADIQAINVEST
           ========================================================================= */}
        <div className="recorded-classes-block">
          <div className="recorded-head">
            <div>
              <h3 className="recorded-title">Clases Magistrales Anteriores en {OFFICIAL_CHANNEL_NAME}</h3>
              <p className="recorded-sub">
                Repasa las grabaciones de análisis técnico, barridos de liquidez y psicotrading cuando desees.
              </p>
            </div>

            <a
              href={OFFICIAL_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost view-all-yt-btn"
            >
              <span>Ver Todo el Archivo en YouTube</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="recorded-grid">
            {RECORDED_CLASSES.map((rc) => (
              <div
                key={rc.id}
                className="recorded-card"
                onClick={() => {
                  setActiveUrl(rc.youtubeUrl);
                  setActiveTitle(rc.title);
                  setActiveDesc(rc.description);
                  // Scroll smoothly to player
                  document.getElementById('streaming')?.scrollIntoView({ behavior: 'smooth' });
                }}
                role="button"
                tabIndex={0}
                title="Hacer clic para cargar esta clase en el reproductor"
              >
                <div
                  className="recorded-thumb"
                  style={{ backgroundColor: rc.thumbnailPlaceholderColor }}
                >
                  <span className="recorded-play-icon">▶</span>
                  <span className="recorded-duration-badge">{rc.duration}</span>
                </div>
                <div className="recorded-body">
                  <span className="recorded-category">{rc.category}</span>
                  <h4 className="recorded-card-title">{rc.title}</h4>
                  <p className="recorded-card-desc">{rc.description}</p>
                  <div className="recorded-card-action">
                    <span>Cargar en Reproductor</span>
                    <span aria-hidden="true">&rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
