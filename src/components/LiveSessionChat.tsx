import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';

export interface LiveSessionChatProps {
  classId: string;
  classTitle: string;
  isLive?: boolean;
  onClose?: () => void;
}

interface ChatMessageItem {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorRole: 'admin' | 'alumno' | 'aprobador';
  text: string;
  createdAt: unknown;
}

const QUICK_REACTIONS = [
  { label: '🔥 Setup Clave', text: '🔥 ¡Excelente confluencia institucional!' },
  { label: '📈 Comprando', text: '📈 Entrada en Compra (Buy) ejecutada.' },
  { label: '📉 Vendiendo', text: '📉 Entrada en Venta (Sell) ejecutada.' },
  { label: '🎯 Take Profit', text: '🎯 ¡Take Profit alcanzado con éxito!' },
  { label: '🛡️ Stop Loss', text: '🛡️ Stop Loss protegido en Break Even.' },
];

export const LiveSessionChat: React.FC<LiveSessionChatProps> = ({
  classTitle,
  isLive = true,
  onClose,
}) => {
  const { currentUser, profile, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  // Subscribe to real-time chat messages
  useEffect(() => {
    const q = query(collection(db, 'chat_messages'), orderBy('createdAt', 'asc'), limit(45));

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
          console.warn('Al-Hadiqa Invest: Chat de sesión en espera de sincronización:', e);
        }
      }
    );

    // Subscribe to system settings for global chat mute
    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'chat'), (docSnap) => {
      if (docSnap.exists()) {
        setIsGlobalMuted(!!docSnap.data().isGlobalMuted);
      }
    });

    return () => {
      unsubMessages();
      unsubSettings();
    };
  }, []);

  // Auto-scroll when messages change unless user has scrolled up
  useEffect(() => {
    if (!isScrolledUp) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isScrolledUp]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsScrolledUp(distanceFromBottom > 75);
  };

  const scrollToBottom = () => {
    setIsScrolledUp(false);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!currentUser || !textToSend || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'chat_messages'), {
        authorId: currentUser.uid,
        authorName: profile?.displayName || currentUser.displayName || 'Alumno',
        authorPhoto: profile?.photoURL || currentUser.photoURL || '',
        authorRole: profile?.role || 'alumno',
        text: textToSend.slice(0, 800),
        createdAt: serverTimestamp(),
      });
      if (!customText) {
        setInputText('');
      }
      setIsScrolledUp(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chat_messages');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '440px',
        background: 'var(--surface-3)',
        borderLeft: '1px solid var(--line-strong)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Chat Top Header */}
      <div
        style={{
          padding: '0.85rem 1.15rem',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLive ? '#ef4444' : 'var(--emerald)',
              boxShadow: isLive ? '0 0 8px #ef4444' : '0 0 8px var(--emerald)',
              flexShrink: 0,
            }}
          ></span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <strong style={{ fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap' }}>
                Chat en Vivo
              </strong>
              {isLive && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.15)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                  }}
                >
                  LIVE
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: '0.72rem',
                color: 'var(--muted)',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '190px',
              }}
              title={classTitle}
            >
              {classTitle}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {isGlobalMuted && (
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--gold)',
                background: 'rgba(251, 191, 36, 0.12)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
              }}
              title="Chat silenciado temporalmente"
            >
              🔇 Silenciado
            </span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0.2rem',
                lineHeight: 1,
              }}
              title="Ocultar chat"
              aria-label="Ocultar chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          background: 'rgba(11, 17, 32, 0.75)',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--muted)', padding: '1rem' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>💬</div>
            <p style={{ fontSize: '0.84rem' }}>
              ¡Inicia la conversación en vivo con tus compañeros y Sr.smith!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMsgAdmin = m.authorRole === 'admin';
            const isMsgApprover = m.authorRole === 'aprobador';
            const isSelf = m.authorId === currentUser?.uid;

            return (
              <div
                key={m.id}
                style={{
                  background: isSelf
                    ? 'rgba(59, 130, 246, 0.08)'
                    : isMsgAdmin
                    ? 'rgba(251, 191, 36, 0.07)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${
                    isMsgAdmin
                      ? 'rgba(251, 191, 36, 0.3)'
                      : isSelf
                      ? 'rgba(59, 130, 246, 0.25)'
                      : 'var(--line)'
                  }`,
                  borderRadius: '8px',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.84rem',
                  position: 'relative',
                }}
              >
                {/* Author Info Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {m.authorPhoto ? (
                      <img
                        src={m.authorPhoto}
                        alt={`Avatar de ${m.authorName || 'alumno en sesión en vivo'}`}
                        style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: isMsgAdmin ? 'var(--gold)' : 'var(--surface-2)',
                          color: isMsgAdmin ? 'var(--ink)' : '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {m.authorName.charAt(0)}
                      </div>
                    )}

                    <strong
                      style={{
                        fontSize: '0.8rem',
                        color: isMsgAdmin ? 'var(--gold)' : isSelf ? '#93c5fd' : '#e2e8f0',
                      }}
                    >
                      {m.authorName}
                    </strong>

                    {isMsgAdmin && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          background: 'rgba(251, 191, 36, 0.2)',
                          color: 'var(--gold)',
                          padding: '0.05rem 0.35rem',
                          borderRadius: '3px',
                          fontWeight: 700,
                        }}
                      >
                        CEO
                      </span>
                    )}

                    {isMsgApprover && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#93c5fd',
                          padding: '0.05rem 0.35rem',
                          borderRadius: '3px',
                          fontWeight: 600,
                        }}
                      >
                        JustMarkets
                      </span>
                    )}
                  </div>

                  {/* Admin moderation delete button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(m.id)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        color: '#fca5a5',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: '0.1rem 0.3rem',
                        opacity: 0.7,
                      }}
                      title="Eliminar mensaje (Moderación)"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Message Text */}
                <p
                  style={{
                    margin: 0,
                    color: '#f1f5f9',
                    fontSize: '0.82rem',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}
                >
                  {m.text}
                </p>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {isScrolledUp && (
        <button
          type="button"
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: '125px',
            right: '15px',
            background: 'var(--surface-2)',
            color: 'var(--emerald)',
            border: '1px solid var(--emerald)',
            borderRadius: '20px',
            padding: '0.3rem 0.75rem',
            fontSize: '0.75rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 10,
          }}
        >
          ↓ Nuevos mensajes
        </button>
      )}

      {/* Quick Reaction Tray (Collapsible) */}
      {showQuickReactions && canPostChat && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(15, 23, 42, 0.98)',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.35rem',
          }}
        >
          {QUICK_REACTIONS.map((qr) => (
            <button
              key={qr.label}
              type="button"
              onClick={() => handleSendMessage(qr.text)}
              style={{
                fontSize: '0.72rem',
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid var(--line)',
                color: 'var(--text)',
                borderRadius: '999px',
                padding: '0.2rem 0.55rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--emerald)';
                e.currentTarget.style.color = 'var(--emerald)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line)';
                e.currentTarget.style.color = 'var(--text)';
              }}
            >
              {qr.label}
            </button>
          ))}
        </div>
      )}

      {/* Input / Control Bar */}
      <div
        style={{
          padding: '0.75rem 0.85rem',
          background: 'rgba(15, 23, 42, 0.98)',
          borderTop: '1px solid var(--line)',
          flexShrink: 0,
        }}
      >
        {!currentUser ? (
          <div
            style={{
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--muted)',
              padding: '0.4rem',
            }}
          >
            🔒 Inicia sesión con Google para comentar en vivo
          </div>
        ) : isUserMuted && !isAdmin ? (
          <div
            style={{
              textAlign: 'center',
              fontSize: '0.78rem',
              color: '#fca5a5',
              padding: '0.4rem',
            }}
          >
            🔇 Has sido silenciado por la administración
          </div>
        ) : isGlobalMuted && !isAdmin ? (
          <div
            style={{
              textAlign: 'center',
              fontSize: '0.78rem',
              color: 'var(--gold)',
              padding: '0.4rem',
            }}
          >
            🔇 El chat ha sido silenciado temporalmente por Sr.smith
          </div>
        ) : !canPostChat ? (
          <div
            style={{
              textAlign: 'center',
              fontSize: '0.78rem',
              color: 'var(--gold)',
              padding: '0.4rem',
            }}
          >
            ⏳ Permiso de chat pendiente de aprobación por el Administrador
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowQuickReactions((prev) => !prev)}
                style={{
                  background: showQuickReactions ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                  border: `1px solid ${showQuickReactions ? 'var(--emerald)' : 'var(--line)'}`,
                  color: showQuickReactions ? 'var(--emerald)' : 'var(--muted)',
                  borderRadius: '6px',
                  padding: '0.45rem 0.55rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  lineHeight: 1,
                }}
                title="Reacciones rápidas de trading"
                aria-label="Reacciones rápidas de trading"
              >
                ⚡
              </button>

              <input
                type="text"
                placeholder="Comentar en la clase en vivo…"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={800}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />

              <button
                type="submit"
                disabled={isSubmitting || !inputText.trim()}
                className="btn btn--emerald"
                style={{
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.78rem',
                  whiteSpace: 'nowrap',
                  borderRadius: '6px',
                }}
              >
                {isSubmitting ? '…' : 'Enviar'}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.68rem',
                color: 'var(--muted-2)',
                paddingLeft: '0.2rem',
              }}
            >
              <span>Presiona Enter para enviar</span>
              <span>{inputText.length}/800</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
