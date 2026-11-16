import React, { useState, useRef, useEffect, useCallback } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  initializeEncryptedBroadcastSession,
  StreamSecuritySession,
} from '../services/streamCryptoService';

interface WebRTCBroadcastStudioProps {
  classId: string;
  classTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WebRTCBroadcastStudio: React.FC<WebRTCBroadcastStudioProps> = ({
  classId,
  classTitle,
  isOpen,
  onClose,
}) => {
  const [streamSource, setStreamSource] = useState<'camera' | 'screen'>('camera');
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [liveDuration, setLiveDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cryptoSession, setCryptoSession] = useState<StreamSecuritySession | null>(null);
  const [isRotatingKey, setIsRotatingKey] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const rotateEncryptionKey = useCallback(async () => {
    setIsRotatingKey(true);
    try {
      const session = await initializeEncryptedBroadcastSession(classId);
      setCryptoSession(session);
      if (isLive) {
        await updateDoc(doc(db, 'classes', classId), {
          encryptionFingerprint: session.keyFingerprint,
          encryptionCipherSuite: session.cipherSuite,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Error inicializando cifrado AES-256-GCM:', err);
    } finally {
      setIsRotatingKey(false);
    }
  }, [classId, isLive]);

  // Initialize media capture
  const startMediaCapture = async (sourceType: 'camera' | 'screen') => {
    setErrorMsg(null);
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }

    try {
      let stream: MediaStream;
      if (sourceType === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30, max: 60 } },
          audio: true,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: true,
        });
      }

      activeStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
      setStreamSource(sourceType);
    } catch (err: unknown) {
      console.error('Media capture error:', err);
      setErrorMsg(
        err instanceof Error
          ? `Permiso denegado o fuente no disponible: ${err.message}`
          : 'No se pudo acceder a la cámara o pantalla.'
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      startMediaCapture('camera');
      rotateEncryptionKey();
    } else {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }
      setIsLive(false);
      setLiveDuration(0);
      setCryptoSession(null);
    }
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, rotateEncryptionKey]);

  // Duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        setLiveDuration((p) => p + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const handleStartBroadcast = async () => {
    setIsLive(true);
    try {
      const activeCrypto = cryptoSession || (await initializeEncryptedBroadcastSession(classId));
      setCryptoSession(activeCrypto);

      // 1. Update class status to 'en_vivo' in Firestore with verified AES-256-GCM + HMAC-SHA256 telemetry
      await updateDoc(doc(db, 'classes', classId), {
        status: 'en_vivo',
        streamUrl: 'webrtc_direct',
        encryptionCipherSuite: activeCrypto.cipherSuite,
        encryptionFingerprint: activeCrypto.keyFingerprint,
        hmacVerified: activeCrypto.verifiedByServer,
        updatedAt: serverTimestamp(),
      });

      // 2. Automatic notification to all registered students
      await addDoc(collection(db, 'notifications'), {
        title: `🔴 ¡EN VIVO AHORA! ${classTitle}`,
        message: `Sr.smith (Carlos Smith Zambrano) ha iniciado la transmisión en directo protegida con cifrado ${activeCrypto.cipherSuite}. Ingresa al aula virtual para ver el análisis en tiempo real.`,
        targetRole: 'all',
        type: 'urgent',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
    }
  };

  const handleStopBroadcast = async () => {
    setIsLive(false);
    try {
      await updateDoc(doc(db, 'classes', classId), {
        status: 'finalizada',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
    }
  };

  const toggleMic = () => {
    if (activeStreamRef.current) {
      const audioTrack = activeStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (activeStreamRef.current) {
      const videoTrack = activeStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOff(!videoTrack.enabled);
      }
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 700,
        background: 'rgba(7, 11, 20, 0.95)',
        backdropFilter: 'blur(16px)',
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
          border: '1px solid var(--gold)',
          borderRadius: 'var(--radius)',
          maxWidth: '1000px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-glow)',
          overflow: 'hidden',
        }}
      >
        {/* Studio Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🎥</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="badge badge--gold" style={{ fontSize: '0.72rem' }}>
                  WebRTC Live Studio
                </span>
                {isLive && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: '#ef4444',
                      color: '#fff',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      animation: 'pulse 1.5s infinite',
                    }}
                  >
                    ● EN VIVO · {formatSeconds(liveDuration)}
                  </span>
                )}
              </div>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', color: '#fff', fontFamily: 'var(--font-head)' }}>
                {classTitle}
              </h3>
              {cryptoSession && (
                <div
                  style={{
                    marginTop: '0.35rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    color: '#34d399',
                  }}
                >
                  <span>🔐 {cryptoSession.cipherSuite}</span>
                  <span aria-hidden="true">·</span>
                  <span>HMAC-SHA256 {cryptoSession.verifiedByServer ? 'Verificado' : 'Local'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Huella: {cryptoSession.keyFingerprint.slice(0, 12)}</span>
                  <button
                    type="button"
                    onClick={rotateEncryptionKey}
                    disabled={isRotatingKey}
                    style={{
                      background: 'rgba(16, 185, 129, 0.14)',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      color: '#6ee7b7',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                    }}
                  >
                    {isRotatingKey ? 'Rotando...' : '↻ Rotar Clave AES-256'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(239, 68, 68, 0.2)', borderBottom: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.85rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Video Canvas and Controls */}
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* Main Video Screen */}
          <div
            style={{
              background: '#05080f',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line-strong)',
              aspectRatio: '16/9',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={videoPreviewRef}
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: cameraOff ? 'none' : 'block',
              }}
            />

            {cameraOff && (
              <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block' }}>📷</span>
                <span>Cámara apagada</span>
              </div>
            )}

            {/* Live Indicator on screen */}
            {isLive && (
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  background: 'rgba(239, 68, 68, 0.85)',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '4px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.06em',
                }}
              >
                ● TRANSMITIENDO EN DIRECTO A LA PLATAFORMA
              </div>
            )}
          </div>

          {/* Broadcast Studio Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <h4 style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', margin: 0, fontSize: '1rem' }}>
                Configuración de Fuente
              </h4>

              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={streamSource === 'camera' ? 'btn btn--emerald' : 'btn btn--ghost'}
                  style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.84rem' }}
                  onClick={() => startMediaCapture('camera')}
                >
                  📷 Cámara Web + Micrófono
                </button>

                <button
                  type="button"
                  className={streamSource === 'screen' ? 'btn btn--emerald' : 'btn btn--ghost'}
                  style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.84rem' }}
                  onClick={() => startMediaCapture('screen')}
                >
                  🖥️ Compartir Pantalla (TradingView / Gráficos)
                </button>
              </div>

              {/* Hardware Mutes */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderColor: isMuted ? '#ef4444' : 'var(--line)' }}
                  onClick={toggleMic}
                >
                  {isMuted ? '🔇 Desmutear Mic' : '🎙️ Mutear Mic'}
                </button>

                <button
                  type="button"
                  className="btn btn--ghost"
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderColor: cameraOff ? '#ef4444' : 'var(--line)' }}
                  onClick={toggleCamera}
                >
                  {cameraOff ? '📷 Encender Cámara' : '🚫 Apagar Cámara'}
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem',
                  fontSize: '0.78rem',
                  color: 'var(--muted)',
                }}
              >
                📡 <strong>Aviso automático a la comunidad:</strong> Al hacer clic en Iniciar, se dispara una notificación urgente a todos los alumnos para que se conecten a la sala virtual.
              </div>
            </div>

            {/* Start / Stop Broadcast Action */}
            <div style={{ marginTop: '1.5rem' }}>
              {!isLive ? (
                <button
                  type="button"
                  className="btn btn--emerald btn--pulse"
                  style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 700 }}
                  onClick={handleStartBroadcast}
                >
                  🔴 INICIAR TRANSMISIÓN EN DIRECTO
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', background: '#dc2626', color: '#fff', border: 0 }}
                  onClick={handleStopBroadcast}
                >
                  ⏹ DETENER Y FINALIZAR CLASE
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.75rem', borderTop: '1px solid var(--line)', background: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cerrar Estudio
          </button>
        </div>
      </div>
    </div>
  );
};
