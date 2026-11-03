import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole, UserStatus, UserPermissions } from '../context/AuthContext';
import { LiveClassItem } from './LiveClassesSection';
import { DownloadLogItem, LibraryCategory } from '../types';
import { CAPITAL_MODULES } from '../data/capitalCurriculum';
import { EmailLogItem } from '../types/notifications';
import {
  dispatchTransactionalEmail,
  buildLiveClassEmailHtml,
  buildNewContentEmailHtml,
  buildPermissionChangeEmailHtml,
  buildWelcomeEmailHtml,
} from '../services/emailService';
import { EmailViewerModal } from './EmailViewerModal';
import { logAdminAction, subscribeAdminAuditLogs, AdminAuditLogEntry } from '../services/adminAuditService';
import { generateDatabaseBackup, triggerBackupDownload } from '../services/backupService';
import {
  FeedbackReportItem,
  FeedbackStatus,
  FeedbackCategory,
  CATEGORY_LABELS,
  MODULE_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '../types/feedback';
import {
  subscribeFeedbackReports,
  updateFeedbackStatus,
  deleteFeedbackReport,
} from '../services/feedbackService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  targetRole: string;
  type: string;
  createdAt?: unknown;
}

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  format: string;
  downloadCount: number;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'classes' | 'chat' | 'library' | 'broadcast' | 'security' | 'feedback'>('metrics');
  const [feedbackReports, setFeedbackReports] = useState<FeedbackReportItem[]>([]);
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<'all' | FeedbackCategory>('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<'all' | FeedbackStatus>('all');
  const [feedbackAdminDrafts, setFeedbackAdminDrafts] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string; authorName: string; text: string }[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLogItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [viewingEmail, setViewingEmail] = useState<EmailLogItem | null>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState<string>('');
  const [testEmailTemplate, setTestEmailTemplate] = useState<'bienvenida' | 'clase_en_vivo' | 'nuevo_contenido' | 'cambio_permisos'>('bienvenida');
  const [assigningUser, setAssigningUser] = useState<UserProfile | null>(null);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [assigningCapitalUser, setAssigningCapitalUser] = useState<UserProfile | null>(null);
  const [selectedCapitalModuleIds, setSelectedCapitalModuleIds] = useState<string[]>([]);
  const [isGlobalChatMuted, setIsGlobalChatMuted] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Class Form
  const [classTitle, setClassTitle] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [classCat, setClassCat] = useState<LiveClassItem['category']>('SMC');
  const [classDate, setClassDate] = useState('2026-11-02 14:00 UTC');
  const [classStreamUrl, setClassStreamUrl] = useState('https://www.youtube.com/embed/live_stream');
  const [classInitialStatus, setClassInitialStatus] = useState<LiveClassItem['status']>('pendiente_aprobacion');

  // New Broadcast Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifTarget, setNotifTarget] = useState('all');
  const [notifType, setNotifType] = useState('urgent');

  // New Library Resource Form with 5 official categories
  const [libTitle, setLibTitle] = useState('');
  const [libDesc, setLibDesc] = useState('');
  const [libCat, setLibCat] = useState<LibraryCategory>('Fundamentos');
  const [libFormat, setLibFormat] = useState('PDF');
  const [libPages, setLibPages] = useState<number>(120);
  const [libSize, setLibSize] = useState<string>('8.5 MB');

  useEffect(() => {
    if (!isOpen) return;

    // Users
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const uList: UserProfile[] = [];
        snap.forEach((d) => uList.push(d.data() as UserProfile));
        setUsers(uList);
      },
      (err) => console.warn('AdminPanelModal - users listener:', err)
    );

    // Classes
    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        const cList: LiveClassItem[] = [];
        snap.forEach((d) => cList.push({ id: d.id, ...(d.data() as Omit<LiveClassItem, 'id'>) }));
        setClasses(cList);
      },
      (err) => console.warn('AdminPanelModal - classes listener:', err)
    );

    // Notifications
    const unsubNotifs = onSnapshot(
      collection(db, 'notifications'),
      (snap) => {
        const nList: NotificationItem[] = [];
        snap.forEach((d) => nList.push({ id: d.id, ...(d.data() as Omit<NotificationItem, 'id'>) }));
        setNotifications(nList);
      },
      (err) => console.warn('AdminPanelModal - notifications listener:', err)
    );

    // Library Resources
    const unsubLib = onSnapshot(
      collection(db, 'library_resources'),
      (snap) => {
        const lList: LibraryItem[] = [];
        snap.forEach((d) => lList.push({ id: d.id, ...(d.data() as Omit<LibraryItem, 'id'>) }));
        setLibraryItems(lList);
      },
      (err) => console.warn('AdminPanelModal - library listener:', err)
    );

    // Chat Messages
    const unsubChat = onSnapshot(
      collection(db, 'chat_messages'),
      (snap) => {
        const mList: { id: string; authorName: string; text: string }[] = [];
        snap.forEach((d) => {
          const data = d.data();
          mList.push({ id: d.id, authorName: data.authorName || 'Alumno', text: data.text || '' });
        });
        setChatMessages(mList.slice(-30));
      },
      (err) => console.warn('AdminPanelModal - chat listener:', err)
    );

    // Download Audit Logs (Real-time monitoring of who downloaded what and when)
    const qLogs = query(collection(db, 'download_logs'), orderBy('downloadedAt', 'desc'), limit(50));
    const unsubLogs = onSnapshot(
      qLogs,
      (snap) => {
        const logs: DownloadLogItem[] = [];
        snap.forEach((d) => logs.push({ id: d.id, ...(d.data() as Omit<DownloadLogItem, 'id'>) }));
        setDownloadLogs(logs);
      },
      (err) => console.warn('download_logs onSnapshot error:', err)
    );

    // Global Chat Settings
    const unsubSettings = onSnapshot(
      doc(db, 'system_settings', 'chat'),
      (docSnap) => {
        if (docSnap.exists()) {
          setIsGlobalChatMuted(!!docSnap.data().isGlobalMuted);
        }
      },
      (err) => console.warn('AdminPanelModal - settings listener:', err)
    );

    // Transactional Email Logs
    const qEmails = query(collection(db, 'email_logs'), orderBy('createdAt', 'desc'), limit(50));
    const unsubEmails = onSnapshot(
      qEmails,
      (snap) => {
        const eList: EmailLogItem[] = [];
        snap.forEach((d) => eList.push({ id: d.id, ...(d.data() as Omit<EmailLogItem, 'id'>) }));
        setEmailLogs(eList);
      },
      (err) => console.warn('email_logs onSnapshot error:', err)
    );

    // Admin Action Audit Trail
    const unsubAudit = subscribeAdminAuditLogs((logs) => setAdminAuditLogs(logs));

    // Feedback & Correcciones Listener
    const unsubFeedback = subscribeFeedbackReports((reports) => setFeedbackReports(reports));

    return () => {
      unsubUsers();
      unsubClasses();
      unsubNotifs();
      unsubLib();
      unsubChat();
      unsubLogs();
      unsubSettings();
      unsubEmails();
      unsubAudit();
      unsubFeedback();
    };
  }, [isOpen]);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // User Actions
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole, updatedAt: serverTimestamp() });
      showNotification(`Rol actualizado a ${newRole.toUpperCase()}`);

      logAdminAction({
        adminUid: 'empresaalhadiqainvest@gmail.com',
        adminEmail: 'empresaalhadiqainvest@gmail.com',
        actionType: 'UPDATE_USER_ROLE',
        targetType: 'user',
        targetId: userId,
        details: `Rol de usuario modificado a ${newRole.toUpperCase()}`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus, updatedAt: serverTimestamp() });
      showNotification(`Estado de usuario actualizado a ${newStatus.toUpperCase()}`);

      logAdminAction({
        adminUid: 'empresaalhadiqainvest@gmail.com',
        adminEmail: 'empresaalhadiqainvest@gmail.com',
        actionType: 'UPDATE_USER_STATUS',
        targetType: 'user',
        targetId: userId,
        details: `Estado de cuenta de usuario modificado a ${newStatus.toUpperCase()}`,
      });

      const user = users.find((u) => u.uid === userId);
      if (user && user.email) {
        dispatchTransactionalEmail({
          userId: user.uid,
          toEmail: user.email,
          toName: user.displayName,
          templateType: 'cambio_permisos',
          subject: `🔑 Actualización de Cuenta: Estado ${newStatus.toUpperCase()}`,
          htmlContent: buildPermissionChangeEmailHtml({
            toName: user.displayName,
            status: newStatus,
            canDownload: Boolean(user.permissions?.canDownload),
            assignedBooksCount: user.permissions?.assignedBookIds?.length || 0,
            assignedCapitalCount: user.permissions?.assignedCapitalModuleIds?.length || 0,
            notes: `Tu estado de cuenta ha sido modificado a ${newStatus.toUpperCase()} por Sr.smith.`,
          }),
        }).catch(console.error);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleTogglePermission = async (userId: string, currentPerms: UserPermissions, permKey: keyof UserPermissions) => {
    const updated = { ...currentPerms, [permKey]: !currentPerms[permKey] };
    const permKeyStr = String(permKey);
    try {
      await updateDoc(doc(db, 'users', userId), { permissions: updated, updatedAt: serverTimestamp() });
      showNotification(`Permiso '${permKeyStr}' actualizado.`);

      const user = users.find((u) => u.uid === userId);
      if (user && user.email) {
        dispatchTransactionalEmail({
          userId: user.uid,
          toEmail: user.email,
          toName: user.displayName,
          templateType: 'cambio_permisos',
          subject: `🔑 Permiso Actualizado: ${permKeyStr} (${updated[permKey] ? 'Habilitado' : 'Desactivado'})`,
          htmlContent: buildPermissionChangeEmailHtml({
            toName: user.displayName,
            status: user.status,
            canDownload: Boolean(updated.canDownload),
            assignedBooksCount: updated.assignedBookIds?.length || 0,
            assignedCapitalCount: updated.assignedCapitalModuleIds?.length || 0,
            notes: `El permiso '${permKeyStr}' ha sido ${updated[permKey] ? 'HABILITADO' : 'DESACTIVADO'} en tu perfil por Sr.smith.`,
          }),
        }).catch(console.error);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleToggleMuteUser = async (userId: string, currentMuted: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isMuted: !currentMuted, updatedAt: serverTimestamp() });
      showNotification(`Usuario ${!currentMuted ? 'silenciado' : 'desilenciado'} en el chat.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`¿Expulsar definitivamente a ${email}?`)) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      showNotification(`Usuario ${email} expulsado.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  };

  // Class Management (7 Lifecycle States: borrador, pendiente_aprobacion, aprobada, programada, en_vivo, finalizada, archivada)
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classTitle.trim()) return;
    try {
      const classRef = doc(collection(db, 'classes'));
      await setDoc(classRef, {
        title: classTitle.trim(),
        description: classDesc.trim(),
        instructor: 'Sr.smith (Carlos Smith Zambrano)',
        category: classCat,
        scheduledAt: classDate,
        streamUrl: classStreamUrl,
        status: classInitialStatus,
        createdBy: 'admin',
        createdAt: serverTimestamp(),
      });

      // Aviso automático: al iniciar o programar una clase, se envía notificación interna a los alumnos
      if (classInitialStatus === 'en_vivo' || classInitialStatus === 'programada') {
        await addDoc(collection(db, 'notifications'), {
          title: classInitialStatus === 'en_vivo' ? `🔴 ¡En Vivo Ahora!: ${classTitle.trim()}` : `📅 Clase Programada: ${classTitle.trim()}`,
          message: `Sr.smith ha ${classInitialStatus === 'en_vivo' ? 'iniciado una transmisión institucional en directo' : `programado una nueva clase para ${classDate}`}. Ingresa al aula para participar.`,
          targetRole: 'all',
          type: classInitialStatus === 'en_vivo' ? 'urgent' : 'class',
          createdAt: serverTimestamp(),
        });
      }

      setClassTitle('');
      setClassDesc('');
      showNotification(`Clase creada con éxito en estado: ${classInitialStatus.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'classes');
    }
  };

  const handleUpdateClassStatus = async (classId: string, status: LiveClassItem['status']) => {
    const cls = classes.find((c) => c.id === classId);

    // Flujo de aprobación del socio (JustMarkets): Toda clase debe pasar por revisión antes de publicarse
    if (
      (status === 'en_vivo' || status === 'programada') &&
      cls &&
      cls.status !== 'aprobada' &&
      cls.status !== 'en_vivo'
    ) {
      showNotification('⚠️ Bloqueado por Compliance: La clase debe ser aprobada primero por el socio JustMarkets.');
      return;
    }

    try {
      await updateDoc(doc(db, 'classes', classId), { status, updatedAt: serverTimestamp() });
      showNotification(`Clase actualizada a estado: ${status.toUpperCase()}`);

      // Auto-aviso al pasar a en_vivo
      if (status === 'en_vivo') {
        await addDoc(collection(db, 'notifications'), {
          title: `🔴 ¡Transmisión en Vivo Iniciada!`,
          message: `Sr.smith está transmitiendo en directo: "${cls?.title || 'Masterclass Al-Hadiqa'}". ¡Conéctate a la sala virtual!`,
          targetRole: 'all',
          type: 'urgent',
          createdAt: serverTimestamp(),
        });
      }

      logAdminAction({
        adminUid: 'empresaalhadiqainvest@gmail.com',
        adminEmail: 'empresaalhadiqainvest@gmail.com',
        actionType: 'APPROVE_CLASS',
        targetType: 'class',
        targetId: classId,
        details: `Clase "${cls?.title || classId}" actualizada a estado ${status.toUpperCase()}`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('¿Eliminar esta clase?')) return;
    try {
      await deleteDoc(doc(db, 'classes', classId));
      showNotification('Clase eliminada del catálogo.');

      logAdminAction({
        adminUid: 'empresaalhadiqainvest@gmail.com',
        adminEmail: 'empresaalhadiqainvest@gmail.com',
        actionType: 'DELETE_CLASS',
        targetType: 'class',
        targetId: classId,
        details: `Clase con ID ${classId} eliminada del catálogo`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${classId}`);
    }
  };

  // Chat Global Mute
  const handleToggleGlobalChatMute = async () => {
    try {
      await setDoc(doc(db, 'system_settings', 'chat'), {
        isGlobalMuted: !isGlobalChatMuted,
        notice: !isGlobalChatMuted ? 'El chat ha sido silenciado temporalmente por Sr.smith.' : '',
      }, { merge: true });
      showNotification(`Chat global ${!isGlobalChatMuted ? 'SILENCIADO' : 'HABILITADO'}.`);

      logAdminAction({
        adminUid: 'empresaalhadiqainvest@gmail.com',
        adminEmail: 'empresaalhadiqainvest@gmail.com',
        actionType: 'MUTE_CHAT',
        targetType: 'chat',
        details: `Chat general ${!isGlobalChatMuted ? 'SILENCIADO globalmente' : 'HABILITADO nuevamente'} por Sr.smith`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system_settings/chat');
    }
  };

  const handleDeleteChatMessage = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, 'chat_messages', msgId));
      showNotification('Mensaje eliminado.');

      logAdminAction({
        adminUid: 'empresaalhadiqainvest@gmail.com',
        adminEmail: 'empresaalhadiqainvest@gmail.com',
        actionType: 'DELETE_CHAT_MESSAGE',
        targetType: 'chat',
        targetId: msgId,
        details: `Mensaje de chat ${msgId} eliminado por moderación`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `chat_messages/${msgId}`);
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    try {
      const snapshot = await generateDatabaseBackup(
        'empresaalhadiqainvest@gmail.com',
        'empresaalhadiqainvest@gmail.com'
      );
      triggerBackupDownload(snapshot);
      showNotification(`✓ Respaldo generado y descargado (SHA-256: ${snapshot.sha256Checksum.substring(0, 16)}...)`);
    } catch (err) {
      console.error('Error generating backup:', err);
      showNotification('Error generando copia de seguridad.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Broadcast Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMsg.trim()) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        title: notifTitle.trim(),
        message: notifMsg.trim(),
        targetRole: notifTarget,
        type: notifType,
        createdAt: serverTimestamp(),
      });
      setNotifTitle('');
      setNotifMsg('');
      showNotification('Comunicado oficial enviado a la plataforma.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'notifications');
    }
  };

  // Library Upload with full metadata
  const handleAddLibraryResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libTitle.trim()) return;
    try {
      await addDoc(collection(db, 'library_resources'), {
        title: libTitle.trim(),
        description: libDesc.trim(),
        category: libCat,
        format: libFormat,
        pagesCount: Number(libPages) || 120,
        fileSize: libSize.trim() || '8.5 MB',
        author: 'Sr.smith (Carlos Smith Zambrano)',
        downloadCount: 0,
        isPublic: true,
        createdAt: serverTimestamp(),
      });
      setLibTitle('');
      setLibDesc('');
      showNotification('Nuevo recurso agregado a la Biblioteca de Trading.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'library_resources');
    }
  };

  const handleDeleteLibraryItem = async (itemId: string) => {
    if (!window.confirm('¿Eliminar este libro de la biblioteca?')) return;
    try {
      await deleteDoc(doc(db, 'library_resources', itemId));
      showNotification('Recurso eliminado de la biblioteca.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `library_resources/${itemId}`);
    }
  };

  const handleSaveAssignedBooks = async () => {
    if (!assigningUser) return;
    try {
      const currentPerms = assigningUser.permissions || {
        canAccessClasses: false,
        canAccessChat: false,
        canAccessLibrary: true,
        canAccessCapital: true,
      };
      await updateDoc(doc(db, 'users', assigningUser.uid), {
        permissions: {
          ...currentPerms,
          assignedBookIds: selectedBookIds,
        },
        updatedAt: serverTimestamp(),
      });
      showNotification(`Libros asignados a ${assigningUser.displayName} con éxito.`);
      setAssigningUser(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${assigningUser.uid}`);
    }
  };

  const handleSaveAssignedCapitalModules = async () => {
    if (!assigningCapitalUser) return;
    try {
      const currentPerms = assigningCapitalUser.permissions || {
        canAccessClasses: false,
        canAccessChat: false,
        canAccessLibrary: true,
        canAccessCapital: true,
      };
      await updateDoc(doc(db, 'users', assigningCapitalUser.uid), {
        permissions: {
          ...currentPerms,
          assignedCapitalModuleIds: selectedCapitalModuleIds,
        },
        updatedAt: serverTimestamp(),
      });
      showNotification(`Módulos de Capital asignados a ${assigningCapitalUser.displayName} (${selectedCapitalModuleIds.length} módulos).`);
      setAssigningCapitalUser(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${assigningCapitalUser.uid}`);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = testEmailRecipient.trim() || 'alumno@alhadiqainvest.com';
    const targetUser = users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
    const recipientName = targetUser?.displayName || targetEmail.split('@')[0] || 'Alumno Al-Hadiqa';
    const recipientUid = targetUser?.uid || 'simulated-student-id';

    let subject = '';
    let htmlContent = '';

    if (testEmailTemplate === 'bienvenida') {
      subject = `🎓 ¡Bienvenido a Al-Hadiqa Invest, ${recipientName}!`;
      htmlContent = buildWelcomeEmailHtml(recipientName, targetEmail);
    } else if (testEmailTemplate === 'clase_en_vivo') {
      const liveCls = classes.find((c) => c.status === 'en_vivo') || classes[0] || {
        title: 'Masterclass SMC & Mitigación de Liquidez Institucional',
        category: 'SMC' as const,
        scheduledAt: 'Hoy 14:00 UTC',
      };
      subject = `🔴 Aviso de Clase en Vivo: ${liveCls.title}`;
      htmlContent = buildLiveClassEmailHtml({
        toName: recipientName,
        classTitle: liveCls.title,
        instructor: 'Sr.smith (Carlos Smith Zambrano)',
        scheduledAt: liveCls.scheduledAt || '14:00 UTC',
        category: liveCls.category || 'Trading Institucional',
        streamUrl: liveCls.streamUrl,
      });
    } else if (testEmailTemplate === 'nuevo_contenido') {
      const topLib = libraryItems[0] || {
        title: 'Manual Maestro de Price Action & Desequilibrios FVG',
        category: 'Price Action',
        description: 'Guía exhaustiva con casos reales y backtesting de liquidez interbancaria.',
        format: 'PDF',
      };
      subject = `📚 Nuevo Contenido Publicado: ${topLib.title}`;
      htmlContent = buildNewContentEmailHtml({
        toName: recipientName,
        contentTitle: topLib.title,
        category: topLib.category,
        author: 'Sr.smith (Carlos Smith Zambrano)',
        description: topLib.description,
        format: topLib.format,
      });
    } else {
      subject = '🔑 Actualización en tus Permisos de Al-Hadiqa Invest';
      htmlContent = buildPermissionChangeEmailHtml({
        toName: recipientName,
        status: targetUser?.status || 'active',
        canDownload: Boolean(targetUser?.permissions?.canDownload),
        assignedBooksCount: targetUser?.permissions?.assignedBookIds?.length || 4,
        assignedCapitalCount: targetUser?.permissions?.assignedCapitalModuleIds?.length || 4,
        notes: 'Permisos y estado revisados y certificados por Sr.smith.',
      });
    }

    try {
      await dispatchTransactionalEmail({
        userId: recipientUid,
        toEmail: targetEmail,
        toName: recipientName,
        templateType: testEmailTemplate,
        subject,
        htmlContent,
        createInAppNotification: true,
        notificationMessage: subject,
      });
      showNotification(`📧 Correo transaccional [${testEmailTemplate}] enviado a ${targetEmail}`);
    } catch (err) {
      console.error('Error dispatching test email:', err);
      showNotification('Error despachando correo transaccional.');
    }
  };

  if (!isOpen) return null;

  // Filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeUsersCount = users.filter((u) => u.status === 'active').length;
  const pendingUsersCount = users.filter((u) => u.status === 'pending').length;
  const publishedClassesCount = classes.filter((c) =>
    ['en_vivo', 'programada', 'aprobada', 'published', 'approved'].includes(c.status)
  ).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        background: 'rgba(7, 11, 20, 0.94)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1rem, 2.5vw, 2.5rem)',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: 'linear-gradient(160deg, var(--surface-3), var(--surface))',
          border: '1px solid var(--gold)',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth: '1200px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 60px -15px rgba(251, 191, 36, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '1.25rem 2rem',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '1.75rem' }}>👑</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="badge badge--gold" style={{ fontSize: '0.72rem' }}>
                  CEO &amp; Fundador
                </span>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-head)', fontSize: '1.3rem', color: '#fff' }}>
                  Panel de Control Maestro · Sr.smith
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                Carlos Smith Zambrano González · Gestión Integral de Usuarios, Clases, Chat, Biblioteca y Métricas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              borderBottom: '1px solid var(--emerald)',
              color: 'var(--emerald)',
              padding: '0.65rem 2rem',
              fontSize: '0.88rem',
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            ✓ {actionNotice}
          </div>
        )}

        {/* Tab Navigation Menu */}
        <div
          style={{
            padding: '0.85rem 2rem',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            background: 'var(--surface-2)',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            <button
              type="button"
              className={`quiz__btn ${activeTab === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('metrics')}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
            >
              📊 Métricas &amp; KPIs
            </button>
            <button
              type="button"
              className={`quiz__btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
            >
              👥 Usuarios &amp; Permisos ({users.length})
            </button>
            <button
              type="button"
              className={`quiz__btn ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
            >
              🎥 Clases &amp; Transmisiones ({classes.length})
            </button>
            <button
              type="button"
              className={`quiz__btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
            >
              💬 Moderación Chat {isGlobalChatMuted ? '🔇' : '🔊'}
            </button>
            <button
              type="button"
              className={`quiz__btn ${activeTab === 'library' ? 'active' : ''}`}
              onClick={() => setActiveTab('library')}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
            >
              📚 Biblioteca &amp; Capital
            </button>
            <button
              type="button"
              className={`quiz__btn ${activeTab === 'broadcast' ? 'active' : ''}`}
              onClick={() => setActiveTab('broadcast')}
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
            >
              📢 Notificaciones &amp; Correos ({emailLogs.length})
            </button>
            <button
              type="button"
              className={`quiz__btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.82rem',
                borderColor: activeTab === 'security' ? 'var(--emerald)' : undefined,
                color: activeTab === 'security' ? 'var(--emerald)' : undefined,
              }}
            >
              🛡️ Auditoría &amp; Seguridad ({adminAuditLogs.length})
            </button>
            <button
              type="button"
              className={`quiz__btn ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.82rem',
                borderColor: activeTab === 'feedback' ? 'var(--gold)' : undefined,
                color: activeTab === 'feedback' ? 'var(--gold-soft)' : undefined,
                position: 'relative',
              }}
            >
              📨 Feedback &amp; Correcciones ({feedbackReports.length})
              {feedbackReports.filter((f) => f.status === 'pendiente').length > 0 && (
                <span
                  style={{
                    marginLeft: '0.35rem',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '0.1rem 0.4rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                  }}
                >
                  {feedbackReports.filter((f) => f.status === 'pendiente').length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'users' && (
            <input
              type="text"
              placeholder="Buscar por correo o nombre…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.84rem',
                background: 'rgba(148, 163, 184, 0.08)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                minWidth: '220px',
              }}
            />
          )}
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>
          
          {/* TAB 1: MÉTRICAS Y KPIS */}
          {activeTab === 'metrics' && (
            <div>
              <div className="section-head" style={{ marginBottom: '1.8rem', textAlign: 'left', marginInline: 0 }}>
                <h4 className="h-sub" style={{ color: 'var(--gold)' }}>Panel Ejecutivo de Métricas</h4>
                <p>Monitoreo en tiempo real de actividad, retención de alumnos y volumen operativo.</p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2.5rem',
                }}
              >
                <div className="stat">
                  <p className="stat__value">{users.length}</p>
                  <p className="stat__label">Total Usuarios Registrados</p>
                  <p className="stat__hint">{activeUsersCount} activos · {pendingUsersCount} pendientes</p>
                </div>
                <div className="stat">
                  <p className="stat__value" style={{ color: 'var(--emerald)' }}>{publishedClassesCount}</p>
                  <p className="stat__label">Clases Publicadas</p>
                  <p className="stat__hint">{classes.length} sesiones en catálogo</p>
                </div>
                <div className="stat">
                  <p className="stat__value" style={{ color: 'var(--gold)' }}>{chatMessages.length}</p>
                  <p className="stat__label">Mensajes en Chat</p>
                  <p className="stat__hint">Estado: {isGlobalChatMuted ? 'Silenciado' : 'Abierto a la comunidad'}</p>
                </div>
                <div className="stat">
                  <p className="stat__value" style={{ color: '#93c5fd' }}>{libraryItems.length + 3}</p>
                  <p className="stat__label">Recursos Educativos PDF</p>
                  <p className="stat__hint">Materiales de libre descarga</p>
                </div>
              </div>

              {/* Status summary table */}
              <div
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.5rem',
                }}
              >
                <h5 style={{ fontFamily: 'var(--font-head)', color: '#fff', marginBottom: '0.8rem', fontSize: '1rem' }}>
                  Flujo de Aprobación de Socios (JustMarkets)
                </h5>
                <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                  Las clases creadas por el administrador entran en estado <strong>Pendiente de Aprobación</strong>.
                  El aprobador del socio JustMarkets las valida técnicamente antes de que Sr.smith pueda publicarlas
                  oficialmente a los alumnos activos.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: USUARIOS Y PERMISOS */}
          {activeTab === 'users' && (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol Asignado</th>
                    <th>Estado</th>
                    <th>Permisos Modulares</th>
                    <th>Chat Mute</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSelfAdmin = u.email === 'empresaalhadiqainvest@gmail.com';
                    const perms = u.permissions || {
                      canAccessClasses: false,
                      canAccessChat: false,
                      canAccessLibrary: true,
                      canAccessCapital: true,
                    };

                    return (
                      <tr key={u.uid}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {u.photoURL ? (
                              <img src={u.photoURL} alt={u.displayName} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                            ) : (
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {u.displayName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#fff' }}>{u.displayName}</strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {isSelfAdmin ? (
                            <span className="badge badge--gold">Administrador (CEO)</span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.uid, e.target.value as UserRole)}
                              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                            >
                              <option value="alumno">Alumno</option>
                              <option value="aprobador">Aprobador Socio (JustMarkets)</option>
                              <option value="admin">Administrador</option>
                            </select>
                          )}
                        </td>

                        <td>
                          {isSelfAdmin ? (
                            <span style={{ color: 'var(--emerald)', fontWeight: 600, fontSize: '0.85rem' }}>● Activo Permanente</span>
                          ) : (
                            <select
                              value={u.status}
                              onChange={(e) => handleUpdateStatus(u.uid, e.target.value as UserStatus)}
                              style={{
                                background: 'var(--surface)',
                                color: u.status === 'active' ? 'var(--emerald)' : u.status === 'pending' ? 'var(--gold)' : '#ef4444',
                                border: '1px solid var(--line)',
                                borderRadius: '6px',
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                              }}
                            >
                              <option value="active">Activo (Aprobado)</option>
                              <option value="pending">Pendiente de Aprobación</option>
                              <option value="suspended">Suspendido / Bloqueado</option>
                            </select>
                          )}
                        </td>

                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(u.uid, perms, 'canAccessClasses')}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                border: `1px solid ${perms.canAccessClasses ? 'var(--emerald)' : 'var(--line)'}`,
                                background: perms.canAccessClasses ? 'rgba(16,185,129,0.15)' : 'transparent',
                                color: perms.canAccessClasses ? 'var(--emerald)' : 'var(--muted)',
                                cursor: 'pointer',
                              }}
                            >
                              Clases {perms.canAccessClasses ? '✓' : '✕'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePermission(u.uid, perms, 'canAccessChat')}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                border: `1px solid ${perms.canAccessChat ? 'var(--gold)' : 'var(--line)'}`,
                                background: perms.canAccessChat ? 'rgba(251,191,36,0.15)' : 'transparent',
                                color: perms.canAccessChat ? 'var(--gold)' : 'var(--muted)',
                                cursor: 'pointer',
                              }}
                            >
                              Chat {perms.canAccessChat ? '✓' : '✕'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePermission(u.uid, perms, 'canAccessCapital')}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                border: `1px solid ${perms.canAccessCapital ? '#93c5fd' : 'var(--line)'}`,
                                background: perms.canAccessCapital ? 'rgba(59,130,246,0.15)' : 'transparent',
                                color: perms.canAccessCapital ? '#93c5fd' : 'var(--muted)',
                                cursor: 'pointer',
                              }}
                            >
                              Capital {perms.canAccessCapital ? '✓' : '✕'}
                            </button>

                            {/* Toggle Descarga por Alumno */}
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(u.uid, perms, 'canDownload')}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                border: `1px solid ${perms.canDownload ? 'var(--emerald)' : '#ef4444'}`,
                                background: perms.canDownload ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                color: perms.canDownload ? 'var(--emerald)' : '#fca5a5',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                              title={perms.canDownload ? 'Descarga habilitada para este alumno' : 'Descarga bloqueada por administración'}
                            >
                              Descarga {perms.canDownload ? '✓ Habilitada' : '🔒 Bloqueada'}
                            </button>

                            {/* Asignación de Libros */}
                            <button
                              type="button"
                              onClick={() => {
                                setAssigningUser(u);
                                setSelectedBookIds(perms.assignedBookIds || []);
                              }}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                border: '1px solid var(--gold)',
                                background: 'rgba(251,191,36,0.12)',
                                color: 'var(--gold)',
                                cursor: 'pointer',
                              }}
                              title="Asignar libros específicos de la biblioteca a este alumno"
                            >
                              📚 Libros ({(perms.assignedBookIds || []).length})
                            </button>

                            {/* Asignación de Módulos Al-Hadiqa Capital */}
                            <button
                              type="button"
                              onClick={() => {
                                setAssigningCapitalUser(u);
                                setSelectedCapitalModuleIds(perms.assignedCapitalModuleIds || []);
                              }}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                border: '1px solid #93c5fd',
                                background: 'rgba(59,130,246,0.12)',
                                color: '#93c5fd',
                                cursor: 'pointer',
                              }}
                              title="Asignar módulos formativos de Al-Hadiqa Capital a este alumno"
                            >
                              🏛️ Capital ({(perms.assignedCapitalModuleIds || []).length})
                            </button>
                          </div>
                        </td>

                        <td>
                          {!isSelfAdmin && (
                            <button
                              type="button"
                              onClick={() => handleToggleMuteUser(u.uid, !!u.isMuted)}
                              style={{
                                fontSize: '0.74rem',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '4px',
                                border: '1px solid var(--line)',
                                background: u.isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.08)',
                                color: u.isMuted ? '#fca5a5' : 'var(--muted)',
                                cursor: 'pointer',
                              }}
                            >
                              {u.isMuted ? '🔇 Silenciado' : '🔊 Silenciar'}
                            </button>
                          )}
                        </td>

                        <td>
                          {!isSelfAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.uid, u.email)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#fca5a5',
                                borderRadius: '4px',
                                padding: '0.3rem 0.65rem',
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                              }}
                            >
                              Expulsar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: GESTIÓN DE CLASES Y TRANSMISIONES */}
          {activeTab === 'classes' && (
            <div>
              {/* Mandatory Partner Disclaimer Banner */}
              <div
                style={{
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  borderRadius: 'var(--radius)',
                  padding: '1rem 1.4rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>⚖️</span>
                <div>
                  <strong style={{ color: 'var(--gold)', fontSize: '0.9rem', display: 'block' }}>
                    Flujo de Aprobación del Socio (JustMarkets) &amp; Aviso Legal Obligatorio
                  </strong>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.45 }}>
                    Toda clase debe pasar por revisión antes de publicarse. El aprobador ve la clase pendiente, puede aprobar o rechazar con comentarios.
                    Solo las clases aprobadas se muestran a los alumnos. Aviso legal permanente:
                    <strong style={{ color: 'var(--gold)' }}> "Las clases son impartidas por un socio y no por el bróker. Contenido educativo, no constituye asesoría financiera."</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
                {/* Create Class Form */}
                <form
                  onSubmit={handleCreateClass}
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    padding: '1.5rem',
                  }}
                >
                  <h4 style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', marginBottom: '1rem', fontSize: '1.05rem' }}>
                    + Programar Nueva Clase en Vivo
                  </h4>
                  <div style={{ display: 'grid', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                        Título de la clase
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Análisis de Liquidez y Entradas en NY"
                        value={classTitle}
                        onChange={(e) => setClassTitle(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                        Temario y descripción
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Descripción, pares a revisar y gestión de riesgo..."
                        value={classDesc}
                        onChange={(e) => setClassDesc(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-body)' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Categoría</label>
                        <select
                          value={classCat}
                          onChange={(e) => setClassCat(e.target.value as LiveClassItem['category'])}
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                        >
                          <option value="SMC">SMC (Smart Money)</option>
                          <option value="Forex">Forex</option>
                          <option value="Cripto">Cripto</option>
                          <option value="Psicología">Psicología</option>
                          <option value="Capital">Capital</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Horario UTC</label>
                        <input
                          type="text"
                          value={classDate}
                          onChange={(e) => setClassDate(e.target.value)}
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                        Estado Inicial (Flujo de Aprobación JustMarkets)
                      </label>
                      <select
                        value={classInitialStatus}
                        onChange={(e) => setClassInitialStatus(e.target.value as LiveClassItem['status'])}
                        style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                      >
                        <option value="pendiente_aprobacion">⏳ Pendiente de Aprobación (Socio JustMarkets)</option>
                        <option value="borrador">📝 Borrador Interno</option>
                        <option value="programada">📅 Programada (Solo si aprobada)</option>
                        <option value="en_vivo">🔴 En Vivo Ahora</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                        URL de Transmisión (YouTube, Twitch, Facebook Live o Directo WebRTC)
                      </label>
                      <input
                        type="text"
                        value={classStreamUrl}
                        onChange={(e) => setClassStreamUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... o Twitch"
                        style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                      />
                    </div>

                    <button type="submit" className="btn btn--emerald" style={{ marginTop: '0.5rem' }}>
                      Guardar Clase &amp; Enviar a Revisión &rarr;
                    </button>
                  </div>
                </form>

                {/* Class List & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-head)', color: '#fff', fontSize: '1.05rem', margin: 0 }}>
                    Catálogo de Clases ({classes.length})
                  </h4>

                  {classes.map((cls) => {
                    const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
                      en_vivo: { label: '🔴 EN VIVO', bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
                      programada: { label: '📅 PROGRAMADA', bg: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' },
                      aprobada: { label: '✓ APROBADA', bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)' },
                      approved: { label: '✓ APROBADA', bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald)' },
                      published: { label: '📅 PROGRAMADA', bg: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' },
                      pendiente_aprobacion: { label: '⏳ PENDIENTE SOCIO', bg: 'rgba(251, 191, 36, 0.15)', color: 'var(--gold)' },
                      pending_approval: { label: '⏳ PENDIENTE SOCIO', bg: 'rgba(251, 191, 36, 0.15)', color: 'var(--gold)' },
                      rechazada: { label: '✕ RECHAZADA', bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' },
                      borrador: { label: '📝 BORRADOR', bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--muted)' },
                      draft: { label: '📝 BORRADOR', bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--muted)' },
                      finalizada: { label: '⏹️ FINALIZADA', bg: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8' },
                      archivada: { label: '📦 ARCHIVADA', bg: 'rgba(71, 85, 105, 0.25)', color: '#64748b' },
                      archived: { label: '📦 ARCHIVADA', bg: 'rgba(71, 85, 105, 0.25)', color: '#64748b' },
                    };

                    const currentBadge = statusConfig[cls.status] || {
                      label: cls.status.toUpperCase(),
                      bg: 'rgba(251, 191, 36, 0.15)',
                      color: 'var(--gold)',
                    };

                    return (
                      <div
                        key={cls.id}
                        style={{
                          background: 'var(--surface-3)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div>
                            <span className="badge" style={{ fontSize: '0.7rem', marginBottom: '0.3rem' }}>{cls.category}</span>
                            <h5 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{cls.title}</h5>
                            <p style={{ margin: '0.3rem 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                              {cls.scheduledAt} · Instructor: {cls.instructor}
                            </p>
                            {cls.partnerNotes && (
                              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--gold)' }}>
                                💬 Nota Socio JustMarkets: {cls.partnerNotes}
                              </p>
                            )}
                          </div>

                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.25rem 0.65rem',
                              borderRadius: '4px',
                              background: currentBadge.bg,
                              color: currentBadge.color,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {currentBadge.label}
                          </span>
                        </div>

                        {/* Status switcher and controls */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem', borderTop: '1px solid var(--line)', paddingTop: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Cambiar Estado:</span>
                            <select
                              value={cls.status}
                              onChange={(e) => handleUpdateClassStatus(cls.id, e.target.value as LiveClassItem['status'])}
                              style={{
                                background: 'var(--surface)',
                                color: '#fff',
                                border: '1px solid var(--line)',
                                borderRadius: '4px',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.76rem',
                              }}
                            >
                              <option value="borrador">Borrador</option>
                              <option value="pendiente_aprobacion">⏳ Enviar a Revisión JustMarkets</option>
                              <option value="aprobada">✓ Aprobada</option>
                              <option value="rechazada">✕ Rechazada (Observaciones)</option>
                              <option value="programada">📅 Programada</option>
                              <option value="en_vivo">🔴 En Vivo</option>
                              <option value="finalizada">Finalizada</option>
                              <option value="archivada">Archivada</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', gap: '0.45rem' }}>
                            {cls.status !== 'en_vivo' ? (
                              <button
                                type="button"
                                className="btn btn--emerald"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem' }}
                                onClick={() => handleUpdateClassStatus(cls.id, 'en_vivo')}
                              >
                                🔴 Iniciar Directo
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn--ghost"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', color: '#fca5a5' }}
                                onClick={() => handleUpdateClassStatus(cls.id, 'finalizada')}
                              >
                                ⏹️ Finalizar
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn btn--ghost"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', color: '#fca5a5' }}
                              onClick={() => handleDeleteClass(cls.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MODERACIÓN DE CHAT */}
          {activeTab === 'chat' && (
            <div>
              <div
                style={{
                  background: isGlobalChatMuted ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${isGlobalChatMuted ? '#ef4444' : 'var(--emerald)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2rem',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: isGlobalChatMuted ? '#fca5a5' : 'var(--emerald)', fontSize: '1.05rem' }}>
                    Estado del Chat Global: {isGlobalChatMuted ? 'SILENCIADO (Solo Lectura)' : 'ACTIVO'}
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: 'var(--muted)' }}>
                    {isGlobalChatMuted
                      ? 'Los alumnos no pueden enviar mensajes nuevos hasta que el administrador lo reanude.'
                      : 'Todos los alumnos con permiso activo pueden debatir y enviar confluencias.'}
                  </p>
                </div>

                <button
                  type="button"
                  className={isGlobalChatMuted ? 'btn btn--emerald' : 'btn btn--ghost'}
                  style={{ padding: '0.55rem 1.25rem', borderColor: isGlobalChatMuted ? 'transparent' : '#ef4444', color: isGlobalChatMuted ? 'var(--ink)' : '#fca5a5' }}
                  onClick={handleToggleGlobalChatMute}
                >
                  {isGlobalChatMuted ? '🔊 Habilitar Chat Global' : '🔇 Silenciar Chat Completo'}
                </button>
              </div>

              <h4 style={{ fontFamily: 'var(--font-head)', color: '#fff', fontSize: '1rem', marginBottom: '1rem' }}>
                Últimos Mensajes en Vivo ({chatMessages.length})
              </h4>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      background: 'var(--surface-3)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--gold)', fontSize: '0.88rem' }}>{msg.authorName}: </strong>
                      <span style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>{msg.text}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteChatMessage(msg.id)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        color: '#fca5a5',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                      }}
                      title="Borrar mensaje"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BIBLIOTECA & CAPITAL */}
          {activeTab === 'library' && (
            <div>
              {/* Header with quick stats */}
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontFamily: 'var(--font-head)' }}>
                    📚 Gestión de Biblioteca &amp; Auditoría de Descargas
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: 'var(--muted)' }}>
                    Control de asignación de libros a alumnos, activación de permisos y registro histórico de descargas.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className="badge badge--gold" style={{ fontSize: '0.75rem' }}>
                    Total Descargas Registradas: {downloadLogs.length}
                  </span>
                  <span className="badge" style={{ fontSize: '0.75rem' }}>
                    Catálogo: {libraryItems.length} Libros
                  </span>
                </div>
              </div>

              {/* Upload form and repository grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem', marginBottom: '2.5rem' }}>
                <form
                  onSubmit={handleAddLibraryResource}
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    padding: '1.5rem',
                  }}
                >
                  <h4 style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', marginBottom: '1rem', fontSize: '1.05rem' }}>
                    + Agregar Nuevo Libro a la Biblioteca
                  </h4>
                  <div style={{ display: 'grid', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Título del libro</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Smart Money Concepts (SMC): El Mapa de la Liquidez"
                        value={libTitle}
                        onChange={(e) => setLibTitle(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Descripción / Syllabus</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Contenido pedagógico, objetivos de aprendizaje y reglas de trading..."
                        value={libDesc}
                        onChange={(e) => setLibDesc(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-body)' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Categoría Oficial</label>
                        <select
                          value={libCat}
                          onChange={(e) => setLibCat(e.target.value as LibraryCategory)}
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                        >
                          <option value="Fundamentos">Fundamentos de Trading</option>
                          <option value="Trading Institucional">Trading Institucional</option>
                          <option value="Scalping">Scalping</option>
                          <option value="Múltiples Estrategias">Múltiples Estrategias</option>
                          <option value="Análisis Técnico y Mercado">Análisis Técnico y Mercado</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Formato</label>
                        <select
                          value={libFormat}
                          onChange={(e) => setLibFormat(e.target.value)}
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                        >
                          <option value="PDF">PDF Oficial</option>
                          <option value="EPUB">EPUB E-Reader</option>
                          <option value="XLSX">Excel Plantilla</option>
                          <option value="DOCX">Documento</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Número de Páginas</label>
                        <input
                          type="number"
                          value={libPages}
                          onChange={(e) => setLibPages(Number(e.target.value))}
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Tamaño Archivo</label>
                        <input
                          type="text"
                          value={libSize}
                          onChange={(e) => setLibSize(e.target.value)}
                          placeholder="Ej: 9.4 MB"
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn--emerald" style={{ marginTop: '0.5rem' }}>
                      Guardar Recurso en Repositorio &rarr;
                    </button>
                  </div>
                </form>

                {/* Catalog list */}
                <div>
                  <h4 style={{ fontFamily: 'var(--font-head)', color: '#fff', fontSize: '1.05rem', marginBottom: '1rem' }}>
                    Recursos en Repositorio ({libraryItems.length})
                  </h4>
                  <div style={{ display: 'grid', gap: '0.85rem', maxHeight: '480px', overflowY: 'auto' }}>
                    {libraryItems.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-3)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)' }}>
                        No hay libros cargados aún. El catálogo se sincroniza automáticamente con los libros oficiales.
                      </div>
                    ) : (
                      libraryItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: 'var(--surface-3)',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1.1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <span className="badge" style={{ fontSize: '0.68rem' }}>{item.category}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--gold-soft)' }}>{item.format}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--emerald)' }}>· {item.downloadCount || 0} descargas</span>
                            </div>
                            <h5 style={{ margin: 0, fontSize: '0.98rem', color: '#fff' }}>{item.title}</h5>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.4 }}>{item.description}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteLibraryItem(item.id)}
                            style={{ background: 'transparent', border: 0, color: '#fca5a5', cursor: 'pointer', fontSize: '0.9rem', padding: '0.4rem' }}
                            title="Eliminar libro"
                          >
                            🗑️
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* AUDITORÍA DE DESCARGAS: QUIÉN DESCARGÓ QUÉ Y CUÁNDO */}
              <div
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-head)', color: 'var(--gold)', fontSize: '1.1rem' }}>
                      📋 Registro de Auditoría de Descargas (Quién descargó qué y cuándo)
                    </h4>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                      Trazabilidad inmutable de todas las descargas realizadas por los alumnos con fecha, hora e identificación.
                    </p>
                  </div>

                  <span className="badge badge--gold" style={{ fontSize: '0.74rem' }}>
                    {downloadLogs.length} Descargas Registradas
                  </span>
                </div>

                {downloadLogs.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                    Aún no se registran descargas de libros en la base de datos de auditoría.
                  </div>
                ) : (
                  <div className="table-scroll" style={{ maxHeight: '350px' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha y Hora (UTC)</th>
                          <th>Alumno</th>
                          <th>Correo</th>
                          <th>Libro Descargado</th>
                          <th>Categoría</th>
                        </tr>
                      </thead>
                      <tbody>
                        {downloadLogs.map((log) => {
                          let formattedDate = 'Reciente';
                          if (log.downloadedAt) {
                            try {
                              const d = (log.downloadedAt as { toDate?: () => Date }).toDate
                                ? (log.downloadedAt as { toDate: () => Date }).toDate()
                                : new Date(log.downloadedAt as string | number);
                              formattedDate = d.toLocaleString('es-ES', { timeZone: 'UTC' }) + ' UTC';
                            } catch {
                              formattedDate = 'Registrado';
                            }
                          }

                          return (
                            <tr key={log.id}>
                              <td style={{ fontSize: '0.78rem', color: 'var(--gold-soft)', whiteSpace: 'nowrap' }}>
                                🕒 {formattedDate}
                              </td>
                              <td>
                                <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{log.userName}</strong>
                              </td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                {log.userEmail}
                              </td>
                              <td>
                                <span style={{ color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600 }}>
                                  📖 {log.resourceTitle}
                                </span>
                              </td>
                              <td>
                                <span className="badge" style={{ fontSize: '0.68rem' }}>
                                  {log.category}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: NOTIFICACIONES Y CORREOS TRANSACCIONALES */}
          {activeTab === 'broadcast' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {/* 1. In-App Notification Dispatcher */}
                <form
                  onSubmit={handleSendNotification}
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>📢</span>
                    <h4 style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', margin: 0, fontSize: '1.05rem' }}>
                      Notificación en Plataforma (Campana)
                    </h4>
                  </div>
                  <div style={{ display: 'grid', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Título del aviso</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Apertura de Sala en Vivo en 15 minutos"
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Mensaje</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Detalles del aviso o recordatorio..."
                        value={notifMsg}
                        onChange={(e) => setNotifMsg(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-body)' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Destinatarios</label>
                        <select
                          value={notifTarget}
                          onChange={(e) => setNotifTarget(e.target.value)}
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                        >
                          <option value="all">Todos los Usuarios</option>
                          <option value="alumno">Solo Alumnos</option>
                          <option value="aprobador">Solo Aprobadores Socio</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Prioridad</label>
                        <select
                          value={notifType}
                          onChange={(e) => setNotifType(e.target.value)}
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                        >
                          <option value="urgent">🔴 Urgente / En Vivo</option>
                          <option value="info">🔵 Informativo</option>
                          <option value="class">🟡 Recordatorio de Clase</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn btn--emerald" style={{ marginTop: '0.5rem' }}>
                      Emitir Notificación en Plataforma &rarr;
                    </button>
                  </div>
                </form>

                {/* 2. Transactional Email Dispatcher */}
                <form
                  onSubmit={handleSendTestEmail}
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: 'var(--radius)',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>✉️</span>
                    <h4 style={{ fontFamily: 'var(--font-head)', color: '#93c5fd', margin: 0, fontSize: '1.05rem' }}>
                      Despachador de Correo Transaccional
                    </h4>
                  </div>
                  <div style={{ display: 'grid', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                        Plantilla de Correo
                      </label>
                      <select
                        value={testEmailTemplate}
                        onChange={(e) => setTestEmailTemplate(e.target.value as any)}
                        style={{ width: '100%', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                      >
                        <option value="bienvenida">🎓 Correo de Bienvenida (Nuevo Registro)</option>
                        <option value="clase_en_vivo">🔴 Aviso de Clase en Vivo (En Directo)</option>
                        <option value="nuevo_contenido">📚 Aviso de Nuevo Contenido Publicado</option>
                        <option value="cambio_permisos">🔑 Notificación de Cambio de Permisos</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                        Alumno Destinatario (o escribe un correo)
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          value={testEmailRecipient}
                          onChange={(e) => setTestEmailRecipient(e.target.value)}
                          style={{ flex: 1, padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                        >
                          <option value="">-- Seleccionar de la lista de alumnos --</option>
                          {users.map((u) => (
                            <option key={u.uid} value={u.email}>
                              {u.displayName} ({u.email}) [{u.role.toUpperCase()}]
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="email"
                        placeholder="O ingresa un correo manual: alumno@ejemplo.com"
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        style={{ width: '100%', marginTop: '0.4rem', padding: '0.55rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: '#93c5fd' }}>
                      ℹ️ Incluye aviso de compliance de JustMarkets, firma oficial de Sr.smith, enlace al portal y botones para modificar preferencias o darse de baja.
                    </div>

                    <button type="submit" className="btn btn--primary" style={{ marginTop: '0.25rem' }}>
                      Despachar Correo Transaccional &rarr;
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. Realtime In-App Notification Feed */}
              <div
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-head)', color: '#fff', fontSize: '1.05rem', margin: 0 }}>
                    🔔 Historial de Avisos en Plataforma ({notifications.length})
                  </h4>
                  <span className="badge" style={{ fontSize: '0.7rem' }}>Enviados a la campana</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                  {notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>{n.type.toUpperCase()} · Destino: {n.targetRole}</span>
                      </div>
                      <h5 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>{n.title}</h5>
                      <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Audit Table: Transactional Email Logs */}
              <div
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-head)', color: 'var(--gold)', fontSize: '1.1rem', margin: 0 }}>
                      📨 Registro de Auditoría de Correos Transaccionales ({emailLogs.length})
                    </h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                      Trazabilidad completa de correos de bienvenida, clases en vivo, nuevo contenido y cambios de permisos enviados por la plataforma.
                    </p>
                  </div>
                </div>

                {emailLogs.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                    Aún no se han despachado correos transaccionales en esta sesión.
                  </div>
                ) : (
                  <div className="table-scroll" style={{ maxHeight: '380px' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha / Hora (UTC)</th>
                          <th>Destinatario</th>
                          <th>Plantilla</th>
                          <th>Asunto</th>
                          <th>Estado</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emailLogs.map((log) => {
                          let formattedDate = 'Reciente';
                          if (log.createdAt) {
                            try {
                              const d = (log.createdAt as { toDate?: () => Date }).toDate
                                ? (log.createdAt as { toDate: () => Date }).toDate()
                                : new Date(log.createdAt as string | number);
                              formattedDate = d.toLocaleString('es-ES', { timeZone: 'UTC' }) + ' UTC';
                            } catch {
                              formattedDate = 'Registrado';
                            }
                          }

                          return (
                            <tr key={log.id}>
                              <td style={{ fontSize: '0.78rem', color: 'var(--gold-soft)', whiteSpace: 'nowrap' }}>
                                🕒 {formattedDate}
                              </td>
                              <td>
                                <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{log.toName}</strong>
                                <br />
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{log.toEmail}</span>
                              </td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '0.68rem',
                                    background:
                                      log.templateType === 'bienvenida'
                                        ? 'rgba(245, 158, 11, 0.15)'
                                        : log.templateType === 'clase_en_vivo'
                                        ? 'rgba(239, 68, 68, 0.15)'
                                        : log.templateType === 'nuevo_contenido'
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : 'rgba(59, 130, 246, 0.15)',
                                    color:
                                      log.templateType === 'bienvenida'
                                        ? '#f59e0b'
                                        : log.templateType === 'clase_en_vivo'
                                        ? '#ef4444'
                                        : log.templateType === 'nuevo_contenido'
                                        ? '#10b981'
                                        : '#93c5fd',
                                  }}
                                >
                                  {log.templateType.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                                {log.subject}
                              </td>
                              <td>
                                <span className="badge badge--emerald" style={{ fontSize: '0.68rem' }}>
                                  ✓ {log.status.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn--ghost"
                                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                                  onClick={() => setViewingEmail(log)}
                                >
                                  👁️ Ver HTML
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SEGURIDAD, AUDITORÍA Y COPIAS DE SEGURIDAD (OWASP TOP 10) */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Top Security & Backup Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* 1. Database Backup Card */}
                <div
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 'var(--radius)',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>💾</span>
                    <h4 style={{ margin: 0, color: 'var(--emerald)', fontSize: '1.1rem', fontFamily: 'var(--font-head)' }}>
                      Copias de Seguridad Periódicas
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    Genera y descarga un snapshot completo de las colecciones de Firestore con verificación criptográfica SHA-256 e integridad inmutable.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem', fontSize: '0.78rem' }}>
                    <div style={{ padding: '0.6rem', background: 'var(--surface)', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--muted)', display: 'block' }}>Frecuencia Programada:</span>
                      <strong style={{ color: '#fff' }}>Diaria (02:00 UTC)</strong>
                    </div>
                    <div style={{ padding: '0.6rem', background: 'var(--surface)', borderRadius: '6px' }}>
                      <span style={{ color: 'var(--muted)', display: 'block' }}>Cifrado de Tránsito:</span>
                      <strong style={{ color: 'var(--emerald)' }}>TLS 1.3 / AES-256</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn--emerald"
                    onClick={handleTriggerBackup}
                    disabled={isBackingUp}
                    style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.84rem' }}
                  >
                    {isBackingUp ? 'Exportando Snapshot...' : 'Generar & Descargar Respaldo JSON 💾'}
                  </button>
                </div>

                {/* 2. Security Status Indicators */}
                <div
                  style={{
                    background: 'var(--surface-3)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                    <h4 style={{ margin: 0, color: '#93c5fd', fontSize: '1.1rem', fontFamily: 'var(--font-head)' }}>
                      Estado de Protección OWASP Top 10
                    </h4>
                  </div>

                  <div style={{ display: 'grid', gap: '0.55rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface)', borderRadius: '4px' }}>
                      <span>Autenticación:</span>
                      <strong style={{ color: 'var(--emerald)' }}>Google OAuth 2.0 (Cero Contraseñas)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface)', borderRadius: '4px' }}>
                      <span>Cabecera HSTS:</span>
                      <strong style={{ color: 'var(--emerald)' }}>max-age=31536000 (Activa)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface)', borderRadius: '4px' }}>
                      <span>Anti-Bots &amp; Rate Limit:</span>
                      <strong style={{ color: 'var(--emerald)' }}>Turnstile / 5 msgs/min (Activo)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface)', borderRadius: '4px' }}>
                      <span>Enlaces de Descarga:</span>
                      <strong style={{ color: 'var(--emerald)' }}>Firmados HMAC-SHA256 (15 min)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--surface)', borderRadius: '4px' }}>
                      <span>Motor Antivirus:</span>
                      <strong style={{ color: 'var(--emerald)' }}>ClamAV 1.4 &amp; Magic Bytes (Activo)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Immutable Admin Audit Logs Table */}
              <div
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--gold)', fontSize: '1.1rem', fontFamily: 'var(--font-head)' }}>
                      📋 Registro Inmutable de Auditoría de Acciones del Administrador ({adminAuditLogs.length})
                    </h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                      Trazabilidad auditable en servidor: cambios de roles, aprobaciones de clases, silenciamientos y políticas de seguridad.
                    </p>
                  </div>
                </div>

                {adminAuditLogs.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                    Aún no se registran acciones administrativas en esta sesión.
                  </div>
                ) : (
                  <div className="table-scroll" style={{ maxHeight: '420px' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha y Hora (UTC)</th>
                          <th>Administrador</th>
                          <th>Acción</th>
                          <th>Objetivo</th>
                          <th>Detalles</th>
                          <th>IP Cliente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminAuditLogs.map((log, idx) => {
                          let formattedDate = 'Reciente';
                          if (log.createdAt) {
                            try {
                              const d = (log.createdAt as { toDate?: () => Date }).toDate
                                ? (log.createdAt as { toDate: () => Date }).toDate()
                                : new Date(log.createdAt as string | number);
                              formattedDate = d.toLocaleString('es-ES', { timeZone: 'UTC' }) + ' UTC';
                            } catch {
                              formattedDate = 'Registrado';
                            }
                          }

                          return (
                            <tr key={log.id || idx}>
                              <td style={{ fontSize: '0.78rem', color: 'var(--gold-soft)', whiteSpace: 'nowrap' }}>
                                🕒 {formattedDate}
                              </td>
                              <td style={{ fontSize: '0.82rem', color: '#fff' }}>
                                <strong>{log.adminEmail}</strong>
                              </td>
                              <td>
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '0.66rem',
                                    background: 'rgba(251, 191, 36, 0.15)',
                                    color: 'var(--gold)',
                                  }}
                                >
                                  {log.actionType}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                                {log.targetType.toUpperCase()}
                              </td>
                              <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                                {log.details}
                              </td>
                              <td style={{ fontSize: '0.76rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                                {log.ipAddress || '127.0.0.1'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: BUZÓN DE FEEDBACK, SUGERENCIAS Y CORRECCIONES */}
          {activeTab === 'feedback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Tarjetas de Resumen KPI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--surface-3)', border: '1px solid var(--line)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total de Reportes
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
                    {feedbackReports.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    Sugerencias, correcciones y avisos
                  </div>
                </div>

                <div style={{ background: 'var(--surface-3)', border: '1px solid #f59e0b', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#fde68a', textTransform: 'uppercase', fontWeight: 700 }}>
                    Pendientes de Revisión
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
                    {feedbackReports.filter((f) => f.status === 'pendiente').length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#fde68a', marginTop: '0.2rem' }}>
                    Requieren atención técnica
                  </div>
                </div>

                <div style={{ background: 'var(--surface-3)', border: '1px solid var(--emerald)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>
                    Resueltos / Aplicados
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)', marginTop: '0.25rem' }}>
                    {feedbackReports.filter((f) => f.status === 'resuelto').length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a7f3d0', marginTop: '0.2rem' }}>
                    Mejoras implementadas
                  </div>
                </div>

                <div style={{ background: 'var(--surface-3)', border: '1px solid var(--gold)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-soft)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Calificación Promedio
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold)', marginTop: '0.25rem' }}>
                    {(() => {
                      const ratings = feedbackReports.filter((f) => typeof f.rating === 'number' && f.rating > 0);
                      if (ratings.length === 0) return '5.0 ★';
                      const avg = ratings.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratings.length;
                      return `${avg.toFixed(1)} ★`;
                    })()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-soft)', marginTop: '0.2rem' }}>
                    Satisfacción global de alumnos
                  </div>
                </div>
              </div>

              {/* Filtros de Categoría y Estado */}
              <div
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>Categoría:</span>
                  <button
                    type="button"
                    onClick={() => setFeedbackCategoryFilter('all')}
                    className={`quiz__btn ${feedbackCategoryFilter === 'all' ? 'active' : ''}`}
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    Todos ({feedbackReports.length})
                  </button>
                  {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((cat) => {
                    const info = CATEGORY_LABELS[cat];
                    const count = feedbackReports.filter((f) => f.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFeedbackCategoryFilter(cat)}
                        className={`quiz__btn ${feedbackCategoryFilter === cat ? 'active' : ''}`}
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        {info.icon} {info.label.split(' ')[0]} ({count})
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>Estado:</span>
                  <select
                    value={feedbackStatusFilter}
                    onChange={(e) => setFeedbackStatusFilter(e.target.value as any)}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color: 'var(--text)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                    }}
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="pendiente">Solo Pendientes</option>
                    <option value="en_revision">En Evaluación Técnica</option>
                    <option value="resuelto">Resueltos / Aplicados</option>
                    <option value="descartado">Descartados / Cerrados</option>
                  </select>
                </div>
              </div>

              {/* Lista de Reportes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(() => {
                  const filtered = feedbackReports.filter((item) => {
                    if (feedbackCategoryFilter !== 'all' && item.category !== feedbackCategoryFilter) return false;
                    if (feedbackStatusFilter !== 'all' && item.status !== feedbackStatusFilter) return false;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div
                        style={{
                          background: 'var(--surface-3)',
                          border: '1px solid var(--line)',
                          padding: '3rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          textAlign: 'center',
                          color: 'var(--muted)',
                        }}
                      >
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
                        <strong style={{ fontSize: '1rem', color: '#f8fafc', display: 'block' }}>
                          No hay reportes de feedback en esta categoría
                        </strong>
                        <span style={{ fontSize: '0.82rem', marginTop: '0.25rem', display: 'block' }}>
                          Los aportes, sugerencias y correcciones enviadas por los alumnos aparecerán aquí en tiempo real.
                        </span>
                      </div>
                    );
                  }

                  return filtered.map((item) => {
                    const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.sugerencia;
                    const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.pendiente;
                    const priorityInfo = PRIORITY_LABELS[item.priority] || PRIORITY_LABELS.media;
                    const draft = feedbackAdminDrafts[item.id] !== undefined ? feedbackAdminDrafts[item.id] : item.adminResponse || '';

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--surface-3)',
                          border: `1px solid ${item.status === 'pendiente' ? '#f59e0b' : item.status === 'resuelto' ? 'var(--emerald)' : 'var(--line)'}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                background: `${catInfo.color}15`,
                                border: `1px solid ${catInfo.color}40`,
                                color: catInfo.color,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                              }}
                            >
                              <span>{catInfo.icon}</span>
                              <span>{catInfo.label}</span>
                            </span>

                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.06)',
                                fontSize: '0.72rem',
                                color: priorityInfo.color,
                                fontWeight: 600,
                              }}
                            >
                              Prioridad: {priorityInfo.label}
                            </span>

                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                fontSize: '0.72rem',
                                color: '#38bdf8',
                              }}
                            >
                              Módulo: {MODULE_LABELS[item.module] || item.module}
                            </span>
                          </div>

                          <span
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: statusInfo.color,
                              background: `${statusInfo.color}15`,
                              border: `1px solid ${statusInfo.color}40`,
                            }}
                          >
                            ● {statusInfo.label}
                          </span>
                        </div>

                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                            {item.title}
                          </h4>
                          <p style={{ margin: '0.5rem 0 0', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {item.description}
                          </p>
                        </div>

                        {item.rating && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#facc15', fontSize: '1.1rem' }}>
                            {'★'.repeat(item.rating)}
                            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginLeft: '0.3rem' }}>
                              ({item.rating} de 5 estrellas otorgadas)
                            </span>
                          </div>
                        )}

                        {item.stepsToReproduce && (
                          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--line)' }}>
                            <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                              Pasos para reproducir reportados:
                            </div>
                            <pre style={{ margin: 0, fontSize: '0.78rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                              {item.stepsToReproduce}
                            </pre>
                          </div>
                        )}

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--line)', fontSize: '0.76rem', color: 'var(--muted)' }}>
                          <div>
                            Remitente: <strong style={{ color: '#fff' }}>{item.userName}</strong> ({item.userEmail || 'Sin email'}) · Rol: {item.userRole}
                          </div>
                          <div>
                            Ticket ID: <code style={{ color: 'var(--gold-soft)' }}>{item.id}</code>
                          </div>
                        </div>

                        {/* Área de Resolución y Respuesta del Administrador */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.76rem', color: 'var(--gold-soft)', fontWeight: 700 }}>
                              👑 Resolución y Respuesta del Sr. Smith / Equipo Técnico:
                            </span>
                            {item.adminResponse && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--emerald)', fontWeight: 600 }}>
                                ✓ Respuesta registrada
                              </span>
                            )}
                          </div>

                          <input
                            type="text"
                            placeholder="Escribe una nota interna o respuesta institucional para este ticket…"
                            value={draft}
                            onChange={(e) => setFeedbackAdminDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--line)',
                              color: '#fff',
                              borderRadius: '6px',
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.8rem',
                            }}
                          />

                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await updateFeedbackStatus(item.id, 'en_revision', draft);
                                    await logAdminAction({
                                      adminUid: 'admin',
                                      adminEmail: 'empresaalhadiqainvest@gmail.com',
                                      actionType: 'UPDATE_SECURITY_POLICY',
                                      targetType: 'system',
                                      targetId: item.id,
                                      details: `Ticket en evaluación técnica: ${item.title}`,
                                    });
                                    showNotification('Ticket marcado: En Evaluación Técnica');
                                  } catch (err) {
                                    console.error(err);
                                    showNotification('Error al actualizar estado');
                                  }
                                }}
                                style={{
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  border: '1px solid #38bdf8',
                                  color: '#38bdf8',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                ⏳ Marcar En Evaluación
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await updateFeedbackStatus(item.id, 'resuelto', draft || 'Mejora o corrección verificada y aplicada en la plataforma.');
                                    await logAdminAction({
                                      adminUid: 'admin',
                                      adminEmail: 'empresaalhadiqainvest@gmail.com',
                                      actionType: 'UPDATE_SECURITY_POLICY',
                                      targetType: 'system',
                                      targetId: item.id,
                                      details: `Ticket resuelto y aplicado: ${item.title}`,
                                    });
                                    showNotification('Ticket marcado: Resuelto / Aplicado');
                                  } catch (err) {
                                    console.error(err);
                                    showNotification('Error al actualizar estado');
                                  }
                                }}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  border: '1px solid var(--emerald)',
                                  color: 'var(--emerald)',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                ✓ Marcar como Resuelto
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await updateFeedbackStatus(item.id, 'descartado', draft);
                                    showNotification('Ticket marcado: Cerrado');
                                  } catch (err) {
                                    console.error(err);
                                    showNotification('Error al actualizar estado');
                                  }
                                }}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid var(--line)',
                                  color: 'var(--muted)',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Cerrar
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`¿Seguro que deseas eliminar permanentemente el ticket "${item.title}"?`)) {
                                  try {
                                    await deleteFeedbackReport(item.id);
                                    await logAdminAction({
                                      adminUid: 'admin',
                                      adminEmail: 'empresaalhadiqainvest@gmail.com',
                                      actionType: 'UPDATE_SECURITY_POLICY',
                                      targetType: 'system',
                                      targetId: item.id,
                                      details: `Ticket eliminado: ${item.title}`,
                                    });
                                    showNotification('Ticket eliminado correctamente');
                                  } catch (err) {
                                    console.error(err);
                                    showNotification('Error al eliminar ticket');
                                  }
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                              }}
                            >
                              Eliminar ticket
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 2rem',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(15, 23, 42, 0.7)',
          }}
        >
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cerrar Panel
          </button>
        </div>
      </div>

      {/* Modal de Asignación de Libros por Alumno */}
      {assigningUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 750,
            background: 'rgba(7, 11, 20, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--gold)',
              borderRadius: 'var(--radius)',
              maxWidth: '600px',
              width: '100%',
              padding: '1.75rem',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontFamily: 'var(--font-head)' }}>
                  📚 Asignar Libros y Recursos al Alumno
                </h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--gold)' }}>
                  {assigningUser.displayName} ({assigningUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningUser(null)}
                style={{ background: 'transparent', border: 0, color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              Selecciona qué libros y guías están específicamente autorizados para este alumno.
              La descarga solo estará disponible para los recursos que marques aquí cuando el permiso de descarga esté habilitado.
            </p>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '0.5rem', marginBottom: '1.25rem' }}>
              {libraryItems.length === 0 ? (
                <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem' }}>
                  No hay libros cargados en el repositorio de la biblioteca aún.
                </div>
              ) : (
                libraryItems.map((book) => {
                  const isChecked = selectedBookIds.includes(book.id);
                  return (
                    <label
                      key={book.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: isChecked ? 'rgba(251, 191, 36, 0.08)' : 'var(--surface)',
                        border: `1px solid ${isChecked ? 'var(--gold)' : 'var(--line)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookIds((prev) => [...prev, book.id]);
                          } else {
                            setSelectedBookIds((prev) => prev.filter((id) => id !== book.id));
                          }
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#fff' }}>{book.title}</strong>
                          <span className="badge" style={{ fontSize: '0.65rem' }}>{book.category}</span>
                        </div>
                        <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                          {book.format} · {book.description.substring(0, 75)}...
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                onClick={() => {
                  if (selectedBookIds.length === libraryItems.length) {
                    setSelectedBookIds([]);
                  } else {
                    setSelectedBookIds(libraryItems.map((b) => b.id));
                  }
                }}
              >
                {selectedBookIds.length === libraryItems.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setAssigningUser(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn--emerald"
                  onClick={handleSaveAssignedBooks}
                >
                  Guardar Asignaciones ({selectedBookIds.length}) &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asignación de Módulos Al-Hadiqa Capital */}
      {assigningCapitalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(160deg, var(--surface-3), var(--surface))',
              border: '1px solid #93c5fd',
              borderRadius: 'var(--radius)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.75rem',
              gap: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#93c5fd', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏛️</span> Asignar Módulos de Al-Hadiqa Capital
                </h4>
                <button
                  type="button"
                  onClick={() => setAssigningCapitalUser(null)}
                  style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--text)' }}>
                Alumno: <strong>{assigningCapitalUser.displayName}</strong> ({assigningCapitalUser.email})
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                Selecciona qué módulos formativos tendrá habilitados este alumno. Si dejas todos seleccionados, tendrá acceso libre a todo el programa.
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
              {CAPITAL_MODULES.map((mod) => {
                const isChecked = selectedCapitalModuleIds.includes(mod.id);
                return (
                  <label
                    key={mod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      background: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface)',
                      border: `1px solid ${isChecked ? '#93c5fd' : 'var(--line)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCapitalModuleIds((prev) => [...prev, mod.id]);
                        } else {
                          setSelectedCapitalModuleIds((prev) => prev.filter((id) => id !== mod.id));
                        }
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                          {mod.icon} {mod.title}
                        </strong>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>{mod.pillarLabel}</span>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: 'var(--muted)', display: 'block' }}>
                        {mod.lessons.length} lecciones · {mod.subtitle}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                onClick={() => {
                  if (selectedCapitalModuleIds.length === CAPITAL_MODULES.length) {
                    setSelectedCapitalModuleIds([]);
                  } else {
                    setSelectedCapitalModuleIds(CAPITAL_MODULES.map((m) => m.id));
                  }
                }}
              >
                {selectedCapitalModuleIds.length === CAPITAL_MODULES.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setAssigningCapitalUser(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn--emerald"
                  onClick={handleSaveAssignedCapitalModules}
                >
                  Guardar Módulos ({selectedCapitalModuleIds.length}) &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor de Correo Transaccional HTML */}
      {viewingEmail && (
        <EmailViewerModal
          email={viewingEmail}
          isOpen={Boolean(viewingEmail)}
          onClose={() => setViewingEmail(null)}
        />
      )}
    </div>
  );
};
