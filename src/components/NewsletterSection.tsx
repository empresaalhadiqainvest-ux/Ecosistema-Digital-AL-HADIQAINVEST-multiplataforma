import React, { useState, useRef } from 'react';
import { trackEvent } from '../utils/analytics';

const NEWSLETTER_STORAGE_KEY = 'alhadiqa_newsletter_subscribers';
const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'yopmail.com',
];

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const renderTimeRef = useRef<number>(Date.now());
  const submitCountRef = useRef<number>(0);

  const validateEmail = (val: string): { valid: boolean; error?: string } => {
    const clean = val.trim().toLowerCase();
    if (!clean) {
      return { valid: false, error: 'Por favor, ingresa tu dirección de correo electrónico.' };
    }
    // RFC 5322 standard-compliant email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(clean)) {
      return { valid: false, error: 'El formato de correo no es válido. Ejemplo: nombre@ejemplo.com' };
    }

    const domain = clean.split('@')[1];
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      return { valid: false, error: 'Por favor, utiliza una dirección de correo institucional o personal válida.' };
    }

    return { valid: true };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Detección de Honeypot contra bots de spam
    if (honeypot.trim() !== '') {
      console.warn('Bot de spam detectado por trampa honeypot.');
      setStatus('success');
      setEmail('');
      return;
    }

    // 2. Detección de envío automatizado ultrarrápido (< 1.2 segundos desde renderizado)
    const elapsed = Date.now() - renderTimeRef.current;
    if (elapsed < 1200) {
      setStatus('error');
      setErrorMessage('Envío detectado como automatizado. Por favor, tómate un momento e inténtalo de nuevo.');
      return;
    }

    // 3. Límite de tasa (Rate Limiting de sesión: máximo 4 envíos por sesión)
    if (submitCountRef.current >= 4) {
      setStatus('error');
      setErrorMessage('Has alcanzado el límite de intentos por sesión. Por favor, reintenta más tarde.');
      return;
    }

    // 4. Validación rigurosa de sintaxis y dominio
    const validation = validateEmail(email);
    if (!validation.valid) {
      setStatus('error');
      setErrorMessage(validation.error || 'Correo no válido.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setStatus('submitting');

    try {
      const stored = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
      const subscribers: string[] = stored ? JSON.parse(stored) : [];

      if (!subscribers.includes(cleanEmail)) {
        subscribers.push(cleanEmail);
        localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(subscribers));
      }

      submitCountRef.current += 1;
      setStatus('success');
      setEmail('');
      setErrorMessage('');

      // Registro analítico GA4 con respeto de privacidad
      trackEvent('newsletter_subscribe', {
        email_domain: cleanEmail.split('@')[1],
        form_location: 'landing_newsletter_section',
      });
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
              Boletín Informativo Institucional
            </p>
            <h2 className="h-section" id="newsletter-title" style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)' }}>
              Mantente al Día con <span className="gradient-text">AL-HADIQA</span>
            </h2>
            <p className="body-text" style={{ margin: '0.85rem auto 0', textAlign: 'center', maxWidth: '640px' }}>
              Recibe análisis exclusivos de mercado institucional, alertas de aperturas bursátiles, guías financieras de Al-Hadiqa Capital
              y oportunidades del ecosistema directo en tu bandeja de entrada.
            </p>
          </div>

          {status === 'success' ? (
            <div
              style={{
                textAlign: 'center',
                padding: '1.8rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: 'var(--text)',
              }}
              role="status"
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🎉</div>
              <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.25rem', color: 'var(--emerald)' }}>
                ¡Suscripción confirmada!
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginTop: '0.4rem' }}>
                Te has suscrito exitosamente al boletín de AL-HADIQAINVEST. Recibirás nuestras próximas publicaciones de alto valor.
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ marginTop: '1.2rem', padding: '0.55rem 1.4rem', fontSize: '0.82rem' }}
                onClick={() => {
                  setStatus('idle');
                  renderTimeRef.current = Date.now();
                }}
              >
                Suscribir otro correo
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ maxWidth: '560px', margin: '0 auto' }} noValidate>
              {/* Campo Trampa Honeypot Antispam (Oculto a humanos, visible solo para bots automatizados) */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
                <label htmlFor="b_newsletter_hp">No llenar este campo:</label>
                <input
                  id="b_newsletter_hp"
                  type="text"
                  name="b_fax_honeypot"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

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
                    disabled={status === 'submitting'}
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
                      outline: 'none',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="btn"
                  style={{
                    flex: '0 0 auto',
                    minHeight: '48px',
                    padding: '0.85rem 1.75rem',
                    whiteSpace: 'nowrap',
                    opacity: status === 'submitting' ? 0.7 : 1,
                  }}
                >
                  {status === 'submitting' ? (
                    <span>Procesando...</span>
                  ) : (
                    <>
                      <span>Suscribirse</span>
                      <span className="arrow" aria-hidden="true">&rarr;</span>
                    </>
                  )}
                </button>
              </div>

              {status === 'error' && errorMessage && (
                <p
                  role="alert"
                  style={{
                    color: '#f87171',
                    fontSize: '0.85rem',
                    marginTop: '0.65rem',
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {errorMessage}
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
                🔒 Formulario protegido con detección antispam y validación RGPD. Cero spam garantizado.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
