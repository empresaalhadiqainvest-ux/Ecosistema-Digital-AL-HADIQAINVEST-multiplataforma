import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Inicialización de la aplicación Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Se debe especificar firestoreDatabaseId para bases de datos nombradas
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Configuración opcional del proveedor de Google
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Comprobación de conectividad al iniciar
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Al-Hadiqa Invest - Firestore offline check:', error.message);
    }
    return false;
  }
}

/**
 * Traduce códigos de error de Firebase Auth a explicaciones legibles y accionables en español.
 */
export function getReadableAuthErrorMessage(error: unknown): string {
  if (!error) return 'Error desconocido al autenticar.';
  
  const err = error as { code?: string; message?: string };
  const code = err.code || '';
  const message = err.message || '';

  if (code === 'auth/popup-closed-by-user' || message.includes('popup-closed-by-user') || message.includes('pollUserCancellation')) {
    return 'Se cerró la ventana de autenticación de Google antes de completar el inicio de sesión. Por favor, haz clic de nuevo en «Entrar con Google».';
  }
  if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
    return 'Tu navegador o el visor del contenedor ha bloqueado la ventana emergente de Google. Por favor, permite ventanas emergentes (pop-ups) para este sitio en la barra del navegador o utiliza el acceso de prueba inferior.';
  }
  if (code === 'auth/cancelled-popup-request' || message.includes('cancelled-popup-request')) {
    return 'La solicitud de inicio de sesión fue reemplazada o cancelada. Intenta de nuevo.';
  }
  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return 'El dominio actual no está agregado en los «Dominios autorizados» de Firebase Authentication en la Consola de Firebase. Mientras tanto, puedes usar el acceso de prueba en este entorno.';
  }
  if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
    return 'Error de conexión de red al conectar con Google. Por favor, verifica tu conexión a internet.';
  }

  return 'No se pudo completar el inicio de sesión con Google. Si las ventanas emergentes están bloqueadas en tu navegador, habilítalas o utiliza el acceso de prueba.';
}

export async function loginWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: unknown) {
    const readable = getReadableAuthErrorMessage(error);
    console.warn('Al-Hadiqa Invest - Google Login warning:', readable, error);
    throw new Error(readable);
  }
}

export async function logoutUser() {
  return signOut(auth);
}
