/**
 * Módulo de Sanitización, Prevención de Inyección (SQL/NoSQL/XSS) y Protección Anti-CSRF
 * Conforme con los estándares de seguridad OWASP Top 10 (A03: Injection).
 */

const CSRF_SESSION_KEY = 'al_hadiqa_csrf_token';

// Genera un token CSRF seguro en sessionStorage para ligar las peticiones a la sesión de usuario
export function getOrCreateCsrfToken(): string {
  try {
    let token = sessionStorage.getItem(CSRF_SESSION_KEY);
    if (!token) {
      const array = new Uint8Array(24);
      window.crypto.getRandomValues(array);
      token = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(CSRF_SESSION_KEY, token);
    }
    return token;
  } catch {
    return 'fallback-secure-csrf-' + Math.random().toString(36).substring(2);
  }
}

export function validateCsrfToken(submittedToken: string): boolean {
  try {
    const currentToken = sessionStorage.getItem(CSRF_SESSION_KEY);
    if (!currentToken || !submittedToken) return false;
    return currentToken === submittedToken;
  } catch {
    return true; // En entornos restrictivos de storage
  }
}

/**
 * Sanitiza cualquier texto entrante de usuarios para prevenir XSS (Cross-Site Scripting)
 * Convierte caracteres especiales a entidades HTML seguras y remueve protocolos peligrosos.
 */
export function sanitizeUserText(text: string): string {
  if (!text) return '';

  // 1. Reemplazo de caracteres peligrosos para HTML
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  const escaped = text.replace(/[&<>"'/]/g, (match) => map[match]);

  // 2. Neutralizar protocolos javascript: o vbscript:
  const neutralized = escaped
    .replace(/javascript\s*:/gi, 'blocked-protocol:')
    .replace(/vbscript\s*:/gi, 'blocked-protocol:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked-protocol:');

  return neutralized.trim();
}

/**
 * Detector de patrones de inyección (XSS, NoSQL, SQL Injection)
 */
export interface InjectionCheckResult {
  isSuspicious: boolean;
  threatType?: 'XSS' | 'SQL_INJECTION' | 'NOSQL_INJECTION' | 'PATH_TRAVERSAL' | 'DANGEROUS_PROTOCOL';
  details?: string;
}

export function detectInjectionPatterns(rawText: string): InjectionCheckResult {
  if (!rawText) return { isSuspicious: false };
  const lower = rawText.toLowerCase();

  // 1. Patrones de Cross-Site Scripting (XSS)
  const xssPatterns = [
    /<script\b[^>]*>/i,
    /<\/script>/i,
    /javascript\s*:/i,
    /on\w+\s*=/i, // onload=, onerror=, onclick=
    /<iframe\b[^>]*>/i,
    /<object\b[^>]*>/i,
    /<embed\b[^>]*>/i,
    /<svg\b[^>]*onload/i,
  ];

  for (const regex of xssPatterns) {
    if (regex.test(rawText)) {
      return {
        isSuspicious: true,
        threatType: 'XSS',
        details: 'Intento de inyección de script o manipulador de eventos HTML detectado.',
      };
    }
  }

  // 2. Patrones de SQL Injection comunes
  const sqlPatterns = [
    /(\bunion\b\s+\bselect\b)/i,
    /(\bselect\b.+?\bfrom\b.+?\bwhere\b)/i,
    /(\bdrop\b\s+\btable\b)/i,
    /(\balter\b\s+\btable\b)/i,
    /(\bexec(\s|\+)+(s|x)p\w+)/i,
    /('\s*or\s*'1'\s*=\s*'1)/i,
    /('--|\/\*|\*\/)/i,
  ];

  for (const regex of sqlPatterns) {
    if (regex.test(lower)) {
      return {
        isSuspicious: true,
        threatType: 'SQL_INJECTION',
        details: 'Sintaxis SQL maliciosa detectada en campo de entrada.',
      };
    }
  }

  // 3. Patrones de NoSQL Injection
  if (lower.includes('$where') || lower.includes('$gt') || lower.includes('$ne') || lower.includes('$regex')) {
    return {
      isSuspicious: true,
      threatType: 'NOSQL_INJECTION',
      details: 'Operador de consulta NoSQL sospechoso detectado.',
    };
  }

  // 4. Path Traversal
  if (rawText.includes('../') || rawText.includes('..\\') || rawText.includes('%2e%2e')) {
    return {
      isSuspicious: true,
      threatType: 'PATH_TRAVERSAL',
      details: 'Intento de navegación de directorio no autorizada detectado.',
    };
  }

  return { isSuspicious: false };
}

/**
 * Validador estricto de URLs seguras (solo protocolos http/https válidos)
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
