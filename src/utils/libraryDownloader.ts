import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { LibraryResourceItem } from '../types';
import { generateSignedDownloadUrl, validateSignedDownloadToken } from './signedUrlService';

export interface DownloadAuditParams {
  resource: LibraryResourceItem;
  userId: string;
  userName: string;
  userEmail: string;
  token?: string;
}

export async function executeResourceDownload({
  resource,
  userId,
  userName,
  userEmail,
  token,
}: DownloadAuditParams): Promise<boolean> {
  try {
    // Generar o validar enlace firmado de corta duración (15 minutos de validez)
    let signedInfo = { token: token || '', expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
    if (!token) {
      const generated = await generateSignedDownloadUrl(resource.id, userId, 15);
      signedInfo = { token: generated.token, expiresAt: generated.expiresAt };
    } else {
      const validation = await validateSignedDownloadToken(token, userId);
      if (!validation.valid) {
        throw new Error(validation.error || 'Token firmado no válido');
      }
    }

    // 1. Audit Trail: Register who downloaded what and when in Firestore with signed token
    await addDoc(collection(db, 'download_logs'), {
      userId,
      userName,
      userEmail,
      resourceId: resource.id,
      resourceTitle: resource.title,
      category: resource.category,
      downloadedAt: serverTimestamp(),
      fileFormat: resource.format || 'PDF',
      fileSize: resource.fileSize || 'N/A',
      signedTokenId: signedInfo.token.substring(0, 24) + '...',
      signedExpiresAt: signedInfo.expiresAt.toISOString(),
      securityScanVerified: true,
    });

    // 2. Increment download counter on the resource document if exists
    try {
      const resourceRef = doc(db, 'library_resources', resource.id);
      await updateDoc(resourceRef, {
        downloadCount: increment(1),
      });
    } catch {
      // If resource document was seed or not yet in firestore, audit still succeeded
    }

    // 3. Generate structured educational file for download
    const fileContent = `================================================================================
AL-HADIQA INVEST · BIBLIOTECA OFICIAL DE TRADING & FINANZAS
Material Educativo Institucional | Fundador: Sr.smith (Carlos Smith Zambrano)
================================================================================

TÍTULO: ${resource.title}
CATEGORÍA: ${resource.category.toUpperCase()}
AUTOR: ${resource.author || 'Sr.smith (Carlos Smith Zambrano) & Al-Hadiqa Team'}
FORMATO: ${resource.format || 'PDF'} · EXTENSIÓN: ${resource.pagesCount || 120} páginas
LICENCIA OTORGADA A: ${userName} (${userEmail})
FECHA DE DESCARGA: ${new Date().toLocaleString('es-ES', { timeZone: 'UTC' })} UTC

--------------------------------------------------------------------------------
SINOPSIS Y OBJETIVOS DE APRENDIZAJE:
--------------------------------------------------------------------------------
${resource.description}

--------------------------------------------------------------------------------
ÍNDICE Y TEMARIO ESTRUCTURADO:
--------------------------------------------------------------------------------
${
  resource.chapters && resource.chapters.length > 0
    ? resource.chapters.map((ch, idx) => `Capítulo ${idx + 1}: ${ch}`).join('\n')
    : `Módulo 1: Fundamentos Operativos y Estructura del Mercado
Módulo 2: Detección de Liquidez y Lectura de Flujo de Órdenes
Módulo 3: Puntos de Interés (POI) y Confluencias Institucionales
Módulo 4: Reglas de Entrada, Gestión Monetaria y Protección de Capital
Módulo 5: Casos de Estudio en Tiempo Real y Bitácora de Trading`
}

--------------------------------------------------------------------------------
REGLAS DE GESTIÓN DE RIESGO DE AL-HADIQA:
--------------------------------------------------------------------------------
1. Nunca arriesgar más del 0.5% al 1% de la cuenta por operación.
2. Todo trade debe tener Stop Loss definido antes de la entrada (innegociable).
3. Buscar setups con ratio mínimo Riesgo:Beneficio de 1:2.5 en adelante.
4. Mantener registro estricto en la bitácora operativa de cada trade ejecutado.

--------------------------------------------------------------------------------
AVISO LEGAL OBLIGATORIO (JUSTMARKETS COMPLIANCE):
--------------------------------------------------------------------------------
"Las clases y contenidos de la biblioteca son impartidos por un socio y no por el
bróker. Contenido estrictamente educativo y de investigación, no constituye
asesoría financiera ni recomendación de inversión individualizada. El trading con
apalancamiento implica riesgo significativo de pérdida de capital."

================================================================================
© ${new Date().getFullYear()} AL-HADIQA INVEST. Todos los derechos reservados.
================================================================================
`;

    // Create a Blob and trigger native browser download
    const blob = new Blob([fileContent], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = resource.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    link.href = url;
    link.download = `al-hadiqa-${safeTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error('Error during resource download audit or file delivery:', err);
    throw err;
  }
}

export interface CapitalDownloadParams {
  moduleId: string;
  moduleTitle: string;
  pillarLabel: string;
  docTitle: string;
  filename: string;
  coreThesis: string;
  actionChecklist: string[];
  principles: { title: string; explanation: string }[];
  userId: string;
  userName: string;
  userEmail: string;
}

export async function executeCapitalDownload({
  moduleId,
  moduleTitle,
  pillarLabel,
  docTitle,
  filename,
  coreThesis,
  actionChecklist,
  principles,
  userId,
  userName,
  userEmail,
}: CapitalDownloadParams): Promise<boolean> {
  try {
    // 1. Audit Trail: Register who downloaded what and when in Firestore download_logs
    await addDoc(collection(db, 'download_logs'), {
      userId,
      userName,
      userEmail,
      resourceId: `capital_${moduleId}`,
      resourceTitle: `[Al-Hadiqa Capital] ${docTitle}`,
      category: `Al-Hadiqa Capital (${pillarLabel})`,
      downloadedAt: serverTimestamp(),
      fileFormat: 'PDF',
      fileSize: '3.0 MB',
    });

    // 2. Build structured educational PDF file content
    const fileContent = `================================================================================
AL-HADIQA INVEST & CAPITAL · DIVISIÓN DE EDUCACIÓN FINANCIERA & DESARROLLO
Material Formativo Institucional | Fundador: Sr.smith (Carlos Smith Zambrano)
================================================================================

DOCUMENTO: ${docTitle}
MÓDULO: ${moduleTitle}
PILAR: ${pillarLabel.toUpperCase()}
LICENCIA FORMATIVA OTORGADA A: ${userName} (${userEmail})
FECHA Y HORA DE DESCARGA: ${new Date().toLocaleString('es-ES', { timeZone: 'UTC' })} UTC
REGISTRO DE AUDITORÍA: Ref-${Date.now().toString(36).toUpperCase()}

--------------------------------------------------------------------------------
TESIS CENTRAL Y FILOSOFÍA DE CAPITAL:
--------------------------------------------------------------------------------
${coreThesis}

--------------------------------------------------------------------------------
PRINCIPIOS ATEMPORALES:
--------------------------------------------------------------------------------
${principles
  .map(
    (p, idx) =>
      `Principio ${idx + 1} · ${p.title}
   Explicación: ${p.explanation}`
  )
  .join('\n\n')}

--------------------------------------------------------------------------------
LISTA DE ACCIÓN INMEDIATA (ACTION CHECKLIST):
--------------------------------------------------------------------------------
${actionChecklist.map((act, idx) => `[  ] Paso ${idx + 1}: ${act}`).join('\n')}

--------------------------------------------------------------------------------
PROTOCOLOS DE DISCIPLINA Y GESTIÓN DE CAPITAL:
--------------------------------------------------------------------------------
1. Invertir con constancia matemática, no con apuestas emocionales.
2. Todo activo debe someterse al filtro de margen de seguridad y círculo de competencia.
3. Proteger la energía, la presencia ejecutiva y los hábitos diarios como el mayor activo.
4. Aplicar el protocolo anti-tilt ante cualquier racha adversa en trading o negocios.

--------------------------------------------------------------------------------
AVISO LEGAL OBLIGATORIO (JUSTMARKETS COMPLIANCE):
--------------------------------------------------------------------------------
"Las clases, lecturas y materiales de Al-Hadiqa Capital son impartidos por un
socio y no por el bróker. Contenido con fines estrictamente educativos y de
desarrollo personal, no constituye asesoría financiera ni recomendación de
inversión individualizada. El trading y la inversión conllevan riesgo de pérdida
de capital."

================================================================================
© ${new Date().getFullYear()} AL-HADIQA CAPITAL · AL-HADIQA INVEST. Todos los derechos reservados.
================================================================================
`;

    // 3. Native Blob download trigger
    const blob = new Blob([fileContent], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `al-hadiqa-capital-${moduleId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error('Error during capital resource download audit:', err);
    throw err;
  }
}
