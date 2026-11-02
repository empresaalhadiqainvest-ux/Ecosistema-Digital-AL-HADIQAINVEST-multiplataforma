import React, { useState, useRef } from 'react';
import {
  scanFileForMalware,
  ScanReport,
} from '../utils/fileSecurityScanner';

interface FileUploadScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileApproved: (file: File, report: ScanReport) => void;
  contextLabel?: string;
  allowedTypesDescription?: string;
}

export const FileUploadScannerModal: React.FC<FileUploadScannerModalProps> = ({
  isOpen,
  onClose,
  onFileApproved,
  contextLabel = 'Chat Comunitario / Biblioteca',
  allowedTypesDescription = 'Imágenes (PNG, JPG, WEBP hasta 5MB) o Documentos (PDF hasta 10MB)',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setScanReport(null);
    setScanProgress(0);
  };

  const handleStartScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setScanProgress(15);

    // Simulación progresiva de fases de escaneo de seguridad
    const timer1 = setTimeout(() => setScanProgress(45), 200);
    const timer2 = setTimeout(() => setScanProgress(75), 450);

    try {
      const report = await scanFileForMalware(selectedFile);
      setScanProgress(100);
      setScanReport(report);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsScanning(false);
    }
  };

  const handleConfirmUpload = () => {
    if (selectedFile && scanReport && scanReport.isClean) {
      onFileApproved(selectedFile, scanReport);
      onClose();
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setScanReport(null);
    setScanProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 800,
        background: 'rgba(7, 11, 20, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'linear-gradient(165deg, var(--surface-3), var(--surface))',
          border: '1px solid var(--line-strong)',
          borderRadius: 'var(--radius)',
          maxWidth: '560px',
          width: '100%',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🛡️</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontFamily: 'var(--font-head)' }}>
                Inspección Antivirus &amp; Validación de Archivos
              </h3>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--gold)' }}>
              Destino: {contextLabel} · Motor: ClamAV Daemon 1.4 &amp; Heuristic Guard
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Security Policy Badge */}
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.76rem',
            color: '#cbd5e1',
            lineHeight: 1.45,
          }}
        >
          <strong>Política de Seguridad OWASP:</strong> Todo archivo subido pasa por verificación de cabeceras binarias (Magic Bytes), limitación de tamaño y escaneo de malware antes de estar disponible para otros usuarios.
        </div>

        {/* Dropzone Area */}
        {!selectedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '2.5rem 1.5rem',
              border: `2px dashed ${dragActive ? 'var(--gold)' : 'rgba(148, 163, 184, 0.3)'}`,
              borderRadius: 'var(--radius-sm)',
              background: dragActive ? 'rgba(245, 158, 11, 0.05)' : 'rgba(15, 23, 42, 0.5)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>📤</div>
            <p style={{ margin: '0 0 0.4rem', color: '#fff', fontWeight: 600, fontSize: '0.92rem' }}>
              Arrastra un archivo aquí o pulsa para seleccionarlo
            </p>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--muted)' }}>
              {allowedTypesDescription}
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: '1.25rem',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.8rem' }}>
                  {selectedFile.name.endsWith('.pdf') ? '📄' : '🖼️'}
                </span>
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block', wordBreak: 'break-all' }}>
                    {selectedFile.name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {selectedFile.type || 'Tipo desconocido'}
                  </span>
                </div>
              </div>

              {!isScanning && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn--ghost"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  Cambiar
                </button>
              )}
            </div>

            {/* Scanning Progress Bar */}
            {isScanning && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--gold)', marginBottom: '0.35rem' }}>
                  <span>Escaneando firmas de malware con ClamAV...</span>
                  <span>{scanProgress}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${scanProgress}%`,
                      background: 'linear-gradient(90deg, var(--gold) 0%, var(--emerald) 100%)',
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Scan Report Feedback */}
            {scanReport && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: scanReport.isClean ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${scanReport.isClean ? 'var(--emerald)' : '#ef4444'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{scanReport.isClean ? '✅' : '🚫'}</span>
                  <strong
                    style={{
                      fontSize: '0.88rem',
                      color: scanReport.isClean ? 'var(--emerald)' : '#fca5a5',
                    }}
                  >
                    {scanReport.isClean
                      ? 'Archivo Verificado & Seguro (0 Amenazas Detectadas)'
                      : '¡Amenaza de Seguridad Detectada! Archivo en Cuarentena'}
                  </strong>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#cbd5e1', display: 'grid', gap: '0.25rem' }}>
                  <div>Motor: <strong>{scanReport.scannerEngine}</strong> (Firmas: {scanReport.signaturesChecked.toLocaleString()})</div>
                  <div>Checksum SHA-256: <code style={{ color: 'var(--gold-soft)' }}>{scanReport.sha256.substring(0, 20)}...</code></div>
                  <div>Magic Bytes: <strong>{scanReport.magicBytesVerified ? '✓ Válidos' : '✗ Inválidos'}</strong></div>
                  {scanReport.threatDetails && (
                    <div style={{ color: '#fca5a5', marginTop: '0.35rem', fontWeight: 600 }}>
                      Detalle del bloqueo: {scanReport.threatDetails}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>

          {selectedFile && !scanReport && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleStartScan}
              disabled={isScanning}
            >
              {isScanning ? 'Analizando...' : 'Iniciar Escaneo Antivirus 🛡️'}
            </button>
          )}

          {scanReport && scanReport.isClean && (
            <button
              type="button"
              className="btn btn--emerald"
              onClick={handleConfirmUpload}
            >
              Aprobar y Enviar Archivo &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
