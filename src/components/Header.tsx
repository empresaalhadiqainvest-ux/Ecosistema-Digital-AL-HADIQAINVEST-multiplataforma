import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenApprover?: () => void;
  onOpenSecurity?: () => void;
  onOpenAdvisorChat?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenSoc?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdmin,
  onOpenProfile,
  onOpenApprover,
  onOpenSecurity,
  onOpenAdvisorChat,
  onOpenLiveVoice,
  onOpenSoc,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const {
    currentUser,
    profile,
    isAdmin,
    isApprover,
    signInWithGoogle,
    signInAsDemo,
    signOut,
    loading,
    authError,
    clearAuthError,
  } = useAuth();

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
    clearAuthError();
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
      closeMenu();
    } catch (err) {
      console.error('Google Sign-in failed:', err);
    }
  };

  const handleDemoSignIn = async (role: 'admin' | 'pending_student' | 'active_student') => {
    clearAuthError();
    try {
      await signInAsDemo(role);
      setShowAuthModal(false);
      closeMenu();
    } catch (err) {
      console.error('Demo sign-in failed:', err);
    }
  };

  return (
    <>
      <header className="site-header">
        <div className="wrap header-inner">
          {/* Logotipo Oficial con León e Identidad de Marca */}
          <a
            className="brand"
            href="/"
            aria-label="AL-HADIQA INVEST, volver al inicio"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              const hero = document.getElementById('inicio');
              if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
              closeMenu();
            }}
          >
            <span className="brand-lion-icon" aria-hidden="true">🦁</span>
            <span>AL-HADIQA <span>INVEST</span></span>
          </a>

          {/* Acciones Rápidas del Encabezado + Botón Menú de Barras */}
          <div className="header-right-actions">
            {/* Botón de Instalación / Descarga App Multiplataforma */}
            <PWAInstallButton variant="header" />

            {/* Centro de Notificaciones Transaccionales */}
            <NotificationCenter />

            {/* Acceso Directo de Ciberseguridad SOC EXCAISRES para el Administrador */}
            {!loading && currentUser && isAdmin && onOpenSoc && (
              <button
                type="button"
                onClick={onOpenSoc}
                className="px-2.5 py-1.5 rounded-xl bg-[#062319] hover:bg-[#0b3325] border border-amber-500/40 hover:border-amber-400 text-amber-300 font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.2)] cursor-pointer hover:scale-105 active:scale-95"
                title="Abrir SOC EXCAISRES (Centro Autónomo de Ciberseguridad y Respuesta a Amenazas)"
              >
                <span>🛡️</span>
                <span className="hidden md:inline">SOC EXCAISRES</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}

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
                    alt={`Fotografía de perfil de ${profile?.displayName || currentUser?.displayName || 'Usuario registrado en la academia'}`}
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
                onClick={() => setShowAuthModal(true)}
                title="Iniciar sesión en la academia o acceder como administrador"
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
          <div className="header-auth-error flex items-center justify-between gap-3 px-4 py-2 bg-red-950/90 border-b border-red-500/50 text-red-200 text-xs" role="alert">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{authError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDemoSignIn('admin')}
                className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Entrar como Admin
              </button>
              <button
                type="button"
                onClick={clearAuthError}
                className="text-red-400 hover:text-white text-xs px-1 cursor-pointer"
                aria-label="Cerrar aviso de error"
              >
                ✕
              </button>
            </div>
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
                    alt={`Fotografía de perfil de ${profile?.displayName || currentUser?.displayName || 'Usuario de AL-HADIQA INVEST'}`}
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
                  <div className="space-y-2 w-full">
                    <button
                      type="button"
                      className="btn btn--gold drawer-portal-btn w-full"
                      onClick={() => {
                        onOpenAdmin();
                        closeMenu();
                      }}
                    >
                      👑 Abrir Panel Maestro (Sr.smith)
                    </button>
                    {onOpenSoc && (
                      <button
                        type="button"
                        className="btn btn--emerald drawer-portal-btn w-full"
                        onClick={() => {
                          onOpenSoc();
                          closeMenu();
                        }}
                      >
                        🛡️ Abrir SOC EXCAISRES (Ciberseguridad)
                      </button>
                    )}
                  </div>
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
            <div className="drawer-login-box space-y-2.5">
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

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 block mb-1.5 uppercase tracking-wider font-mono">
                  Acceso Alternativo / Respaldo:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDemoSignIn('admin')}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-bold text-center transition-all cursor-pointer"
                  >
                    👑 Admin (Sr. Smith)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoSignIn('active_student')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold text-center transition-all cursor-pointer"
                  >
                    🎓 Alumno Activo
                  </button>
                </div>
              </div>
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
                <a href="#dashboard-estudiantes" onClick={closeMenu} className="drawer-link drawer-link--featured">
                  <span className="drawer-link-icon">📊</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">Dashboard de Estudiantes</span>
                    <span className="drawer-link-desc">Progreso de cursos, webinars y documentos descargados</span>
                  </div>
                </a>
              </li>
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
                    <span className="drawer-link-desc">YouTube @AL-HADIQAINVEST &amp; TikTok @alhadiqa.capital</span>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@alhadiqa.capital"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="drawer-link"
                >
                  <span className="drawer-link-icon">🎵</span>
                  <div className="drawer-link-content">
                    <span className="drawer-link-label">TikTok @alhadiqa.capital ↗</span>
                    <span className="drawer-link-desc">Alertas automáticas en web al transmitir o subir contenido</span>
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

              <button
                type="button"
                className="drawer-tool-card"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('al_hadiqa_open_feedback'));
                  }
                  closeMenu();
                }}
                title="Abrir Centro de Feedback, Sugerencias y Correcciones"
              >
                <span className="drawer-tool-icon">📨</span>
                <div>
                  <div className="drawer-tool-title">Feedback &amp; Corrección</div>
                  <div className="drawer-tool-desc">Buzón y Sugerencias</div>
                </div>
              </button>

              <button
                type="button"
                className="drawer-tool-card"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('al_hadiqa_open_legal', { detail: { tab: 'terms' } }));
                  }
                  closeMenu();
                }}
                title="Consultar Términos, Condiciones y Política de Privacidad"
              >
                <span className="drawer-tool-icon">⚖️</span>
                <div>
                  <div className="drawer-tool-title">Términos &amp; Privacidad</div>
                  <div className="drawer-tool-desc">Marco Legal &amp; RGPD</div>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Pie del Drawer con CTA de App Descargable y Registro en JustMarkets */}
        <div className="drawer-footer">
          <PWAInstallButton variant="drawer" onAfterTrigger={closeMenu} />

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

      {/* MODAL DE ACCESO Y AUTENTICACIÓN GOOGLE & RESPALDO */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#03140e] border border-amber-500/40 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦁</span>
                <div>
                  <h3 id="auth-modal-title" className="text-base font-bold text-white font-['Montserrat']">
                    Iniciar Sesión en <span className="text-amber-400">AL-HADIQA INVEST</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Portal Institucional &amp; Academia de Trading
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-300">
                  <span>⚠️</span>
                  <span>Aviso de Autenticación:</span>
                </div>
                <p className="text-[11px] leading-relaxed">{authError}</p>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              Inicia sesión con tu cuenta oficial para acceder a clases en directo, temarios, biblioteca de libros, chat y seguimiento del Roadmap.
            </p>

            {/* Botón Principal Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_14px_rgba(255,255,255,0.15)] cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.89c2.27-2.09 3.655-5.17 3.655-9.15z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3.05c-1.08.72-2.45 1.16-4.04 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.26 21.4 7.36 24 12 24z"/>
                <path fill="#FBBC05" d="M5.32 14.24c-.25-.72-.39-1.49-.39-2.24s.14-1.52.39-2.24V6.61H1.21C.44 8.14 0 9.87 0 12s.44 3.86 1.21 5.39l4.11-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.6 1.21 6.61l4.11 3.15c.94-2.85 3.57-5.01 6.68-5.01z"/>
              </svg>
              <span>Continuar Oficialmente con Google</span>
            </button>

            {/* Alternativas de Respaldo */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 block font-mono">
                Accesos de Respaldo y Verificación:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('admin')}
                  className="p-2.5 rounded-xl bg-[#062319] hover:bg-[#0b3325] border border-amber-500/40 text-amber-300 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer"
                >
                  <span className="text-base">👑</span>
                  <span>Administrador</span>
                  <span className="text-[9px] text-slate-400 font-normal">Sr. Smith (Control Total)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('active_student')}
                  className="p-2.5 rounded-xl bg-[#062319] hover:bg-[#0b3325] border border-emerald-500/40 text-emerald-300 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer"
                >
                  <span className="text-base">🎓</span>
                  <span>Alumno Activo</span>
                  <span className="text-[9px] text-slate-400 font-normal">Acceso Formativo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
