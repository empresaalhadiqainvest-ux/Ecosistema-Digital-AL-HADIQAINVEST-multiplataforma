/**
 * SOC EXCAISRES - Tipos y Modelos de Datos del Centro de Operaciones de Ciberseguridad
 * AL-HADIQA INVEST · Executive Cyber Automated Incident Surveillance & Response Ecosystem
 */

export type ThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AttackVector =
  | 'BRUTE_FORCE'
  | 'CREDENTIAL_SPRAYING'
  | 'SQLI_INJECTION'
  | 'XSS_ATTACK'
  | 'NOSQL_INJECTION'
  | 'PATH_TRAVERSAL'
  | 'RATE_LIMIT_FLOOD'
  | 'HONEYPOT_TRIGGER'
  | 'SESSION_TAMPERING'
  | 'MALICIOUS_USER_AGENT';

export type MitigationAction =
  | 'BLOCKED_IMMEDIATELY'
  | 'IP_QUARANTINED'
  | 'ACCOUNT_QUARANTINED'
  | 'RATE_THROTTLED'
  | 'SESSION_REVOKED'
  | 'ADAPTIVE_CHALLENGE'
  | 'HONEYPOT_NEUTRALIZED'
  | 'LOCKDOWN_TRIGGERED';

export type IncidentStatus = 'NEUTRALIZADO' | 'EN_CUARENTENA' | 'INVESTIGANDO' | 'RESUELTO';

export type SocPosture = 'NOMINAL' | 'ELEVADA' | 'LOCKDOWN';

export interface SocIncident {
  id: string;
  timestamp: string;
  attackVector: AttackVector;
  severity: ThreatSeverity;
  sourceIp: string;
  sourceFingerprint: string;
  targetEndpoint: string;
  payloadSample: string;
  mitigationAction: MitigationAction;
  status: IncidentStatus;
  autoResponseMs: number;
  details: string;
  userAgent?: string;
}

export interface SocSettings {
  autoResponseEnabled: boolean;
  posture: SocPosture;
  bruteForceThreshold: number;
  rateLimitBurstMax: number;
  honeypotInstantBan: boolean;
  injectionZeroTolerance: boolean;
  lockdownTriggerThreshold: number;
  lastUpdated: string;
}

export interface SocQuarantineEntry {
  id: string;
  identifier: string;
  targetType?: 'IP' | 'ACCOUNT' | 'FINGERPRINT';
  reason: string;
  attackVector: AttackVector;
  bannedAt: string;
  expiresAt: string | 'PERMANENT';
  status: 'ACTIVE' | 'PARDONED';
}

export interface SocStats {
  totalThreatsNeutralized: number;
  activeQuarantineCount: number;
  avgResponseMs: number;
  criticalIncidentCount: number;
  posture: SocPosture;
  autoResponseStatus: boolean;
}

export type AuthLogOutcome = 'FAILED' | 'SUCCESS' | 'BLOCKED';

export interface FirebaseAuthLogEntry {
  id: string;
  timestamp: string;
  email: string;
  sourceIp: string;
  errorCode: string;
  errorMessage: string;
  provider: string;
  userAgent: string;
  outcome: AuthLogOutcome;
  mitigated?: boolean;
  detectedPattern?: string;
}

export type AuthPatternType =
  | 'IP_BRUTE_FORCE'
  | 'ACCOUNT_STUFFING'
  | 'CREDENTIAL_SPRAYING'
  | 'BOT_AUTOMATION';

export interface AuthPatternDetectionResult {
  id: string;
  detectedAt: string;
  patternType: AuthPatternType;
  targetIdentifier: string;
  targetType: 'IP' | 'ACCOUNT';
  severity: ThreatSeverity;
  failedAttemptsCount: number;
  windowMinutes: number;
  reason: string;
  blockedUntil: string;
  adminNotified: boolean;
}

export interface AdminSecurityAlert {
  id: string;
  createdAt: string;
  title: string;
  message: string;
  targetIdentifier: string;
  patternType: AuthPatternType;
  blockedMinutes: number;
  expiresAt: string;
  notifiedEmail: string;
}
