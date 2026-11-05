import React, { useState } from 'react';

interface NotFoundPageProps {
  onGoHome?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const quickLinks = [
    { title: 'Roadmap del Alumno', href: '/#roadmap', desc: 'Ruta de aprendizaje y fases formativas', icon: '🧭' },
    { title: 'Trading Institucional SMC', href: '/#trading', desc: 'Smart Money Concepts y bloques de órdenes', icon: '📊' },
    { title: 'Bróker Auditado (JustMarkets)', href: '/#broker', desc: '5 auditorías públicas y registro regulado', icon: '⚖️' },
    { title: 'Streaming Oficial en Vivo', href: '/#streaming', desc: 'Sesiones de mercado en directo', icon: '🔴' },
    { title: 'Biblioteca de Trading', href: '/#biblioteca', desc: 'Manuales, libros y PDFs autorizados', icon: '📚' },
    { title: 'AL-HADIQA Capital', href: '/#capital', desc: 'Educación financiera y mentalidad de inversor', icon: '🏛️' },
    { title: 'Ecosistema Digital', href: '/#ecosistema', desc: 'Holding empresarial y divisiones operativas', icon: '🦁' },
    { title: 'Preguntas Frecuentes (FAQ)', href: '/#faq', desc: 'Respuestas sobre registro y academia', icon: '❓' },
  ];

  const filteredLinks = quickLinks.filter(
    (link) =>
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNavigateHome = () => {
    if (onGoHome) {
      onGoHome();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#03140e] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Barra Superior Minimalista de Retorno */}
      <header className="px-6 py-4 border-b border-amber-500/20 bg-[#062319]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNavigateHome();
          }}
          className="flex items-center gap-2.5 text-amber-200 hover:text-white transition-colors group cursor-pointer"
        >
          <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(212,175,55,0.5)] group-hover:scale-110 transition-transform">
            🦁
          </span>
          <span className="font-extrabold tracking-wide font-['Montserrat'] text-sm sm:text-base">
            AL-HADIQA <span className="text-amber-400">INVEST</span>
          </span>
        </a>

        <button
          type="button"
          onClick={handleNavigateHome}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all shadow-[0_4px_14px_rgba(212,175,55,0.35)] cursor-pointer flex items-center gap-1.5"
        >
          <span>Ir al Inicio</span>
          <span aria-hidden="true">&rarr;</span>
        </button>
      </header>

      {/* Contenido Principal 404 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 text-center max-w-4xl mx-auto w-full">
        {/* Emblema Heráldico de Alerta */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#062319] via-[#093325] to-[#041a13] border-2 border-amber-500/50 flex items-center justify-center text-5xl sm:text-6xl shadow-[0_0_40px_rgba(212,175,55,0.25)] animate-pulse">
            🦁
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
            Error 404
          </span>
        </div>

        {/* Tipografía 404 Grande */}
        <h1 className="font-['Cinzel'] text-6xl sm:text-8xl font-black tracking-widest bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)] mb-2">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-bold text-amber-100 mb-3 tracking-wide">
          Ruta o Sección No Encontrada
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
          La dirección que intentas consultar no existe, ha sido reubicada dentro del holding o requiere acceso exclusivo para alumnos matriculados en la academia.
        </p>

        {/* Barra de Búsqueda Rápida de Secciones */}
        <div className="w-full max-w-md mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar sección (ej. Trading, Clases, Bróker, Biblioteca)..."
              className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-900/80 border border-amber-500/30 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
            />
            <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Botones de Acción Primarios */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-12">
          <button
            type="button"
            onClick={handleNavigateHome}
            className="px-6 py-3 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all shadow-[0_6px_20px_rgba(212,175,55,0.4)] cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>🦁 Volver al Inicio (Holding &amp; Academia)</span>
            <span aria-hidden="true">&rarr;</span>
          </button>

          <a
            href="/#roadmap"
            className="px-5 py-3 rounded-xl font-semibold text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-amber-400/50 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>🧭 Roadmap del Alumno</span>
          </a>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('al_hadiqa_open_feedback', { detail: { category: 'bug' } }));
              }
            }}
            className="px-4 py-3 rounded-xl font-medium text-xs text-sky-300 hover:text-sky-200 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📨 Reportar Enlace Roto</span>
          </button>
        </div>

        {/* Cuadrícula de Divisiones Principales del Ecosistema */}
        <div className="w-full text-left">
          <h3 className="text-xs uppercase tracking-widest font-bold text-amber-300/80 mb-4 text-center">
            Explora las Divisiones de AL-HADIQA INVEST
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                className="p-3.5 rounded-xl bg-[#062319]/60 hover:bg-[#093325] border border-amber-500/20 hover:border-amber-500/50 transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg group-hover:scale-110 transition-transform">
                      {link.icon}
                    </span>
                    <h4 className="font-bold text-xs text-amber-200 group-hover:text-white transition-colors">
                      {link.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                    {link.desc}
                  </p>
                </div>
                <div className="mt-2.5 text-[11px] text-amber-400/80 group-hover:text-amber-300 font-semibold flex items-center gap-1">
                  <span>Acceder</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>

      {/* Pie de Página 404 */}
      <footer className="px-6 py-4 border-t border-white/5 bg-[#020e0a] text-center text-xs text-slate-400">
        <p>&copy; 2026 AL-HADIQA INVEST · «Cultivando el crecimiento, nutriendo su capital» · Smith Business Solutions</p>
      </footer>
    </div>
  );
};
