import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { LibraryResourceItem, LibraryCategory } from '../types';
import { OFFICIAL_SEED_BOOKS } from '../data/seedLibrary';
import { executeResourceDownload } from '../utils/libraryDownloader';

const CATEGORIES: { key: 'all' | LibraryCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'Todos los Recursos', icon: '📚' },
  { key: 'Fundamentos', label: 'Fundamentos de Trading', icon: '📘' },
  { key: 'Trading Institucional', label: 'Trading Institucional (SMC)', icon: '🏛️' },
  { key: 'Scalping', label: 'Scalping Quirúrgico', icon: '⚡' },
  { key: 'Múltiples Estrategias', label: 'Múltiples Estrategias', icon: '🧭' },
  { key: 'Análisis Técnico y Mercado', label: 'Análisis Técnico y Mercado', icon: '📊' },
];

export const LibrarySection: React.FC = () => {
  const { currentUser, profile, isAdmin, signInWithGoogle } = useAuth();
  const [resources, setResources] = useState<LibraryResourceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | LibraryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBookModal, setActiveBookModal] = useState<LibraryResourceItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Sync with Firestore collection 'library_resources'
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'library_resources'),
      async (snapshot) => {
        if (snapshot.empty && isAdmin) {
          // Auto-seed with the comprehensive trading curriculum
          for (const item of OFFICIAL_SEED_BOOKS) {
            const docRef = doc(collection(db, 'library_resources'));
            await setDoc(docRef, {
              ...item,
              id: docRef.id,
              createdAt: serverTimestamp(),
            });
          }
          return;
        }

        const list: LibraryResourceItem[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<LibraryResourceItem, 'id'>) });
        });

        if (list.length > 0) {
          setResources(list);
        } else {
          // Fallback to local official seeds while connecting
          setResources(
            OFFICIAL_SEED_BOOKS.map((s, idx) => ({ ...s, id: `seed-book-${idx}` }))
          );
        }
      },
      (err) => {
        console.warn('Firestore library_resources listener:', err);
        setResources(
          OFFICIAL_SEED_BOOKS.map((s, idx) => ({ ...s, id: `seed-book-${idx}` }))
        );
      }
    );

    return () => unsub();
  }, [isAdmin]);

  const showFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4500);
  };

  // Helper: Determine if the current student is allowed to download this resource
  const canUserDownload = (book: LibraryResourceItem): boolean => {
    if (!currentUser) return false;
    if (isAdmin) return true; // Administrator always has access

    // Check student download permission flag
    const hasDownloadPermission = !!profile?.permissions?.canDownload;
    if (!hasDownloadPermission) return false;

    // If resource has specific assigned users list, check if user is in it
    if (book.assignedUserIds && book.assignedUserIds.length > 0) {
      return book.assignedUserIds.includes(currentUser.uid);
    }

    // Check if student has assigned specific books array
    if (profile?.permissions?.assignedBookIds && profile.permissions.assignedBookIds.length > 0) {
      return profile.permissions.assignedBookIds.includes(book.id);
    }

    // Otherwise, default to the global student canDownload permission
    return hasDownloadPermission;
  };

  // Handle download and audit logging
  const handleDownload = async (book: LibraryResourceItem) => {
    if (!currentUser) {
      try {
        await signInWithGoogle();
      } catch (e) {
        console.error(e);
      }
      return;
    }

    if (!canUserDownload(book)) {
      showFeedback('La descarga de este libro está deshabilitada por administración para tu perfil.', 'error');
      return;
    }

    setDownloadingId(book.id);
    try {
      await executeResourceDownload({
        resource: book,
        userId: currentUser.uid,
        userName: profile?.displayName || currentUser.displayName || 'Alumno',
        userEmail: profile?.email || currentUser.email || '',
      });

      showFeedback(
        `✓ "${book.title}" descargado mediante enlace firmado HMAC-SHA256 (validez 15 min). Registro de auditoría guardado.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showFeedback('No se pudo completar la descarga. Por favor, reintenta.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  // Request download authorization from administrator
  const handleRequestPermission = async (book: LibraryResourceItem) => {
    if (!currentUser) {
      try {
        await signInWithGoogle();
      } catch (e) {
        console.error(e);
      }
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        title: `📢 Solicitud de Descarga: ${profile?.displayName || currentUser.displayName}`,
        message: `El alumno ${profile?.displayName || currentUser.displayName} (${currentUser.email}) solicita que el administrador habilite la descarga del libro: "${book.title}" (${book.category}).`,
        targetRole: 'admin',
        type: 'info',
        createdAt: serverTimestamp(),
      });

      showFeedback(
        `Solicitud enviada a Sr.smith. Se te notificará cuando tu permiso de descarga sea habilitado.`,
        'info'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'notifications');
    }
  };

  // Filtered resources
  const filteredResources = resources.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.author && item.author.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  return (
    <section id="biblioteca" className="sec sec--trading" style={{ position: 'relative' }}>
      <div className="wrap">
        {/* Section Header */}
        <div className="section-head" style={{ marginBottom: '2.5rem' }}>
          <p className="eyebrow">Biblioteca Especializada de Trading</p>
          <h2 className="h-section">Contenido Funcional &amp; Organizado por Categorías 📚</h2>
          <p style={{ maxWidth: '820px', margin: '0 auto' }}>
            Material didáctico exclusivo estructurado por Sr.smith para el desarrollo de operadores rentables.
            Fundamentos, trading institucional SMC, scalping, múltiples estrategias y cartografía técnica del mercado.
          </p>
        </div>

        {/* Feedback Alert */}
        {notice && (
          <div
            style={{
              maxWidth: '800px',
              margin: '0 auto 2rem',
              padding: '0.9rem 1.4rem',
              borderRadius: 'var(--radius-sm)',
              background:
                notice.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : notice.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)',
              border: `1px solid ${
                notice.type === 'success'
                  ? 'var(--emerald)'
                  : notice.type === 'error'
                  ? '#ef4444'
                  : 'var(--blue)'
              }`,
              color: '#fff',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              animation: 'fadeIn 0.25s ease',
            }}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Search & Category Filter Bar */}
        <div
          style={{
            background: 'var(--surface-3)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: '1.25rem',
            marginBottom: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Search Box */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por título, autor o temario (ej: SMC, Wyckoff, Scalping, FVG)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Access rules reminder badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 0.95rem',
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: 'var(--gold)',
              }}
            >
              <span>🔒 <strong>Reglas de Acceso:</strong> Descargas sujetas a asignación y habilitación por el administrador.</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.55rem',
              borderTop: '1px solid var(--line)',
              paddingTop: '1rem',
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              const count =
                cat.key === 'all'
                  ? resources.length
                  : resources.filter((r) => r.category === cat.key).length;

              return (
                <button
                  key={cat.key}
                  type="button"
                  className={`quiz__btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '10px',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resources Cards Grid */}
        {filteredResources.length === 0 ? (
          <div
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              background: 'var(--surface-3)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
            <h4 style={{ color: '#fff', fontFamily: 'var(--font-head)', margin: '0 0 0.5rem' }}>
              No se encontraron recursos en esta categoría o búsqueda
            </h4>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
              Prueba cambiando el filtro de categoría o limpiando la barra de búsqueda.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {filteredResources.map((book) => {
              const allowed = canUserDownload(book);
              const isDownloading = downloadingId === book.id;

              return (
                <article
                  key={book.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.75rem',
                    border: '1px solid var(--line)',
                    background: 'var(--surface-3)',
                    position: 'relative',
                  }}
                >
                  <div>
                    {/* Header badge & format */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <span className="badge" style={{ fontSize: '0.7rem' }}>
                        {book.category}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#93c5fd',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        {book.format || 'PDF'} · {book.fileSize || '8 MB'}
                      </span>
                    </div>

                    <h3 className="h-card" style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.65rem' }}>
                      {book.title}
                    </h3>

                    <p style={{ color: 'var(--muted)', fontSize: '0.86rem', lineHeight: 1.55, marginBottom: '1.1rem' }}>
                      {book.description}
                    </p>

                    {/* Metadata specs */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.45rem',
                        padding: '0.75rem',
                        background: 'var(--surface)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        color: 'var(--muted-2)',
                        marginBottom: '1.25rem',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div>
                        ✍️ Autor: <strong style={{ color: '#fff' }}>{book.author?.split('(')[0] || 'Sr.smith'}</strong>
                      </div>
                      <div>
                        📄 Extensión: <strong style={{ color: 'var(--gold-soft)' }}>{book.pagesCount || 120} págs</strong>
                      </div>
                      <div>
                        📥 Descargas: <strong style={{ color: 'var(--emerald)' }}>{book.downloadCount || 0}</strong>
                      </div>
                      <div>
                        🔒 Asignación: <strong style={{ color: allowed ? 'var(--emerald)' : 'var(--gold)' }}>{allowed ? 'Habilitada' : 'Requiere Permiso'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Download Control */}
                  <div>
                    {/* Status Notice Indicator */}
                    <div style={{ marginBottom: '0.85rem' }}>
                      {!currentUser ? (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.4rem 0.65rem',
                            background: 'rgba(148, 163, 184, 0.08)',
                            border: '1px solid var(--line)',
                            borderRadius: '4px',
                            color: 'var(--muted)',
                          }}
                        >
                          👤 Inicia sesión con Google para acceder a descargas y permisos.
                        </div>
                      ) : allowed ? (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.4rem 0.65rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: '4px',
                            color: 'var(--emerald)',
                          }}
                        >
                          ✓ Permiso de descarga habilitado por el administrador.
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.4rem 0.65rem',
                            background: 'rgba(251, 191, 36, 0.08)',
                            border: '1px solid rgba(251, 191, 36, 0.25)',
                            borderRadius: '4px',
                            color: 'var(--gold)',
                          }}
                        >
                          🔒 Descarga restringida. El administrador debe activar tu permiso.
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => setActiveBookModal(book)}
                      >
                        📖 Ver Temario
                      </button>

                      {!currentUser ? (
                        <button
                          type="button"
                          className="btn btn--gold"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => signInWithGoogle()}
                        >
                          Acceder con Google
                        </button>
                      ) : allowed ? (
                        <button
                          type="button"
                          className="btn btn--emerald"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                          disabled={isDownloading}
                          onClick={() => handleDownload(book)}
                        >
                          {isDownloading ? 'Generando...' : '📥 Descargar PDF'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--ghost"
                          style={{
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.76rem',
                            borderColor: 'var(--gold)',
                            color: 'var(--gold)',
                          }}
                          onClick={() => handleRequestPermission(book)}
                          title="Solicitar a Sr.smith la activación de descarga para este recurso"
                        >
                          ✋ Solicitar Acceso
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Mandatory Legal Disclaimer Banner */}
        <div
          style={{
            marginTop: '3.5rem',
            padding: '1.25rem 1.75rem',
            background: 'rgba(251, 191, 36, 0.06)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <span style={{ fontSize: '2rem' }}>⚖️</span>
          <div>
            <strong style={{ color: 'var(--gold)', fontSize: '0.92rem', display: 'block' }}>
              Aviso Legal &amp; Cumplimiento Regulatorio JustMarkets
            </strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              "Las clases y contenidos de la biblioteca son impartidos por un socio y no por el bróker.
              Contenido educativo, no constituye asesoría financiera. Las descargas son monitoreadas con registro de auditoría
              de acuerdo con las políticas internas de Al-Hadiqa Invest."
            </p>
          </div>
        </div>

        {/* Detailed Book Modal with Chapters Syllabus */}
        {activeBookModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 750,
              background: 'rgba(7, 11, 20, 0.93)',
              backdropFilter: 'blur(12px)',
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
                background: 'linear-gradient(165deg, var(--surface-3), var(--surface))',
                border: '1px solid var(--gold)',
                borderRadius: 'var(--radius)',
                maxWidth: '650px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.25rem 1.75rem',
                  borderBottom: '1px solid var(--line)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div>
                  <span className="badge badge--gold" style={{ fontSize: '0.72rem', marginBottom: '0.35rem' }}>
                    {activeBookModal.category}
                  </span>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontFamily: 'var(--font-head)' }}>
                    {activeBookModal.title}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Autor: {activeBookModal.author} · Formato: {activeBookModal.format} ({activeBookModal.fileSize})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBookModal(null)}
                  style={{ background: 'transparent', border: 0, color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
                <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                  Sinopsis del Contenido
                </h4>
                <p style={{ color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {activeBookModal.description}
                </p>

                <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  Índice de Capítulos y Módulos
                </h4>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  {activeBookModal.chapters && activeBookModal.chapters.length > 0 ? (
                    activeBookModal.chapters.map((ch, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>#{idx + 1}</span>
                        <span style={{ color: '#fff' }}>{ch}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>
                      Capítulo 1: Fundamentos y Arquitectura Operativa · Capítulo 2: Ejecución y Gestión de Riesgo
                    </div>
                  )}
                </div>

                {/* Audit & Access Info */}
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#93c5fd',
                    lineHeight: 1.45,
                  }}
                >
                  ℹ️ <strong>Control de Descarga:</strong> {canUserDownload(activeBookModal)
                    ? 'Tienes autorización activa para descargar este libro. Tu usuario y fecha quedarán asentados en la bitácora.'
                    : 'Tu usuario requiere habilitación por parte de Sr.smith para descargar este recurso.'}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '1rem 1.75rem',
                  borderTop: '1px solid var(--line)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.8rem',
                }}
              >
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setActiveBookModal(null)}
                >
                  Cerrar
                </button>

                {canUserDownload(activeBookModal) ? (
                  <button
                    type="button"
                    className="btn btn--emerald"
                    disabled={downloadingId === activeBookModal.id}
                    onClick={() => {
                      handleDownload(activeBookModal);
                      setActiveBookModal(null);
                    }}
                  >
                    📥 Descargar Libro Ahora (PDF)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--gold"
                    onClick={() => {
                      handleRequestPermission(activeBookModal);
                      setActiveBookModal(null);
                    }}
                  >
                    ✋ Solicitar Habilitación a Sr.smith
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
