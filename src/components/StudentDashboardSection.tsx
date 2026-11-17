import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Lock,
  Radio,
  Search,
  Bell,
  BellRing,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  deliverDailyPersonalDevNotification,
  getDailyPersonalDevStatus,
  requestPermissionAndDeliverDailyDev,
  setDailyPersonalDevEnabled,
} from '../services/dailyPersonalDevService';
import { CAPITAL_MODULES } from '../data/capitalCurriculum';
import { OFFICIAL_SEED_BOOKS } from '../data/seedLibrary';
import { MILESTONES } from './Roadmap';
import { LiveClassItem, ClassStatus } from './LiveClassesSection';
import { DownloadLogItem, LibraryResourceItem } from '../types';
import { executeResourceDownload, executeCapitalDownload } from '../utils/libraryDownloader';
import { TIKTOK_CHANNEL_URL, TIKTOK_LIVE_URL } from './LiveStreamMonitorBanner';

type DashboardTab = 'overview' | 'courses' | 'webinars' | 'documents';

interface LiveBroadcastSummary {
  id: string;
  title?: string;
  description?: string;
  isLive?: boolean;
  status?: string;
  youtubeUrl?: string;
  channelUrl?: string;
  updatedAt?: string;
}

const FALLBACK_WEBINARS: LiveClassItem[] = [
  {
    id: 'fallback-webinar-1',
    title: 'Masterclass SMC: Detección de Order Blocks Institucionales y FVG',
    description:
      'Análisis en vivo de la apertura de Nueva York, lectura de flujo de órdenes e identificación de zonas de descuento para entradas con ratio 1:3+.',
    instructor: 'Sr.smith (Carlos Smith Zambrano)',
    category: 'SMC',
    scheduledAt: '2026-10-26 14:00 UTC',
    streamUrl: 'https://www.youtube.com/@AL-HADIQAINVEST',
    status: 'en_vivo',
    createdBy: 'system_admin',
  },
  {
    id: 'fallback-webinar-2',
    title: 'Estrategia de Liquidez Turtle Soup en XAU/USD (Oro)',
    description:
      'Cómo operar los barridos de máximos y mínimos asiáticos evitando las trampas minoristas de rompimiento en falso.',
    instructor: 'Sr.smith (Carlos Smith Zambrano)',
    category: 'Forex',
    scheduledAt: '2026-10-28 15:30 UTC',
    streamUrl: 'https://www.youtube.com/@AL-HADIQAINVEST',
    status: 'programada',
    createdBy: 'system_admin',
  },
  {
    id: 'fallback-webinar-3',
    title: 'Sesión AL-HADIQA Capital: Mentalidad de Portafolio y Control de Riesgo',
    description:
      'Seminario práctico de gestión monetaria, presupuesto operativo y transición gradual hacia activos generadores de flujo.',
    instructor: 'Sr.smith (Carlos Smith Zambrano)',
    category: 'Capital',
    scheduledAt: '2026-11-02 18:00 UTC',
    streamUrl: TIKTOK_CHANNEL_URL,
    status: 'programada',
    createdBy: 'system_admin',
  },
];

function formatFirestoreDate(val: unknown): string {
  if (!val) return 'Fecha registrada';
  try {
    if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
      return (val as { toDate: () => Date }).toDate().toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return String(val);
    }
  } catch {
    // ignore formatting errors
  }
  return 'Fecha registrada';
}

function getTimestampMillis(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const t = new Date(val).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

function normalizeClassStatus(rawStatus: unknown): ClassStatus {
  const s = String(rawStatus || 'programada');
  if (s === 'published') return 'programada';
  if (s === 'draft') return 'borrador';
  if (s === 'approved') return 'aprobada';
  if (s === 'pending_approval') return 'pendiente_aprobacion';
  return s as ClassStatus;
}

function detectStreamProviderLabel(url?: string): string {
  const lower = (url || '').toLowerCase();
  if (lower.includes('tiktok.com')) return 'TikTok Live';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube Live';
  if (lower.includes('twitch.tv')) return 'Twitch';
  if (lower.includes('webrtc')) return 'Estudio WebRTC';
  return 'Sala Oficial';
}

export const StudentDashboardSection: React.FC = () => {
  const { currentUser, profile, isAdmin, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>([]);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(CAPITAL_MODULES[0]?.id || null);

  const [classes, setClasses] = useState<LiveClassItem[]>(FALLBACK_WEBINARS);
  const [tiktokBroadcast, setTiktokBroadcast] = useState<LiveBroadcastSummary | null>(null);
  const [youtubeBroadcast, setYoutubeBroadcast] = useState<LiveBroadcastSummary | null>(null);
  const [webinarFilter, setWebinarFilter] = useState<'all' | 'live' | 'upcoming'>('all');
  const [reminderIds, setReminderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('al_hadiqa_webinar_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [libraryItems, setLibraryItems] = useState<LibraryResourceItem[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<(DownloadLogItem & { fileFormat?: string; fileSize?: string })[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [docSearch, setDocSearch] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ text: string; tone: 'success' | 'warning' | 'info' } | null>(null);
  const [dailyDevStatus, setDailyDevStatus] = useState(() => getDailyPersonalDevStatus());

  const isActiveStudent = Boolean(currentUser && (isAdmin || profile?.status === 'active'));
  const isPendingStudent = Boolean(currentUser && !isAdmin && profile?.status === 'pending');
  const canDownload = Boolean(isAdmin || profile?.permissions?.canDownload);

  const showFeedback = (text: string, tone: 'success' | 'warning' | 'info' = 'info') => {
    setFeedbackBanner({ text, tone });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 4200);
  };

  // 1. Load course progress (capital_progress/{uid} + localStorage + alhadiqa_roadmap_progress)
  useEffect(() => {
    let isMounted = true;

    const loadLocalFallback = () => {
      try {
        const savedCap = localStorage.getItem('al_hadiqa_capital_progress');
        if (savedCap && isMounted) {
          const parsed = JSON.parse(savedCap);
          if (Array.isArray(parsed.completedLessonIds)) {
            setCompletedLessonIds(parsed.completedLessonIds);
          }
        }
      } catch {
        // ignore parse errors
      }
      try {
        const savedRoad = localStorage.getItem('alhadiqa_roadmap_progress');
        if (savedRoad && isMounted) {
          const parsedRoad = JSON.parse(savedRoad);
          if (Array.isArray(parsedRoad)) {
            setCompletedMilestones(parsedRoad);
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    loadLocalFallback();

    if (!currentUser?.uid || !isActiveStudent) {
      return () => {
        isMounted = false;
      };
    }

    const loadFirestoreProgress = async () => {
      try {
        const snap = await getDoc(doc(db, 'capital_progress', currentUser.uid));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          if (Array.isArray(data.completedLessonIds)) {
            setCompletedLessonIds(data.completedLessonIds);
            localStorage.setItem(
              'al_hadiqa_capital_progress',
              JSON.stringify({ completedLessonIds: data.completedLessonIds, notes: data.notes || {} })
            );
          }
        }
      } catch {
        // Fallback to localStorage already loaded
      }
    };

    loadFirestoreProgress();

    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === 'al_hadiqa_capital_progress' || e.key === 'alhadiqa_roadmap_progress') {
        loadLocalFallback();
      }
    };
    window.addEventListener('storage', handleStorageSync);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [currentUser, isActiveStudent]);

  // 2. Listen to upcoming webinars (`classes` + `live_broadcasts`)
  useEffect(() => {
    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        if (snap.empty) {
          setClasses(FALLBACK_WEBINARS);
          return;
        }
        const parsed: LiveClassItem[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          const status = normalizeClassStatus(data.status);
          if (['en_vivo', 'programada', 'aprobada'].includes(status)) {
            parsed.push({
              id: docSnap.id,
              title: data.title || 'Sesión Formativa Al-Hadiqa',
              description: data.description || '',
              instructor: data.instructor || 'Sr.smith (Carlos Smith Zambrano)',
              category: data.category || 'General',
              scheduledAt: data.scheduledAt || 'Por confirmar',
              streamUrl: data.streamUrl || 'https://www.youtube.com/@AL-HADIQAINVEST',
              streamSource: data.streamSource,
              status,
              createdBy: data.createdBy || 'admin',
              approvedBy: data.approvedBy,
            });
          }
        });
        setClasses(parsed.length > 0 ? parsed : FALLBACK_WEBINARS);
      },
      () => {
        setClasses(FALLBACK_WEBINARS);
      }
    );

    const unsubCurrent = onSnapshot(
      doc(db, 'live_broadcasts', 'current'),
      (snap) => {
        if (snap.exists()) {
          setYoutubeBroadcast({ id: snap.id, ...(snap.data() as Omit<LiveBroadcastSummary, 'id'>) });
        }
      },
      () => {}
    );

    const unsubTikTok = onSnapshot(
      doc(db, 'live_broadcasts', 'tiktok_alhadiqa_capital'),
      (snap) => {
        if (snap.exists()) {
          setTiktokBroadcast({ id: snap.id, ...(snap.data() as Omit<LiveBroadcastSummary, 'id'>) });
        }
      },
      () => {}
    );

    return () => {
      unsubClasses();
      unsubCurrent();
      unsubTikTok();
    };
  }, []);

  // 3. Listen to Library catalog (`library_resources`)
  useEffect(() => {
    const unsubLib = onSnapshot(
      collection(db, 'library_resources'),
      (snap) => {
        if (snap.empty) {
          setLibraryItems(
            OFFICIAL_SEED_BOOKS.map((book, idx) => ({
              ...book,
              id: `seed-book-${idx + 1}`,
            }))
          );
          return;
        }
        const items: LibraryResourceItem[] = [];
        snap.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<LibraryResourceItem, 'id'>),
          });
        });
        setLibraryItems(items);
      },
      () => {
        setLibraryItems(
          OFFICIAL_SEED_BOOKS.map((book, idx) => ({
            ...book,
            id: `seed-book-${idx + 1}`,
          }))
        );
      }
    );

    return () => unsubLib();
  }, []);

  // 4. Listen to student's `download_logs` strictly obeying firestore.rules
  useEffect(() => {
    const firebaseUid = auth.currentUser?.uid;
    if (!currentUser?.uid || !firebaseUid || !isActiveStudent) {
      setDownloadLogs([]);
      setLogsLoading(false);
      return;
    }

    setLogsLoading(true);
    const logsQuery = isAdmin
      ? query(collection(db, 'download_logs'), orderBy('downloadedAt', 'desc'), limit(25))
      : query(collection(db, 'download_logs'), where('userId', '==', currentUser.uid));

    const unsubLogs = onSnapshot(
      logsQuery,
      (snap) => {
        const items: (DownloadLogItem & { fileFormat?: string; fileSize?: string })[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            userId: data.userId || currentUser.uid,
            userName: data.userName || '',
            userEmail: data.userEmail || '',
            resourceId: data.resourceId || '',
            resourceTitle: data.resourceTitle || 'Documento de Trading',
            category: data.category || 'Biblioteca',
            downloadedAt: data.downloadedAt,
            fileFormat: data.fileFormat || 'PDF',
            fileSize: data.fileSize || 'PDF',
          });
        });

        items.sort((a, b) => getTimestampMillis(b.downloadedAt) - getTimestampMillis(a.downloadedAt));
        setDownloadLogs(items);
        setLogsLoading(false);
      },
      () => {
        setDownloadLogs([]);
        setLogsLoading(false);
      }
    );

    return () => unsubLogs();
  }, [currentUser, isAdmin, isActiveStudent]);

  // Toggle Capital lesson completion
  const handleToggleLesson = async (lessonId: string) => {
    const exists = completedLessonIds.includes(lessonId);
    const updated = exists
      ? completedLessonIds.filter((id) => id !== lessonId)
      : [...completedLessonIds, lessonId];

    setCompletedLessonIds(updated);

    try {
      const existingRaw = localStorage.getItem('al_hadiqa_capital_progress');
      const existingParsed = existingRaw ? JSON.parse(existingRaw) : {};
      localStorage.setItem(
        'al_hadiqa_capital_progress',
        JSON.stringify({ ...existingParsed, completedLessonIds: updated })
      );
    } catch {
      localStorage.setItem('al_hadiqa_capital_progress', JSON.stringify({ completedLessonIds: updated }));
    }

    if (currentUser?.uid && isActiveStudent) {
      try {
        await setDoc(
          doc(db, 'capital_progress', currentUser.uid),
          {
            userId: currentUser.uid,
            completedLessonIds: updated,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // Saved locally if Firestore write is restricted
      }
    }

    showFeedback(
      exists ? 'Lección marcada como pendiente.' : 'Progreso guardado: lección completada.',
      'success'
    );
  };

  // Toggle Roadmap phase completion
  const handleToggleMilestone = (milestoneId: string) => {
    const exists = completedMilestones.includes(milestoneId);
    const updated = exists
      ? completedMilestones.filter((id) => id !== milestoneId)
      : [...completedMilestones, milestoneId];

    setCompletedMilestones(updated);
    localStorage.setItem('alhadiqa_roadmap_progress', JSON.stringify(updated));
    showFeedback(
      exists ? 'Fase del Roadmap marcada como pendiente.' : 'Fase del Roadmap completada.',
      'success'
    );
  };

  // Toggle webinar reminder
  const handleToggleReminder = async (webinar: LiveClassItem) => {
    const exists = reminderIds.includes(webinar.id);
    const updated = exists
      ? reminderIds.filter((id) => id !== webinar.id)
      : [...reminderIds, webinar.id];

    setReminderIds(updated);
    localStorage.setItem('al_hadiqa_webinar_reminders', JSON.stringify(updated));

    if (!exists && typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      try {
        await window.Notification.requestPermission();
      } catch {
        // ignore permission failure
      }
    }

    showFeedback(
      exists
        ? `Recordatorio desactivado para "${webinar.title}".`
        : `Recordatorio activado para "${webinar.title}" (${webinar.scheduledAt}).`,
      'info'
    );
  };

  // Re-download or quick-download a document
  const handleDownloadResource = async (resource: LibraryResourceItem) => {
    if (!currentUser) {
      showFeedback('Inicia sesión con tu cuenta para descargar documentos de trading.', 'warning');
      return;
    }
    if (!canDownload) {
      showFeedback('Tu permiso de descarga aún no está habilitado por el Administrador.', 'warning');
      return;
    }

    setDownloadingId(resource.id);
    try {
      await executeResourceDownload({
        resource,
        userId: currentUser.uid,
        userName: profile?.displayName || currentUser.displayName || 'Estudiante Al-Hadiqa',
        userEmail: currentUser.email || 'estudiante@alhadiqainvest.com',
      });
      showFeedback(`Descarga completada: ${resource.title}`, 'success');
    } catch {
      showFeedback('No se pudo completar la descarga en este momento.', 'warning');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRedownloadFromLog = async (log: DownloadLogItem) => {
    if (!currentUser) {
      showFeedback('Inicia sesión para volver a descargar este documento.', 'warning');
      return;
    }
    if (!canDownload) {
      showFeedback('Permiso de descarga deshabilitado. Solicita habilitación al Administrador.', 'warning');
      return;
    }

    if (log.resourceId.startsWith('capital_')) {
      const modId = log.resourceId.replace('capital_', '');
      const capMod = CAPITAL_MODULES.find((m) => m.id === modId);
      if (capMod) {
        setDownloadingId(log.id);
        try {
          await executeCapitalDownload({
            moduleId: capMod.id,
            moduleTitle: capMod.title,
            pillarLabel: capMod.pillarLabel,
            docTitle: capMod.executiveSummary.title,
            filename: capMod.executiveSummary.filename,
            coreThesis: capMod.executiveSummary.coreThesis,
            actionChecklist: capMod.executiveSummary.actionChecklist,
            principles: capMod.executiveSummary.principles,
            userId: currentUser.uid,
            userName: profile?.displayName || currentUser.displayName || 'Estudiante Al-Hadiqa',
            userEmail: currentUser.email || 'estudiante@alhadiqainvest.com',
          });
          showFeedback(`Documento descargado nuevamente: ${capMod.executiveSummary.title}`, 'success');
        } catch {
          showFeedback('Error al volver a generar la descarga.', 'warning');
        } finally {
          setDownloadingId(null);
        }
        return;
      }
    }

    const matchedLib =
      libraryItems.find((item) => item.id === log.resourceId) ||
      libraryItems.find((item) => item.title.toLowerCase() === log.resourceTitle.toLowerCase()) ||
      ({
        id: log.resourceId || `doc-${log.id}`,
        title: log.resourceTitle,
        description: 'Documento de estudio institucional de la Biblioteca Oficial AL-HADIQA INVEST.',
        category: 'Fundamentos',
        format: 'PDF',
        fileUrl: '#',
        fileSize: 'N/A',
        pagesCount: 95,
        author: 'Sr.smith (Carlos Smith Zambrano)',
        downloadCount: 1,
        isPublic: true,
      } as LibraryResourceItem);

    setDownloadingId(log.id);
    try {
      await executeResourceDownload({
        resource: matchedLib,
        userId: currentUser.uid,
        userName: profile?.displayName || currentUser.displayName || 'Estudiante Al-Hadiqa',
        userEmail: currentUser.email || 'estudiante@alhadiqainvest.com',
      });
      showFeedback(`Documento descargado nuevamente: ${matchedLib.title}`, 'success');
    } catch {
      showFeedback('No se pudo regenerar la descarga solicitada.', 'warning');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRequestDownloadAccess = async () => {
    if (!currentUser) {
      await signInWithGoogle();
      return;
    }
    try {
      await addDoc(collection(db, 'notifications'), {
        title: 'Solicitud de Acceso a Descargas de Biblioteca',
        message: `El estudiante ${profile?.displayName || currentUser.email} solicita habilitación de descargas desde el Dashboard de Estudiantes.`,
        targetRole: 'admin',
        type: 'urgent',
        createdAt: serverTimestamp(),
      });
      showFeedback('Solicitud enviada al Administrador para habilitar descargas.', 'success');
    } catch {
      showFeedback('Tu solicitud quedó anotada. Contacta con administración si persiste.', 'info');
    }
  };

  // Derived Course Metrics
  const totalCapitalLessons = useMemo(
    () => CAPITAL_MODULES.reduce((acc, mod) => acc + mod.lessons.length, 0),
    []
  );
  const completedCapitalCount = useMemo(
    () =>
      CAPITAL_MODULES.reduce(
        (acc, mod) => acc + mod.lessons.filter((l) => completedLessonIds.includes(l.id)).length,
        0
      ),
    [completedLessonIds]
  );
  const totalRoadmapCount = MILESTONES.length;
  const completedRoadmapCount = useMemo(
    () => MILESTONES.filter((m) => completedMilestones.includes(m.id)).length,
    [completedMilestones]
  );

  const totalCurriculumUnits = totalCapitalLessons + totalRoadmapCount;
  const completedCurriculumUnits = completedCapitalCount + completedRoadmapCount;
  const overallProgressPct = Math.min(
    100,
    Math.round((completedCurriculumUnits / (totalCurriculumUnits || 1)) * 100)
  );

  // Derived Webinars sorted (`en_vivo` first, then `programada`, then `aprobada`)
  const sortedWebinars = useMemo(() => {
    const rank = (status: ClassStatus) => {
      if (status === 'en_vivo') return 0;
      if (status === 'programada') return 1;
      return 2;
    };
    const filtered = classes.filter((c) => {
      if (webinarFilter === 'live') return c.status === 'en_vivo';
      if (webinarFilter === 'upcoming') return c.status === 'programada' || c.status === 'aprobada';
      return true;
    });
    return [...filtered].sort((a, b) => rank(a.status) - rank(b.status));
  }, [classes, webinarFilter]);

  const liveWebinarsCount = useMemo(
    () => classes.filter((c) => c.status === 'en_vivo').length + (tiktokBroadcast?.isLive ? 1 : 0),
    [classes, tiktokBroadcast]
  );

  // Available trading documents accessible to user
  const accessibleLibraryDocs = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    return libraryItems.filter((item) => {
      const hasAccess =
        isAdmin ||
        item.isPublic !== false ||
        (currentUser?.uid && item.assignedUserIds?.includes(currentUser.uid));
      if (!hasAccess) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q)
      );
    });
  }, [libraryItems, docSearch, isAdmin, currentUser]);

  const filteredLogs = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    if (!q) return downloadLogs;
    return downloadLogs.filter(
      (log) =>
        log.resourceTitle.toLowerCase().includes(q) ||
        log.category.toLowerCase().includes(q)
    );
  }, [downloadLogs, docSearch]);

  const studentDisplayName =
    profile?.displayName || currentUser?.displayName || 'Estudiante Invitado';

  const accountStatusLabel = !currentUser
    ? 'Vista previa · Inicia sesión para sincronizar'
    : isAdmin
      ? 'Administrador Maestro · Acceso total'
      : isActiveStudent
        ? 'Alumno activo · Sincronización en tiempo real'
        : 'Cuenta en revisión administrativa';

  return (
    <section
      id="dashboard-estudiantes"
      className="section section--alt border-t border-b border-amber-500/15"
      aria-labelledby="student-dashboard-heading"
    >
      <div className="wrap">
        {/* Top Bar Contract: Context on left, 1-2 crisp actions on right */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pb-6 border-b border-amber-500/20">
          <div className="space-y-2 max-w-2xl">
            <p className="eyebrow" style={{ marginBottom: 0 }}>
              Portal Académico · Centro del Estudiante
            </p>
            <h2
              id="student-dashboard-heading"
              className="h-section"
              style={{ marginTop: '0.25rem' }}
            >
              Dashboard de <span className="gradient-text">Estudiantes</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Supervisa tu avance en los cursos de trading y finanzas, consulta los próximos webinars en vivo y accede directamente a tus documentos de trading descargados.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs font-mono text-slate-300">
              <span className="text-amber-300 font-semibold">{studentDisplayName}</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className={isPendingStudent ? 'text-amber-300' : isActiveStudent ? 'text-emerald-400' : 'text-slate-400'}>
                {accountStatusLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!currentUser ? (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#03140e] font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Sincronizar con Google</span>
              </button>
            ) : (
              <a
                href="#capital"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200 font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                <span>Continuar Aprendiendo</span>
              </a>
            )}
            <a
              href="#biblioteca"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#062319] hover:bg-[#093325] border border-amber-500/30 text-amber-200 font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Ir a Biblioteca</span>
            </a>
          </div>
        </div>

        {/* Toast / inline feedback banner */}
        {feedbackBanner && (
          <div
            role="status"
            className={`mt-4 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 ${
              feedbackBanner.tone === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : feedbackBanner.tone === 'warning'
                  ? 'bg-amber-950/70 border-amber-500/40 text-amber-200'
                  : 'bg-sky-950/70 border-sky-500/40 text-sky-200'
            }`}
          >
            <span>{feedbackBanner.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-xs opacity-80 hover:opacity-100 px-1.5 py-0.5 cursor-pointer"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        )}

        {/* Daily Personal Development Strip (Brian Tracy & Kindred Mentors) */}
        <div className="mt-6 rounded-2xl border border-emerald-500/25 bg-[#041b13] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-mono">
              <span className="text-emerald-300 font-semibold inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Dosis Diaria de Desarrollo Personal
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-300">{dailyDevStatus.todayMessage.pillar}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{dailyDevStatus.todayMessage.mentor}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white font-['Montserrat']">
              {dailyDevStatus.todayMessage.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {dailyDevStatus.todayMessage.message}{' '}
              <span className="text-amber-200 font-medium">
                Reto de hoy: {dailyDevStatus.todayMessage.dailyAction}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                const res = await deliverDailyPersonalDevNotification({
                  force: true,
                  rotate: true,
                  showToast: true,
                });
                setDailyDevStatus(getDailyPersonalDevStatus());
                showFeedback(`Nueva reflexión cargada: ${res.message.title}`, 'info');
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#062319] hover:bg-[#093325] border border-amber-500/30 text-amber-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cambiar reflexión</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (dailyDevStatus.permission === 'granted' && dailyDevStatus.enabled) {
                  setDailyPersonalDevEnabled(false);
                  setDailyDevStatus(getDailyPersonalDevStatus());
                  showFeedback('Alertas diarias pausadas en este dispositivo.', 'info');
                } else {
                  const res = await requestPermissionAndDeliverDailyDev();
                  setDailyDevStatus(getDailyPersonalDevStatus());
                  showFeedback(
                    res.permission === 'granted'
                      ? 'Notificaciones diarias activadas y enviadas a tu dispositivo.'
                      : 'Dosis diaria activada en tu Centro de Notificaciones dentro de la App.',
                    'success'
                  );
                }
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                dailyDevStatus.permission === 'granted' && dailyDevStatus.enabled
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/25'
                  : 'bg-amber-400 hover:bg-amber-300 text-[#03140e]'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>
                {dailyDevStatus.permission === 'granted' && dailyDevStatus.enabled
                  ? 'Notificaciones Diarias Activas'
                  : 'Activar Notificación Diaria'}
              </span>
            </button>
          </div>
        </div>

        {/* Single-Elevation Hairline KPI Strip (Tabular Numerals, No Card Sandwiches) */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 border border-amber-500/20 rounded-2xl bg-[#041b13] divide-y lg:divide-y-0 lg:divide-x divide-amber-500/15 overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Progreso Global
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-amber-300 tabular-nums font-['Montserrat']">
                {overallProgressPct}%
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {completedCurriculumUnits}/{totalCurriculumUnits} unidades
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800/90 overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${overallProgressPct}%` }}
              />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5 border-l border-amber-500/15 lg:border-l-0">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Cursos Capital &amp; Roadmap
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-300 tabular-nums font-['Montserrat']">
                {completedCapitalCount}
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                de {totalCapitalLessons} lecciones · {completedRoadmapCount}/{totalRoadmapCount} fases
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {CAPITAL_MODULES.length} módulos formativos activos
            </span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Webinars Programados
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums font-['Montserrat']">
                {classes.length}
              </span>
              <span className="text-xs font-mono tabular-nums text-emerald-300">
                {liveWebinarsCount > 0 ? `${liveWebinarsCount} en vivo ahora` : 'Agenda actualizada'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              YouTube @AL-HADIQAINVEST &amp; TikTok
            </span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5 border-l border-amber-500/15 lg:border-l-0">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Documentos Descargados
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-sky-300 tabular-nums font-['Montserrat']">
                {downloadLogs.length}
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {accessibleLibraryDocs.length} disponibles
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {canDownload ? 'Descarga directa habilitada' : 'Historial sujeto a aprobación'}
            </span>
          </div>
        </div>

        {/* Segmented Tab Bar */}
        <div
          className="mt-6 flex flex-wrap items-center gap-2 border-b border-amber-500/15 pb-3"
          role="tablist"
          aria-label="Secciones del Dashboard de Estudiantes"
        >
          {(
            [
              { id: 'overview', label: 'Resumen Integral' },
              { id: 'courses', label: `Progreso de Cursos (${overallProgressPct}%)` },
              { id: 'webinars', label: `Próximos Webinars (${classes.length})` },
              { id: 'documents', label: `Documentos Descargados (${downloadLogs.length})` },
            ] as { id: DashboardTab; label: string }[]
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer tabular-nums ${
                  isActive
                    ? 'bg-amber-400 text-[#03140e]'
                    : 'bg-[#062319] text-slate-300 hover:text-white hover:bg-[#093325] border border-amber-500/20'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* MAIN VIEWPORT CONTENT */}
        <div className="mt-6 space-y-6">
          {/* PILLAR 1: PROGRESO DE CURSOS */}
          {(activeTab === 'overview' || activeTab === 'courses') && (
            <div className="rounded-2xl border border-amber-500/20 bg-[#041b13] overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-500/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-['Montserrat']">
                    <GraduationCap className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Progreso de Cursos &amp; Roadmap Institucional</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Marca lecciones completadas para sincronizar tu avance curricular en AL-HADIQA Capital y Trading SMC.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-300">
                  <span>
                    Capital: <strong className="text-amber-300">{completedCapitalCount}/{totalCapitalLessons}</strong>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>
                    Roadmap: <strong className="text-emerald-300">{completedRoadmapCount}/{totalRoadmapCount}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-amber-500/15">
                {/* Left 7 cols: Capital Curriculum Modules */}
                <div className="lg:col-span-7 divide-y divide-amber-500/10">
                  {CAPITAL_MODULES.map((mod) => {
                    const doneInMod = mod.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
                    const modPct = Math.round((doneInMod / (mod.lessons.length || 1)) * 100);
                    const isExpanded = expandedModuleId === mod.id || activeTab === 'courses';

                    return (
                      <div key={mod.id} className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedModuleId((prev) => (prev === mod.id ? null : mod.id))
                            }
                            className="text-left flex-1 cursor-pointer group"
                          >
                            <div className="text-[11px] font-mono text-amber-300/90 uppercase tracking-wider">
                              {mod.pillarLabel} · {mod.estimatedHours}
                            </div>
                            <div className="text-sm sm:text-base font-bold text-white group-hover:text-amber-200 transition-colors mt-0.5 flex items-center gap-2">
                              <span>{mod.title}</span>
                              {activeTab === 'overview' &&
                                (isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                ))}
                            </div>
                          </button>
                          <div className="text-right shrink-0 tabular-nums font-mono">
                            <span className="text-sm font-bold text-emerald-300">{modPct}%</span>
                            <div className="text-[11px] text-slate-400">
                              {doneInMod}/{mod.lessons.length}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-800/90 overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 transition-all duration-300"
                            style={{ width: `${modPct}%` }}
                          />
                        </div>

                        {isExpanded && (
                          <ul className="mt-3 divide-y divide-slate-800/70">
                            {mod.lessons.map((lesson) => {
                              const isDone = completedLessonIds.includes(lesson.id);
                              return (
                                <li
                                  key={lesson.id}
                                  className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLesson(lesson.id)}
                                    className="flex items-start gap-2.5 text-left flex-1 min-h-[36px] py-1 cursor-pointer group"
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-slate-500 group-hover:text-amber-300 shrink-0 mt-0.5" />
                                    )}
                                    <span
                                      className={
                                        isDone
                                          ? 'text-slate-400 line-through'
                                          : 'text-slate-200 group-hover:text-white'
                                      }
                                    >
                                      {lesson.title}
                                    </span>
                                  </button>
                                  <span className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums">
                                    {lesson.durationMinutes} min
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right 5 cols: Trading Roadmap Milestones */}
                <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-amber-500/15">
                      <div>
                        <h4 className="text-sm font-bold text-white font-['Montserrat']">
                          Ruta de Trading (5 Fases SMC)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Sincronizado con el Roadmap del Alumno
                        </p>
                      </div>
                      <a
                        href="#roadmap"
                        className="text-xs text-amber-300 hover:text-amber-200 font-semibold inline-flex items-center gap-1"
                      >
                        <span>Ver fases</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <ul className="divide-y divide-slate-800/70 mt-1">
                      {MILESTONES.map((ms) => {
                        const isDone = completedMilestones.includes(ms.id);
                        return (
                          <li key={ms.id} className="py-3 flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleMilestone(ms.id)}
                              className="flex items-start gap-2.5 text-left flex-1 cursor-pointer group"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-500 group-hover:text-amber-300 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <div className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-amber-200 transition-colors">
                                  <span className="font-mono text-amber-400 mr-1.5">
                                    {ms.stepNumber}.
                                  </span>
                                  {ms.phaseTitle}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {ms.duration} · {ms.tagline}
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-amber-500/15 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      ¿Listo para profundizar en un módulo?
                    </span>
                    <a
                      href="#capital"
                      className="text-xs font-bold text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1"
                    >
                      <span>Abrir Campus Capital</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TWO-COLUMN ROW ON OVERVIEW OR FULL WIDTH IN DEDICATED TABS */}
          <div
            className={
              activeTab === 'overview'
                ? 'grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'
                : 'space-y-6'
            }
          >
            {/* PILLAR 2: PRÓXIMOS WEBINARS PROGRAMADOS */}
            {(activeTab === 'overview' || activeTab === 'webinars') && (
              <div
                className={`${
                  activeTab === 'overview' ? 'xl:col-span-6' : ''
                } rounded-2xl border border-amber-500/20 bg-[#041b13] overflow-hidden`}
              >
                <div className="px-5 py-4 border-b border-amber-500/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-['Montserrat']">
                      <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>Próximos Webinars Programados</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sesiones aprobadas y transmisiones en directo por YouTube y TikTok @alhadiqa.capital.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(
                      [
                        { id: 'all', label: 'Todos' },
                        { id: 'live', label: 'En Vivo' },
                        { id: 'upcoming', label: 'Próximos' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWebinarFilter(opt.id)}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          webinarFilter === opt.id
                            ? 'bg-amber-400 text-[#03140e]'
                            : 'bg-[#062319] text-slate-300 hover:text-white border border-slate-700/80'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Broadcast Highlight Strip (if YouTube or TikTok channel is active) */}
                {(youtubeBroadcast?.isLive || tiktokBroadcast?.isLive || tiktokBroadcast?.status === 'nuevo_contenido') && (
                  <div className="px-5 py-3 bg-emerald-950/50 border-b border-emerald-500/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-emerald-200">
                      <Radio className="w-4 h-4 text-red-400 shrink-0" />
                      <span>
                        <strong>
                          {tiktokBroadcast?.isLive
                            ? 'TikTok @alhadiqa.capital EN VIVO'
                            : youtubeBroadcast?.isLive
                              ? 'Streaming YouTube EN VIVO'
                              : 'Nuevo contenido en TikTok @alhadiqa.capital'}
                        </strong>
                        {tiktokBroadcast?.title || youtubeBroadcast?.title
                          ? ` — ${tiktokBroadcast?.title || youtubeBroadcast?.title}`
                          : ''}
                      </span>
                    </div>
                    <a
                      href={tiktokBroadcast?.isLive ? TIKTOK_LIVE_URL : '#streaming'}
                      target={tiktokBroadcast?.isLive ? '_blank' : undefined}
                      rel={tiktokBroadcast?.isLive ? 'noopener noreferrer' : undefined}
                      className="text-xs font-bold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Unirse ahora</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {sortedWebinars.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-sm text-slate-300">
                      No hay webinars bajo el filtro seleccionado en este momento.
                    </p>
                    <button
                      type="button"
                      onClick={() => setWebinarFilter('all')}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#062319] border border-amber-500/30 text-amber-200 text-xs font-semibold cursor-pointer"
                    >
                      Ver toda la cartelera
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-amber-500/10">
                    {sortedWebinars.map((cls) => {
                      const isLive = cls.status === 'en_vivo';
                      const hasReminder = reminderIds.includes(cls.id);
                      const provider = detectStreamProviderLabel(cls.streamUrl);

                      return (
                        <li
                          key={cls.id}
                          className="p-4 sm:p-5 hover:bg-[#062319]/60 transition-colors space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              {isLive ? (
                                <span className="inline-flex items-center gap-1.5 text-red-400 font-bold">
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                  EN VIVO
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-semibold uppercase">
                                  Programada
                                </span>
                              )}
                              <span className="text-slate-600">·</span>
                              <span className="text-amber-300">{cls.category}</span>
                              <span className="text-slate-600">·</span>
                              <span className="text-slate-400">{provider}</span>
                            </div>

                            <span className="text-slate-300 tabular-nums inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {cls.scheduledAt}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                              {cls.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {cls.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] text-slate-400">
                              Instructor: <strong className="text-slate-200">{cls.instructor}</strong>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleReminder(cls)}
                                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                                  hasReminder
                                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                                    : 'bg-[#062319] border border-slate-700 text-slate-300 hover:text-white'
                                }`}
                              >
                                {hasReminder ? (
                                  <>
                                    <BellRing className="w-3.5 h-3.5" />
                                    <span>Recordatorio activo</span>
                                  </>
                                ) : (
                                  <>
                                    <Bell className="w-3.5 h-3.5" />
                                    <span>Recordarme</span>
                                  </>
                                )}
                              </button>

                              <a
                                href="#clases-en-vivo"
                                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#03140e] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                              >
                                <span>{isLive ? 'Entrar a Sala' : 'Ver Temario'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="px-5 py-3.5 border-t border-amber-500/15 bg-[#03140e]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">
                    Alertas automáticas al transmitir en @alhadiqa.capital
                  </span>
                  <a
                    href="#streaming"
                    className="font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1"
                  >
                    <span>Abrir Centro Streaming</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* PILLAR 3: ACCESO DIRECTO A DOCUMENTOS DE TRADING DESCARGADOS */}
            {(activeTab === 'overview' || activeTab === 'documents') && (
              <div
                className={`${
                  activeTab === 'overview' ? 'xl:col-span-6' : ''
                } rounded-2xl border border-amber-500/20 bg-[#041b13] overflow-hidden`}
              >
                <div className="px-5 py-4 border-b border-amber-500/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-['Montserrat']">
                      <FileText className="w-5 h-5 text-sky-400 shrink-0" />
                      <span>Documentos de Trading Descargados</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Historial personal de descargas y acceso directo de re-descarga en 1 clic.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-52 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      placeholder="Buscar documento..."
                      aria-label="Buscar documentos de trading"
                      className="w-full min-h-[38px] pl-8 pr-3 py-1.5 rounded-lg bg-[#03140e] border border-slate-700 focus:border-amber-400 text-xs text-slate-100 placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>

                {/* History of Downloaded Documents */}
                <div className="divide-y divide-amber-500/10">
                  {!currentUser ? (
                    <div className="p-6 text-center space-y-3 border-b border-amber-500/15">
                      <p className="text-xs sm:text-sm text-slate-300">
                        Inicia sesión con Google para visualizar tu historial personal de manuales PDF y resúmenes descargados.
                      </p>
                      <button
                        type="button"
                        onClick={signInWithGoogle}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#03140e] text-xs font-bold cursor-pointer"
                      >
                        Iniciar Sesión para Sincronizar
                      </button>
                    </div>
                  ) : isPendingStudent ? (
                    <div className="p-5 bg-amber-950/25 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5 text-xs text-amber-200">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          Tu cuenta está en revisión. Una vez aprobada, tus documentos descargados y enlaces firmados aparecerán aquí.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestDownloadAccess}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        Recordar al Admin
                      </button>
                    </div>
                  ) : logsLoading ? (
                    <div className="p-5 space-y-3" aria-label="Cargando historial de descargas">
                      {[1, 2, 3].map((row) => (
                        <div key={row} className="h-11 rounded-lg bg-slate-800/40 animate-pulse" />
                      ))}
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="p-6 text-center space-y-2 border-b border-amber-500/15">
                      <p className="text-xs sm:text-sm text-slate-300">
                        {docSearch
                          ? 'Ningún documento descargado coincide con tu búsqueda.'
                          : 'Aún no registras descargas en tu cuenta. Usa el acceso rápido de abajo o explora la Biblioteca.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-amber-500/15 text-[11px] uppercase tracking-wider text-slate-400 bg-[#03140e]/50">
                            <th className="py-2.5 px-4 font-semibold">Documento</th>
                            <th className="py-2.5 px-3 font-semibold hidden sm:table-cell">Fecha</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 text-xs">
                          {filteredLogs
                            .slice(0, activeTab === 'overview' ? 4 : 20)
                            .map((log) => (
                              <tr key={log.id} className="hover:bg-[#062319]/60 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-100 leading-snug">
                                    {log.resourceTitle}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    {log.category} · {log.fileFormat || 'PDF'}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-[11px] text-slate-400 font-mono tabular-nums hidden sm:table-cell whitespace-nowrap">
                                  {formatFirestoreDate(log.downloadedAt)}
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    disabled={downloadingId === log.id}
                                    onClick={() => handleRedownloadFromLog(log)}
                                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>
                                      {downloadingId === log.id ? 'Generando...' : 'Abrir PDF'}
                                    </span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Quick-Access Available Trading Documents */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                        Acceso Directo · Biblioteca Institucional ({accessibleLibraryDocs.length})
                      </h4>
                      {!canDownload && currentUser && (
                        <button
                          type="button"
                          onClick={handleRequestDownloadAccess}
                          className="text-[11px] text-amber-300 hover:underline font-semibold cursor-pointer"
                        >
                          Solicitar permiso de descarga
                        </button>
                      )}
                    </div>

                    <ul className="divide-y divide-slate-800/70">
                      {accessibleLibraryDocs
                        .slice(0, activeTab === 'overview' ? 4 : 12)
                        .map((docItem) => (
                          <li
                            key={docItem.id}
                            className="py-2.5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-100 truncate">
                                {docItem.title}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                                {docItem.category} · {docItem.format} · {docItem.fileSize} · {docItem.pagesCount} pág.
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={downloadingId === docItem.id}
                              onClick={() => handleDownloadResource(docItem)}
                              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                                canDownload
                                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-200'
                                  : 'bg-[#062319] border border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {canDownload ? (
                                <Download className="w-3.5 h-3.5" />
                              ) : (
                                <Lock className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {downloadingId === docItem.id
                                  ? 'Descargando...'
                                  : canDownload
                                    ? 'Descargar'
                                    : 'Bloqueado'}
                              </span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-amber-500/15 bg-[#03140e]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">
                    Incluye guías de SMC, Scalping, Wyckoff y Gestión de Riesgo
                  </span>
                  <a
                    href="#biblioteca"
                    className="font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1"
                  >
                    <span>Explorar catálogo completo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
