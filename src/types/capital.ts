export type CapitalPillar = 'educacion_financiera' | 'desarrollo_personal' | 'psicotrading_negocios';

export type CapitalLessonType = 'clase' | 'lectura' | 'resumen';

export interface CapitalLessonItem {
  id: string;
  moduleId: string;
  title: string;
  type: CapitalLessonType;
  durationMinutes: number;
  instructorOrAuthor: string;
  summary: string;
  keyTakeaways: string[];
  readingContentMarkdown?: string;
  videoOrAudioUrl?: string;
  downloadableDocTitle?: string;
  downloadableDocSize?: string;
  badge?: string;
}

export interface CapitalExecutiveSummary {
  title: string;
  filename: string;
  size: string;
  pages: number;
  coreThesis: string;
  actionChecklist: string[];
  principles: { title: string; explanation: string }[];
}

export interface CapitalModule {
  id: string;
  pillar: CapitalPillar;
  pillarLabel: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  colorVar: string;
  icon: string;
  lessonsCount: number;
  estimatedHours: string;
  lessons: CapitalLessonItem[];
  executiveSummary: CapitalExecutiveSummary;
}

export interface UserCapitalProgress {
  userId: string;
  completedLessonIds: string[];
  completedModuleIds: string[];
  lastActiveLessonId?: string;
  notes?: Record<string, string>;
  updatedAt?: unknown;
}
