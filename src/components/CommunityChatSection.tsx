import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { sanitizeUserText, detectInjectionPatterns } from '../utils/securitySanitizer';
import { checkChatRateLimit } from '../utils/botProtection';
import { FileUploadScannerModal } from './FileUploadScannerModal';
import { BotProtectionWidget } from './BotProtectionWidget';
import { ScanReport } from '../utils/fileSecurityScanner';

export interface ChatMessageItem {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  authorRole: 'admin' | 'alumno' | 'aprobador';
  text: string;
  attachment?: {
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    sha256: string;
    scannerEngine: string;
  };
  createdAt: unknown;
}

export const CommunityChatSection: React.FC = () => {
  const { currentUser, profile, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMessagesLoadRef = useRef(true);

  useEffect(() => {
    const q = query(collection(db, 'chat_messages'), orderBy('createdAt', 'asc'), limit(50));

    const unsubMessages = onSnapshot(
      q,
      (snapshot) => {
        const list: ChatMessageItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<ChatMessageItem, 'id'>) });
        });
        setMessages(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'chat_messages');
        } catch (e) {
          console.warn('Al-Hadiqa Invest: Chat comunitario en espera de sincronización:', e);
        }
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'system_settings', 'chat'),
      (docSnap) => {
        if (docSnap.exists()) {
          setIsGlobalMuted(!!docSnap.data().isGlobalMuted);
        }
      },
      (err) => {
        console.warn('Al-Hadiqa Invest: Chat settings listener:', err);
      }
    );

    return () => {
      unsubMessages();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    if (isInitialMessagesLoadRef.current) {
      isInitialMessagesLoadRef.current = false;
      container.scrollTop = container.scrollHeight;
      return;
    }
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const showSecurityWarning = (msg: string) => {
    setSecurityNotice(msg);
    setTimeout(() => setSecurityNotice(null), 5000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !inputText.trim() || isSubmitting) return;

    // 1. Detección de inyección y XSS (OWASP A03: Injection)
    const threatCheck = detectInjectionPatterns(inputText);
    if (threatCheck.isSuspicious) {
      showSecurityWarning(`⚠️ Bloqueo de Seguridad: ${threatCheck.details}`);
      return;
    }

    // 2. Control de Tasa (Rate Limiting: 5 msgs/min por usuario, 15 por IP)
    const rateCheck = checkChatRateLimit(currentUser.uid);
    if (!rateCheck.allowed) {
      showSecurityWarning(`⏱️ ${rateCheck.message}`);
      return;
    }

    // 3. Sanitización de entidades HTML y protocolos peligrosos
    const sanitizedText = sanitizeUserText(inputText.trim());

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'chat_messages'), {
        authorId: currentUser.uid,
        authorName: profile?.displayName || currentUser.displayName || 'Alumno',
        authorPhoto: profile?.photoURL || currentUser.photoURL || '',
        authorRole: profile?.role || 'alumno',
        text: sanitizedText,
        createdAt: serverTimestamp(),
      });
      setInputText('');
      setSecurityNotice(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chat_messages');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileApproved = async (file: File, report: ScanReport) => {
    if (!currentUser) return;

    const rateCheck = checkChatRateLimit(currentUser.uid);
    if (!rateCheck.allowed) {
      showSecurityWarning(`⏱️ ${rateCheck.message}`);
      return;
    }

    try {
      await addDoc(collection(db, 'chat_messages'), {
        authorId: currentUser.uid,
        authorName: profile?.displayName || currentUser.displayName || 'Alumno',
        authorPhoto: profile?.photoURL || currentUser.photoURL || '',
        authorRole: profile?.role || 'alumno',
        text: `📎 [Archivo Adjunto Verificado por Antivirus ClamAV]: ${file.name}`,
        attachment: {
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type,
          sha256: report.sha256,
          scannerEngine: report.scannerEngine,
        },
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chat_messages');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'chat_messages', msgId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `chat_messages/${msgId}`);
    }
  };

  const isUserMuted = !!profile?.isMuted;
  const canPostChat =
    isAdmin ||
    (!isGlobalMuted && !isUserMuted && profile?.status === 'active' && profile?.permissions?.canAccessChat);

  return (
    <section className="section section--alt" id="comunidad-chat" aria-labelledby="chat-heading">
      <div className="wrap">
        
        <div className="section-head" style={{ marginBottom: '2.5rem' }}>
          <p className="eyebrow">Comunidad Oficial · Tiempo Real</p>
          <h2 className="h-section" id="chat-heading">
            Chat de Alumnos &amp; <span className="gradient-text">Análisis de Mercado</span>
          </h2>
          <p>
            Espacio moderado para debatir confluencias, zonas de liquidez y resolver dudas directamente con Sr.smith y compañeros de la academia.
          </p>
        </div>

        <div
          style={{
            maxWidth: '880px',
            margin: '0 auto',
            background: 'var(--surface-3)',
            border: '1px solid var(--line-strong)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            height: '560px',
          }}
        >
          {/* Chat Header Bar */}
          <div
            style={{
              padding: '1rem 1.5rem',
              background: 'rgba(15, 23, 42, 0.85)',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isGlobalMuted ? '#ef4444' : 'var(--emerald)',
                  boxShadow: isGlobalMuted ? '0 0 8px #ef4444' : '0 0 8px var(--emerald)',
                }}
              ></span>
              <strong style={{ fontSize: '0.92rem', color: '#fff' }}>Sala de Trading General</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>({messages.length} mensajes)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isGlobalMuted && (
                <span className="badge badge--gold" style={{ fontSize: '0.7rem' }}>
                  🔇 Chat Silenciado
                </span>
              )}
              {isAdmin && (
                <span className="badge badge--gold" style={{ fontSize: '0.7rem' }}>
                  Modo Moderador Activo
                </span>
              )}
            </div>
          </div>

          {/* Messages Body */}
          <div
            ref={chatContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'var(--surface)',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--muted)' }}>
                <p style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>💬</p>
                <p>No hay mensajes aún. ¡Sé el primero en compartir tu análisis!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMsgAdmin = msg.authorRole === 'admin';
                const isMsgApprover = msg.authorRole === 'aprobador';
                const isSelf = msg.authorId === currentUser?.uid;

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      gap: '0.85rem',
                      alignItems: 'flex-start',
                      background: isSelf ? 'rgba(59, 130, 246, 0.05)' : 'rgba(148, 163, 184, 0.03)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isMsgAdmin ? 'rgba(251, 191, 36, 0.4)' : 'var(--line)'}`,
                    }}
                  >
                    {/* Avatar */}
                    {msg.authorPhoto ? (
                      <img
                        src={msg.authorPhoto}
                        alt={`Avatar de usuario de ${msg.authorName || 'miembro de la comunidad'}`}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isMsgAdmin ? 'var(--gold)' : 'var(--surface-3)',
                          color: isMsgAdmin ? 'var(--ink)' : 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.82rem',
                          flexShrink: 0,
                        }}
                      >
                        {msg.authorName.charAt(0)}
                      </div>
                    )}

                    {/* Message content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.88rem', color: isMsgAdmin ? 'var(--gold)' : '#fff' }}>
                          {msg.authorName}
                        </strong>

                        {isMsgAdmin && (
                          <span className="badge badge--gold" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                            Sr.smith (Admin)
                          </span>
                        )}
                        {isMsgApprover && (
                          <span className="badge" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                            JustMarkets Partner
                          </span>
                        )}
                      </div>

                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.55 }}>
                        {msg.text}
                      </p>

                      {msg.attachment && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.55rem 0.85rem',
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            fontSize: '0.78rem',
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>
                            {msg.attachment.fileName.endsWith('.pdf') ? '📄' : '🖼️'}
                          </span>
                          <div>
                            <strong style={{ color: '#fff', display: 'block' }}>
                              {msg.attachment.fileName}
                            </strong>
                            <span style={{ color: 'var(--emerald)', fontSize: '0.7rem' }}>
                              🛡️ Verificado por {msg.attachment.scannerEngine} (SHA-256: {msg.attachment.sha256.substring(0, 10)}…)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Admin delete moderation button */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        style={{
                          background: 'transparent',
                          border: 0,
                          color: '#fca5a5',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.4rem',
                        }}
                        title="Moderar / Borrar mensaje"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Security & Threat Notice Banner */}
          {securityNotice && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                borderTop: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '0.6rem 1.4rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{securityNotice}</span>
              <button
                type="button"
                onClick={() => setSecurityNotice(null)}
                style={{ background: 'transparent', border: 0, color: '#fca5a5', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <div
            style={{
              padding: '0.9rem 1.4rem',
              background: 'rgba(15, 23, 42, 0.95)',
              borderTop: '1px solid var(--line)',
            }}
          >
            {!currentUser ? (
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
                🔒 Inicia sesión con Google para participar en la conversación.
              </div>
            ) : isUserMuted && !isAdmin ? (
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#fca5a5' }}>
                🔇 Has sido silenciado individualmente en el chat por el Administrador (Sr.smith).
              </div>
            ) : isGlobalMuted && !isAdmin ? (
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--gold)' }}>
                🔇 El chat general ha sido silenciado temporalmente por el Administrador (Sr.smith).
              </div>
            ) : !canPostChat ? (
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--gold)' }}>
                ⏳ Tu cuenta está en revisión o no tiene habilitado el permiso de chat. Sr.smith debe activarlo.
              </div>
            ) : (
              <div>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid var(--line-strong)',
                      color: 'var(--gold)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 0.85rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Subir captura o documento con análisis antivirus ClamAV"
                  >
                    📎
                  </button>

                  <input
                    type="text"
                    placeholder="Escribe tu mensaje o consulta de mercado…"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    maxLength={800}
                    required
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      background: 'var(--surface)',
                      border: '1px solid var(--line-strong)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />

                  <button
                    type="submit"
                    className="btn btn--emerald"
                    disabled={isSubmitting || !inputText.trim()}
                    style={{ padding: '0.75rem 1.4rem', whiteSpace: 'nowrap' }}
                  >
                    {isSubmitting ? 'Enviando…' : 'Enviar &rarr;'}
                  </button>
                </form>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.45rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    Filtro anti-spam y rate limit (máx 5 msgs/min). Sanitización XSS activa.
                  </span>
                  <BotProtectionWidget compact={true} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Carga y Escaneo Antivirus */}
        <FileUploadScannerModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onFileApproved={handleFileApproved}
          contextLabel="Chat Comunitario de Alumnos"
        />

      </div>
    </section>
  );
};
