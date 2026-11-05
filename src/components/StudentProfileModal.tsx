import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, currentUser, signOut } = useAuth();
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);

  if (!isOpen || !currentUser) return null;

  const perms = profile?.permissions || {
    canAccessClasses: false,
    canAccessChat: false,
    canAccessLibrary: true,
    canAccessCapital: true,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: 'rgba(7, 11, 20, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'linear-gradient(160deg, var(--surface-3), var(--surface))',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--radius)',
          maxWidth: '560px',
          width: '100%',
          padding: '2rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-head)', fontSize: '1.25rem', color: '#fff' }}>
            Panel Personal del Alumno
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* User Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.2rem',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
          }}
        >
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={`Fotografía de perfil de ${profile?.displayName || 'alumno de AL-HADIQA INVEST'}`}
              style={{ width: '56px', height: '56px', borderRadius: '50%' }}
            />
          ) : (
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 'bold',
              }}
            >
              {profile?.displayName?.charAt(0) || 'A'}
            </div>
          )}

          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontFamily: 'var(--font-head)' }}>
              {profile?.displayName}
            </h4>
            <p style={{ margin: '0.2rem 0', fontSize: '0.84rem', color: 'var(--muted)' }}>{profile?.email}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <span className="badge" style={{ fontSize: '0.7rem' }}>
                Rol: {profile?.role?.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  background:
                    profile?.status === 'active'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(251, 191, 36, 0.15)',
                  color: profile?.status === 'active' ? 'var(--emerald)' : 'var(--gold)',
                }}
              >
                ● {profile?.status === 'active' ? 'Activo (Aprobado)' : 'Pendiente de Aprobación'}
              </span>
            </div>
          </div>
        </div>

        {/* Permissions Overview */}
        <h5 style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          Estado de Permisos Asignados por Sr.smith:
        </h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              fontSize: '0.82rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Clases en Vivo</span>
            <strong style={{ color: perms.canAccessClasses ? 'var(--emerald)' : 'var(--muted)' }}>
              {perms.canAccessClasses ? '✓ Habilitado' : '⏳ Pendiente'}
            </strong>
          </div>

          <div
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              fontSize: '0.82rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Chat de Comunidad</span>
            <strong style={{ color: perms.canAccessChat ? 'var(--emerald)' : 'var(--muted)' }}>
              {perms.canAccessChat ? '✓ Habilitado' : '⏳ Pendiente'}
            </strong>
          </div>

          <div
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              fontSize: '0.82rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Biblioteca PDF</span>
            <strong style={{ color: 'var(--emerald)' }}>✓ Habilitado</strong>
          </div>

          <div
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              fontSize: '0.82rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Al-Hadiqa Capital</span>
            <strong style={{ color: 'var(--emerald)' }}>✓ Habilitado</strong>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <a
            className="btn btn--emerald"
            href="#clases-en-vivo"
            onClick={onClose}
            style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.84rem' }}
          >
            Ir a Clases en Vivo &rarr;
          </a>
          <a
            className="btn btn--ghost"
            href="#comunidad-chat"
            onClick={onClose}
            style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.84rem' }}
          >
            Ir al Chat &rarr;
          </a>
        </div>

        {/* Notification Preferences & Unsubscribe Link */}
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setIsPrefsOpen(true)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid var(--gold)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--gold)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚙️</span> Preferencias de Notificaciones &amp; Correo (Darse de baja)
          </button>
        </div>

        {/* Logout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--muted-2)' }}>
            Sesión protegida por Google OAuth 2.0
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)' }}
            onClick={() => {
              signOut();
              onClose();
            }}
          >
            Cerrar Sesión Global
          </button>
        </div>
      </div>

      <NotificationPreferencesModal
        isOpen={isPrefsOpen}
        onClose={() => setIsPrefsOpen(false)}
      />
    </div>
  );
};
