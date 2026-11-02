export interface CommentItem {
  id?: string;
  name: string;
  stars: number;
  text: string;
  date: string;
}

export interface FeedbackData {
  ratings: number[];
  comments: CommentItem[];
}

export type QuadrantType = 'E' | 'A' | 'D' | 'I';

export interface QuadrantInfo {
  code: QuadrantType;
  title: string;
  badge: string;
  description: string;
  accent: string;
  advice: string;
}

export interface BookGuide {
  title: string;
  description: string;
  filename: string;
  colorVar: string;
  icon: string;
}

export type LibraryCategory =
  | 'Fundamentos'
  | 'Trading Institucional'
  | 'Scalping'
  | 'Múltiples Estrategias'
  | 'Análisis Técnico y Mercado';

export interface LibraryResourceItem {
  id: string;
  title: string;
  description: string;
  category: LibraryCategory;
  format: string;
  fileUrl: string;
  fileSize: string;
  pagesCount: number;
  author: string;
  downloadCount: number;
  isPublic?: boolean;
  assignedUserIds?: string[];
  chapters?: string[];
  createdAt?: unknown;
}

export interface DownloadLogItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  resourceId: string;
  resourceTitle: string;
  category: string;
  downloadedAt?: unknown;
}

