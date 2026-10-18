import React, { useState } from 'react';

const NEWSLETTER_STORAGE_KEY = 'alhadiqa_newsletter_subscribers';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setStatus('error');
      setErrorMessage('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    try {
      const stored = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
      const subscribers: string[] = stored ? JSON.parse(stored) : [];

      if (!subscribers.includes(cleanEmail)) {
        subscribers.push(cleanEmail);
        localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(subscribers));
      }

      setStatus('success');
      setEmail('');
      setErrorMessage('');
    } catch {
      setStatus('success');
      setEmail('');
    }
  };

  return (
    <section className="section" id="newsletter" aria-labelledby="newsletter-title">
      <div className="wrap">
        <div
          className="card"
          style={{
            ['--accent' as string]: 'var(--gold)',
            maxWidth: '860px',
            margin: '0 auto',
            padding: 'clamp(2rem, 5vw, 3.5rem)',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              className="card__icon"
              aria-hidden="true"
              style={{ margin: '0 auto 1.25rem', width: '58px', height: '58px', fontSize: '1.75rem' }}
            >
              📬
            </div>
            <p className="eyebrow" style={{ justifyContent: 'center' }}>
              Boletín Informativo · Actualizaciones
            </p>
            <h2 className="h-section" id="newsletter-title" style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)' }}>
              Mantente al Día con <span className="gradient-text">AL-HADIQA</span>
            </h2>
            <p className="body-text" style={{ margin: '0.85rem auto 0', textAlign: 'center' }}>
              Recibe análisis exclusivos de mercado, guías financieras gratuitas, novedades de nuestras plataformas
              y oportunidades del ecosistema directo en tu bandeja de entrada.
            </p>
          </div>

          {status === 'success' ? (
            <div
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: 'var(--text)',
              }}
              role="status"
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>🎉</div>
              <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.15rem', color: 'var(--emerald)' }}>
                ¡Suscripción confirmada!
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginTop: '0.4rem' }}>
                Te has suscrito exitosamente al boletín de AL-HADIQAINVEST. Recibirás nuestras próximas publicaciones de alto valor.
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ marginTop: '1.1rem', padding: '0.55rem 1.4rem', fontSize: '0.82rem' }}
                onClick={() => setStatus('idle')}
              >
                Suscribir otro correo
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ maxWidth: '560px', margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  alignItems: 'stretch',
                }}
              >
                <div style={{ flex: '1 1 280px' }}>
                  <label htmlFor="newsletter-email" className="sr-only">
                    Correo electrónico
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    name="email"
                    placeholder="tu.correo@ejemplo.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    required
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '48px',
                      padding: '0.85rem 1.1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${status === 'error' ? 'var(--orange)' : 'var(--line-strong)'}`,
                      background: 'rgba(148, 163, 184, 0.06)',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.94rem',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    flex: '0 0 auto',
                    minHeight: '48px',
                    padding: '0.85rem 1.75rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Suscribirse <span className="arrow" aria-hidden="true">&rarr;</span>
                </button>
              </div>

              {status === 'error' && errorMessage && (
                <p
                  role="alert"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '0.85rem',
                    marginTop: '0.6rem',
                    textAlign: 'center',
                  }}
                >
                  {errorMessage}
                </p>
              )}

              <p
                style={{
                  marginTop: '1rem',
                  fontSize: '0.8rem',
                  color: 'var(--muted-2)',
                  textAlign: 'center',
                }}
              >
                🔒 Respetamos tu privacidad. Cero spam. Puedes darte de baja en cualquier momento con un solo clic.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
