import { useState, useEffect, useCallback } from 'react';
import {
  markAppAsInstalled,
  requestPermissionAndDeliverDailyDev,
} from '../services/dailyPersonalDevService';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type DevicePlatform = 'ios' | 'android' | 'mac' | 'desktop';

function detectDevicePlatform(): { platform: DevicePlatform; isSafari: boolean } {
  if (typeof navigator === 'undefined') {
    return { platform: 'desktop', isSafari: false };
  }

  const ua = navigator.userAgent || '';
  const platformStr = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || '';

  const isIPadOS = platformStr === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || isIPadOS;
  const isAndroid = /Android/i.test(ua);
  const isMac = !isIOS && (/Macintosh|Mac OS X|MacIntel/i.test(ua) || /macOS/i.test(platformStr));
  const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|EdgiOS|EdgA|OPR|Opera/i.test(ua);

  if (isIOS) return { platform: 'ios', isSafari };
  if (isAndroid) return { platform: 'android', isSafari: false };
  if (isMac) return { platform: 'mac', isSafari };
  return { platform: 'desktop', isSafari };
}

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    nav.standalone === true
  );
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => checkIsStandalone());
  const [isInstalling, setIsInstalling] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [{ platform, isSafari }] = useState(() => detectDevicePlatform());

  useEffect(() => {
    const standalone = checkIsStandalone();
    setIsStandalone(standalone);
    if (standalone) {
      markAppAsInstalled();
    }

    const mql = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      const active = checkIsStandalone();
      setIsStandalone(active);
      if (active) markAppAsInstalled();
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      markAppAsInstalled();
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowInstallModal(false);
    };

    mql.addEventListener?.('change', handleDisplayModeChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mql.removeEventListener?.('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerNativeInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        markAppAsInstalled();
        setDeferredPrompt(null);
        setShowInstallModal(false);
        void requestPermissionAndDeliverDailyDev();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Error durante instalación nativa PWA:', err);
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt]);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      await triggerNativeInstall();
    } else {
      setShowInstallModal(true);
    }
  }, [deferredPrompt, triggerNativeInstall]);

  return {
    canPromptNatively: Boolean(deferredPrompt),
    isStandalone,
    isInstalling,
    platform,
    isSafari,
    showInstallModal,
    setShowInstallModal,
    triggerNativeInstall,
    handleInstallClick,
  };
}
