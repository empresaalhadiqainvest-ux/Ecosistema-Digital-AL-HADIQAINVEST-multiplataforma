import React from 'react';
import { EmailLogItem } from '../types/notifications';

interface EmailViewerModalProps {
  email: EmailLogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPreferences?: () => void;
}

export const EmailViewerModal: React.FC<EmailViewerModalProps> = ({
  email,
  isOpen,
  onClose,
  onOpenPreferences,
}) => {
  if (!isOpen || !email) return null;

  let formattedDate = 'Reciente';
  if (email.createdAt) {
    try {
      const d = (email.createdAt as { toDate?: () => Date }).toDate
        ? (email.createdAt as { toDate: () => Date }).toDate()
        : new Date(email.createdAt as string | number);
      formattedDate = d.toLocaleString('es-ES', { timeZone: 'UTC' }) + ' UTC';
    } catch {
      formattedDate = 'Enviado recientemente';
    }
  }

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
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Email Client Header Bar */}
        <div
          style={{
            padding: '1rem 1.4rem',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem' }}>📧</span>
            <div>
              <strong style={{ fontSize: '0.92rem', color: '#fff', display: 'block' }}>
                Visor de Correo Transaccional Institucional
              </strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                Cliente de Correo Al-Hadiqa Invest · Servidor Seguro
              </span>
            </div>
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

        {/* Envelope Metadata */}
        <div
          style={{
            padding: '1rem 1.4rem',
            background: 'var(--surface-3)',
            borderBottom: '1px solid var(--line)',
            fontSize: '0.84rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 800 }}>
              {email.subject}
            </h3>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: email.status === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: email.status === 'delivered' ? 'var(--emerald)' : '#fca5a5',
                fontWeight: 600,
              }}
            >
              ● {email.status === 'delivered' ? 'Entregado con Éxito' : 'Baja / No Enviado'}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--muted)', fontSize: '0.8rem' }}>
            <span>
              <strong>De:</strong> Sr.smith (CEO) &lt;empresaalhadiqainvest@gmail.com&gt;
            </span>
            <span>
              <strong>Para:</strong> {email.toName} &lt;{email.toEmail}&gt;
            </span>
            <span>
              <strong>Fecha:</strong> {formattedDate}
            </span>
          </div>
        </div>

        {/* Rendered HTML Email Content */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            background: '#070b14',
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: email.htmlContent }}
            style={{
              maxWidth: '600px',
              margin: '0 auto',
            }}
          />
        </div>

        {/* Email Footer Controls */}
        <div
          style={{
            padding: '0.8rem 1.4rem',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (onOpenPreferences) {
                onClose();
                onOpenPreferences();
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gold)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              textDecoration: 'underline',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            ⚙️ Gestionar preferencias de correo o darse de baja (Unsubscribe)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn--ghost"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            Cerrar Mensaje
          </button>
        </div>
      </div>
    </div>
  );
};
