import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserNotificationPreferences,
  saveUserNotificationPreferences,
} from '../services/emailService';
import { UserNotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notifications';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [prefs, setPrefs] = useState<Omit<UserNotificationPreferences, 'userId'>>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [savingNotice, setSavingNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    let isMounted = true;
    getUserNotificationPreferences(currentUser.uid).then((p) => {
      if (isMounted) {
        setPrefs({
          emailLiveClasses: p.emailLiveClasses,
          emailNewContent: p.emailNewContent,
          emailPermissionChanges: p.emailPermissionChanges,
          emailWeeklyDigest: p.emailWeeklyDigest,
          inAppSound: p.inAppSound,
          unsubscribedAll: p.unsubscribedAll,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleToggle = async (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSavingNotice('Guardando cambios...');
    await saveUserNotificationPreferences(currentUser.uid, updated);
    setSavingNotice('✓ Preferencias actualizadas correctamente.');
    setTimeout(() => setSavingNotice(null), 2500);
  };

  const handleUnsubscribeAll = async () => {
    const nextState = !prefs.unsubscribedAll;
    const updated = {
      ...prefs,
      unsubscribedAll: nextState,
    };
    setPrefs(updated);
    setSavingNotice(nextState ? 'Has sido dado de baja de todos los correos.' : 'Te has vuelto a suscribir.');
    await saveUserNotificationPreferences(currentUser.uid, updated);
    setTimeout(() => setSavingNotice(null), 3000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(5, 9, 18, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1rem, 2vw, 2.5rem)',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'linear-gradient(165deg, var(--surface-2), var(--surface))',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          padding: '1.8rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-head)', fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚙️</span> Preferencias de Notificación &amp; Correo
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
              Gestiona qué avisos transaccionales deseas recibir en <strong>{currentUser.email}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Notice Toast */}
        {savingNotice && (
          <div
            style={{
              padding: '0.6rem 1rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--emerald)',
              borderRadius: '6px',
              color: 'var(--emerald)',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              fontWeight: 600,
            }}
          >
            {savingNotice}
          </div>
        )}

        {/* Unsubscribed Warning Banner if Opted-Out */}
        {prefs.unsubscribedAll && (
          <div
            style={{
              padding: '0.9rem 1.1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              marginBottom: '1.2rem',
              fontSize: '0.84rem',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.8rem',
            }}
          >
            <div>
              <strong>Estado: Dado de Baja (Unsubscribed)</strong>
              <span style={{ display: 'block', fontSize: '0.76rem', color: '#fecaca', marginTop: '0.2rem' }}>
                No recibirás ningún correo electrónico de clases, libros ni novedades.
              </span>
            </div>
            <button
              type="button"
              onClick={handleUnsubscribeAll}
              style={{
                padding: '0.4rem 0.8rem',
                background: 'var(--emerald)',
                color: '#07111f',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Reactivar Correos
            </button>
          </div>
        )}

        {/* Toggles Container */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {/* Option 1: Live Classes */}
          <div
            style={{
              padding: '0.9rem 1rem',
              background: 'var(--surface-3)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: prefs.unsubscribedAll ? 0.5 : 1,
            }}
          >
            <div>
              <strong style={{ fontSize: '0.88rem', color: '#fff', display: 'block' }}>
                🔴 Avisos de Clases en Vivo
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                Recibe un correo 15 minutos antes de iniciar transmisiones y masterclasses de Sr.smith.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.emailLiveClasses && !prefs.unsubscribedAll}
              disabled={prefs.unsubscribedAll}
              onChange={() => handleToggle('emailLiveClasses')}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--emerald)' }}
            />
          </div>

          {/* Option 2: New Content */}
          <div
            style={{
              padding: '0.9rem 1rem',
              background: 'var(--surface-3)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: prefs.unsubscribedAll ? 0.5 : 1,
            }}
          >
            <div>
              <strong style={{ fontSize: '0.88rem', color: '#fff', display: 'block' }}>
                📚 Nuevo Contenido y Recursos
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                Alertas cuando se publiquen nuevos libros, lecturas o módulos en Al-Hadiqa Capital.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.emailNewContent && !prefs.unsubscribedAll}
              disabled={prefs.unsubscribedAll}
              onChange={() => handleToggle('emailNewContent')}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--emerald)' }}
            />
          </div>

          {/* Option 3: Permission Changes */}
          <div
            style={{
              padding: '0.9rem 1rem',
              background: 'var(--surface-3)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: prefs.unsubscribedAll ? 0.5 : 1,
            }}
          >
            <div>
              <strong style={{ fontSize: '0.88rem', color: '#fff', display: 'block' }}>
                🔑 Cambios de Permisos y Cuenta
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                Confirmación por correo cuando el administrador habilite descargas o asigne nuevos libros.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.emailPermissionChanges && !prefs.unsubscribedAll}
              disabled={prefs.unsubscribedAll}
              onChange={() => handleToggle('emailPermissionChanges')}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--emerald)' }}
            />
          </div>

          {/* Option 4: In-app Sound */}
          <div
            style={{
              padding: '0.9rem 1rem',
              background: 'var(--surface-3)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong style={{ fontSize: '0.88rem', color: '#fff', display: 'block' }}>
                🔊 Sonido de Notificaciones en Plataforma
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                Reproducir un suave tono acústico cuando llegue un aviso a la campana.
              </span>
            </div>
            <input
              type="checkbox"
              checked={prefs.inAppSound}
              onChange={() => handleToggle('inAppSound')}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--emerald)' }}
            />
          </div>
        </div>

        {/* Unsubscribe Footer Section */}
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.8rem',
          }}
        >
          <button
            type="button"
            onClick={handleUnsubscribeAll}
            style={{
              background: 'none',
              border: 'none',
              color: prefs.unsubscribedAll ? 'var(--emerald)' : '#ef4444',
              cursor: 'pointer',
              fontSize: '0.8rem',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            {prefs.unsubscribedAll
              ? '✓ Cancelar baja y volver a recibir correos'
              : '🚫 Darse de baja de todos los correos (Unsubscribe)'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn--emerald"
            style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
          >
            Listo / Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
