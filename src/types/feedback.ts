export type FeedbackCategory =
  | 'sugerencia'
  | 'correccion'
  | 'bug'
  | 'calificacion'
  | 'seguridad';

export type FeedbackModule =
  | 'calculador_smc'
  | 'validador_smc'
  | 'mentor_trading'
  | 'clases_en_vivo'
  | 'streaming_hub'
  | 'biblioteca'
  | 'chat_comunitario'
  | 'portal_alumno'
  | 'diseno_general';

export type FeedbackPriority = 'baja' | 'media' | 'alta' | 'urgente';

export type FeedbackStatus = 'pendiente' | 'en_revision' | 'resuelto' | 'descartado';

export interface FeedbackReportItem {
  id: string;
  category: FeedbackCategory;
  module: FeedbackModule;
  title: string;
  description: string;
  stepsToReproduce?: string;
  rating?: number; // 1 - 5
  priority: FeedbackPriority;
  status: FeedbackStatus;
  userId?: string;
  userName: string;
  userEmail: string;
  userRole?: string;
  adminResponse?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const CATEGORY_LABELS: Record<FeedbackCategory, { label: string; icon: string; color: string }> = {
  sugerencia: { label: 'Sugerencia de Mejora', icon: '💡', color: '#fbbf24' },
  correccion: { label: 'Corrección de Contenido/SMC', icon: '📝', color: '#38bdf8' },
  bug: { label: 'Reporte de Error Técnico (Bug)', icon: '🐛', color: '#f87171' },
  calificacion: { label: 'Calificación & Experiencia', icon: '⭐', color: '#facc15' },
  seguridad: { label: 'Aviso de Seguridad / Privacidad', icon: '🛡️', color: '#10b981' },
};

export const MODULE_LABELS: Record<FeedbackModule, string> = {
  calculador_smc: '🧮 Calculador & Validador SMC',
  validador_smc: '🔍 Validador de Confluencias Algorítmicas',
  mentor_trading: '🦁 Mentor de Trading (Código Abierto)',
  clases_en_vivo: '🎓 Clases en Vivo & Masterclass',
  streaming_hub: '🔴 Transmisión Streaming Oficial',
  biblioteca: '📚 Biblioteca & Descargas de Libros',
  chat_comunitario: '💬 Chat Comunitario en Vivo',
  portal_alumno: '🏛️ Portal del Alumno / Al-Hadiqa Capital',
  diseno_general: '🌐 Diseño General / Responsividad',
};

export const PRIORITY_LABELS: Record<FeedbackPriority, { label: string; color: string; badgeClass: string }> = {
  baja: { label: 'Baja', color: '#94a3b8', badgeClass: 'bg-slate-800 text-slate-300' },
  media: { label: 'Media', color: '#38bdf8', badgeClass: 'bg-blue-900/60 text-blue-300' },
  alta: { label: 'Alta', color: '#f59e0b', badgeClass: 'bg-amber-900/60 text-amber-300' },
  urgente: { label: 'Urgente', color: '#ef4444', badgeClass: 'bg-red-900/60 text-red-300' },
};

export const STATUS_LABELS: Record<FeedbackStatus, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente de Revisión', color: '#f59e0b' },
  en_revision: { label: 'En Evaluación Técnica', color: '#38bdf8' },
  resuelto: { label: 'Resuelto / Aplicado', color: '#10b981' },
  descartado: { label: 'Cerrado', color: '#64748b' },
};
