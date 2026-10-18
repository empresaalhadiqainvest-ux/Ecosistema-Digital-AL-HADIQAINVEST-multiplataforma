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
