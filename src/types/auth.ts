import { User as FirebaseUser } from 'firebase/auth';

export type UserRole = 'admin' | 'alumno' | 'aprobador';

export type UserStatus = 'active' | 'pending' | 'suspended';

export type DemoRoleType = 'admin' | 'pending_student' | 'active_student';

export interface UserPermissions {
  canAccessClasses?: boolean;
  canAccessChat?: boolean;
  canAccessLibrary?: boolean;
  canAccessCapital?: boolean;
  canDownload?: boolean;
  assignedBookIds?: string[];
  assignedCapitalModuleIds?: string[];
  notes?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  approvedBy?: string;
  permissions?: UserPermissions;
  isMuted?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isPending: boolean;
  isActive: boolean;
  isApprover: boolean;
  isDemoUser: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: (roleType?: DemoRoleType) => Promise<void>;
  signOut: () => Promise<void>;
}
