import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { parseStreamEmbedUrl } from '../utils/streamUrlParser';
import { verifyStreamUrlIntegrity } from '../services/streamCryptoService';
import { socService } from '../services/socService';
import { WebRTCBroadcastStudio } from './WebRTCBroadcastStudio';
import { LiveSessionChat } from './LiveSessionChat';

export type ClassStatus =
  | 'borrador'
  | 'pendiente_aprobacion'
  | 'aprobada'
  | 'programada'
  | 'en_vivo'
  | 'finalizada'
  | 'archivada'
  | 'rechazada';

export interface LiveClassItem {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: 'SMC' | 'Forex' | 'Cripto' | 'Psicología' | 'Capital' | 'General';
  scheduledAt: string;
  streamUrl: string;
  streamSource?: 'youtube' | 'twitch' | 'facebook' | 'webrtc_direct' | 'custom_embed';
  status: ClassStatus;
  createdBy: string;
  approvedBy?: string;
  partnerNotes?: string;
}

const SEED_CLASSES: Omit<LiveClassItem, 'id'>[] = [
  {
    title: 'Masterclass SMC: Detección de Order Blocks Institucionales y FVG',
    description: 'Análisis en vivo de la apertura de Nueva York, lectura de flujo de órdenes e identificación de zonas de descuento para entradas con ratio 1:3+.',
    instructor: 'Sr.smith (Carlos Smith Zambrano)',
    category: 'SMC',
    scheduledAt: '2026-10-26 14:00 UTC',
    streamUrl: 'https://www.youtube.com/watch?v=live_stream',
    status: 'en_vivo',
    createdBy: 'system_admin',
    approvedBy: 'JustMarkets Approver Team',
    partnerNotes: 'Aprobada por JustMarkets Compliance. Aviso legal verificado.',
  },
  {
    title: 'Estrategia de Liquidez Turtle Soup en XAU/USD (Oro)',
    description: 'Cómo operar los barridos de máximos y mínimos asiáticos evitando las trampas minoristas de rompimiento en falso.',
    instructor: 'Sr.smith (Carlos Smith Zambrano)',
    category: 'Forex',
    scheduledAt: '2026-10-28 15:30 UTC',
    streamUrl: 'https://www.youtube.com/watch?v=live_stream_2',
    status: 'programada',
    createdBy: 'system_admin',
    approvedBy: 'JustMarkets Approver Team',
    partnerNotes: 'Aprobada técnicamente para su programación.',
  },
  {
    title: 'Psicología Operativa y Blindaje del Capital ante Alta Volatilidad',
    description: 'Reglas de stop out, dimensionamiento de posición en lotes y transición psicológica hacia cuentas de fondeo institucional.',
    instructor: 'Sr.smith (Carlos Smith Zambrano)',
    category: 'Psicología',
    scheduledAt: '2026-10-31 18:00 UTC',
    streamUrl: 'https://www.twitch.tv/alhadiqainvest',
    status: 'pendiente_aprobacion',
    createdBy: 'system_admin',
    partnerNotes: 'En revisión técnica por el socio JustMarkets para cumplimiento de normativas.',
  },
];

export const LiveClassesSection: React.FC = () => {
  const { currentUser, profile, isAdmin, isApprover } = useAuth();
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeClass, setActiveClass] = useState<LiveClassItem | null>(null);
  const [studioClass, setStudioClass] = useState<LiveClassItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Approver rejection modal state
  const [rejectingClass, setRejectingClass] = useState<LiveClassItem | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // New Class Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<LiveClassItem['category']>('SMC');
  const [newDate, setNewDate] = useState('2026-11-05 15:00 UTC');
  const [newStreamUrl, setNewStreamUrl] = useState('https://www.youtube.com/watch?v=live_stream');

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'classes'),
      async (snapshot) => {
        if (snapshot.empty && isAdmin && auth.currentUser) {
          try {
            for (const item of SEED_CLASSES) {
              const classRef = doc(collection(db, 'classes'));
              await setDoc(classRef, {
                ...item,
                id: classRef.id,
                createdAt: serverTimestamp(),
              });
            }
            return;
          } catch (seedErr) {
            console.warn('Classes auto-seed fallback to base catalog:', seedErr);
          }
        }

        const list: LiveClassItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Normalize legacy statuses if needed
          let status: ClassStatus = (data.status as ClassStatus) || 'programada';
          if (data.status === 'published') status = 'programada';
          if (data.status === 'draft') status = 'borrador';
          if (data.status === 'approved') status = 'aprobada';
          if (data.status === 'pending_approval') status = 'pendiente_aprobacion';

          list.push({
            id: docSnap.id,
            ...(data as Omit<LiveClassItem, 'id' | 'status'>),
            status,
          });
        });

        setClasses(
          list.length > 0
            ? list
            : SEED_CLASSES.map((s, idx) => ({ ...s, id: `seed-${idx}` }))
        );
      },
      (error) => {
        console.warn('Al-Hadiqa Invest: Clases sincronizadas con catálogo base:', error);
        setClasses(SEED_CLASSES.map((s, idx) => ({ ...s, id: `seed-${idx}` })));
      }
    );

    return () => unsub();
  }, [isAdmin]);

  const showMsg = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const textThreat = socService.inspectPayload(`${newTitle} ${newDesc}`);
    if (textThreat.isThreat && textThreat.vector) {
      socService.detectAndMitigate({
        attackVector: textThreat.vector,
        severity: 'HIGH',
        targetEndpoint: '/live-classes/create',
        payloadSample: textThreat.sample || newTitle.slice(0, 100),
        details: 'Payload sospechoso bloqueado al programar clase en vivo.',
      });
      showMsg('🛡️ Contenido bloqueado por el blindaje de seguridad SOC EXCAISRES.');
      return;
    }

    const urlValidation = verifyStreamUrlIntegrity(newStreamUrl.trim());
    if (!urlValidation.valid) {
      showMsg(`🛡️ Enlace de transmisión bloqueado: ${urlValidation.reason}`);
      return;
    }

    try {
      const classRef = doc(collection(db, 'classes'));
      const newClassData: Omit<LiveClassItem, 'id'> = {
        title: newTitle.trim(),
        description: newDesc.trim(),
        instructor: profile?.displayName || 'Sr.smith (Carlos Smith Zambrano)',
        category: newCategory,
        scheduledAt: newDate,
        streamUrl: urlValidation.sanitizedUrl,
        status: 'pendiente_aprobacion', // Follows required workflow
        createdBy: currentUser?.uid || 'admin',
      };

      await setDoc(classRef, { ...newClassData, createdAt: serverTimestamp() });

      // Automatic announcement to all users
      await addDoc(collection(db, 'notifications'), {
        title: `📅 Nueva Clase Programada: ${newTitle.trim()}`,
        message: `Se ha agendado una nueva sesión de ${newCategory} para el ${newDate}. Temario: ${newDesc.trim().slice(0, 150)}...`,
        targetRole: 'all',
        type: 'class',
        createdAt: serverTimestamp(),
      });

      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
      showMsg('Clase programada, enviada a revisión y aviso automático emitido.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'classes');
    }
  };

  const handleApproveClass = async (cls: LiveClassItem, note?: string) => {
    try {
      const partnerNote = note?.trim() || 'Aprobada por JustMarkets Compliance. Cumple normativas educativas.';
      await updateDoc(doc(db, 'classes', cls.id), {
        status: 'aprobada',
        approvedBy: profile?.displayName || currentUser?.displayName || 'JustMarkets Approver Team',
        partnerNotes: partnerNote,
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'notifications'), {
        title: `✓ Clase Aprobada por JustMarkets: ${cls.title}`,
        message: `El socio JustMarkets ha validado la clase. Sr.smith ya puede programarla o emitirla. Nota: "${partnerNote}"`,
        targetRole: 'admin',
        type: 'class',
        createdAt: serverTimestamp(),
      });
      showMsg(`Clase "${cls.title}" aprobada por JustMarkets.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${cls.id}`);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingClass) return;
    if (!rejectionNotes.trim()) {
      alert('Por favor escribe los comentarios u observaciones para rechazar la clase.');
      return;
    }

    try {
      await updateDoc(doc(db, 'classes', rejectingClass.id), {
        status: 'rechazada',
        approvedBy: profile?.displayName || currentUser?.displayName || 'JustMarkets Approver Team',
        partnerNotes: rejectionNotes.trim(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        title: `⚠️ Observaciones de JustMarkets en: ${rejectingClass.title}`,
        message: `La clase requiere ajustes antes de ser aprobada. Motivo: "${rejectionNotes.trim()}".`,
        targetRole: 'admin',
        type: 'urgent',
        createdAt: serverTimestamp(),
      });

      showMsg(`Clase devuelta a la administración con observaciones.`);
      setRejectingClass(null);
      setRejectionNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${rejectingClass.id}`);
    }
  };

  const handleSetClassStatus = async (classId: string, classTitle: string, status: ClassStatus, currentStatus?: ClassStatus) => {
    // Requisito del Socio: Toda clase debe pasar por revisión antes de publicarse
    if ((status === 'en_vivo' || status === 'programada') && currentStatus !== 'aprobada' && currentStatus !== 'en_vivo') {
      showMsg('⚠️ Requisito del Socio: Toda clase debe ser aprobada previamente por JustMarkets antes de programarse o emitirse en directo.');
      return;
    }

    try {
      await updateDoc(doc(db, 'classes', classId), {
        status,
        updatedAt: serverTimestamp(),
      });

      // Automatic broadcast alert if starting live
      if (status === 'en_vivo') {
        await addDoc(collection(db, 'notifications'), {
          title: `🔴 ¡EN VIVO AHORA! ${classTitle}`,
          message: `Sr.smith ha iniciado la transmisión. Conéctate a la sala de clases para el análisis de mercado en tiempo real.`,
          targetRole: 'all',
          type: 'urgent',
          createdAt: serverTimestamp(),
        });
      }

      showMsg(`Estado de clase actualizado a: ${status.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
    }
  };

  const canAccess = isAdmin || isApprover || (profile?.status === 'active' && profile?.permissions?.canAccessClasses);

  const getStatusBadge = (status: ClassStatus) => {
    switch (status) {
      case 'en_vivo':
        return { label: '● EN VIVO AHORA', bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '#ef4444' };
      case 'programada':
        return { label: '📅 Programada', bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)', border: 'var(--emerald)' };
      case 'aprobada':
        return { label: '✓ Aprobada por Socio', bg: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: '#3b82f6' };
      case 'pendiente_aprobacion':
        return { label: '⏳ Pendiente Aprobación', bg: 'rgba(251, 191, 36, 0.15)', color: 'var(--gold)', border: 'var(--gold)' };
      case 'rechazada':
        return { label: '✕ Rechazada / Observaciones', bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '#ef4444' };
      case 'finalizada':
        return { label: '📼 Finalizada / Grabada', bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--muted)', border: 'var(--line)' };
      case 'archivada':
        return { label: '📦 Archivada', bg: 'rgba(148, 163, 184, 0.1)', color: 'var(--muted-2)', border: 'var(--line)' };
      default:
        return { label: '📝 Borrador', bg: 'rgba(148, 163, 184, 0.1)', color: 'var(--muted)', border: 'var(--line)' };
    }
  };

  return (
    <section className="section" id="clases-en-vivo" aria-labelledby="classes-heading">
      <div className="wrap">
        
        {/* Section Head */}
        <div className="section-head" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: 'var(--emerald)',
                boxShadow: '0 0 10px var(--emerald)',
                animation: 'sessionPulse 2s infinite ease-in-out',
              }}
            ></span>
            <p className="eyebrow" style={{ marginBottom: 0 }}>
              Transmisión Espejo &amp; Clases en Vivo · Al-Hadiqa Live
            </p>
          </div>
          <h2 className="h-section" id="classes-heading">
            Salas en Directo &amp; <span className="gradient-text">Transmisiones Espejo</span>
          </h2>
          <p>
            Mira las transmisiones oficiales de YouTube, Twitch, Facebook Live y directos WebRTC desde el navegador
            incrustadas dentro de la plataforma sin salir de Al-Hadiqa.
          </p>
        </div>

        {notice && (
          <div
            style={{
              maxWidth: '750px',
              margin: '0 auto 1.5rem',
              padding: '0.8rem 1.4rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--emerald)',
              color: 'var(--emerald)',
              textAlign: 'center',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            ✓ {notice}
          </div>
        )}

        {/* Admin and Approver Action Bar */}
        {(isAdmin || isApprover) && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid var(--gold)',
              borderRadius: 'var(--radius)',
              padding: '1.25rem 1.75rem',
              marginBottom: '2.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <span style={{ fontSize: '1.8rem' }}>{isAdmin ? '👑' : '🤝'}</span>
              <div>
                <strong style={{ color: 'var(--gold)', fontSize: '1rem' }}>
                  {isAdmin
                    ? 'Panel de Transmisiones de Sr.smith (Modo Espejo & WebRTC)'
                    : 'Panel de Aprobación del Socio (JustMarkets)'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>
                  {isAdmin
                    ? 'Incrusta enlaces de YouTube / Twitch / Facebook o transmite directamente tu pantalla y cámara.'
                    : 'Revisa y aprueba clases antes de su publicación oficial a los alumnos.'}
                </p>
              </div>
            </div>

            {isAdmin && (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn--emerald"
                  style={{ padding: '0.55rem 1.2rem', fontSize: '0.84rem' }}
                  onClick={() => setIsCreating((p) => !p)}
                >
                  {isCreating ? 'Cancelar' : '+ Incrustar Transmisión Espejo'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create / Embed Class Form */}
        {isCreating && isAdmin && (
          <form
            onSubmit={handleCreateClass}
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--gold)',
              borderRadius: 'var(--radius)',
              padding: '2rem',
              marginBottom: '2.5rem',
              maxWidth: '850px',
              marginInline: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.3rem' }}>📺</span>
              <h4 style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', margin: 0, fontSize: '1.15rem' }}>
                Configurar Transmisión Espejo (Mirror Streaming)
              </h4>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Pega el enlace de tu transmisión en vivo de <strong>YouTube</strong>, <strong>Twitch</strong>, <strong>Facebook Live</strong> o cualquier reproductor compatible. La plataforma lo incrustará automáticamente en el aula virtual para que los alumnos lo vean sin salir.
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                  Enlace de la Transmisión (YouTube Live, Twitch, Facebook, etc.)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... o https://twitch.tv/..."
                  value={newStreamUrl}
                  onChange={(e) => setNewStreamUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.95rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--gold)',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                  Título de la Clase
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Análisis en Vivo de la Killzone de Londres & Order Blocks"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.95rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                  Descripción y Syllabus
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Pares a analizar, confluencias macroeconómicas y advertencia de riesgo..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.95rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                    Categoría
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as LiveClassItem['category'])}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.95rem',
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                    }}
                  >
                    <option value="SMC">Smart Money Concepts (SMC)</option>
                    <option value="Forex">Forex &amp; Divisas</option>
                    <option value="Cripto">Criptomercados &amp; M2</option>
                    <option value="Psicología">Psicología de Trading</option>
                    <option value="Capital">Al-Hadiqa Capital</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                    Fecha y Hora Programada
                  </label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.95rem',
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setIsCreating(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn--emerald">
                  Guardar e Incrustar Espejo &rarr;
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Approver Compliance Overview Banner */}
        {isApprover && (
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid var(--blue)',
              borderRadius: 'var(--radius)',
              padding: '1.25rem 1.75rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <span style={{ fontSize: '2rem' }}>🤝</span>
              <div>
                <strong style={{ color: '#93c5fd', fontSize: '1.05rem', display: 'block' }}>
                  Bandeja de Aprobador de JustMarkets Activa
                </strong>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>
                  Tienes <strong>{classes.filter((c) => c.status === 'pendiente_aprobacion').length}</strong> clase(s) pendiente(s) de revisión técnica. Solo las clases aprobadas son visibles para los alumnos.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <span className="badge badge--gold" style={{ fontSize: '0.74rem' }}>
                Rol: JustMarkets Approver
              </span>
            </div>
          </div>
        )}

        {/* Classes Grid with 7 States - Only approved classes shown to students */}
        {(() => {
          const visibleClasses = classes.filter((cls) => {
            if (isAdmin || isApprover) return true;
            // Solo las clases aprobadas se muestran a los alumnos
            return ['aprobada', 'programada', 'en_vivo', 'finalizada', 'approved', 'published'].includes(cls.status);
          });

          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {visibleClasses.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '3rem 2rem', textAlign: 'center', background: 'var(--surface-3)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.6rem' }}>⏳</div>
                  <h4 style={{ fontFamily: 'var(--font-head)', color: '#fff', fontSize: '1.15rem' }}>
                    No hay clases aprobadas disponibles actualmente
                  </h4>
                  <p style={{ color: 'var(--muted)', fontSize: '0.86rem', margin: '0.4rem 0 0' }}>
                    Las sesiones se publicarán una vez que hayan sido validadas técnicamente por el socio JustMarkets.
                  </p>
                </div>
              ) : (
                visibleClasses.map((cls) => {
                  const badge = getStatusBadge(cls.status);
                  const isLiveNow = cls.status === 'en_vivo';

                  return (
                    <div
                      key={cls.id}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '1.75rem',
                        border: isLiveNow ? '2px solid #ef4444' : `1px solid ${badge.border}`,
                        boxShadow: isLiveNow ? '0 0 25px rgba(239, 68, 68, 0.25)' : 'var(--shadow)',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.9rem',
                          }}
                        >
                          <span className="badge" style={{ fontSize: '0.7rem' }}>
                            {cls.category}
                          </span>

                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              animation: isLiveNow ? 'sessionPulse 1.5s infinite ease-in-out' : 'none',
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <h3 className="h-card" style={{ fontSize: '1.15rem', marginBottom: '0.6rem', color: '#fff' }}>
                          {cls.title}
                        </h3>

                        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '0.85rem' }}>
                          {cls.description}
                        </p>

                        {/* Partner notes feedback if present */}
                        {cls.partnerNotes && (
                          <div
                            style={{
                              padding: '0.55rem 0.75rem',
                              background: cls.status === 'rechazada' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                              border: `1px solid ${cls.status === 'rechazada' ? '#ef4444' : 'var(--emerald)'}`,
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              color: cls.status === 'rechazada' ? '#fca5a5' : 'var(--emerald)',
                              marginBottom: '0.85rem',
                            }}
                          >
                            💬 <strong>Dictamen JustMarkets:</strong> "{cls.partnerNotes}"
                          </div>
                        )}

                        {/* MANDATORY LEGAL DISCLAIMER VISIBLE ON EVERY CLASS */}
                        <div
                          style={{
                            padding: '0.65rem 0.85rem',
                            background: 'rgba(251, 191, 36, 0.08)',
                            border: '1px solid rgba(251, 191, 36, 0.25)',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            color: 'var(--gold)',
                            lineHeight: 1.45,
                            marginBottom: '1rem',
                          }}
                        >
                          ⚖️ <strong>Aviso legal:</strong> "Las clases son impartidas por un socio y no por el bróker. Contenido educativo, no constituye asesoría financiera."
                        </div>

                        <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--muted-2)', marginBottom: '1.25rem' }}>
                          <div>
                            👨‍🏫 Instructor: <strong style={{ color: 'var(--gold)' }}>{cls.instructor}</strong>
                          </div>
                          <div>
                            🕒 Horario: <strong style={{ color: '#fff' }}>{cls.scheduledAt}</strong>
                          </div>
                          {cls.approvedBy && (
                            <div style={{ color: 'var(--emerald)' }}>
                              ✓ Aprobador JustMarkets: {cls.approvedBy}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div>
                        {/* Approver role actions: Approve or Reject with comments */}
                        {isApprover && cls.status === 'pendiente_aprobacion' && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                            <button
                              type="button"
                              className="btn btn--emerald"
                              style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                              onClick={() => handleApproveClass(cls)}
                            >
                              ✓ Aprobar
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost"
                              style={{ padding: '0.45rem', fontSize: '0.8rem', color: '#fca5a5', borderColor: '#ef4444' }}
                              onClick={() => setRejectingClass(cls)}
                            >
                              ✕ Rechazar con Comentarios
                            </button>
                          </div>
                        )}

                        {/* Admin State Changers */}
                        {isAdmin && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
                            {cls.status !== 'en_vivo' && (
                              <button
                                type="button"
                                className="btn btn--emerald"
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  fontSize: '0.74rem',
                                  background: cls.status === 'aprobada' ? '#ef4444' : 'var(--surface)',
                                  borderColor: cls.status === 'aprobada' ? '#ef4444' : 'var(--line)',
                                }}
                                onClick={() => handleSetClassStatus(cls.id, cls.title, 'en_vivo', cls.status)}
                                title={
                                  cls.status === 'aprobada'
                                    ? 'Iniciar transmisión en vivo'
                                    : 'Requiere aprobación previa de JustMarkets'
                                }
                              >
                                🔴 Iniciar En Vivo
                              </button>
                            )}

                            {/* WebRTC Live Studio button for Admin */}
                            <button
                              type="button"
                              className="btn btn--ghost"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem', color: 'var(--gold)', borderColor: 'var(--gold)' }}
                              onClick={() => setStudioClass(cls)}
                              title="Transmitir desde el navegador (Cámara y Pantalla WebRTC)"
                            >
                              🎥 Estudio WebRTC
                            </button>

                            {cls.status === 'en_vivo' && (
                              <button
                                type="button"
                                className="btn btn--ghost"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}
                                onClick={() => handleSetClassStatus(cls.id, cls.title, 'finalizada', cls.status)}
                              >
                                Finalizar
                              </button>
                            )}
                          </div>
                        )}

                        {/* Enter Classroom Action */}
                        {!currentUser ? (
                          <div
                            style={{
                              padding: '0.65rem',
                              textAlign: 'center',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(148, 163, 184, 0.08)',
                              fontSize: '0.82rem',
                              color: 'var(--muted)',
                            }}
                          >
                            🔒 Inicia sesión con Google para acceder
                          </div>
                        ) : canAccess ? (
                          <button
                            type="button"
                            className={`btn ${isLiveNow ? 'btn--emerald btn--pulse' : 'btn--emerald'}`}
                            style={{ width: '100%', padding: '0.7rem', fontWeight: isLiveNow ? 700 : 600 }}
                            onClick={() => setActiveClass(cls)}
                          >
                            {isLiveNow ? '🔴 Ver Transmisión en Vivo + Chat &rarr;' : 'Ingresar a la Sala &rarr;'}
                          </button>
                        ) : (
                          <div
                            style={{
                              padding: '0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(251, 191, 36, 0.1)',
                              border: '1px solid rgba(251, 191, 36, 0.3)',
                              fontSize: '0.8rem',
                              color: 'var(--gold)',
                              textAlign: 'center',
                            }}
                          >
                            ⏳ Acceso pendiente de aprobación por Sr.smith
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })()}

        {/* Embedded Mirror Classroom Modal with Integrated Real-time LiveSessionChat */}
        {activeClass && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 700,
              background: 'rgba(7, 11, 20, 0.96)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(0.5rem, 2vw, 1.75rem)',
            }}
            onClick={() => setActiveClass(null)}
          >
            <div
              style={{
                background: 'linear-gradient(160deg, var(--surface-3), var(--surface))',
                border: '1px solid var(--emerald)',
                borderRadius: 'var(--radius)',
                maxWidth: '1380px',
                width: '100%',
                height: '92vh',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-glow)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Classroom Header */}
              <div
                style={{
                  padding: '0.85rem 1.4rem',
                  borderBottom: '1px solid var(--line)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: activeClass.status === 'en_vivo' ? '#ef4444' : 'var(--emerald)',
                      boxShadow: activeClass.status === 'en_vivo' ? '0 0 10px #ef4444' : '0 0 10px var(--emerald)',
                      flexShrink: 0,
                    }}
                  ></span>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.05rem',
                          color: '#fff',
                          fontFamily: 'var(--font-head)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {activeClass.title}
                      </h3>
                      <span className="badge badge--gold" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                        {activeClass.category}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Instructor: <strong style={{ color: 'var(--gold-soft)' }}>{activeClass.instructor}</strong> · Transmisión Espejo &amp; Chat Interactivo Al-Hadiqa
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen((prev) => !prev)}
                    className="btn btn--ghost"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.76rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      border: `1px solid ${isChatOpen ? 'var(--emerald)' : 'var(--line)'}`,
                      color: isChatOpen ? 'var(--emerald)' : 'var(--muted)',
                    }}
                    title="Alternar chat en vivo para modo cine"
                  >
                    💬 {isChatOpen ? 'Ocultar Chat' : 'Mostrar Chat en Vivo'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveClass(null)}
                    style={{
                      background: 'rgba(148, 163, 184, 0.1)',
                      border: '1px solid var(--line)',
                      color: 'var(--text)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Cerrar sala"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Classroom Main Body: Split Player & Real-time Live Session Chat */}
              <div
                style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: isChatOpen ? 'minmax(0, 1.8fr) minmax(310px, 370px)' : '1fr',
                  overflow: 'hidden',
                  minHeight: 0,
                }}
              >
                {/* Left Column: Player & Stream Info */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                    background: '#05080f',
                    minHeight: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      flex: 1,
                      minHeight: '360px',
                      background: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {(() => {
                      const { embedUrl, source } = parseStreamEmbedUrl(activeClass.streamUrl);

                      if (embedUrl === 'webrtc_direct' || source === 'webrtc') {
                        return (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              background: 'radial-gradient(circle at 50% 50%, #111827, #070b14)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2rem',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '3rem', marginBottom: '0.6rem' }}>📡</div>
                            <h4 style={{ color: 'var(--emerald)', margin: '0 0 0.5rem', fontFamily: 'var(--font-head)' }}>
                              Transmisión Directa WebRTC Activa
                            </h4>
                            <p style={{ color: 'var(--muted)', fontSize: '0.86rem', maxWidth: '440px', margin: 0 }}>
                              Conectado a la señal directa desde el estudio del navegador de Sr.smith con baja latencia para trading institucional.
                            </p>
                          </div>
                        );
                      }

                      if (embedUrl) {
                        return (
                          <iframe
                            src={embedUrl}
                            title={activeClass.title}
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              border: 0,
                            }}
                          />
                        );
                      }

                      return (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                          No se pudo cargar la URL de transmisión espejo.
                        </div>
                      );
                    })()}
                  </div>

                  {/* Class Info Under Video */}
                  <div
                    style={{
                      padding: '0.9rem 1.4rem',
                      background: 'var(--surface-2)',
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontFamily: 'var(--font-head)' }}>
                          {activeClass.title}
                        </h4>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                          {activeClass.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            background: getStatusBadge(activeClass.status).bg,
                            color: getStatusBadge(activeClass.status).color,
                            border: `1px solid ${getStatusBadge(activeClass.status).border}`,
                          }}
                        >
                          {getStatusBadge(activeClass.status).label}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--gold-soft)' }}>
                          🕒 {activeClass.scheduledAt}
                        </span>
                      </div>
                    </div>

                    {/* MANDATORY LEGAL DISCLAIMER IN CLASSROOM VIEW */}
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(251, 191, 36, 0.08)',
                        border: '1px solid rgba(251, 191, 36, 0.25)',
                        borderRadius: '6px',
                        fontSize: '0.73rem',
                        color: 'var(--gold)',
                        lineHeight: 1.4,
                      }}
                    >
                      ⚖️ <strong>Aviso legal:</strong> "Las clases son impartidas por un socio y no por el bróker. Contenido educativo, no constituye asesoría financiera."
                    </div>
                  </div>
                </div>

                {/* Right Column: Real-time Live Session Chat */}
                {isChatOpen && (
                  <LiveSessionChat
                    classId={activeClass.id}
                    classTitle={activeClass.title}
                    isLive={activeClass.status === 'en_vivo'}
                    onClose={() => setIsChatOpen(false)}
                  />
                )}
              </div>

              {/* Classroom Bottom Bar */}
              <div
                style={{
                  padding: '0.75rem 1.4rem',
                  borderTop: '1px solid var(--line)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--emerald)' }}></span>
                  Transmisión espejo oficial sincronizada con chat de alumnos en tiempo real
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  {!isChatOpen && (
                    <button
                      type="button"
                      className="btn btn--emerald"
                      onClick={() => setIsChatOpen(true)}
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                    >
                      💬 Abrir Chat en Vivo
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setActiveClass(null)}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                  >
                    Salir de la Sala
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WebRTC Broadcast Studio for Admin */}
        {studioClass && (
          <WebRTCBroadcastStudio
            classId={studioClass.id}
            classTitle={studioClass.title}
            isOpen={!!studioClass}
            onClose={() => setStudioClass(null)}
          />
        )}

        {/* Approver Rejection Modal with Comments */}
        {rejectingClass && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 700,
              background: 'rgba(7, 11, 20, 0.92)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                background: 'var(--surface-3)',
                border: '1px solid #ef4444',
                borderRadius: 'var(--radius)',
                maxWidth: '540px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 20px 40px rgba(239, 68, 68, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.6rem' }}>⚠️</span>
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontFamily: 'var(--font-head)' }}>
                    Rechazar Clase con Observaciones
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
                    Socio Estratégico JustMarkets Compliance
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Indica a la administración (Sr.smith) qué aspectos técnicos, temáticos o regulatorios deben corregirse antes de que la clase pueda ser aprobada y emitida.
              </p>

              <div style={{ background: 'var(--surface)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--line)', marginBottom: '1rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block' }}>{rejectingClass.title}</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Instructor: {rejectingClass.instructor} · {rejectingClass.scheduledAt}</span>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Motivo de rechazo / Correcciones solicitadas <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ej: Incluir advertencia explícita sobre riesgo en derivados; corregir el enlace de transmisión espejo o revisar el temario de volatilidad..."
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.86rem',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setRejectingClass(null);
                    setRejectionNotes('');
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn--gold"
                  style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
                  onClick={handleConfirmReject}
                >
                  ✕ Confirmar Rechazo y Notificar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
