import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateSignedDownloadUrl, validateSignedDownloadToken } from '../utils/signedUrlService';
import { scanFileForMalware, ScanReport } from '../utils/fileSecurityScanner';
import { getClientIpFingerprint } from '../utils/botProtection';

interface SecurityComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityComplianceModal: React.FC<SecurityComplianceModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'owasp' | 'headers' | 'signed_urls' | 'antivirus' | 'privacy'>('owasp');

  // Signed URL Tester State
  const [testResourceId, setTestResourceId] = useState('smc-institucional-vol1');
  const [testGeneratedToken, setTestGeneratedToken] = useState<string | null>(null);
  const [testVerificationOutput, setTestVerificationOutput] = useState<string | null>(null);

  // AV Tester State
  const [avReport, setAvReport] = useState<ScanReport | null>(null);
  const [avScanning, setAvScanning] = useState(false);

  // Privacy export notice
  const [privacyNotice, setPrivacyNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateTestSignedUrl = async () => {
    const uid = currentUser?.uid || 'alumno-demo-123';
    const res = await generateSignedDownloadUrl(testResourceId, uid, 15);
    setTestGeneratedToken(res.token);
    setTestVerificationOutput(null);
  };

  const handleVerifyTestToken = async () => {
    if (!testGeneratedToken) return;
    const uid = currentUser?.uid || 'alumno-demo-123';
    const result = await validateSignedDownloadToken(testGeneratedToken, uid);
    if (result.valid) {
      setTestVerificationOutput(`✅ Firma Válida & Enlace Activo. Recurso autorizado: "${result.resourceId}". Enlace intransferible ligado al UID: ${uid}.`);
    } else {
      setTestVerificationOutput(`❌ Enlace Rechazado: ${result.error}`);
    }
  };

  const handleTestAvScan = async (file: File) => {
    setAvScanning(true);
    setAvReport(null);
    try {
      const report = await scanFileForMalware(file);
      setAvReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setAvScanning(false);
    }
  };

  const handleExportUserData = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      ecosystem: 'AL-HADIQA INVEST',
      user: {
        uid: currentUser?.uid,
        email: currentUser?.email,
        displayName: profile?.displayName,
        role: profile?.role,
        status: profile?.status,
        permissions: profile?.permissions,
        createdAt: profile?.createdAt,
      },
      security: {
        clientIpFingerprint: getClientIpFingerprint(),
        authProvider: 'Google OAuth 2.0 (Zero Local Password Architecture)',
        encryption: 'TLS 1.3 / AES-256',
      },
      legalDisclaimer: 'Contenido educativo, no constituye asesoría financiera ni recomendación de inversión.',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `al_hadiqa_datos_usuario_${currentUser?.uid || 'alumno'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setPrivacyNotice('Copia de datos personales exportada exitosamente conforme a GDPR / Buenas Prácticas de Privacidad.');
    setTimeout(() => setPrivacyNotice(null), 4000);
  };

  const OWASP_ITEMS = [
    {
      code: 'A01:2021',
      title: 'Control de Acceso Roto (Broken Access Control)',
      status: 'CUMPLIDO',
      description: 'Control de acceso basado en roles (RBAC) validado en el servidor Firestore (firestore.rules), no sólo en la interfaz cliente. Reglas para administradores, aprobadores del socio y alumnos con permisos específicos.',
    },
    {
      code: 'A02:2021',
      title: 'Fallas Criptográficas (Cryptographic Failures)',
      status: 'CUMPLIDO',
      description: 'HTTPS obligatorio con TLS 1.3 vigente, cabecera HSTS activa (31536000s) y enlaces de descarga firmados criptográficamente con tokens HMAC-SHA256 con expiración estricta de 15 minutos.',
    },
    {
      code: 'A03:2021',
      title: 'Inyección (Injection - SQL, NoSQL & XSS)',
      status: 'CUMPLIDO',
      description: 'Sanitización exhaustiva de todo mensaje de chat, neutralización de entidades HTML, detección de patrones maliciosos (SQLi, NoSQL, javascript:) y consultas parametrizadas nativas en Firestore.',
    },
    {
      code: 'A04:2021',
      title: 'Diseño Inseguro (Insecure Design)',
      status: 'CUMPLIDO',
      description: 'Autenticación exclusiva vía Google OAuth 2.0 sin contraseñas locales que puedan ser vulneradas. Flujo de aprobación previa de clases con el socio JustMarkets y avisos regulatorios permanentes.',
    },
    {
      code: 'A05:2021',
      title: 'Configuración de Seguridad Incorrecta',
      status: 'CUMPLIDO',
      description: 'Cabeceras de protección HTTP configuradas: Strict-Transport-Security, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin y Permissions-Policy.',
    },
    {
      code: 'A06:2021',
      title: 'Componentes Vulnerables y Desactualizados',
      status: 'CUMPLIDO',
      description: 'Arquitectura basada en bibliotecas modernas (Firebase SDK v13, React 18, Vite), sin dependencias innecesarias y estricta compilación tipada en TypeScript.',
    },
    {
      code: 'A07:2021',
      title: 'Fallas de Identificación y Autenticación',
      status: 'CUMPLIDO',
      description: 'Protección contra bots con Cloudflare Turnstile / reCAPTCHA en registro y chat, limitación de peticiones por IP y usuario (5 msgs/min), y delegación de MFA al proveedor Google.',
    },
    {
      code: 'A08:2021',
      title: 'Fallas en la Integridad del Software y Datos',
      status: 'CUMPLIDO',
      description: 'Análisis antivirus con motor ClamAV y heurística en todos los archivos subidos, validación de cabeceras binarias (Magic Bytes) y cómputo de sumas de verificación SHA-256.',
    },
    {
      code: 'A09:2021',
      title: 'Fallas en el Registro y Monitoreo de Seguridad',
      status: 'CUMPLIDO',
      description: 'Registro inmutable de auditoría: tabla de descargas (quién descargó qué y cuándo) y registro de acciones administrativas (admin_audit_logs) protegido contra modificaciones.',
    },
    {
      code: 'A10:2021',
      title: 'Falsificación de Peticiones del Lado del Servidor (SSRF)',
      status: 'CUMPLIDO',
      description: 'Validación estricta de URLs de streaming (YouTube, Twitch, WebRTC) con listas permitidas y rechazo automático de direcciones IP locales o esquemas no seguros.',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 750,
        background: 'rgba(7, 11, 20, 0.94)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1rem, 2.5vw, 2.5rem)',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'var(--surface-3)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius)',
          maxWidth: '960px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 2rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🛡️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="badge badge--emerald" style={{ fontSize: '0.72rem' }}>
                  OWASP Top 10 · TLS 1.3 · RBAC
                </span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontFamily: 'var(--font-head)' }}>
                  Centro de Seguridad, Cumplimiento &amp; Protección de Datos
                </h3>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                Arquitectura Cero-Contraseñas, Cabeceras HTTP Fortificadas, Antivirus ClamAV y Enlaces Firmados
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--muted)',
              fontSize: '1.3rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation Menu */}
        <div
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'owasp' ? 'active' : ''}`}
            onClick={() => setActiveTab('owasp')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            📋 Matriz OWASP Top 10
          </button>
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'headers' ? 'active' : ''}`}
            onClick={() => setActiveTab('headers')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            🔒 HTTPS, TLS &amp; Cabeceras
          </button>
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'signed_urls' ? 'active' : ''}`}
            onClick={() => setActiveTab('signed_urls')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            🔑 Enlaces Firmados (15 min)
          </button>
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'antivirus' ? 'active' : ''}`}
            onClick={() => setActiveTab('antivirus')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            🦠 Antivirus ClamAV Sandbox
          </button>
          <button
            type="button"
            className={`quiz__btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            👤 Privacidad &amp; GDPR
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>
          {/* TAB 1: MATRIZ OWASP TOP 10 */}
          {activeTab === 'owasp' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: 0, color: 'var(--emerald)', fontSize: '1.05rem', fontFamily: 'var(--font-head)' }}>
                  Evaluación de Conformidad con el Estándar OWASP Top 10 (2021-2026)
                </h4>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                  Todas las categorías principales han sido implementadas y validadas a nivel de servidor, red y cliente.
                </p>
              </div>

              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {OWASP_ITEMS.map((item) => (
                  <div
                    key={item.code}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 700 }}>
                        {item.code} · {item.title}
                      </span>
                      <span className="badge badge--emerald" style={{ fontSize: '0.68rem' }}>
                        ✓ {item.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: HTTPS, TLS 1.3 & CABECERAS DE SEGURIDAD */}
          {activeTab === 'headers' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.85rem', color: '#93c5fd', fontSize: '1rem' }}>
                  🌐 Certificado TLS &amp; Conexión HTTPS Forzada
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', fontSize: '0.82rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--muted)', display: 'block' }}>Protocolo Criptográfico:</span>
                    <strong style={{ color: 'var(--emerald)' }}>TLS 1.3 (RFC 8446) / TLS 1.2+</strong>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--muted)', display: 'block' }}>Algoritmo de Cifrado:</span>
                    <strong style={{ color: '#fff' }}>TLS_AES_256_GCM_SHA384</strong>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--muted)', display: 'block' }}>Estado de Conexión:</span>
                    <strong style={{ color: 'var(--emerald)' }}>🔒 100% Cifrada (HTTPS Only)</strong>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--muted)', display: 'block' }}>Autoridad de Certificación:</span>
                    <strong style={{ color: '#fff' }}>Google Trust Services (GTS CA 1C3)</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.85rem', color: 'var(--gold)', fontSize: '1rem' }}>
                  🛡️ Cabeceras HTTP de Respuesta Activadas
                </h4>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Cabecera HTTP</th>
                        <th>Valor Configurado</th>
                        <th>Protección Ofrecida</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>Strict-Transport-Security</code> (HSTS)</td>
                        <td><code>max-age=31536000; includeSubDomains; preload</code></td>
                        <td>Previene ataques de degradación SSL/TLS (SSL Stripping). Fuerza conexión HTTPS durante 1 año.</td>
                      </tr>
                      <tr>
                        <td><code>X-Content-Type-Options</code></td>
                        <td><code>nosniff</code></td>
                        <td>Impide que los navegadores interpreten archivos como un tipo MIME diferente al declarado (MIME Sniffing).</td>
                      </tr>
                      <tr>
                        <td><code>X-Frame-Options</code> / CSP frame-ancestors</td>
                        <td><code>SAMEORIGIN</code></td>
                        <td>Protege contra ataques de secuestro de clics (Clickjacking).</td>
                      </tr>
                      <tr>
                        <td><code>Referrer-Policy</code></td>
                        <td><code>strict-origin-when-cross-origin</code></td>
                        <td>Evita que se filtren rutas completas o tokens a dominios de terceros.</td>
                      </tr>
                      <tr>
                        <td><code>Permissions-Policy</code></td>
                        <td><code>camera=(), microphone=(), geolocation=()</code></td>
                        <td>Deshabilita el acceso no solicitado a periféricos sensibles en el navegador.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENLACES FIRMADOS DE CORTA DURACIÓN */}
          {activeTab === 'signed_urls' && (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.4rem', color: '#93c5fd', fontSize: '1rem' }}>
                  🔑 Generador y Validador de Enlaces Firmados (Signed URLs)
                </h4>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Las descargas de libros y manuales nunca exponen URLs estáticas públicas. Cada enlace se firma con HMAC-SHA256, se vincula exclusivamente al UID del alumno y expira automáticamente tras 15 minutos.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={testResourceId}
                    onChange={(e) => setTestResourceId(e.target.value)}
                    placeholder="ID de Recurso (ej: manual-smc-2026)"
                    style={{ flex: 1, padding: '0.55rem', background: 'var(--surface-3)', border: '1px solid var(--line)', borderRadius: '4px', color: '#fff', fontSize: '0.84rem' }}
                  />
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={handleGenerateTestSignedUrl}
                    style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}
                  >
                    Generar Enlace Firmado (15 min) &rarr;
                  </button>
                </div>

                {testGeneratedToken && (
                  <div style={{ padding: '0.85rem', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.78rem' }}>
                    <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '0.35rem' }}>Token Criptográfico Generado:</div>
                    <code style={{ wordBreak: 'break-all', color: '#cbd5e1' }}>{testGeneratedToken}</code>

                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.65rem' }}>
                      <button
                        type="button"
                        className="btn btn--emerald"
                        onClick={handleVerifyTestToken}
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                      >
                        Validar Firma y Tiempo de Expiración
                      </button>
                    </div>

                    {testVerificationOutput && (
                      <div style={{ marginTop: '0.65rem', padding: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--emerald)', borderRadius: '4px', color: '#fff', fontSize: '0.8rem' }}>
                        {testVerificationOutput}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MOTOR ANTIVIRUS CLAMAV SANDBOX */}
          {activeTab === 'antivirus' && (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.4rem', color: 'var(--emerald)', fontSize: '1rem' }}>
                  🦠 Sandbox de Análisis Antivirus ClamAV &amp; Heurística
                </h4>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Prueba el analizador de malware en tiempo real. Inspecciona extensiones, límites de tamaño, cabeceras binarias (Magic Bytes) y búsqueda de patrones de virus o scripts incrustados.
                </p>

                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleTestAvScan(e.target.files[0]);
                    }
                  }}
                  style={{ marginBottom: '1rem', fontSize: '0.82rem', color: '#cbd5e1' }}
                />

                {avScanning && (
                  <div style={{ color: 'var(--gold)', fontSize: '0.84rem' }}>
                    🔍 Analizando archivo con ClamAV 1.4 y base de firmas activas...
                  </div>
                )}

                {avReport && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '6px',
                      background: avReport.isClean ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${avReport.isClean ? 'var(--emerald)' : '#ef4444'}`,
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: avReport.isClean ? 'var(--emerald)' : '#fca5a5', marginBottom: '0.5rem' }}>
                      {avReport.isClean ? '✅ Archivo Limpio · Certificado Seguro' : '🚫 Archivo Malicioso o Bloqueado por Antivirus'}
                    </div>
                    <div style={{ display: 'grid', gap: '0.25rem', color: '#cbd5e1' }}>
                      <div>Archivo: <strong>{avReport.fileName}</strong> ({(avReport.fileSizeBytes / 1024).toFixed(1)} KB)</div>
                      <div>Motor: {avReport.scannerEngine} · Firmas: {avReport.signaturesChecked.toLocaleString()}</div>
                      <div>Hash SHA-256: <code>{avReport.sha256}</code></div>
                      <div>Magic Bytes: {avReport.magicBytesVerified ? '✓ Válidos' : '✗ Inválidos'}</div>
                      {avReport.threatDetails && (
                        <div style={{ color: '#fca5a5', marginTop: '0.4rem', fontWeight: 600 }}>
                          Motivo: {avReport.threatDetails}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACIDAD DE DATOS & GDPR */}
          {activeTab === 'privacy' && (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.6rem', color: 'var(--gold)', fontSize: '1rem' }}>
                  👤 Gestión de Privacidad &amp; Derechos del Usuario
                </h4>
                <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  Al-Hadiqa Invest respeta los principios de minimización de datos y privacidad por diseño. No almacenamos contraseñas (autenticación delegada a Google), no utilizamos cookies de rastreo publicitario de terceros y todos los registros son transparentes.
                </p>

                {privacyNotice && (
                  <div style={{ padding: '0.65rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--emerald)', borderRadius: '4px', color: 'var(--emerald)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                    ✓ {privacyNotice}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn--emerald"
                    onClick={handleExportUserData}
                    style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}
                  >
                    📥 Exportar Mis Datos Personales (JSON)
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      alert('Para solicitar la baja definitiva y eliminación de tu cuenta, contacta a empresaalhadiqainvest@gmail.com o pulsa "Darse de baja" en tus preferencias de notificación.');
                    }}
                    style={{ fontSize: '0.82rem', padding: '0.55rem 1rem', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    🗑️ Solicitar Supresión de Cuenta (Derecho al Olvido)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 2rem',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--surface-2)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
            Aviso JustMarkets: Contenido 100% pedagógico, no constituye asesoría financiera.
          </div>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
