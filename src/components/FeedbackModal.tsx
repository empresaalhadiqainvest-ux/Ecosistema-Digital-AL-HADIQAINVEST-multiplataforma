import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FeedbackCategory,
  FeedbackModule,
  FeedbackPriority,
  CATEGORY_LABELS,
  MODULE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  FeedbackReportItem,
} from '../types/feedback';
import { submitFeedbackReport, getLocalFeedbackHistory } from '../services/feedbackService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: FeedbackCategory;
  defaultModule?: FeedbackModule;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'sugerencia',
  defaultModule = 'calculador_smc',
}) => {
  const { currentUser, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // Form Fields
  const [category, setCategory] = useState<FeedbackCategory>(defaultCategory);
  const [module, setModule] = useState<FeedbackModule>(defaultModule);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [priority, setPriority] = useState<FeedbackPriority>('media');
  const [rating, setRating] = useState<number>(5);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessId, setSubmitSuccessId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localHistory, setLocalHistory] = useState<FeedbackReportItem[]>([]);

  // Pre-fill user data from auth context
  useEffect(() => {
    if (currentUser) {
      setUserName(profile?.displayName || currentUser.displayName || '');
      setUserEmail(currentUser.email || '');
    }
  }, [currentUser, profile]);

  // Load history when tab is opened
  useEffect(() => {
    if (isOpen) {
      setLocalHistory(getLocalFeedbackHistory());
    }
  }, [isOpen, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Por favor, ingresa un título o resumen para tu reporte.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Por favor, detalla tu sugerencia o la corrección que deseas aportar.');
      return;
    }
    if (!userName.trim()) {
      setErrorMessage('Por favor, indica tu nombre o seudónimo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketId = await submitFeedbackReport({
        category,
        module,
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: category === 'bug' ? stepsToReproduce.trim() : undefined,
        priority,
        rating: category === 'calificacion' ? rating : undefined,
        userId: currentUser?.uid,
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        userRole: profile?.role || 'visitante',
      });

      setSubmitSuccessId(ticketId);
      // Reset form fields
      setTitle('');
      setDescription('');
      setStepsToReproduce('');
      setLocalHistory(getLocalFeedbackHistory());
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setErrorMessage(
        'Ocurrió un inconveniente al enviar tu aporte. Se guardó una copia en tu sesión local y nuestro equipo la revisará.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-[#03140e] border border-amber-500/40 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-slate-100">
        {/* CABECERA */}
        <div className="px-5 py-4 border-b border-amber-500/20 bg-gradient-to-r from-[#062319] via-[#093325] to-[#062319] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shadow-[0_0_12px_rgba(212,175,55,0.25)]">
              📨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="feedback-modal-title" className="font-bold text-base sm:text-lg text-amber-200 tracking-wide">
                  Centro de Feedback, Sugerencias y Correcciones
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Integrado
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Tu opinión técnica perfecciona el holding AL-HADIQA INVEST. Revisión directa por el equipo del Sr. Smith.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-lg"
            aria-label="Cerrar modal de feedback"
          >
            ✕
          </button>
        </div>

        {/* SELECTOR DE PESTAÑAS (NUEVO REPORTE / MIS TICKETS) */}
        <div className="px-5 py-2.5 border-b border-white/5 bg-[#041a13] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('submit');
                setSubmitSuccessId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'submit'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_2px_8px_rgba(212,175,55,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>✍️ Enviar Nuevo Aporte</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_2px_8px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📋 Mis Tickets Enviados ({localHistory.length})</span>
            </button>
          </div>
        </div>

        {/* CONTENIDO SCROLL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === 'submit' ? (
            submitSuccessId ? (
              <div className="p-6 text-center space-y-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-200">
                    ¡Aporte Registrado Exitosamente!
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                    Gracias por contribuir a la excelencia de AL-HADIQA INVEST. Tu reporte ha sido recibido por el equipo técnico y se le ha asignado el ticket institucional:
                  </p>
                  <div className="mt-3 inline-block px-3 py-1.5 bg-black/50 border border-emerald-500/50 rounded-lg text-xs font-mono text-emerald-300">
                    ID: {submitSuccessId}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSubmitSuccessId(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#03140e] bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    Enviar otro reporte
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Ver mis tickets
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 1. Categoría de Feedback */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    1. ¿Qué tipo de aporte deseas realizar?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((catKey) => {
                      const item = CATEGORY_LABELS[catKey];
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => setCategory(catKey)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                            category === catKey
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-base">{item.icon}</span>
                          <span className="font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Si es calificación, mostrar selector de estrellas */}
                {category === 'calificacion' && (
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-500/30 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-amber-200 block">
                        Calificación Global de la Plataforma
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ¿Cómo calificarías tu experiencia educativa y tecnológica?
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-2xl transition-transform hover:scale-125 cursor-pointer ${
                            star <= rating ? 'text-amber-400' : 'text-slate-700'
                          }`}
                          aria-label={`${star} estrellas`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Módulo Afectado */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    2. Módulo o Sección de la Plataforma
                  </label>
                  <select
                    value={module}
                    onChange={(e) => setModule(e.target.value as FeedbackModule)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                  >
                    {(Object.keys(MODULE_LABELS) as FeedbackModule[]).map((modKey) => (
                      <option key={modKey} value={modKey}>
                        {MODULE_LABELS[modKey]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Título / Resumen */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    3. Título o Resumen Corto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Corrección en cálculo de pips de Oro / Sugerencia de nuevo par Forex"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 4. Descripción detallada */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    4. Descripción Detallada de la Observación o Corrección *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe con claridad qué observaste, cuál es la corrección matemática o conceptual recomendada, o cómo enriquecería la plataforma..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-medium text-white focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                  />
                </div>

                {/* 5. Pasos para reproducir (solo para bugs) */}
                {category === 'bug' && (
                  <div>
                    <label className="block text-xs font-bold text-red-300 mb-1">
                      Pasos para reproducir el error (Opcional pero recomendado)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="1. Ingresé al calculador SMC. 2. Coloqué SL en 2736. 3. Ocurrió..."
                      value={stepsToReproduce}
                      onChange={(e) => setStepsToReproduce(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-400 resize-none"
                    />
                  </div>
                )}

                {/* 6. Prioridad y Datos de Contacto */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nivel de Prioridad
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                    >
                      {(Object.keys(PRIORITY_LABELS) as FeedbackPriority[]).map((pKey) => (
                        <option key={pKey} value={pKey}>
                          {PRIORITY_LABELS[pKey].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Tu Nombre / Seudónimo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Tu nombre"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Correo Electrónico (Para respuesta)
                    </label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* BOTÓN DE ENVÍO */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#03140e] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_4px_14px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Enviando reporte...' : '🚀 Enviar Feedback / Corrección'}</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            /* PESTAÑA HISTORIAL DE TICKETS */
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Historial de observaciones y correcciones registradas desde este dispositivo:
              </div>

              {localHistory.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
                  <span className="text-3xl block">📭</span>
                  <div className="text-sm font-semibold text-slate-300">
                    Aún no has registrado tickets de feedback
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Si identificas algún detalle a corregir o tienes ideas para enriquecer las herramientas del holding, envíanos tu aporte.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {localHistory.map((item) => {
                    const cat = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.sugerencia;
                    const st = STATUS_LABELS[item.status] || STATUS_LABELS.pendiente;
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-1.5 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{cat.icon}</span>
                            <span className="font-bold text-slate-200">{item.title}</span>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ color: st.color, backgroundColor: `${st.color}15`, border: `1px solid ${st.color}40` }}
                          >
                            {st.label}
                          </span>
                        </div>

                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-1 border-t border-white/5">
                          <span>Módulo: <strong>{MODULE_LABELS[item.module] || item.module}</strong></span>
                          <span>Ticket ID: <code className="text-amber-300">{item.id}</code></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
