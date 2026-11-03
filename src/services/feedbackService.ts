import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  FeedbackReportItem,
  FeedbackStatus,
  FeedbackCategory,
  FeedbackModule,
  FeedbackPriority,
} from '../types/feedback';

const FEEDBACK_COLLECTION = 'feedback_reports';
const LOCAL_FEEDBACK_KEY = 'al_hadiqa_user_feedback_history';

export interface SubmitFeedbackPayload {
  category: FeedbackCategory;
  module: FeedbackModule;
  title: string;
  description: string;
  stepsToReproduce?: string;
  rating?: number;
  priority: FeedbackPriority;
  userId?: string;
  userName: string;
  userEmail: string;
  userRole?: string;
}

export async function submitFeedbackReport(payload: SubmitFeedbackPayload): Promise<string> {
  const docData = {
    ...payload,
    status: 'pendiente' as FeedbackStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), docData);

  // Almacenar copia local para referencia del usuario en caso de estar offline o sin sesión
  try {
    const existing = getLocalFeedbackHistory();
    const newLocalItem: FeedbackReportItem = {
      ...payload,
      id: docRef.id,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify([newLocalItem, ...existing.slice(0, 19)]));
  } catch (e) {
    console.warn('No se pudo guardar la copia local del feedback:', e);
  }

  return docRef.id;
}

export function subscribeFeedbackReports(
  callback: (reports: FeedbackReportItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, FEEDBACK_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reports: FeedbackReportItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          category: data.category || 'sugerencia',
          module: data.module || 'diseno_general',
          title: data.title || 'Sin título',
          description: data.description || '',
          stepsToReproduce: data.stepsToReproduce,
          rating: typeof data.rating === 'number' ? data.rating : undefined,
          priority: data.priority || 'media',
          status: data.status || 'pendiente',
          userId: data.userId,
          userName: data.userName || 'Usuario anónimo',
          userEmail: data.userEmail || '',
          userRole: data.userRole || 'visitante',
          adminResponse: data.adminResponse,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
      callback(reports);
    },
    (err) => {
      console.error('Error al suscribirse a los reportes de feedback:', err);
      if (onError) onError(err);
    }
  );
}

export async function updateFeedbackStatus(
  reportId: string,
  status: FeedbackStatus,
  adminResponse?: string
): Promise<void> {
  const reportRef = doc(db, FEEDBACK_COLLECTION, reportId);
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (adminResponse !== undefined) {
    updateData.adminResponse = adminResponse;
  }
  await updateDoc(reportRef, updateData);
}

export async function deleteFeedbackReport(reportId: string): Promise<void> {
  const reportRef = doc(db, FEEDBACK_COLLECTION, reportId);
  await deleteDoc(reportRef);
}

export function getLocalFeedbackHistory(): FeedbackReportItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
