import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser, testFirestoreConnection } from '../firebase';
import { UserProfile, UserRole, UserStatus, UserPermissions, AuthContextType } from '../types/auth';
import { socService } from '../services/socService';

// Re-exportar tipos para compatibilidad entre módulos
export type { UserProfile, UserRole, UserStatus, UserPermissions };

// Correo oficial del administrador fundador (Sr. Smith)
export const DEFAULT_ADMIN_EMAIL = 'empresaalhadiqainvest@gmail.com';
const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
export const ADMIN_EMAIL = (metaEnv?.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isStudent: false,
  isPending: false,
  isActive: false,
  isApprover: false,
  isDemoUser: false,
  authError: null,
  clearAuthError: () => {},
  signInWithGoogle: async () => {},
  signInAsDemo: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    // Comprobar conectividad inicial con Firestore
    testFirestoreConnection();

    // Comprobar si hay una sesión demo activa guardada localmente
    const savedDemo = sessionStorage.getItem('alhadiqa_invest_demo_user');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo) as {
          uid: string;
          email: string;
          displayName: string;
          profile?: UserProfile;
        };
        const demoMockUser = {
          uid: parsed.uid,
          email: parsed.email,
          displayName: parsed.displayName,
          emailVerified: true,
          isAnonymous: false,
        } as unknown as FirebaseUser;

        setCurrentUser(demoMockUser);
        if (parsed.profile) {
          setProfile(parsed.profile);
        }
        setIsDemoUser(true);
        setLoading(false);

        if (auth.currentUser?.uid === parsed.uid) {
          const unsubDemo = onSnapshot(doc(db, 'users', parsed.uid), (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            }
          }, () => {});
          return () => unsubDemo();
        }
        return;
      } catch (e) {
        console.warn('Error parsing demo user session:', e);
        sessionStorage.removeItem('alhadiqa_invest_demo_user');
      }
    }

    let unsubProfileListener: (() => void) | null = null;

    // Suscripción al estado oficial de autenticación de Firebase
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Clean up previous profile listener if any
      if (unsubProfileListener) {
        unsubProfileListener();
        unsubProfileListener = null;
      }

      // Si hay sesión demo activa, no sobreescribir salvo que user real exista
      if (sessionStorage.getItem('alhadiqa_invest_demo_user') && !user) {
        return;
      }

      setCurrentUser(user);
      setIsDemoUser(false);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const isConfiguredAdmin = user.email?.toLowerCase().trim() === ADMIN_EMAIL;

      try {
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          // Registro por primera vez:
          // Si coincide con la cuenta del Administrador (Sr. Smith), se asigna 'admin' y 'active'.
          // Si es cualquier otro alumno nuevo, se crea con rol 'alumno' y estado 'pending'.
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || (isConfiguredAdmin ? 'Sr. Smith (Administrador)' : 'Alumno Al-Hadiqa'),
            photoURL: user.photoURL || '',
            role: isConfiguredAdmin ? 'admin' : 'alumno',
            status: isConfiguredAdmin ? 'active' : 'pending',
            permissions: {
              canAccessClasses: isConfiguredAdmin,
              canAccessChat: isConfiguredAdmin,
              canAccessLibrary: isConfiguredAdmin,
              canAccessCapital: isConfiguredAdmin,
              canDownload: isConfiguredAdmin,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(userDocRef, newProfile);

          // Si es admin, registrar en la colección /admins para reglas Zero-Trust
          if (isConfiguredAdmin) {
            await setDoc(doc(db, 'admins', user.uid), {
              uid: user.uid,
              email: user.email,
              role: 'admin',
              createdAt: serverTimestamp(),
            });
          }

          setProfile(newProfile);
        } else {
          const data = userDocSnap.data() as UserProfile;
          setProfile(data);

          // Asegurar que la cuenta del administrador mantenga su rol activo
          if (isConfiguredAdmin && (data.role !== 'admin' || data.status !== 'active')) {
            await setDoc(
              userDocRef,
              { role: 'admin', status: 'active', updatedAt: serverTimestamp() },
              { merge: true }
            );
            await setDoc(doc(db, 'admins', user.uid), {
              uid: user.uid,
              email: user.email,
              role: 'admin',
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        }

        // Listener en tiempo real del perfil
        unsubProfileListener = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            }
          },
          (error) => {
            console.warn('Al-Hadiqa Invest: Error sincronizando perfil en tiempo real:', error);
          }
        );

        setLoading(false);
      } catch (err) {
        console.error('Error al inicializar el perfil de usuario:', err);
        // Fallback resiliente: asegura que el usuario y especialmente el Administrador nunca queden sin perfil
        const fallbackProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || (isConfiguredAdmin ? 'Sr. Smith (Administrador)' : 'Alumno Al-Hadiqa'),
          photoURL: user.photoURL || '',
          role: isConfiguredAdmin ? 'admin' : 'alumno',
          status: isConfiguredAdmin ? 'active' : 'pending',
          permissions: {
            canAccessClasses: isConfiguredAdmin,
            canAccessChat: isConfiguredAdmin,
            canAccessLibrary: isConfiguredAdmin,
            canAccessCapital: isConfiguredAdmin,
            canDownload: isConfiguredAdmin,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        setLoading(false);
      }
    });

    return () => {
      if (unsubProfileListener) {
        unsubProfileListener();
        unsubProfileListener = null;
      }
      unsubscribe();
    };
  }, []);

  const signIn = async () => {
    setAuthError(null);
    const clientIp = await socService.resolveClientIp();
    const remainingMs = socService.getQuarantineRemainingMs(clientIp);

    if (remainingMs !== null) {
      const minsLeft = remainingMs === Infinity ? 'permanente' : `${Math.max(1, Math.ceil(remainingMs / 60000))} min`;
      const blockMsg = `Acceso bloqueado temporalmente (${minsLeft}) por SOC EXCAISRES debido a múltiples intentos fallidos desde tu IP (${clientIp}).`;
      setAuthError(blockMsg);
      await socService.logFirebaseAuthAttempt({
        sourceIp: clientIp,
        errorCode: 'soc/quarantine-active',
        errorMessage: blockMsg,
        outcome: 'BLOCKED',
      });
      throw new Error(blockMsg);
    }

    try {
      const cred = await loginWithGoogle();
      await socService.logFirebaseAuthAttempt({
        email: cred?.user?.email || undefined,
        sourceIp: clientIp,
        errorCode: 'auth/ok',
        errorMessage: 'Autenticación Google OAuth exitosa',
        outcome: 'SUCCESS',
      });
    } catch (err: unknown) {
      const authErr = err as Error & { code?: string; email?: string };
      const msg = authErr instanceof Error ? authErr.message : 'Error al autenticar con Google.';
      setAuthError(msg);
      // Registrar fallo en logs de autenticación Firebase para monitoreo continuo de SOC EXCAISRES
      await socService.logFirebaseAuthAttempt({
        email: authErr?.email,
        sourceIp: clientIp,
        errorCode: authErr?.code || 'auth/popup-error',
        errorMessage: msg,
        outcome: 'FAILED',
      });
      socService.registerAuthFailure(clientIp);
      console.warn('Error al iniciar sesión con Google:', err);
      throw err;
    }
  };

  /**
   * Permite iniciar sesión de prueba de forma instantánea en entornos donde
   * las ventanas emergentes (pop-ups) del navegador estén bloqueadas por políticas de iframe.
   */
  const signInAsDemo = async (roleType: 'admin' | 'pending_student' | 'active_student' = 'admin') => {
    setLoading(true);
    let mockProfile: UserProfile;

    if (roleType === 'admin') {
      mockProfile = {
        uid: 'demo_admin_smith_uid',
        email: 'empresaalhadiqainvest@gmail.com',
        displayName: 'Sr. Smith (Fundador & Administrador)',
        photoURL: '',
        role: 'admin',
        status: 'active',
        permissions: {
          canAccessClasses: true,
          canAccessChat: true,
          canAccessLibrary: true,
          canAccessCapital: true,
          canDownload: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else if (roleType === 'pending_student') {
      mockProfile = {
        uid: 'demo_student_pending_uid',
        email: 'alumno.solicitante@alhadiqa.com',
        displayName: 'Carlos Mendoza (Alumno Aspirante)',
        photoURL: '',
        role: 'alumno',
        status: 'pending',
        permissions: {
          canAccessClasses: false,
          canAccessChat: false,
          canAccessLibrary: false,
          canAccessCapital: false,
          canDownload: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      mockProfile = {
        uid: 'demo_student_active_uid',
        email: 'elena.torres@alhadiqa.com',
        displayName: 'Elena Torres (Alumna Oficial)',
        photoURL: '',
        role: 'alumno',
        status: 'active',
        approvedBy: 'Sr. Smith (Fundador & Administrador)',
        permissions: {
          canAccessClasses: true,
          canAccessChat: true,
          canAccessLibrary: true,
          canAccessCapital: true,
          canDownload: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Persistir en Firestore solo si hay sesión Firebase autenticada que coincida
    if (auth.currentUser?.uid === mockProfile.uid) {
      try {
        const docRef = doc(db, 'users', mockProfile.uid);
        await setDoc(docRef, mockProfile, { merge: true });
        if (mockProfile.role === 'admin') {
          await setDoc(doc(db, 'admins', mockProfile.uid), {
            uid: mockProfile.uid,
            email: mockProfile.email,
            role: 'admin',
          }, { merge: true });
        }
      } catch (e) {
        console.warn('Al-Hadiqa Invest: Could not write mock profile to Firestore:', e);
      }
    }

    const demoMockUser = {
      uid: mockProfile.uid,
      email: mockProfile.email,
      displayName: mockProfile.displayName,
      emailVerified: true,
      isAnonymous: false,
    } as unknown as FirebaseUser;

    sessionStorage.setItem('alhadiqa_invest_demo_user', JSON.stringify({
      uid: mockProfile.uid,
      email: mockProfile.email,
      displayName: mockProfile.displayName,
      profile: mockProfile,
    }));

    setCurrentUser(demoMockUser);
    setProfile(mockProfile);
    setIsDemoUser(true);
    setLoading(false);
  };

  const logOut = async () => {
    sessionStorage.removeItem('alhadiqa_invest_demo_user');
    setIsDemoUser(false);
    try {
      await logoutUser();
      setProfile(null);
      setCurrentUser(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setProfile(null);
      setCurrentUser(null);
    }
  };

  const isAdmin = profile?.role === 'admin' || currentUser?.email?.toLowerCase().trim() === ADMIN_EMAIL;
  const isApprover = profile?.role === 'aprobador';
  const isStudent = profile?.role === 'alumno';
  const isPending = profile?.status === 'pending';
  const isActive = profile?.status === 'active';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        isAdmin,
        isStudent,
        isPending,
        isActive,
        isApprover,
        isDemoUser,
        authError,
        clearAuthError,
        signInWithGoogle: signIn,
        signInAsDemo,
        signOut: logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
