import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Al-Hadiqa Invest - ErrorBoundary caught an error:', error, errorInfo);

    const msg = error?.message || '';
    const isChunkOrModuleError =
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Loading chunk') ||
      msg.includes('ChunkLoadError');

    if (isChunkOrModuleError && typeof window !== 'undefined') {
      const guardKey = 'alhadiqa_chunk_auto_reload_ts';
      const last = Number(sessionStorage.getItem(guardKey) || '0');
      if (Date.now() - last > 15_000) {
        sessionStorage.setItem(guardKey, String(Date.now()));
        this.clearCachesAndReload();
      }
    }
  }

  private clearCachesAndReload = () => {
    const reload = () => window.location.reload();
    if ('caches' in window) {
      caches
        .keys()
        .then((names) => Promise.all(names.map((n) => caches.delete(n))))
        .finally(reload);
    } else {
      reload();
    }
  };

  private handleReload = () => {
    this.clearCachesAndReload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#03140e] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#062319]/90 border border-amber-500/30 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-bold text-amber-200 mb-2">Al-Hadiqa Invest</h2>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Ocurrió una pausa temporal al sincronizar la sesión. Por favor, recargue el portal para restablecer el entorno institucional de forma segura.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-3 px-6 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              Recargar Plataforma
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
