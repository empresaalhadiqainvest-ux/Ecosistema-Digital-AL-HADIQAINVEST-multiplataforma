import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { LiveClassItem, ClassStatus } from './LiveClassesSection';
import { parseStreamEmbedUrl } from '../utils/streamUrlParser';

interface PartnerApproverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerApproverModal: React.FC<PartnerApproverModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, profile } = useAuth();
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [previewClass, setPreviewClass] = useState<LiveClassItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsub = onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        const list: LiveClassItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let status: ClassStatus = (data.status as ClassStatus) || 'borrador';
          if (data.status === 'pending_approval') status = 'pendiente_aprobacion';
          if (data.status === 'approved') status = 'aprobada';
          if (data.status === 'published') status = 'programada';
          if (data.status === 'draft') status = 'borrador';

          list.push({
            id: docSnap.id,
            ...(data as Omit<LiveClassItem, 'id' | 'status'>),
            status,
          });
        });
        setClasses(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'classes');
        } catch (e) {
          console.warn('Al-Hadiqa Invest: Lista de clases para socio aprobador en espera:', e);
        }
      }
    );

    return () => unsub();
  }, [isOpen]);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleApprove = async (classItem: LiveClassItem) => {
    const note = reviewNotes[classItem.id]?.trim() || 'Aprobada por JustMarkets Compliance. Cumple normativas educativas.';
    try {
      await updateDoc(doc(db, 'classes', classItem.id), {
        status: 'aprobada',
        approvedBy: profile?.displayName || currentUser?.displayName || 'JustMarkets Approver Team',
        partnerNotes: note,
        updatedAt: serverTimestamp(),
      });

      // Notify admin
      await addDoc(collection(db, 'notifications'), {
        title: `✓ Clase Aprobada por JustMarkets: ${classItem.title}`,
        message: `El aprobador del socio JustMarkets ha validado la clase. Sr.smith ya puede programarla o emitirla. Nota: "${note}"`,
        targetRole: 'admin',
        type: 'class',
        createdAt: serverTimestamp(),
      });

      showNotification(`Clase "${classItem.title}" aprobada con éxito.`);
      setReviewNotes((prev) => {
        const next = { ...prev };
        delete next[classItem.id];
        return next;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${classItem.id}`);
    }
  };

  const handleReject = async (classItem: LiveClassItem) => {
    const note = reviewNotes[classItem.id]?.trim();
    if (!note) {
      alert('Por favor, indica los comentarios o correcciones requeridas para rechazar la clase.');
      return;
    }

    try {
      await updateDoc(doc(db, 'classes', classItem.id), {
        status: 'rechazada',
        approvedBy: profile?.displayName || currentUser?.displayName || 'JustMarkets Approver Team',
        partnerNotes: note,
        updatedAt: serverTimestamp(),
      });

      // Notify admin about rejection
      await addDoc(collection(db, 'notifications'), {
        title: `⚠️ Observaciones de JustMarkets en: ${classItem.title}`,
        message: `La clase requiere correcciones antes de aprobarse. Motivo: "${note}". Por favor, ajusta los puntos señalados.`,
        targetRole: 'admin',
        type: 'urgent',
        createdAt: serverTimestamp(),
      });

      showNotification(`Clase devuelta con observaciones a la administración.`);
      setReviewNotes((prev) => {
        const next = { ...prev };
        delete next[classItem.id];
        return next;
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${classItem.id}`);
    }
  };

  if (!isOpen) return null;

  const pendingClasses = classes.filter((c) => c.status === 'pendiente_aprobacion');
  const historyClasses = classes.filter((c) => c.status !== 'pendiente_aprobacion');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 650,
        background: 'rgba(7, 11, 20, 0.95)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.75rem, 2vw, 2rem)',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'linear-gradient(160deg, var(--surface-3), var(--surface))',
          border: '1px solid var(--blue)',
          borderRadius: 'var(--radius)',
          maxWidth: '1200px',
          width: '100%',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 60px -15px rgba(59, 130, 246, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '1.25rem 2rem',
            borderBottom: '1px solid var(--line)',
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🤝</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#93c5fd',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                  }}
                >
                  Socio Estratégico JustMarkets
                </span>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-head)', fontSize: '1.25rem', color: '#fff' }}>
                  Portal de Revisión &amp; Aprobación Técnica
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                Verificación de estándares educativos y cumplimiento regulatorio antes de publicación a los alumnos.
              </p>
            </div>
          </div>

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
            aria-label="Cerrar panel de aprobación"
          >
            ✕
          </button>
        </div>

        {/* Mandatory Legal Disclaimer Bar */}
        <div
          style={{
            padding: '0.65rem 2rem',
            background: 'rgba(251, 191, 36, 0.08)',
            borderBottom: '1px solid rgba(251, 191, 36, 0.25)',
            color: 'var(--gold)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <span>⚖️</span>
          <span>
            <strong>Aviso legal obligatorio:</strong> "Las clases son impartidas por un socio y no por el bróker. Contenido educativo, no constituye asesoría financiera."
          </span>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid var(--emerald)',
              color: 'var(--emerald)',
              padding: '0.65rem 2rem',
              fontSize: '0.88rem',
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            ✓ {actionNotice}
          </div>
        )}

        {/* Tab Switcher */}
        <div
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            gap: '0.6rem',
          }}
        >
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
          >
            ⏳ Clases Pendientes de Revisión ({pendingClasses.length})
          </button>
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
          >
            📋 Historial &amp; Clases Aprobadas ({historyClasses.length})
          </button>
        </div>

        {/* Body Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>
          
          {/* TAB 1: PENDING CLASSES */}
          {activeTab === 'pending' && (
            <div>
              {pendingClasses.length === 0 ? (
                <div
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    maxWidth: '650px',
                    margin: '2rem auto',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>🎉</div>
                  <h4 style={{ fontFamily: 'var(--font-head)', color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    Todas las clases están al día
                  </h4>
                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
                    No hay solicitudes pendientes en la bandeja. Cuando Sr.smith cree o programe una nueva sesión formativa, aparecerá aquí para su validación técnica antes de ser visible para los alumnos.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.88rem', color: 'var(--muted)', margin: 0 }}>
                      Mostrando <strong>{pendingClasses.length}</strong> clase(s) a la espera de dictamen de JustMarkets.
                    </p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gold)' }}>
                      🔒 Solo las clases con dictamen favorable pasan a estado visible para alumnos.
                    </span>
                  </div>

                  {pendingClasses.map((item) => {
                    const embed = parseStreamEmbedUrl(item.streamUrl);
                    const noteValue = reviewNotes[item.id] || '';

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--surface-3)',
                          border: '1px solid var(--blue)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                          <div style={{ flex: 1, minWidth: '280px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                              <span className="badge" style={{ fontSize: '0.7rem' }}>
                                {item.category}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: 'rgba(251, 191, 36, 0.15)',
                                  color: 'var(--gold)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                }}
                              >
                                ⏳ PENDIENTE DE REVISIÓN
                              </span>
                            </div>

                            <h4 style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', color: '#fff', margin: '0 0 0.5rem' }}>
                              {item.title}
                            </h4>

                            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                              {item.description}
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                              <div>👨‍🏫 Instructor: <strong style={{ color: 'var(--gold-soft)' }}>{item.instructor}</strong></div>
                              <div>🕒 Horario UTC: <strong style={{ color: '#fff' }}>{item.scheduledAt}</strong></div>
                              <div>🔗 Fuente: <strong style={{ color: '#93c5fd' }}>{embed.source.toUpperCase()}</strong></div>
                            </div>
                          </div>

                          {/* Quick Preview Button */}
                          <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() => setPreviewClass(previewClass?.id === item.id ? null : item)}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                          >
                            {previewClass?.id === item.id ? 'Ocultar Previsualización' : '👁️ Previsualizar Stream'}
                          </button>
                        </div>

                        {/* Stream Preview Container if toggled */}
                        {previewClass?.id === item.id && (
                          <div
                            style={{
                              background: '#05080f',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.75rem',
                              border: '1px solid var(--line)',
                            }}
                          >
                            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
                              Previsualización del reproductor espejo incrustado:
                            </p>
                            {embed.embedUrl ? (
                              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: '320px', overflow: 'hidden', borderRadius: '6px' }}>
                                <iframe
                                  src={embed.embedUrl}
                                  title={item.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  style={{ width: '100%', height: '100%', border: 0 }}
                                />
                              </div>
                            ) : (
                              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.84rem' }}>
                                Enlace directo para emisión WebRTC o transmisión pendiente de inicio.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Compliance Checklist and Comments */}
                        <div
                          style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid var(--line)',
                            borderRadius: '8px',
                            padding: '1rem',
                            display: 'grid',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            <strong>Criterios de Verificación JustMarkets:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.35rem', color: '#93c5fd' }}>
                              <span>✓ Foco 100% formativo (SMC / Gestión de riesgo)</span>
                              <span>✓ Sin promesas de rentabilidad fija</span>
                              <span>✓ Advertencia legal en pantalla</span>
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                              Comentarios del Aprobador (Obligatorio en caso de rechazo / Opcional para aprobación):
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Ej: Aprobada con éxito. / Rechazada: Por favor, agrega aclaración sobre volatilidad en el temario..."
                              value={noteValue}
                              onChange={(e) =>
                                setReviewNotes({ ...reviewNotes, [item.id]: e.target.value })
                              }
                              style={{
                                width: '100%',
                                padding: '0.55rem 0.85rem',
                                background: 'var(--surface)',
                                border: '1px solid var(--line)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '0.84rem',
                                fontFamily: 'var(--font-body)',
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                            <button
                              type="button"
                              className="btn btn--ghost"
                              style={{ color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '0.5rem 1.1rem', fontSize: '0.82rem' }}
                              onClick={() => handleReject(item)}
                            >
                              ✕ Rechazar con Comentarios
                            </button>

                            <button
                              type="button"
                              className="btn btn--emerald"
                              style={{ padding: '0.5rem 1.3rem', fontSize: '0.82rem' }}
                              onClick={() => handleApprove(item)}
                            >
                              ✓ Aprobar Clase para Publicación &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUDIT & HISTORY */}
          {activeTab === 'history' && (
            <div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Clase / Temario</th>
                      <th>Instructor</th>
                      <th>Categoría</th>
                      <th>Estado Actual</th>
                      <th>Dictamen JustMarkets</th>
                      <th>Fecha Programada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyClasses.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong style={{ color: '#fff', display: 'block', fontSize: '0.9rem' }}>{item.title}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                            {item.description.slice(0, 90)}...
                          </span>
                        </td>
                        <td>{item.instructor}</td>
                        <td>
                          <span className="badge" style={{ fontSize: '0.7rem' }}>{item.category}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color:
                                item.status === 'aprobada' || item.status === 'en_vivo' || item.status === 'programada'
                                  ? 'var(--emerald)'
                                  : item.status === 'rechazada'
                                  ? '#ef4444'
                                  : 'var(--muted)',
                            }}
                          >
                            ● {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', color: item.partnerNotes ? 'var(--gold-soft)' : 'var(--muted)' }}>
                            {item.partnerNotes || (item.approvedBy ? `Validado por ${item.approvedBy}` : 'Sin notas')}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{item.scheduledAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 2rem',
            borderTop: '1px solid var(--line)',
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            Protocolo de Aprobación JustMarkets · Sistema de Educación Financiera Regulado
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
