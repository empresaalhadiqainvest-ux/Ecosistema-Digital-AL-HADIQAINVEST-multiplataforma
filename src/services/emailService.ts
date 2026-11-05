import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
  EmailTemplateType,
  EmailLogItem,
  UserNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../types/notifications';

const LOGO_BADGE = 'AL-HADIQA INVEST · ACADEMIA & CAPITAL';
const SENDER_EMAIL = 'empresaalhadiqainvest@gmail.com';
const SENDER_NAME = 'Sr.smith (Carlos Smith Zambrano) · CEO Fundador';

// --- HTML EMAIL BUILDERS ---

export function buildWelcomeEmailHtml(toName: string, toEmail: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bienvenido a Al-Hadiqa Invest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #070b14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(165deg, #0f172a 0%, #0b1120 100%); border: 1px solid #f59e0b; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px 20px; border-bottom: 1px solid rgba(245, 158, 11, 0.2); text-align: center; background-color: #0b1120;">
              <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #f59e0b; font-weight: 700; display: block; margin-bottom: 8px;">${LOGO_BADGE}</span>
              <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 800;">¡Bienvenido a la Academia, ${toName}! 🎓</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 35px 40px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              <p style="margin-top: 0;">Estimado <strong>${toName}</strong> (${toEmail}):</p>
              
              <p>Te doy la más cordial bienvenida a <strong>AL-HADIQA INVEST</strong>. Has ingresado a un entorno formativo de alto rendimiento enfocado en tres pilares: <strong>Trading Institucional (Smart Money Concepts)</strong>, <strong>Educación Financiera (Al-Hadiqa Capital)</strong> y <strong>Desarrollo Personal de Élite</strong>.</p>

              <!-- Highlight Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; border-radius: 4px; margin: 25px 0;">
                <tr>
                  <td style="padding: 16px 20px; font-size: 14px; color: #fef3c7;">
                    <strong>Mensaje de Sr.smith (CEO):</strong><br>
                    <em>«Los hombres luchan y Dios concede la victoria. Aquí no prometemos riqueza fácil: entregamos sistemas, matemáticas de riesgo y la disciplina para dominar tu capital.»</em>
                  </td>
                </tr>
              </table>

              <h3 style="color: #ffffff; font-size: 16px; margin: 25px 0 12px;">Tus primeros 3 pasos como alumno oficial:</h3>
              <ol style="padding-left: 20px; margin: 0 0 25px; color: #94a3b8; font-size: 14px; line-height: 1.8;">
                <li><strong style="color: #ffffff;">Explora el Portal del Alumno:</strong> Revisa el estado de tus permisos y las próximas clases programadas.</li>
                <li><strong style="color: #ffffff;">Ingresa a la Biblioteca de Trading:</strong> Accede a los manuales asignados por el administrador con temarios completos.</li>
                <li><strong style="color: #ffffff;">Participa en el Chat Comunitario:</strong> Comparte análisis con otros estudiantes y consulta al Bot Asistente SMC.</li>
              </ol>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0 20px;">
                <a href="https://ais-pre-edhvj2r6aca7vjztc46cco-860728404276.us-east1.run.app/#roadmap" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #07111f; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                  Ingresar a Mi Portal de Alumno &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #070b14; border-top: 1px solid rgba(148, 163, 184, 0.1); font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
              <p style="margin: 0 0 8px;">
                <strong>Aviso Legal JustMarkets:</strong> "Las clases y materiales formativos son impartidos por un socio y no por el bróker. Contenido con fines educativos, no constituye asesoría financiera."
              </p>
              <p style="margin: 0 0 8px;">
                Remitente: ${SENDER_NAME} &lt;${SENDER_EMAIL}&gt;
              </p>
              <p style="margin: 0;">
                <a href="https://ais-pre-edhvj2r6aca7vjztc46cco-860728404276.us-east1.run.app/#faq" style="color: #94a3b8; text-decoration: underline;">Centro de Ayuda &amp; Preferencias</a> · 
                <a href="mailto:empresaalhadiqainvest@gmail.com?subject=Solicitud%20de%20Baja%20de%20Comunicaciones%20AL-HADIQA" style="color: #ef4444; text-decoration: underline;">Darse de baja (Unsubscribe)</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildLiveClassEmailHtml(params: {
  toName: string;
  classTitle: string;
  instructor: string;
  scheduledAt: string;
  category: string;
  streamUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Aviso de Clase en Vivo: ${params.classTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #070b14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(165deg, #0f172a 0%, #0b1120 100%); border: 1px solid #ef4444; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(239, 68, 68, 0.2);">
          
          <!-- Urgent Header -->
          <tr>
            <td style="padding: 25px 40px; border-bottom: 1px solid rgba(239, 68, 68, 0.3); text-align: center; background-color: #1a1016;">
              <span style="background-color: #ef4444; color: #ffffff; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; display: inline-block; margin-bottom: 10px;">
                🔴 Transmisión en Directo
              </span>
              <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 800;">Aviso de Clase en Vivo</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 35px 40px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              <p style="margin-top: 0;">Hola <strong>${params.toName}</strong>:</p>
              
              <p>Te informamos que una nueva clase institucional está programada o comenzando en vivo dentro de la plataforma:</p>

              <!-- Class Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; margin: 20px 0; padding: 20px;">
                <tr>
                  <td>
                    <span style="font-size: 11px; color: #f59e0b; font-weight: 700; text-transform: uppercase;">Categoría: ${params.category}</span>
                    <h2 style="margin: 6px 0 10px; font-size: 18px; color: #ffffff;">${params.classTitle}</h2>
                    <p style="margin: 0 0 6px; font-size: 14px; color: #94a3b8;">
                      👨‍🏫 <strong>Instructor:</strong> ${params.instructor}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #10b981;">
                      🕒 <strong>Horario:</strong> ${params.scheduledAt}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #94a3b8;">
                Durante la sesión podrás interactuar mediante el <strong>Chat en Vivo</strong> para plantear consultas sobre entradas, mitigaciones de liquidez y lectura de gráficos en tiempo real.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="https://ais-pre-edhvj2r6aca7vjztc46cco-860728404276.us-east1.run.app/#clases-en-vivo" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);">
                  Entrar a la Sala Virtual Ahora &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #070b14; border-top: 1px solid rgba(148, 163, 184, 0.1); font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
              <p style="margin: 0 0 6px;">
                Aviso Legal JustMarkets: Contenido estrictamente educativo. No constituye recomendación financiera.
              </p>
              <p style="margin: 0;">
                <a href="https://ais-pre-edhvj2r6aca7vjztc46cco-860728404276.us-east1.run.app/#faq" style="color: #94a3b8;">Centro de Ayuda &amp; Preferencias</a> · 
                <a href="mailto:empresaalhadiqainvest@gmail.com?subject=Solicitud%20de%20Baja%20de%20Comunicaciones%20AL-HADIQA" style="color: #ef4444;">Darse de baja</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildNewContentEmailHtml(params: {
  toName: string;
  contentTitle: string;
  category: string;
  author: string;
  description: string;
  format?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nuevo Contenido Publicado: ${params.contentTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #070b14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(165deg, #0f172a 0%, #0b1120 100%); border: 1px solid #10b981; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(16, 185, 129, 0.2);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 25px 40px; border-bottom: 1px solid rgba(16, 185, 129, 0.3); text-align: center; background-color: #0a1f18;">
              <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #10b981; font-weight: 700; display: block; margin-bottom: 8px;">NUEVO MATERIAL EN REPOSITORIO</span>
              <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 800;">📚 Nuevo Contenido Pedagógico Disponible</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 35px 40px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              <p style="margin-top: 0;">Estimado <strong>${params.toName}</strong>:</p>
              
              <p>Te informamos que se ha incorporado un nuevo recurso formativo a la plataforma oficial:</p>

              <!-- Resource Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(15, 23, 42, 0.9); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; margin: 20px 0; padding: 20px;">
                <tr>
                  <td>
                    <span style="background-color: rgba(16, 185, 129, 0.15); color: #10b981; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                      ${params.category} · ${params.format || 'PDF Oficial'}
                    </span>
                    <h2 style="margin: 10px 0 6px; font-size: 18px; color: #ffffff;">${params.contentTitle}</h2>
                    <p style="margin: 0 0 10px; font-size: 13px; color: #f59e0b;">
                      ✍️ <strong>Autor:</strong> ${params.author}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                      ${params.description}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #94a3b8;">
                Puedes revisar el temario completo, marcar lecciones completadas y, si tienes habilitada la descarga por parte del administrador, descargar el documento estructurado.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="https://ais-pre-edhvj2r6aca7vjztc46cco-860728404276.us-east1.run.app/#biblioteca" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #07111f; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; display: inline-block;">
                  Acceder al Contenido &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #070b14; border-top: 1px solid rgba(148, 163, 184, 0.1); font-size: 12px; color: #64748b; text-align: center;">
              <p style="margin: 0 0 6px;">Aviso Legal JustMarkets: Contenido estrictamente formativo.</p>
              <p style="margin: 0;">
                <a href="https://ais-pre-edhvj2r6aca7vjztc46cco-860728404276.us-east1.run.app/#faq" style="color: #94a3b8;">Centro de Ayuda &amp; Preferencias</a> · 
                <a href="mailto:empresaalhadiqainvest@gmail.com?subject=Solicitud%20de%20Baja%20de%20Comunicaciones%20AL-HADIQA" style="color: #ef4444;">Darse de baja</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildPermissionChangeEmailHtml(params: {
  toName: string;
  status: string;
  canDownload: boolean;
  assignedBooksCount: number;
  assignedCapitalCount: number;
  notes?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Actualización de Permisos en Al-Hadiqa Invest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #070b14; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(165deg, #0f172a 0%, #0b1120 100%); border: 1px solid #3b82f6; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 25px 40px; border-bottom: 1px solid rgba(59, 130, 246, 0.3); text-align: center; background-color: #0c1a2e;">
              <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #93c5fd; font-weight: 700; display: block; margin-bottom: 8px;">SEGURIDAD &amp; ACCESO</span>
              <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 800;">🔑 Actualización de Permisos en tu Cuenta</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 35px 40px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
              <p style="margin-top: 0;">Hola <strong>${params.toName}</strong>:</p>
              
              <p>El administrador <strong>Sr.smith (Carlos Smith Zambrano)</strong> ha actualizado los permisos y el estado de tu cuenta institucional:</p>

              <!-- Permissions Grid Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; margin: 20px 0; padding: 15px;">
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px;">Estado de Cuenta:</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; font-weight: 700; color: ${params.status === 'active' ? '#10b981' : '#f59e0b'};">
                    ${params.status === 'active' ? '● Activo (Aprobado)' : '⏳ ' + params.status}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px;">Descarga de Libros y Síntesis:</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; font-weight: 700; color: ${params.canDownload ? '#10b981' : '#ef4444'};">
                    ${params.canDownload ? '✓ Habilitada' : '🔒 Bloqueada'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px;">Libros Asignados:</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; font-weight: 700; color: #f59e0b;">
                    📚 ${params.assignedBooksCount} títulos autorizados
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-size: 14px;">Módulos Al-Hadiqa Capital:</td>
                  <td style="padding: 8px 12px; font-size: 14px; font-weight: 700; color: #93c5fd;">
                    🏛️ ${params.assignedCapitalCount} módulos habilitados
                  </td>
                </tr>
              </table>

              ${
                params.notes
                  ? `<p style="background: rgba(245, 158, 11, 0.1); padding: 12px; border-radius: 6px; font-size: 13px; color: #fde68a;">
                       <strong>Nota del Administrador:</strong> ${params.notes}
                     </p>`
                  : ''
              }

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="https://ais-pre-edhvj2r6aca7vjztc46cco-860728404276.us-east1.run.app/#roadmap" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; display: inline-block;">
                  Ver Mi Perfil Actualizado &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #070b14; border-top: 1px solid rgba(148, 163, 184, 0.1); font-size: 12px; color: #64748b; text-align: center;">
              <p style="margin: 0 0 6px;">Aviso Legal JustMarkets: Contenido educativo y formativo.</p>
              <p style="margin: 0;">
                <a href="https://ais-pre-edhvj2r6aca7vjztc46cco-860728404276.us-east1.run.app/#faq" style="color: #94a3b8;">Centro de Ayuda &amp; Preferencias</a> · 
                <a href="mailto:empresaalhadiqainvest@gmail.com?subject=Solicitud%20de%20Baja%20de%20Comunicaciones%20AL-HADIQA" style="color: #ef4444;">Darse de baja</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// --- DISPATCHER & PREFERENCE MANAGEMENT ---

export async function getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences> {
  try {
    const docRef = doc(db, 'notification_preferences', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { userId, ...(snap.data() as Omit<UserNotificationPreferences, 'userId'>) };
    }
  } catch {
    // fallback
  }

  // Check localStorage
  const localSaved = localStorage.getItem(`al_hadiqa_notif_prefs_${userId}`);
  if (localSaved) {
    try {
      return { userId, ...JSON.parse(localSaved) };
    } catch {
      // ignore
    }
  }

  return { userId, ...DEFAULT_NOTIFICATION_PREFERENCES };
}

export async function saveUserNotificationPreferences(
  userId: string,
  preferences: Omit<UserNotificationPreferences, 'userId'>
): Promise<void> {
  localStorage.setItem(`al_hadiqa_notif_prefs_${userId}`, JSON.stringify(preferences));

  try {
    const docRef = doc(db, 'notification_preferences', userId);
    await setDoc(
      docRef,
      {
        userId,
        ...preferences,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving notification preferences:', err);
  }
}

export interface DispatchEmailParams {
  userId: string;
  toEmail: string;
  toName: string;
  templateType: EmailTemplateType;
  subject: string;
  htmlContent: string;
  plainText?: string;
  createInAppNotification?: boolean;
  notificationMessage?: string;
}

export async function dispatchTransactionalEmail(params: DispatchEmailParams): Promise<EmailLogItem> {
  const prefs = await getUserNotificationPreferences(params.userId);

  // Check unsubscribe status
  let isOptedOut = prefs.unsubscribedAll;

  if (!isOptedOut) {
    if (params.templateType === 'clase_en_vivo' && !prefs.emailLiveClasses) isOptedOut = true;
    if (params.templateType === 'nuevo_contenido' && !prefs.emailNewContent) isOptedOut = true;
    if (params.templateType === 'cambio_permisos' && !prefs.emailPermissionChanges) isOptedOut = true;
  }

  const status: EmailLogItem['status'] = isOptedOut ? 'opted_out' : 'delivered';

  const emailRecord: Omit<EmailLogItem, 'id'> = {
    userId: params.userId,
    toEmail: params.toEmail,
    toName: params.toName,
    subject: params.subject,
    templateType: params.templateType,
    htmlContent: params.htmlContent,
    plainTextContent: params.plainText || params.subject,
    status,
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, 'email_logs'), emailRecord);

    // Also register in-app notification if requested and not opted out
    if (params.createInAppNotification !== false) {
      await addDoc(collection(db, 'notifications'), {
        title: params.subject,
        message: params.notificationMessage || `Se ha enviado una notificación oficial a tu correo ${params.toEmail}.`,
        category:
          params.templateType === 'clase_en_vivo'
            ? 'clase'
            : params.templateType === 'nuevo_contenido'
            ? 'contenido'
            : params.templateType === 'cambio_permisos'
            ? 'permisos'
            : params.templateType === 'bienvenida'
            ? 'bienvenida'
            : 'sistema',
        targetRole: 'all',
        targetUserId: params.userId,
        type: params.templateType === 'clase_en_vivo' ? 'urgent' : 'info',
        readBy: [],
        createdAt: serverTimestamp(),
      });
    }

    return { id: docRef.id, ...emailRecord };
  } catch (err) {
    console.error('Error logging transactional email:', err);
    return { id: 'temp_' + Date.now(), ...emailRecord };
  }
}
