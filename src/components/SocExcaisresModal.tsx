import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { socService } from '../services/socService';
import {
  SocIncident,
  SocSettings,
  SocQuarantineEntry,
  SocStats,
  ThreatSeverity,
  FirebaseAuthLogEntry,
  AuthPatternDetectionResult,
  AdminSecurityAlert,
  AuthPatternType,
} from '../types/soc';

const AUTH_AUTO_BLOCK_MINUTES = 15;
const AUTH_PATTERN_WINDOW_MS = 10 * 60 * 1000; // Ventana de análisis de 10 minutos
const AUTH_FAILED_THRESHOLD = 3; // 3 o más intentos fallidos inusuales disparan bloqueo de 15 min

interface SocExcaisresModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocExcaisresModal: React.FC<SocExcaisresModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'auth_monitor' | 'soar' | 'blocklist' | 'simulator' | 'report'>('feed');
  const [incidents, setIncidents] = useState<SocIncident[]>([]);
  const [blocklist, setBlocklist] = useState<SocQuarantineEntry[]>([]);
  const [settings, setSettings] = useState<SocSettings>(socService.getSettings());
  const [stats, setStats] = useState<SocStats>(socService.getStats());

  // Estado del Monitor de Logs de Firebase Authentication
  const [authLogs, setAuthLogs] = useState<FirebaseAuthLogEntry[]>(socService.getAuthLogs());
  const [authMonitorEnabled, setAuthMonitorEnabled] = useState<boolean>(true);
  const [isScanningAuthLogs, setIsScanningAuthLogs] = useState<boolean>(false);
  const [lastAuthScanAt, setLastAuthScanAt] = useState<string | null>(null);
  const [detectedAuthPatterns, setDetectedAuthPatterns] = useState<AuthPatternDetectionResult[]>([]);
  const [adminAlerts, setAdminAlerts] = useState<AdminSecurityAlert[]>(socService.getAdminAlerts());
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const processingLockRef = useRef<boolean>(false);

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | ThreatSeverity>('ALL');

  // Estado del simulador
  const [simulating, setSimulating] = useState<string | null>(null);
  const [simulationLog, setSimulationLog] = useState<string | null>(null);

  // Manual block modal / input
  const [manualIp, setManualIp] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [showManualBlockForm, setShowManualBlockForm] = useState(false);

  const refreshData = useCallback(() => {
    setIncidents(socService.getIncidents());
    setBlocklist(socService.getBlocklist());
    setSettings(socService.getSettings());
    setStats(socService.getStats());
    setAdminAlerts(socService.getAdminAlerts());
  }, []);

  /**
   * Función principal de monitoreo continuo de logs de Firebase Authentication.
   * Analiza patrones de intentos de inicio de sesión fallidos inusuales (fuerza bruta por IP,
   * ataque a cuenta, credential spraying o automatización maliciosa), bloquea automáticamente
   * la IP o cuenta afectada durante 15 minutos y notifica al Administrador Maestro.
   */
  const monitorFirebaseAuthLogs = useCallback(
    async (logsToAnalyze: FirebaseAuthLogEntry[]): Promise<AuthPatternDetectionResult[]> => {
      if (processingLockRef.current) return [];
      processingLockRef.current = true;
      setIsScanningAuthLogs(true);

      const newDetections: AuthPatternDetectionResult[] = [];

      try {
        const now = Date.now();
        setLastAuthScanAt(new Date(now).toISOString());

        // Filtrar logs fallidos recientes que aún no hayan sido mitigados
        const recentFailedLogs = logsToAnalyze.filter((log) => {
          if (log.outcome !== 'FAILED' || log.mitigated) return false;
          const logTime = new Date(log.timestamp).getTime();
          return !Number.isNaN(logTime) && now - logTime <= AUTH_PATTERN_WINDOW_MS;
        });

        if (recentFailedLogs.length === 0) {
          return [];
        }

        // Agrupar fallos por IP origen y por cuenta (email)
        const failuresByIp = new Map<string, FirebaseAuthLogEntry[]>();
        const failuresByAccount = new Map<string, FirebaseAuthLogEntry[]>();
        const automatedBotLogs: FirebaseAuthLogEntry[] = [];

        const botUaRegex = /(python-requests|curl\/|scrapy|sqlmap|headless|puppeteer|playwright|httpclient|bot)/i;

        for (const log of recentFailedLogs) {
          if (log.sourceIp) {
            const list = failuresByIp.get(log.sourceIp) || [];
            list.push(log);
            failuresByIp.set(log.sourceIp, list);
          }

          const normalizedEmail = log.email?.toLowerCase().trim();
          if (
            normalizedEmail &&
            normalizedEmail !== 'cuenta-no-identificada' &&
            normalizedEmail !== 'desconocido'
          ) {
            const accList = failuresByAccount.get(normalizedEmail) || [];
            accList.push(log);
            failuresByAccount.set(normalizedEmail, accList);
          }

          if (botUaRegex.test(log.userAgent || '')) {
            automatedBotLogs.push(log);
          }
        }

        const applyAutoBlockAndNotify = async (params: {
          patternType: AuthPatternType;
          targetIdentifier: string;
          targetType: 'IP' | 'ACCOUNT';
          severity: ThreatSeverity;
          matchedLogs: FirebaseAuthLogEntry[];
          reason: string;
        }) => {
          const { patternType, targetIdentifier, targetType, severity, matchedLogs, reason } = params;
          const matchedIds = matchedLogs.map((l) => l.id);

          // Evitar bloqueos duplicados si el identificador ya cumple cuarentena activa
          if (socService.isQuarantined(targetIdentifier)) {
            await socService.markAuthLogsMitigated(matchedIds, patternType);
            return;
          }

          // 1. Bloquear automáticamente la IP o cuenta afectada durante exactamente 15 minutos
          const quarantineEntry = socService.quarantineForDuration(
            targetIdentifier,
            reason,
            patternType === 'CREDENTIAL_SPRAYING' ? 'CREDENTIAL_SPRAYING' : 'BRUTE_FORCE',
            AUTH_AUTO_BLOCK_MINUTES,
            targetType
          );

          const expiresAt =
            quarantineEntry.expiresAt === 'PERMANENT'
              ? new Date(Date.now() + AUTH_AUTO_BLOCK_MINUTES * 60 * 1000).toISOString()
              : quarantineEntry.expiresAt;

          // 2. Registrar el incidente en el feed SOAR de SOC EXCAISRES
          await socService.detectAndMitigate({
            attackVector: patternType === 'CREDENTIAL_SPRAYING' ? 'CREDENTIAL_SPRAYING' : 'BRUTE_FORCE',
            severity,
            sourceIp: targetIdentifier,
            targetEndpoint: '/firebase-auth/signin',
            payloadSample: `${matchedLogs.length} fallos (${matchedLogs
              .map((l) => l.errorCode)
              .slice(0, 3)
              .join(', ')})`,
            details: `${reason} Bloqueo automático de 15 minutos aplicado.`,
            quarantineMinutes: AUTH_AUTO_BLOCK_MINUTES,
            targetType,
            mitigationActionOverride:
              targetType === 'ACCOUNT' ? 'ACCOUNT_QUARANTINED' : 'IP_QUARANTINED',
          });

          // 3. Marcar logs como mitigados en Firestore y caché local
          await socService.markAuthLogsMitigated(matchedIds, patternType);

          // 4. Notificar al Administrador Maestro (notificación in-app, registro email y evento en vivo)
          await socService.notifyAdministratorSecurityAlert({
            targetIdentifier,
            targetType,
            patternType,
            failedAttemptsCount: matchedLogs.length,
            blockedMinutes: AUTH_AUTO_BLOCK_MINUTES,
            expiresAt,
            reason,
          });

          const detection: AuthPatternDetectionResult = {
            id: `pat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            detectedAt: new Date().toISOString(),
            patternType,
            targetIdentifier,
            targetType,
            severity,
            failedAttemptsCount: matchedLogs.length,
            windowMinutes: 10,
            reason,
            blockedUntil: expiresAt,
            adminNotified: true,
          };

          newDetections.push(detection);
        };

        // Evaluar Patrón 1 & 3: Fuerza bruta por IP o Credential Spraying (múltiples cuentas desde 1 IP)
        for (const [ip, logs] of failuresByIp.entries()) {
          const distinctEmails = new Set(
            logs
              .map((l) => l.email?.toLowerCase().trim())
              .filter((e) => e && e !== 'cuenta-no-identificada' && e !== 'desconocido')
          );

          const hasTooManyRequestsCode = logs.some((l) => l.errorCode === 'auth/too-many-requests');

          if (distinctEmails.size >= 3) {
            await applyAutoBlockAndNotify({
              patternType: 'CREDENTIAL_SPRAYING',
              targetIdentifier: ip,
              targetType: 'IP',
              severity: 'CRITICAL',
              matchedLogs: logs,
              reason: `Patrón de Credential Spraying detectado: la IP ${ip} intentó acceder sin éxito a ${distinctEmails.size} cuentas distintas en <10 min.`,
            });
          } else if (logs.length >= AUTH_FAILED_THRESHOLD || (hasTooManyRequestsCode && logs.length >= 2)) {
            await applyAutoBlockAndNotify({
              patternType: 'IP_BRUTE_FORCE',
              targetIdentifier: ip,
              targetType: 'IP',
              severity: 'HIGH',
              matchedLogs: logs,
              reason: `Ráfaga inusual de ${logs.length} inicios de sesión fallidos en Firebase Auth desde la IP ${ip}.`,
            });
          }
        }

        // Evaluar Patrón 2: Ataque dirigido sobre una misma cuenta (Account Stuffing)
        for (const [email, logs] of failuresByAccount.entries()) {
          const unmitigatedForAccount = logs.filter((l) => !l.mitigated);
          const hasCredentialErrors = unmitigatedForAccount.some((l) =>
            ['auth/wrong-password', 'auth/invalid-credential', 'auth/too-many-requests'].includes(l.errorCode)
          );

          if (
            unmitigatedForAccount.length >= AUTH_FAILED_THRESHOLD ||
            (hasCredentialErrors && unmitigatedForAccount.length >= 2)
          ) {
            await applyAutoBlockAndNotify({
              patternType: 'ACCOUNT_STUFFING',
              targetIdentifier: email,
              targetType: 'ACCOUNT',
              severity: 'HIGH',
              matchedLogs: unmitigatedForAccount,
              reason: `Patrón anómalo dirigido contra la cuenta ${email} (${unmitigatedForAccount.length} fallos de credenciales recientes).`,
            });
          }
        }

        // Evaluar Patrón 4: Automatización / Bots con User-Agent sospechoso
        if (automatedBotLogs.length > 0) {
          const botIpGroups = new Map<string, FirebaseAuthLogEntry[]>();
          for (const bLog of automatedBotLogs) {
            const list = botIpGroups.get(bLog.sourceIp) || [];
            list.push(bLog);
            botIpGroups.set(bLog.sourceIp, list);
          }
          for (const [ip, logs] of botIpGroups.entries()) {
            await applyAutoBlockAndNotify({
              patternType: 'BOT_AUTOMATION',
              targetIdentifier: ip,
              targetType: 'IP',
              severity: 'HIGH',
              matchedLogs: logs,
              reason: `Cliente automatizado/headless detectado en fallo de autenticación Firebase desde ${ip}.`,
            });
          }
        }

        if (newDetections.length > 0) {
          setDetectedAuthPatterns((prev) => [...newDetections, ...prev].slice(0, 25));
          setAuthLogs(socService.getAuthLogs());
          refreshData();
        }
      } finally {
        setIsScanningAuthLogs(false);
        processingLockRef.current = false;
      }

      return newDetections;
    },
    [refreshData]
  );

  // Cargar datos, suscribirse a logs de Firebase Auth en Firestore y escuchar eventos en vivo
  useEffect(() => {
    if (!isOpen) return;

    refreshData();
    const initialLogs = socService.getAuthLogs();
    setAuthLogs(initialLogs);

    if (authMonitorEnabled && initialLogs.length > 0) {
      monitorFirebaseAuthLogs(initialLogs);
    }

    // Listener en tiempo real sobre la colección firebase_auth_logs en Firestore
    let unsubAuthLogs = () => {};
    try {
      const authLogsQuery = query(
        collection(db, 'firebase_auth_logs'),
        orderBy('timestamp', 'desc'),
        limit(60)
      );
      unsubAuthLogs = onSnapshot(
        authLogsQuery,
        (snapshot) => {
          const remoteLogs: FirebaseAuthLogEntry[] = [];
          snapshot.forEach((docSnap) => {
            remoteLogs.push({
              id: docSnap.id,
              ...(docSnap.data() as Omit<FirebaseAuthLogEntry, 'id'>),
            });
          });

          // Combinar logs remotos con caché local sin duplicados
          const mergedMap = new Map<string, FirebaseAuthLogEntry>();
          for (const item of remoteLogs) mergedMap.set(item.id, item);
          for (const item of socService.getAuthLogs()) {
            if (!mergedMap.has(item.id)) mergedMap.set(item.id, item);
          }

          const mergedList = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          setAuthLogs(mergedList);
          if (authMonitorEnabled) {
            monitorFirebaseAuthLogs(mergedList);
          }
        },
        () => {
          // Si las reglas o conexión impiden lectura remota en modo demo, usar caché local
          const localLogs = socService.getAuthLogs();
          setAuthLogs(localLogs);
          if (authMonitorEnabled) {
            monitorFirebaseAuthLogs(localLogs);
          }
        }
      );
    } catch (_) {
      // Fallback silencioso a caché local
    }

    const handleIncident = () => refreshData();
    const handleAdminAlert = () => refreshData();
    const handleAuthLogAdded = () => {
      const latestLogs = socService.getAuthLogs();
      setAuthLogs(latestLogs);
      if (authMonitorEnabled) {
        monitorFirebaseAuthLogs(latestLogs);
      }
    };

    window.addEventListener('soc_incident_detected', handleIncident);
    window.addEventListener('soc_admin_alert', handleAdminAlert);
    window.addEventListener('soc_auth_log_added', handleAuthLogAdded);

    const interval = setInterval(() => {
      refreshData();
      setNowTick(Date.now());
    }, 3000);

    return () => {
      unsubAuthLogs();
      window.removeEventListener('soc_incident_detected', handleIncident);
      window.removeEventListener('soc_admin_alert', handleAdminAlert);
      window.removeEventListener('soc_auth_log_added', handleAuthLogAdded);
      clearInterval(interval);
    };
  }, [isOpen, authMonitorEnabled, monitorFirebaseAuthLogs, refreshData]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSimulate = async (type: 'SQLI' | 'BRUTE_FORCE' | 'HONEYPOT' | 'DDOS_FLOOD' | 'XSS') => {
    setSimulating(type);
    setSimulationLog(null);
    try {
      const inc = await socService.simulateAttackScenario(type);
      setIncidents(socService.getIncidents());
      setBlocklist(socService.getBlocklist());
      setStats(socService.getStats());
      setSimulationLog(
        `🛡️ [SOC EXCAISRES AUTO-DEFENSE]: Ataque "${inc.attackVector}" interceptado en ${inc.autoResponseMs}ms. Acción: ${inc.mitigationAction}. Origen: ${inc.sourceIp}. Estado: ${inc.status}.`
      );
    } catch (err: any) {
      setSimulationLog(`Error en simulador: ${err.message}`);
    } finally {
      setSimulating(null);
    }
  };

  const handlePardon = (id: string) => {
    socService.pardonEntity(id);
    setBlocklist(socService.getBlocklist());
    setStats(socService.getStats());
  };

  const handleAddManualBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp.trim()) return;
    socService.addManualBlock(manualIp.trim(), manualReason.trim() || 'Bloqueo manual por el Administrador Maestro');
    setManualIp('');
    setManualReason('');
    setShowManualBlockForm(false);
    setBlocklist(socService.getBlocklist());
    setStats(socService.getStats());
  };

  const handleDownloadReport = () => {
    const md = socService.generateSecurityReportMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOC_EXCAISRES_INFORME_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSimulateAuthAnomaly = async (
    scenario: 'IP_BRUTE_FORCE' | 'ACCOUNT_STUFFING' | 'CREDENTIAL_SPRAYING'
  ) => {
    setSimulating(scenario);
    try {
      const octet = Math.floor(Math.random() * 190 + 25);
      const hostileIp = `185.199.${octet}.${Math.floor(Math.random() * 200 + 10)}`;

      if (scenario === 'IP_BRUTE_FORCE') {
        for (let i = 0; i < 4; i++) {
          await socService.logFirebaseAuthAttempt({
            email: 'usuario.objetivo@alhadiqa.com',
            sourceIp: hostileIp,
            errorCode: i === 3 ? 'auth/too-many-requests' : 'auth/invalid-credential',
            errorMessage: 'Intento fallido consecutivo detectado en Firebase Auth',
            outcome: 'FAILED',
          });
        }
      } else if (scenario === 'ACCOUNT_STUFFING') {
        const targetAccount = `inversor.${octet}@alhadiqa.com`;
        for (let i = 0; i < 3; i++) {
          await socService.logFirebaseAuthAttempt({
            email: targetAccount,
            sourceIp: `91.214.${octet}.${10 + i}`,
            errorCode: 'auth/wrong-password',
            errorMessage: 'Contraseña o credencial inválida repetida contra la cuenta',
            outcome: 'FAILED',
          });
        }
      } else {
        const accounts = [
          `socio1.${octet}@alhadiqa.com`,
          `admin.test.${octet}@alhadiqa.com`,
          `tesoreria.${octet}@alhadiqa.com`,
        ];
        for (const acc of accounts) {
          await socService.logFirebaseAuthAttempt({
            email: acc,
            sourceIp: hostileIp,
            errorCode: 'auth/invalid-credential',
            errorMessage: 'Barrido de credenciales sobre múltiples cuentas desde única IP',
            outcome: 'FAILED',
          });
        }
      }

      const latest = socService.getAuthLogs();
      setAuthLogs(latest);
      await monitorFirebaseAuthLogs(latest);
    } finally {
      setSimulating(null);
    }
  };

  const formatRemainingCountdown = (expiresAt: string | 'PERMANENT'): string => {
    if (expiresAt === 'PERMANENT') return 'PERMANENTE';
    const diff = new Date(expiresAt).getTime() - nowTick;
    if (diff <= 0) return 'EXPIRADO';
    const totalSec = Math.floor(diff / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.attackVector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.sourceIp.includes(searchQuery) ||
      inc.targetEndpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.payloadSample.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="soc-title"
    >
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#03140e] text-slate-100 rounded-2xl border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Cabecera Principal de SOC EXCAISRES */}
        <header className="px-5 py-4 border-b border-amber-500/20 bg-[#062319] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/10 border border-amber-500/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(212,175,55,0.25)]">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] text-amber-400 font-mono tracking-wider uppercase">
                <span>AL-HADIQA INVEST</span>
                <span aria-hidden="true">/</span>
                <span>Ciberseguridad Activa</span>
              </div>
              <h2 id="soc-title" className="text-lg sm:text-xl font-black tracking-wide font-['Montserrat'] text-white">
                SOC <span className="text-amber-400">EXCAISRES</span>
                <span className="ml-2 text-xs font-normal text-slate-400 hidden sm:inline">
                  (Centro Autónomo de Vigilancia y Respuesta Activa)
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador de Postura de Seguridad */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b291e] border border-amber-500/30 text-xs font-mono">
              <span className="text-slate-400">POSTURA:</span>
              {stats.posture === 'NOMINAL' && (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  NOMINAL (DEFENSA ACTIVA)
                </span>
              )}
              {stats.posture === 'ELEVADA' && (
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  ALERTA REFORZADA
                </span>
              )}
              {stats.posture === 'LOCKDOWN' && (
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  DEFENSA MÁXIMA / LOCKDOWN
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Cerrar panel de SOC EXCAISRES"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Fila de Tarjetas KPI / Métricas del Sistema Autónomo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-5 py-3 bg-[#041912] border-b border-amber-500/10 text-xs">
          <div className="p-2.5 rounded-xl bg-[#062319]/80 border border-emerald-500/20">
            <span className="text-[11px] text-slate-400 block mb-0.5">Amenazas Neutralizadas</span>
            <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
              {stats.totalThreatsNeutralized}
            </span>
            <span className="text-[10px] text-slate-500 block">100% interceptadas</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#062319]/80 border border-amber-500/20">
            <span className="text-[11px] text-slate-400 block mb-0.5">Cuarentena Activa</span>
            <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
              {stats.activeQuarantineCount}
            </span>
            <span className="text-[10px] text-slate-500 block">Entidades aisladas</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#062319]/80 border border-sky-500/20">
            <span className="text-[11px] text-slate-400 block mb-0.5">Velocidad de Auto-Respuesta</span>
            <span className="text-lg font-mono font-bold text-sky-400 tabular-nums">
              {stats.avgResponseMs} ms
            </span>
            <span className="text-[10px] text-slate-500 block">Mitigación sub-50ms</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#062319]/80 border border-purple-500/20 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 block mb-0.5">Motor SOAR Autónomo</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {settings.autoResponseEnabled ? 'AUTÓNOMO' : 'SUPERVISADO'}
              </span>
              <button
                type="button"
                onClick={() => {
                  socService.toggleAutoResponse(!settings.autoResponseEnabled);
                  setSettings(socService.getSettings());
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  settings.autoResponseEnabled
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                    : 'bg-amber-950 text-amber-300 border border-amber-600/50'
                }`}
              >
                {settings.autoResponseEnabled ? 'Activo' : 'Pausar'}
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Navegación por Pestañas */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-amber-500/20 bg-[#03140e] overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'feed'
                ? 'bg-[#062319] text-amber-300 border-t-2 border-amber-400 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📡 Telemetría &amp; Incidentes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
              {incidents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('auth_monitor')}
            className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'auth_monitor'
                ? 'bg-[#062319] text-amber-300 border-t-2 border-amber-400 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🔐 Monitor Auth Firebase</span>
            <span className="text-[10px] font-mono text-emerald-400 tabular-nums">
              {authLogs.filter((l) => l.outcome === 'FAILED').length} fallos
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-[#062319] text-amber-300 border-t-2 border-amber-400 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎯 Simulador de Ataques (Sandbox)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blocklist')}
            className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'blocklist'
                ? 'bg-[#062319] text-amber-300 border-t-2 border-amber-400 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⛔ Piscina de Cuarentena</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
              {stats.activeQuarantineCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('soar')}
            className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'soar'
                ? 'bg-[#062319] text-amber-300 border-t-2 border-amber-400 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚙️ Reglas SOAR Autónomas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'report'
                ? 'bg-[#062319] text-amber-300 border-t-2 border-amber-400 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📄 Auditoría &amp; Informes</span>
          </button>
        </div>

        {/* Cuerpo del Contenido por Pestaña */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#03140e]/95 space-y-4">
          {/* TAB 1: FEED DE INCIDENTES EN VIVO */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {/* Filtros de Telemetría */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#062319]/70 border border-amber-500/20 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="text-slate-400">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por vector, IP, payload o endpoint..."
                    className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">SEVERIDAD:</span>
                  {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
                        severityFilter === sev
                          ? sev === 'CRITICAL'
                            ? 'bg-red-500 text-white'
                            : sev === 'HIGH'
                            ? 'bg-amber-500 text-slate-950'
                            : sev === 'MEDIUM'
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sev === 'ALL' ? 'TODAS' : sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Incidentes */}
              <div className="space-y-2.5">
                {filteredIncidents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 rounded-xl bg-[#062319]/40 border border-slate-800">
                    <p className="text-sm font-semibold mb-1">Sin incidentes detectados con los filtros actuales</p>
                    <p className="text-xs text-slate-500">
                      El perímetro defensivo de SOC EXCAISRES se encuentra en estado óptimo.
                    </p>
                  </div>
                ) : (
                  filteredIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-3.5 rounded-xl bg-[#062319]/60 hover:bg-[#062319] border border-amber-500/20 hover:border-amber-500/50 transition-all text-xs space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                              inc.severity === 'CRITICAL'
                                ? 'bg-red-950 text-red-300 border border-red-500/50'
                                : inc.severity === 'HIGH'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                                : inc.severity === 'MEDIUM'
                                ? 'bg-sky-950 text-sky-300 border border-sky-500/50'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            }`}
                          >
                            {inc.severity}
                          </span>
                          <span className="font-bold text-white font-mono">{inc.attackVector}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-400 font-mono">{inc.targetEndpoint}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span>IP: <strong className="text-slate-200">{inc.sourceIp}</strong></span>
                          <span>·</span>
                          <span>Auto-Respuesta: <strong className="text-emerald-400">{inc.autoResponseMs}ms</strong></span>
                          <span>·</span>
                          <span>{new Date(inc.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-black/60 border border-slate-800 font-mono text-[11px] text-amber-200/90 break-all">
                        <span className="text-slate-500 select-none mr-2">PAYLOAD:</span>
                        {inc.payloadSample}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <p className="text-slate-300">{inc.details}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                            ✓ {inc.mitigationAction}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MONITOR EN TIEMPO REAL DE LOGS DE FIREBASE AUTHENTICATION */}
          {activeTab === 'auth_monitor' && (
            <div className="space-y-4">
              {/* Cabecera de Control del Monitor de Autenticación */}
              <div className="p-4 rounded-xl bg-[#062319] border border-amber-500/25 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <span className={`w-2 h-2 rounded-full ${authMonitorEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>{authMonitorEnabled ? 'VIGILANCIA ACTIVA' : 'VIGILANCIA PAUSADA'}</span>
                    <span aria-hidden="true">·</span>
                    <span>Ventana 10 min</span>
                    <span aria-hidden="true">·</span>
                    <span>Bloqueo auto: 15 min</span>
                    {lastAuthScanAt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-400 tabular-nums">
                          Último escaneo: {new Date(lastAuthScanAt).toLocaleTimeString('es-ES')}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    Monitor de Patrones Inusuales en Firebase Authentication
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    Analiza continuamente la colección <code className="text-amber-300">firebase_auth_logs</code> en busca de ráfagas de inicios de sesión fallidos (≥{AUTH_FAILED_THRESHOLD} fallos), ataques a cuentas o credential spraying. Bloquea automáticamente la IP o cuenta afectada durante <strong>15 minutos</strong> y notifica al Administrador Maestro.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMonitorEnabled((prev) => !prev)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      authMonitorEnabled
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                        : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    {authMonitorEnabled ? '⏸ Pausar Vigilancia' : '▶ Reanudar Vigilancia'}
                  </button>

                  <button
                    type="button"
                    disabled={isScanningAuthLogs}
                    onClick={() => monitorFirebaseAuthLogs(authLogs)}
                    className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isScanningAuthLogs ? 'Analizando Logs...' : '🔍 Escanear Logs Ahora'}
                  </button>
                </div>
              </div>

              {/* Simulador Rápido de Patrones Inusuales de Firebase Auth */}
              <div className="p-3.5 rounded-xl bg-[#041912] border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-amber-300 block">Prueba Controlada de Detección Auth</span>
                  <span className="text-slate-400">
                    Inyecta logs fallidos reales para verificar el bloqueo automático de 15 min y la alerta al Administrador.
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    disabled={Boolean(simulating)}
                    onClick={() => handleSimulateAuthAnomaly('IP_BRUTE_FORCE')}
                    className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-semibold cursor-pointer"
                  >
                    {simulating === 'IP_BRUTE_FORCE' ? 'Inyectando...' : '⚡ Simular Fuerza Bruta IP'}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(simulating)}
                    onClick={() => handleSimulateAuthAnomaly('ACCOUNT_STUFFING')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/85 hover:bg-amber-500 text-slate-950 font-semibold cursor-pointer"
                  >
                    {simulating === 'ACCOUNT_STUFFING' ? 'Inyectando...' : '👤 Simular Ataque a Cuenta'}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(simulating)}
                    onClick={() => handleSimulateAuthAnomaly('CREDENTIAL_SPRAYING')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/85 hover:bg-purple-500 text-white font-semibold cursor-pointer"
                  >
                    {simulating === 'CREDENTIAL_SPRAYING' ? 'Inyectando...' : '🌐 Simular Credential Spraying'}
                  </button>
                </div>
              </div>

              {/* Bloqueos Temporales Activos de 15 Minutos + Alertas Enviadas al Administrador */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Alertas notificadas al Administrador */}
                <div className="p-4 rounded-xl bg-[#062319]/60 border border-red-500/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">
                      🚨 Notificaciones Enviadas al Administrador ({adminAlerts.length})
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      empresaalhadiqainvest@gmail.com
                    </span>
                  </div>

                  {adminAlerts.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      No se han emitido alertas de bloqueo automático de 15 min en esta sesión.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {adminAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-red-200">{alert.title}</strong>
                            <span className="text-[10px] font-mono text-slate-400 tabular-nums shrink-0">
                              {new Date(alert.createdAt).toLocaleTimeString('es-ES')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">{alert.message}</p>
                          <div className="text-[10px] font-mono text-emerald-400">
                            ✓ Notificado in-app &amp; bitácora email ({alert.notifiedEmail})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cuarentenas temporales activas con cuenta regresiva */}
                <div className="p-4 rounded-xl bg-[#062319]/60 border border-amber-500/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      ⏳ Bloqueos Activos de 15 Minutos &amp; Patrones
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {detectedAuthPatterns.length} patrones hoy
                    </span>
                  </div>

                  {blocklist.filter((b) => b.status === 'ACTIVE' && b.expiresAt !== 'PERMANENT').length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Ninguna IP o cuenta se encuentra en ventana de bloqueo temporal de 15 minutos ahora mismo.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {blocklist
                        .filter((b) => b.status === 'ACTIVE' && b.expiresAt !== 'PERMANENT')
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="p-2.5 rounded-lg bg-[#041912] border border-amber-500/30 text-xs flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 font-mono">
                                <span className="text-amber-300 font-bold truncate">{entry.identifier}</span>
                                <span className="text-[10px] text-slate-400">
                                  · {entry.targetType || 'IP'} · {entry.attackVector}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">{entry.reason}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-xs font-bold text-red-300 tabular-nums">
                                {formatRemainingCountdown(entry.expiresAt)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handlePardon(entry.id)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer"
                              >
                                Liberar
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabla de Logs de Firebase Authentication */}
              <div className="overflow-x-auto rounded-xl border border-amber-500/20 bg-[#062319]/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#03140e] text-slate-400 font-mono text-[11px] uppercase border-b border-amber-500/20">
                    <tr>
                      <th className="px-4 py-3">Hora</th>
                      <th className="px-4 py-3">Cuenta / Email</th>
                      <th className="px-4 py-3">IP Origen</th>
                      <th className="px-4 py-3">Código Firebase</th>
                      <th className="px-4 py-3">Resultado</th>
                      <th className="px-4 py-3">Diagnóstico SOC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    {authLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-sans">
                          No hay eventos registrados aún en <code className="text-amber-300">firebase_auth_logs</code>. Usa los botones de prueba arriba o intenta iniciar sesión para ver la telemetría en vivo.
                        </td>
                      </tr>
                    ) : (
                      authLogs.slice(0, 30).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-2.5 text-slate-400 tabular-nums">
                            {new Date(log.timestamp).toLocaleTimeString('es-ES')}
                          </td>
                          <td className="px-4 py-2.5 text-slate-200 max-w-[180px] truncate">
                            {log.email}
                          </td>
                          <td className="px-4 py-2.5 text-amber-300">{log.sourceIp}</td>
                          <td className="px-4 py-2.5 text-slate-300">{log.errorCode}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`font-bold ${
                                log.outcome === 'FAILED'
                                  ? 'text-red-400'
                                  : log.outcome === 'BLOCKED'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {log.outcome}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-300 font-sans">
                            {log.mitigated ? (
                              <span className="text-emerald-300 font-semibold">
                                ✓ Mitigado ({log.detectedPattern || '15 min block'})
                              </span>
                            ) : log.outcome === 'FAILED' ? (
                              <span className="text-amber-300">En observación</span>
                            ) : (
                              <span className="text-slate-500">Nominal</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SIMULADOR DE CIBERATAQUES (SANDBOX DE PRUEBAS) */}
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#062319] border border-amber-500/30">
                <h3 className="text-sm font-bold text-amber-300 mb-1 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Banco de Pruebas de Mitigación Autónoma</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Permite al Administrador comprobar en vivo cómo el motor SOAR de <strong>SOC EXCAISRES</strong> detecta,
                  clasifica y neutraliza automáticamente amenazas sin intervención humana, aplicando cuarentena de IP,
                  filtrado de payloads y throttling en menos de 50 milisegundos.
                </p>
              </div>

              {simulationLog && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 font-mono shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-start gap-2">
                  <span className="text-emerald-400 text-sm">🛡️</span>
                  <div className="flex-1 leading-relaxed">{simulationLog}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Inyección SQL */}
                <div className="p-4 rounded-xl bg-[#041912] border border-red-500/30 hover:border-red-500/60 transition-all space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                      <span>💉</span> Inyección SQL Maliciosa (SQLi)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                      CRÍTICA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Simula el envío de una sentencia SQL de evasión de autenticación y extracción forzada de tablas.
                  </p>
                  <code className="block p-2 rounded bg-black/60 text-[10px] font-mono text-red-200">
                    admin' OR 1=1; DROP TABLE users; --
                  </code>
                  <button
                    type="button"
                    disabled={Boolean(simulating)}
                    onClick={() => handleSimulate('SQLI')}
                    className="w-full py-2 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{simulating === 'SQLI' ? 'Mitigando...' : 'Simular Inyección SQL'}</span>
                  </button>
                </div>

                {/* 2. Fuerza Bruta */}
                <div className="p-4 rounded-xl bg-[#041912] border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span>⚡</span> Ráfaga de Fuerza Bruta / Stuffing
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                      ALTA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Simula 4 intentos rápidos consecutivos con credenciales anómalas en el flujo de inicio de sesión.
                  </p>
                  <code className="block p-2 rounded bg-black/60 text-[10px] font-mono text-amber-200">
                    POST /auth/session · 4 token failures in &lt;4s
                  </code>
                  <button
                    type="button"
                    disabled={Boolean(simulating)}
                    onClick={() => handleSimulate('BRUTE_FORCE')}
                    className="w-full py-2 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{simulating === 'BRUTE_FORCE' ? 'Mitigando...' : 'Simular Fuerza Bruta'}</span>
                  </button>
                </div>

                {/* 3. Disparo de Trampa Honeypot */}
                <div className="p-4 rounded-xl bg-[#041912] border border-sky-500/30 hover:border-sky-500/60 transition-all space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <span>🍯</span> Trampa Honeypot Anti-Bot
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                      MEDIA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Simula un bot crawler que rellena campos trampa invisibles (`b_fax_honeypot`) en formularios públicos.
                  </p>
                  <code className="block p-2 rounded bg-black/60 text-[10px] font-mono text-sky-200">
                    b_fax_honeypot: "automated_spam_bot_v2"
                  </code>
                  <button
                    type="button"
                    disabled={Boolean(simulating)}
                    onClick={() => handleSimulate('HONEYPOT')}
                    className="w-full py-2 rounded-lg bg-sky-600/80 hover:bg-sky-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{simulating === 'HONEYPOT' ? 'Mitigando...' : 'Simular Bot Honeypot'}</span>
                  </button>
                </div>

                {/* 4. Inundación DDoS / Rate Throttling */}
                <div className="p-4 rounded-xl bg-[#041912] border border-purple-500/30 hover:border-purple-500/60 transition-all space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <span>🌊</span> Inundación de Peticiones (DDoS Burst)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
                      ALTA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Simula una ráfaga de 28 peticiones concurrentes en 800ms intentando degradar el servicio de cotizaciones.
                  </p>
                  <code className="block p-2 rounded bg-black/60 text-[10px] font-mono text-purple-200">
                    BURST: 28 requests/sec -&gt; 429 Throttle Activated
                  </code>
                  <button
                    type="button"
                    disabled={Boolean(simulating)}
                    onClick={() => handleSimulate('DDOS_FLOOD')}
                    className="w-full py-2 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{simulating === 'DDOS_FLOOD' ? 'Mitigando...' : 'Simular Inundación DDoS'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PISCINA DE CUARENTENA (BLOCKLIST) */}
          {activeTab === 'blocklist' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Lista de Identificadores y Direcciones Aisladas</h3>
                  <p className="text-xs text-slate-400">
                    Entidades que han sido neutralizadas y bloqueadas automáticamente o por decisión del Administrador.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowManualBlockForm(!showManualBlockForm)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{showManualBlockForm ? '✕ Cerrar Formulario' : '+ Bloquear IP Manualmente'}</span>
                </button>
              </div>

              {showManualBlockForm && (
                <form
                  onSubmit={handleAddManualBlock}
                  className="p-4 rounded-xl bg-[#062319] border border-amber-500/40 space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Dirección IP o Identificador:</label>
                      <input
                        type="text"
                        required
                        value={manualIp}
                        onChange={(e) => setManualIp(e.target.value)}
                        placeholder="Ej. 195.12.44.89 o client-fingerprint-xyz"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/30 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Motivo del Bloqueo:</label>
                      <input
                        type="text"
                        value={manualReason}
                        onChange={(e) => setManualReason(e.target.value)}
                        placeholder="Ej. Tráfico anómalo repetitivo"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/30 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Confirmar Cuarentena Inmediata
                  </button>
                </form>
              )}

              <div className="overflow-x-auto rounded-xl border border-amber-500/20 bg-[#062319]/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#03140e] text-slate-400 font-mono text-[11px] uppercase border-b border-amber-500/20">
                    <tr>
                      <th className="px-4 py-3">Identificador / IP</th>
                      <th className="px-4 py-3">Vector de Ataque</th>
                      <th className="px-4 py-3">Motivo de Aislamiento</th>
                      <th className="px-4 py-3">Expiración</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    {blocklist.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                          No hay entidades en la piscina de cuarentena activa.
                        </td>
                      </tr>
                    ) : (
                      blocklist.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 text-amber-300 font-bold">{entry.identifier}</td>
                          <td className="px-4 py-3 text-slate-300">{entry.attackVector}</td>
                          <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{entry.reason}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {entry.expiresAt === 'PERMANENT'
                              ? 'PERMANENTE'
                              : new Date(entry.expiresAt).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3">
                            {entry.status === 'ACTIVE' ? (
                              <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold">
                                BLOQUEADO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                                PERDONADO
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {entry.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handlePardon(entry.id)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[10px] font-sans font-bold cursor-pointer"
                              >
                                Liberar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: REGLAS SOAR AUTÓNOMAS */}
          {activeTab === 'soar' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#062319] border border-amber-500/20">
                <h3 className="text-sm font-bold text-white mb-1">Matriz de Reglas Autónomas de Respuesta Activa (SOAR)</h3>
                <p className="text-xs text-slate-300">
                  Políticas automáticas aplicadas en milisegundos cuando el motor de detección de SOC EXCAISRES identifica una firma hostil.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                {/* Regla 1 */}
                <div className="p-3.5 rounded-xl bg-[#062319]/60 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">1. Escudo de Fuerza Bruta</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">
                      ACTIVA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Si el monitor de logs de Firebase Auth detecta patrones inusuales (≥3 fallos por IP/cuenta o credential spraying), bloquea la IP o cuenta afectada durante 15 minutos y notifica al Administrador Maestro.
                  </p>
                  <div className="text-[10px] font-mono text-slate-400">
                    Umbral: <strong>{settings.bruteForceThreshold} fallos / ventana activa · Bloqueo 15 min</strong>
                  </div>
                </div>

                {/* Regla 2 */}
                <div className="p-3.5 rounded-xl bg-[#062319]/60 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-300">2. Tolerancia Cero SQLi / XSS</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">
                      ACTIVA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Cualquier carga útil que contenga sintaxis SQL (`DROP`, `UNION SELECT`) o etiquetas de script maliciosas resulta en bloqueo permanente inmediato.
                  </p>
                  <div className="text-[10px] font-mono text-slate-400">
                    Acción: <strong>Baneo Permanente + Sanitización</strong>
                  </div>
                </div>

                {/* Regla 3 */}
                <div className="p-3.5 rounded-xl bg-[#062319]/60 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300">3. Interceptor Honeypot</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">
                      ACTIVA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Envío de formularios donde los campos señuelo ocultos han sido completados o con tiempo menor a 1,200ms son neutralizados sin persistir en base de datos.
                  </p>
                  <div className="text-[10px] font-mono text-slate-400">
                    Acción: <strong>Descarte Silencioso + Registro Forense</strong>
                  </div>
                </div>

                {/* Regla 4 */}
                <div className="p-3.5 rounded-xl bg-[#062319]/60 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300">4. Throttling Progresivo DDoS</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">
                      ACTIVA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Peticiones concurrentes superiores a 20 por segundo disparan código 429 Too Many Requests y aplican retraso exponencial defensivo.
                  </p>
                  <div className="text-[10px] font-mono text-slate-400">
                    Umbral: <strong>{settings.rateLimitBurstMax} reqs/segundo</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDITORÍA & INFORMES */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#062319] border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Informe de Cumplimiento y Auditoría Forense</h3>
                  <p className="text-xs text-slate-300">
                    Exporta la bitácora completa de incidentes neutralizados y estado del perímetro de seguridad para auditorías externas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <span>📥 Descargar Informe Oficial (.md)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#020e0a] border border-slate-800 font-mono text-[11px] text-slate-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {socService.generateSecurityReportMarkdown()}
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal con resumen de estado */}
        <footer className="px-5 py-3 border-t border-amber-500/20 bg-[#062319] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>SOC EXCAISRES Operativo · Smith Business Solutions &amp; AL-HADIQA INVEST</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Cerrar Panel
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
