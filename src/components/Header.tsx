import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenApprover?: () => void;
  onOpenSecurity?: () => void;
  onOpenAdvisorChat?: () => void;
  onOpenLiveVoice?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdmin,
  onOpenProfile,
  onOpenApprover,
  onOpenSecurity,
  onOpenAdvisorChat,
  onOpenLiveVoice,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, profile, isAdmin, isApprover, signInWithGoogle, signOut, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  // Close on Escape key and manage body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      closeMenu();
    } catch (err) {
      console.error('Google Sign-in failed:', err);
      setAuthError('Error al autenticar con Google. Por favor, reintenta.');
    }
  };

  return (
    <>
      <header className="site-header">
        <div className="wrap header-inner">
          {/* Logotipo Oficial con León e Identidad de Marca */}
          <a
            className="brand"
            href="#"
            aria-label="AL-HADIQA INVEST, volver al inicio"
            onClick={closeMenu}
          >
            <span className="brand-lion-icon" aria-hidden="true">🦁</span>
            <span>AL-HADIQA <span>INVEST</span></span>
          </a>

          {/* Acciones Rápidas del Encabezado + Botón Menú de Barras */}
          <div className="header-right-actions">
            {/* Centro de Notificaciones Transaccionales */}
            <NotificationCenter />

            {/* Estado de Usuario Compacto en Barra Superior */}
            {!loading && currentUser && (
              <div
                className="header-user-pill"
                onClick={() => {
                  if (isAdmin) onOpenAdmin();
                  else if (isApprover && onOpenApprover) onOpenApprover();
                  else onOpenProfile();
                }}
                role="button"
                tabIndex={0}
                title={currentUser.email || 'Mi Perfil'}
              >
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName || 'Usuario'}
                    className="header-user-avatar"
                  />
                ) : (
                  <div className="header-user-avatar header-user-avatar--placeholder">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="header-user-name">
                  {currentUser.displayName?.split(' ')[0] || 'Usuario'}
                </span>
                {isAdmin && <span className="header-role-badge">Admin</span>}
                {isApprover && !isAdmin && <span className="header-role-badge header-role-badge--partner">Socio</span>}
              </div>
            )}

            {!loading && !currentUser && (
              <button
                type="button"
                className="header-google-btn-compact"
                onClick={handleGoogleSignIn}
                title="Iniciar sesión con tu cuenta de Google"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.89c2.27-2.09 3.655-5.17 3.655-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3.05c-1.08.72-2.45 1.16-4.04 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.26 21.4 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.32 14.24c-.25-.72-.39-1.49-.39-2.24s.14-1.52.39-2.24V6.61H1.21C.44 8.14 0 9.87 0 12s.44 3.86 1.21 5.39l4.11-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.6 1.21 6.61l4.11 3.15c.94-2.85 3.57-5.01 6.68-5.01z"
                  />
                </svg>
                <span>Acceder</span>
              </button>
            )}

            {/* BOTÓN DEL MENÚ DE BARRAS (3 BARRAS DORADAS) */}
            <button
              type="button"
              className={`bar-menu-trigger ${isMenuOpen ? 'is-active' : ''}`}
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Cerrar menú de barras' : 'Abrir menú de barras'}
              aria-expanded={isMenuOpen}
              aria-controls="bar-menu-navigation"
            >
              <span className="bar-menu-icon" aria-hidden="true">
                <span className="bar-line bar-line-1"></span>
                <span className="bar-line bar-line-2"></span>
                <span className="bar-line bar-line-3"></span>
              </span>
              <span className="bar-menu-label">Menú</span>
            </button>
          </div>
        </div>

        {authError && (
          <div className="header-auth-error" role="alert">
            {authError}
          </div>
        )}
      </header>

      {/* BACKDROP CON DESENFOQUE (Cierra el menú al hacer clic fuera) */}
      {isMenuOpen && (
        <div
          className="bar-menu-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* PANEL LATERAL DEL MENÚ DE BARRAS (OFF-CANVAS DRAWER) */}
      <aside
        id="bar-menu-navigation"
        className={`bar-menu-drawer ${isMenuOpen ? 'is-open' : ''}`}
        aria-label="Menú de barras de navegación principal"
        aria-hidden={!isMenuOpen}
      >
        {/* Cabecera del Menú de Barras */}
        <div className="drawer-header">
          <div className="drawer-brand">
            <span className="brand-lion-icon" aria-hidden="true">🦁</span>
            <div>
              <div className="drawer-title">AL-HADIQA INVEST</div>
              <div className="drawer-slogan">«Cultivando el crecimiento, nutriendo su capital»</div>
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={closeMenu}
            aria-label="Cerrar menú de barras"
          >
            ✕
          </button>
        </div>

        {/* Tarjeta de Sesión / Perfil de Usuario */}
        <div className="drawer-user-card">
          {loading ? (
            <div className="drawer-user-loading">Verificando sesión...</div>
          ) : currentUser ? (
            <div>
              <div className="drawer-user-info">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName || 'Usuario'}
                    className="drawer-avatar"
                  />
                ) : (
                  <div className="drawer-avatar drawer-avatar--placeholder">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="drawer-user-meta">
                  <div className="drawer-user-name-full">
                    {currentUser.displayName || 'Usuario'}
                  </div>
                  <div className="drawer-user-email">{currentUser.email}</div>
                  <div className="drawer-badge-row">
                    {isAdmin && <span className="drawer-role-tag drawer-role-tag--admin">👑 Administrador Maestro</span>}
                    {isApprover && !isAdmin && <span className="drawer-role-tag drawer-role-tag--approver">🤝 Socio JustMarkets</span>}
                    {!isAdmin && !isApprover && <span className="drawer-role-tag">🎓 Alumno Registrado</span>}
                  </div>
                </div>
              </div>

              {/* Botones de Acción de Perfil */}
              <div className="drawer-user-actions">
                {isAdmin ? (
                  <button
                    type="button"
                    className="btn btn--gold drawer-portal-btn"
                    onClick={() => {
                      onOpenAdmin();
                      closeMenu();
                    }}
                  >
                    👑 Abrir Panel Maestro (Sr.smith)
                  </button>
                ) : isApprover && onOpenApprover ? (
                  <button
                    type="button"
                    className="btn btn--emerald drawer-portal-btn"
                    onClick={() => {
                      onOpenApprover();
                      closeMenu();
                    }}
                  >
                    🤝 Panel JustMarkets (Aprobador)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--ghost drawer-portal-btn"
                    onClick={() => {
                      onOpenProfile();
                      closeMenu();
                    }}
                  >
                    🎓 Abrir Portal del Alumno
                  </button>
                )}

                <button
                  type="button"
                  className="drawer-signout-btn"
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                  title="Cerrar sesión"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          ) : (
            <div className="drawer-login-box">
              <div className="drawer-login-prompt">
                Accede a tus clases en vivo, biblioteca, chat institucional y seguimiento personalizado:
              </div>
              <button
                type="button"
                className="btn drawer-google-full-btn"
                onClick={handleGoogleSignIn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.89c2.27-2.09 3.655-5.17 3.655-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3.05c-1.08.72-2.45 1.16-4.04 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.26 21.4 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.32 14.24c-.25-.72-.39-1.49-.39-2.24s.14-1.52.39-2.24V6.61H1.21C.44 8.14 0 9.87 0 12s.44 3.86 1.21 5.39l4.11-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.6 1.21 6.61l4.11 3.15c.94-2.85 3.57-5.01 6.68-5.01z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>
            </div>
          )}
        </div>

        {/* CONTENIDO DEL MENÚ CATEGORIZADO */}
        <nav className="drawer-nav-sections" aria-label="Secciones del menú de barras">
          {/* Categoría 1: Ruta & Formación */}
          <div className="drawer-group">
            <div className="drawer-group-title">
              <span>🧭</span>
              <span>Ruta &amp; Formación</span>
            </div>
            <ul className="drawer-links-list">
              <li>
                <a href="#roadmap" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">🗺️</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Roadmap Institucional</span>
                    <span className="drawer-link-desc">Ruta en 5 fases desde Onboarding a SMC</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#fundador" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">🦁</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Biografía del Fundador</span>
                    <span className="drawer-link-desc">Carlos Smith Zambrano González · CEO</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#streaming" onClick={closeMenu} className="drawer-link drawer-link--featured">
                  <span className="drawer-link-icon">🔴</span>
                  <div className="drawer-link-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="drawer-link-label">Transmisión Streaming Oficial</span>
                      <span className="drawer-mini-tag" style={{ background: '#ef4444', color: '#fff' }}>En Vivo</span>
                    </div>
                    <span className="drawer-link-desc">Canal @AL-HADIQAINVEST · Alertas y Acceso Alumnos</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#clases-en-vivo" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">🎓</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Cartelera de Clases</span>
                    <span className="drawer-link-desc">Calendario y temarios formativos</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#biblioteca" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">📚</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Biblioteca de Trading</span>
                    <span className="drawer-link-desc">Manuales, libros y PDFs autorizados</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#capital" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">🏛️</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">AL-HADIQA Capital</span>
                    <span className="drawer-link-desc">Educación financiera, Kiyosaki &amp; psicología</span>
                  </div>
                </a>
              </li>
            </ul>
          </div>

          {/* Categoría 2: Trading & Mercados */}
          <div className="drawer-group">
            <div className="drawer-group-title">
              <span>📈</span>
              <span>Trading &amp; Mercados</span>
            </div>
            <ul className="drawer-links-list">
              <li>
                <a href="#trading" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">📊</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Trading Institucional</span>
                    <span className="drawer-link-desc">Plataforma SMC, Order Blocks &amp; Liquidez</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#broker" onClick={closeMenu} className="drawer-link drawer-link--featured">
                  <span className="drawer-link-icon">⚖️</span>
                  <div className="drawer-link-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="drawer-link-label">Bróker Auditado (JustMarkets)</span>
                      <span className="drawer-mini-tag">5 Fuentes</span>
                    </div>
                    <span className="drawer-link-desc">WikiFX, Traders Union, FXVerify, FXLeaders &amp; Sitio Oficial</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#noticias-mercado" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">📰</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Noticias de Mercado</span>
                    <span className="drawer-link-desc">Calendario económico y análisis fundamental</span>
                  </div>
                </a>
              </li>
            </ul>
          </div>

          {/* Categoría 3: Ecosistema & Comunidad */}
          <div className="drawer-group">
            <div className="drawer-group-title">
              <span>🌐</span>
              <span>Comunidad &amp; Ecosistema</span>
            </div>
            <ul className="drawer-links-list">
              <li>
                <a href="#comunidad-chat" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">💬</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Chat Comunitario</span>
                    <span className="drawer-link-desc">4 salas en tiempo real: Forex, Cripto, Índices, Acciones</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#smithbusiness" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">💼</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">SmithBusiness Solutions</span>
                    <span className="drawer-link-desc">Arquitectura tecnológica, holding y software</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#gaming" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">🎮</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Taberna Lions-Gold</span>
                    <span className="drawer-link-desc">Comunidad gaming, torneos y recreación</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#ecosistema" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">🦁</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Ecosistema Digital</span>
                    <span className="drawer-link-desc">Holding integral y pilares corporativos</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="#faq" onClick={closeMenu} className="drawer-link">
                  <span className="drawer-link-icon">❓</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Preguntas Frecuentes (FAQ)</span>
                    <span className="drawer-link-desc">Cumplimiento, registro y respuestas claras</span>
                  </div>
                </a>
              </li>
            </ul>
          </div>

          {/* Categoría 4: Herramientas IA & Seguridad */}
          <div className="drawer-group">
            <div className="drawer-group-title">
              <span>⚡</span>
              <span>Mentoría Institucional &amp; Seguridad</span>
            </div>
            <div className="drawer-tools-grid">
              {onOpenAdvisorChat && (
                <button
                  type="button"
                  className="drawer-tool-card"
                  onClick={() => {
                    onOpenAdvisorChat();
                    closeMenu();
                  }}
                  title="Abrir Mentor Institucional de Trading (Código Abierto)"
                >
                  <span className="drawer-tool-icon">🦁</span>
                  <div>
                    <div className="drawer-tool-title">Mentor de Trading</div>
                    <div className="drawer-tool-desc">Código Abierto · SMC &amp; Riesgo</div>
                  </div>
                </button>
              )}

              {onOpenLiveVoice && (
                <button
                  type="button"
                  className="drawer-tool-card drawer-tool-card--emerald"
                  onClick={() => {
                    onOpenLiveVoice();
                    closeMenu();
                  }}
                  title="Abrir Calculadora & Herramientas de Trading"
                >
                  <span className="drawer-tool-icon">🧮</span>
                  <div>
                    <div className="drawer-tool-title">Lotaje &amp; Voz</div>
                    <div className="drawer-tool-desc">Calculadora y Síntesis</div>
                  </div>
                </button>
              )}

              {onOpenSecurity && (
                <button
                  type="button"
                  className="drawer-tool-card"
                  onClick={() => {
                    onOpenSecurity();
                    closeMenu();
                  }}
                  title="Abrir Centro de Seguridad"
                >
                  <span className="drawer-tool-icon">🛡️</span>
                  <div>
                    <div className="drawer-tool-title">Seguridad &amp; OWASP</div>
                    <div className="drawer-tool-desc">Auditoría y protección</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Pie del Drawer con CTA de Registro en JustMarkets */}
        <div className="drawer-footer">
          <div className="drawer-cta-card">
            <div className="drawer-cta-label">Bróker Oficial Certificado</div>
            <div className="drawer-cta-desc">
              Auditado por WikiFX, Traders Union, FXVerify, FXLeaders y el Sitio Oficial.
            </div>
            <a
              href="https://one.justmarkets.link/a/kgi9s02uqu"
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="btn btn--gold drawer-cta-btn"
              onClick={closeMenu}
            >
              <span>🚀 Abrir Cuenta en JustMarkets</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div className="drawer-copyright">
            © 2026 AL-HADIQA INVEST · Smith Business Solutions
          </div>
        </div>
      </aside>
    </>
  );
};
