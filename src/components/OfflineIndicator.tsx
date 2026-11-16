import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-[76px] left-1/2 -translate-x-1/2 z-[950] px-4 py-2 rounded-full bg-amber-950/95 border border-amber-400/60 text-amber-100 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-[92vw]"
    >
      <WifiOff size={15} className="text-amber-400 shrink-0" aria-hidden="true" />
      <span>Modo sin conexión: mostrando recursos guardados de AL-HADIQA INVEST</span>
    </div>
  );
};
