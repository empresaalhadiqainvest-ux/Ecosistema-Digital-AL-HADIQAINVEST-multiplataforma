import React, { Component, ErrorInfo, ReactNode, useEffect, useRef, useState } from 'react';

const RETRY_DELAYS_MS = [250, 700, 1500];

function isDynamicImportError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return (
    msg.includes('dynamically imported module') ||
    msg.includes('Failed to fetch') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError')
  );
}

/**
 * Envuelve importaciones dinámicas (React.lazy) con reintentos automáticos
 * para tolerar reinicios del servidor Vite o microcortes de red sin romper la app.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  sectionLabel = 'Módulo'
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        return await importer();
      } catch (err) {
        lastError = err;
        if (!isDynamicImportError(err) || attempt === RETRY_DELAYS_MS.length) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
      }
    }

    console.warn(`Al-Hadiqa Invest: Fallo recuperado al cargar ${sectionLabel}:`, lastError);

    const FallbackComponent = (() => (
      <section
        style={{
          padding: '2rem 1.25rem',
          margin: '1rem auto',
          maxWidth: '720px',
          borderRadius: '14px',
          background: 'rgba(6, 35, 25, 0.72)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          textAlign: 'center',
          color: '#e2e8f0',
        }}
      >
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
          La sección <strong>{sectionLabel}</strong> está sincronizando una actualización de módulo.
        </p>
        <button
          type="button"
          className="btn btn--gold"
          onClick={() => window.location.reload()}
          style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}
        >
          Recargar vista
        </button>
      </section>
    )) as unknown as T;

    return { default: FallbackComponent };
  });
}

interface SectionBoundaryProps {
  children: ReactNode;
  label?: string;
  anchorId?: string;
  extraAnchors?: string[];
  defer?: boolean;
  fallbackHeight?: string;
}

interface SectionBoundaryState {
  hasError: boolean;
}

class SectionErrorCatcher extends Component<SectionBoundaryProps, SectionBoundaryState> {
  public state: SectionBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): SectionBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`Al-Hadiqa Invest - Recuperación aislada en sección (${this.props.label || 'UI'}):`, error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '1.5rem',
            margin: '1rem auto',
            maxWidth: '680px',
            borderRadius: '12px',
            background: 'rgba(6, 35, 25, 0.65)',
            border: '1px solid rgba(212, 175, 55, 0.22)',
            textAlign: 'center',
            color: '#cbd5e1',
            fontSize: '0.86rem',
          }}
        >
          No se pudo mostrar esta sección temporalmente.{' '}
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gold)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const SectionGuard: React.FC<SectionBoundaryProps> = ({
  children,
  label,
  anchorId,
  extraAnchors,
  defer = false,
  fallbackHeight = '180px',
}) => {
  const [shouldMount, setShouldMount] = useState<boolean>(() => !defer);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldMount) return;

    let cancelled = false;
    const targetAnchors = [anchorId, ...(extraAnchors || [])].filter(Boolean) as string[];
    const matchesHash = (hash: string) => targetAnchors.includes(hash);

    const activateAndScroll = (hash?: string) => {
      if (cancelled) return;
      setShouldMount(true);
      if (!hash) return;
      let attempts = 0;
      const tryScroll = () => {
        if (cancelled) return;
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempts < 8) {
          attempts += 1;
          setTimeout(tryScroll, 90);
        }
      };
      setTimeout(tryScroll, 80);
    };

    // 1. Hidratar inmediatamente solo si el usuario navega al ancla (#id) de esta sección
    const handleHashOrClick = (evt?: Event) => {
      if (evt?.type === 'click') {
        const target = (evt.target as HTMLElement | null)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
        if (!target) return;
        const hash = target.getAttribute('href')?.slice(1);
        if (!hash || !matchesHash(hash)) return;
        activateAndScroll(hash);
        return;
      }
      const currentHash = window.location.hash ? window.location.hash.slice(1) : '';
      if (currentHash && matchesHash(currentHash)) {
        activateAndScroll(currentHash);
      }
    };

    if (window.location.hash && matchesHash(window.location.hash.slice(1))) {
      activateAndScroll(window.location.hash.slice(1));
    }

    window.addEventListener('hashchange', handleHashOrClick);
    document.addEventListener('click', handleHashOrClick, true);

    // 2. Hidratar por proximidad de viewport (IntersectionObserver con 900px de anticipación)
    if (typeof IntersectionObserver !== 'undefined' && hostRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            activateAndScroll();
            observer.disconnect();
          }
        },
        { rootMargin: '900px 0px' }
      );
      observer.observe(hostRef.current);
      return () => {
        cancelled = true;
        observer.disconnect();
        window.removeEventListener('hashchange', handleHashOrClick);
        document.removeEventListener('click', handleHashOrClick, true);
      };
    }

    const fallbackTimer = setTimeout(() => activateAndScroll(), 1200);
    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      window.removeEventListener('hashchange', handleHashOrClick);
      document.removeEventListener('click', handleHashOrClick, true);
    };
  }, [shouldMount, anchorId, extraAnchors]);

  if (!shouldMount) {
    return (
      <div
        ref={hostRef}
        id={anchorId}
        className="section-deferred"
        style={{ minHeight: fallbackHeight }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="section-deferred">
      <SectionErrorCatcher label={label}>
        <React.Suspense fallback={<div style={{ minHeight: fallbackHeight }} aria-hidden="true" />}>
          {children}
        </React.Suspense>
      </SectionErrorCatcher>
    </div>
  );
};
