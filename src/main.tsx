import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    const key = 'alhadiqa_preload_reload_ts';
    const last = Number(sessionStorage.getItem(key) || '0');
    if (Date.now() - last > 15_000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  });

  if (import.meta.env.PROD) {
    registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          setInterval(() => {
            registration.update().catch(() => {});
          }, 60 * 60 * 1000);
        }
      },
      onOfflineReady() {
        console.info('AL-HADIQA INVEST App lista para uso sin conexión.');
      },
    });
  } else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        if (reg.active?.scriptURL?.includes('dev-sw')) {
          void reg.unregister();
        }
      });
    }).catch(() => {});
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

