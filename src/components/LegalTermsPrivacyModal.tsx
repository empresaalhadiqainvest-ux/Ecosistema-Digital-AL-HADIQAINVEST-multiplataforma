import React, { useState } from 'react';

export type LegalTab = 'terms' | 'privacy' | 'security';

interface LegalTermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalTermsPrivacyModal: React.FC<LegalTermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#03140e] border border-amber-500/40 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-slate-100">
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 border-b border-amber-500/20 bg-gradient-to-r from-[#062319] via-[#093325] to-[#062319] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shadow-[0_0_12px_rgba(212,175,55,0.25)]">
              ⚖️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="legal-modal-title" className="font-bold text-base sm:text-lg text-amber-200 tracking-wide">
                  Marco Legal, Términos &amp; Privacidad
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Oficial 2026
                </span>
              </div>
              <p className="text-xs text-slate-300">
                AL-HADIQA INVEST &amp; Smith Business Solutions · Transparencia, Seguridad y Cumplimiento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-lg"
            aria-label="Cerrar modal legal"
          >
            ✕
          </button>
        </div>

        {/* Selector de Pestañas Legales */}
        <div className="px-5 py-2.5 border-b border-white/5 bg-[#041a13] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'terms'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_2px_8px_rgba(212,175,55,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📜 Términos y Condiciones</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'privacy'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_2px_8px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛡️ Política de Privacidad &amp; RGPD</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-blue-500 text-slate-950 shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🔒 Protección de APIs &amp; Secretos</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            Última revisión: Noviembre 2026
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
          {/* PESTAÑA 1: TÉRMINOS Y CONDICIONES DE USO */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              {/* Aviso Destacado de Riesgo Financiero */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/50 text-amber-200 text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 uppercase tracking-wider">
                  <span>⚠️</span>
                  <span>Descargo de Responsabilidad y Advertencia de Riesgo (Risk Warning)</span>
                </div>
                <p className="leading-relaxed">
                  El comercio en los mercados financieros globales (Forex, Criptoactivos, Materias Primas e Índices Bursátiles) mediante Contratos por Diferencia (CFDs) u operaciones apalancadas conlleva un <strong>alto nivel de riesgo de capital</strong> y puede no ser adecuado para todos los inversores. Existe la posibilidad real de sufrir pérdidas parciales o totales de los fondos depositados.
                </p>
                <p className="leading-relaxed font-medium">
                  <strong>AL-HADIQA INVEST</strong> es un ecosistema de educación financiera, investigación técnica institucional (Smart Money Concepts) y desarrollo de simuladores analíticos. <em>Ningún contenido, clase en vivo, transmisión, mentoría o cálculo emitido en esta plataforma constituye asesoramiento financiero personalizado ni captación o gestión de fondos ajenos.</em>
                </p>
              </div>

              {/* 1. Identificación del Titular */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
                  <span>1.</span>
                  <span>Titularidad y Naturaleza del Ecosistema</span>
                </h3>
                <p>
                  Esta plataforma digital es operada bajo la dirección del holding <strong>AL-HADIQA INVEST</strong> y la empresa de desarrollo tecnológico <strong>Smith Business Solutions</strong>, fundada y presidida por <strong>Carlos Smith Zambrano González (Sr. Smith)</strong>. Correo oficial de contacto institucional: <code className="text-amber-300">empresaalhadiqainvest@gmail.com</code>.
                </p>
                <p>
                  El lema institucional «<em>Cultivando el crecimiento, nutriendo su capital</em>» orienta la filosofía de enseñanza hacia la gestión prudente, la paciencia institucional y la asimetría positiva (ratios 1:2 y 1:3).
                </p>
              </section>

              {/* 2. Propiedad Intelectual */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
                  <span>2.</span>
                  <span>Propiedad Intelectual y Derechos de Autor</span>
                </h3>
                <p>
                  Todos los contenidos de la plataforma —incluyendo manuales, libros de la biblioteca institucional, algoritmos del Calculador y Validador SMC, códigos fuente, interfaces gráficas, logotipos y material audiovisual— son propiedad exclusiva de <strong>Smith Business Solutions</strong> &amp; <strong>AL-HADIQA INVEST</strong>.
                </p>
                <p>
                  Queda estrictamente prohibida la reproducción, duplicación, reventa, explotación comercial no autorizada o distribución no autorizada de los recursos educativos. Las descargas facilitadas en la biblioteca son para uso estrictamente formativo y personal del alumno autenticado.
                </p>
              </section>

              {/* 3. Cuentas de Alumnos y Permisos */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
                  <span>3.</span>
                  <span>Cuentas de Alumnos, Roles y Enlaces Firmados</span>
                </h3>
                <p>
                  El acceso a las funciones avanzadas (Portal del Alumno, salas de chat comunitario, clases en vivo y biblioteca) requiere autenticación federada segura mediante Google OAuth 2.0. El usuario se compromete a mantener la confidencialidad de sus dispositivos de acceso.
                </p>
                <p>
                  Los enlaces de descarga de libros y guías generados en la plataforma utilizan <strong>tokens criptográficos firmados con HMAC-SHA256</strong> con una validez máxima de 15 minutos. Estos enlaces son personales e intransferibles; cualquier intento de redistribución masiva podrá conllevar la suspensión del perfil en el ecosistema.
                </p>
              </section>

              {/* 4. Relación con Brókers Auditados */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
                  <span>4.</span>
                  <span>Relación con JustMarkets y Brókers Regulados</span>
                </h3>
                <p>
                  AL-HADIQA INVEST mantiene acuerdos de asociación e información con brókers internacionales auditados como <strong>JustMarkets</strong> (regulado por FSA, CySEC y FSC). Las aperturas de cuentas de trading real se realizan directamente en los servidores de la entidad regulada. AL-HADIQA INVEST no almacena claves de trading privadas de MetaTrader ni custodia depósitos bancarios de los usuarios.
                </p>
              </section>

              {/* 5. Normas de Convivencia y Moderación */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
                  <span>5.</span>
                  <span>Normas del Chat Comunitario y Moderación</span>
                </h3>
                <p>
                  Los canales comunitarios están concebidos para el enriquecimiento mutuo, debate técnico y análisis colaborativo de mercado. Está rotundamente prohibido:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                  <li>Promocionar esquemas multinivel, piramidales o captación de capital.</li>
                  <li>Realizar spam, enviar enlaces no verificados o publicidad no autorizada.</li>
                  <li>Utilizar lenguaje discriminatorio, difamatorio o denigrante hacia otros alumnos o el cuerpo directivo.</li>
                </ul>
                <p>
                  El equipo de administración se reserva el derecho de silenciar, advertir o suspender a cualquier participante que vulnere estas pautas de convivencia.
                </p>
              </section>
            </div>
          )}

          {/* PESTAÑA 2: POLÍTICA DE PRIVACIDAD & RGPD */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              {/* Resumen de Principios de Privacidad */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-300 uppercase tracking-wider">
                  <span>🛡️</span>
                  <span>Compromiso de Privacidad y No Comercialización de Datos</span>
                </div>
                <p>
                  En <strong>AL-HADIQA INVEST</strong> aplicamos el principio de minimización de datos: recopilamos únicamente la información técnica y de perfil indispensable para operar la plataforma educativa. <strong>Nunca comercializamos, vendemos ni transferimos sus datos personales a intermediarios publicitarios externos.</strong>
                </p>
              </div>

              {/* 1. Responsable del Tratamiento */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                  <span>1.</span>
                  <span>Responsable del Tratamiento de Datos</span>
                </h3>
                <p>
                  El responsable legal del tratamiento de los datos es el holding <strong>AL-HADIQA INVEST</strong> con el soporte tecnológico de <strong>Smith Business Solutions</strong>.
                </p>
                <p>
                  Canal directo para el ejercicio de derechos de privacidad: <code className="text-emerald-300">empresaalhadiqainvest@gmail.com</code>.
                </p>
              </section>

              {/* 2. Datos que Recopilamos */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                  <span>2.</span>
                  <span>Datos Personales Recopilados</span>
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-slate-200 block">A. Datos de Identificación Federada (Google OAuth)</strong>
                    <span className="text-slate-400">
                      Nombre completo o de visualización, correo electrónico y fotografía de perfil pública proporcionada por su cuenta de Google. No almacenamos contraseñas locales (Arquitectura Zero Local Passwords).
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-slate-200 block">B. Registro Formativo y Académico</strong>
                    <span className="text-slate-400">
                      Progreso de lecciones en Al-Hadiqa Capital, registro de libros descargados, historial de asistencias a transmisiones oficiales y aportes enviados a través del buzón de feedback.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <strong className="text-slate-200 block">C. Datos de Sesión Técnica y Seguridad</strong>
                    <span className="text-slate-400">
                      Dirección IP anonimizada, huella técnica del navegador para mitigación de ataques automatizados (OWASP bot protection) y marcas temporales de conexión.
                    </span>
                  </div>
                </div>
              </section>

              {/* 3. Finalidad del Tratamiento */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                  <span>3.</span>
                  <span>Finalidad del Tratamiento</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                  <li>Permitir el acceso exclusivo al Portal del Alumno y Panel de Administración.</li>
                  <li>Facilitar la emisión de enlaces firmados criptográficamente para descarga segura de libros.</li>
                  <li>Enviar notificaciones y avisos de inicio de clases en vivo o transmisiones de streaming.</li>
                  <li>Auditar y resolver los tickets de sugerencias, incidencias y calificaciones técnicas.</li>
                  <li>Garantizar la estabilidad, integridad y protección contra fraudes en la infraestructura tecnológica.</li>
                </ul>
              </section>

              {/* 4. Cookies y Almacenamiento Local */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                  <span>4.</span>
                  <span>Uso de Cookies y Almacenamiento Local (Local Storage)</span>
                </h3>
                <p>
                  Nuestra plataforma emplea cookies esenciales para mantener su sesión activa de forma segura. Asimismo, utilizamos el almacenamiento local de su navegador (<code>localStorage</code>) para preservar:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                  <li>Preferencias de visualización y tema de la plataforma.</li>
                  <li>Parámetros calculados en el Calculador y Validador SMC (lotajes, balances, pares favoritos).</li>
                  <li>Bitácora personal de setups analizados por el alumno.</li>
                  <li>Estado de aceptación de cookies para evitar avisos redundantes.</li>
                </ul>
                <p>
                  Puede revocar o reconfigurar estas preferencias en cualquier instante mediante el enlace permanente «<em>🍪 Aviso y Configuración de Cookies</em>» situado en el pie de página.
                </p>
              </section>

              {/* 5. Derechos del Usuario (RGPD / ARCO) */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                  <span>5.</span>
                  <span>Derechos del Usuario (Acceso, Rectificación y Supresión)</span>
                </h3>
                <p>
                  Cualquier alumno o usuario tiene derecho en todo momento a solicitar:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                  <li><strong>Acceso:</strong> Conocer con exactitud qué datos personales obran en nuestros registros de Firebase Firestore.</li>
                  <li><strong>Rectificación:</strong> Actualizar o corregir información inexacta de su perfil.</li>
                  <li><strong>Supresión («Derecho al Olvido»):</strong> Solicitar la eliminación total de su cuenta y registros vinculados.</li>
                  <li><strong>Limitación u Oposición:</strong> Restringir el tratamiento de sus datos para fines específicos.</li>
                </ul>
                <p>
                  Para ejercer cualquiera de estos derechos, basta enviar un correo electrónico con su solicitud a <code className="text-emerald-300">empresaalhadiqainvest@gmail.com</code> indicando el correo asociado a su cuenta.
                </p>
              </section>
            </div>
          )}

          {/* PESTAÑA 3: PROTECCIÓN DE APIS & AUDITORÍA DE SECRETOS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/50 text-blue-200 text-xs sm:text-sm space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-300 uppercase tracking-wider">
                  <span>🔒</span>
                  <span>Informe de Auditoría y Protección de Secretos</span>
                </div>
                <p>
                  La arquitectura de <strong>AL-HADIQA INVEST</strong> se rige bajo principios de <strong>Seguridad por Diseño (Secure by Design)</strong> y políticas <strong>Zero-Trust</strong>. A continuación se detalla la verificación técnica de secretos y protección de credenciales en el repositorio.
                </p>
              </div>

              {/* Auditoría de Secretos */}
              <section className="space-y-3">
                <h3 className="text-base font-bold text-blue-300 flex items-center gap-2">
                  <span>1.</span>
                  <span>Verificación de No Exposición de Claves Privadas</span>
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div>
                      <strong className="text-emerald-300 block">Sin Claves Privadas en el Frontend</strong>
                      <span className="text-slate-400 leading-relaxed block mt-0.5">
                        El código cliente empaquetado para el navegador no contiene claves secretas, contraseñas de bases de datos ni tokens privados. Toda operación con servicios externos se gestiona exclusivamente a través de rutas proxy del servidor Node.js/Express.
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div>
                      <strong className="text-emerald-300 block">Protección de Cabeceras HTTP (OWASP)</strong>
                      <span className="text-slate-400 leading-relaxed block mt-0.5">
                        El servidor backend desactiva la cabecera <code>x-powered-by</code> para no divulgar el stack tecnológico y aplica cabeceras estrictas: <code>X-Content-Type-Options: nosniff</code>, <code>X-Frame-Options: SAMEORIGIN</code>, <code>Referrer-Policy: strict-origin-when-cross-origin</code> y protección contra XSS.
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div>
                      <strong className="text-emerald-300 block">Reglas de Seguridad Zero-Trust en Firebase Firestore</strong>
                      <span className="text-slate-400 leading-relaxed block mt-0.5">
                        La base de datos cuenta con reglas de seguridad granulares (<code>firestore.rules</code>) desplegadas en la nube. Las colecciones críticas de administración, auditoría y permisos exigen validación de administrador (<code>isBootstrappedAdmin()</code>), impidiendo cualquier lectura o escritura no autorizada incluso conociendo el ID del proyecto.
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">✓</span>
                    <div>
                      <strong className="text-emerald-300 block">Enlaces de Descarga con Firma HMAC y Tiempo de Expiración</strong>
                      <span className="text-slate-400 leading-relaxed block mt-0.5">
                        Los accesos a manuales y libros de la academia generan tokens firmados con caducidad forzosa de 15 minutos, impidiendo la manipulación de parámetros o descargas anónimas no registradas en la bitácora de auditoría inmutable.
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="px-5 py-3 border-t border-amber-500/20 bg-[#041a13] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            © 2026 AL-HADIQA INVEST · Smith Business Solutions. Todos los derechos reservados.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-[#03140e] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_4px_14px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
