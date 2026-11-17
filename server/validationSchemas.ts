import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
export { extractNormalizedClientIp } from './rateLimiter';

/**
 * Esquemas estrictos Zod para validación Zero-Trust en todas las rutas API
 */
export const authSessionSchema = z
  .object({
    uid: z
      .string()
      .trim()
      .min(2, 'UID demasiado corto')
      .max(128, 'UID excede longitud permitida')
      .regex(/^[a-zA-Z0-9._:@-]+$/, 'UID contiene caracteres no permitidos'),
    role: z.enum(['admin', 'aprobador', 'alumno']).optional().default('alumno'),
    email: z.string().trim().email('Correo electrónico inválido').max(120).optional(),
  })
  .strict();

export const verifyRestoreSchema = z
  .object({
    snapshotId: z
      .string()
      .trim()
      .min(4)
      .max(80)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .optional(),
  })
  .strict();

export const selfHealSchema = z
  .object({
    trigger: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-zA-Z0-9_.:-]+$/)
      .optional(),
  })
  .strict();

export const rotateKeysSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-zA-Z0-9_.: -]+$/)
      .optional(),
  })
  .strict();

export const mentorChatSchema = z
  .object({
    messages: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant', 'model', 'system']),
          content: z.string().trim().max(8000),
        })
      )
      .transform((msgs) => msgs.filter((m) => m.content.length > 0))
      .refine((msgs) => msgs.length >= 1, {
        message: 'Se requiere al menos un mensaje con contenido válido',
      })
      .refine((msgs) => msgs.length <= 40, {
        message: 'Historial de conversación excede el máximo permitido',
      }),
    model: z.string().trim().max(80).optional(),
    temperature: z.number().min(0).max(2).optional(),
    systemInstruction: z.string().trim().max(4000).optional(),
  })
  .strict();

export const streamSecurityTokenSchema = z
  .object({
    classId: z
      .string()
      .trim()
      .min(1, 'classId es obligatorio')
      .max(120)
      .regex(/^[a-zA-Z0-9_.:@-]+$/, 'Formato de classId inválido'),
    hostUid: z.string().trim().max(128).optional(),
    keyFingerprint: z.string().trim().max(128).optional(),
  })
  .strict();

export const streamVerifyTokenSchema = z
  .object({
    sessionId: z.string().trim().min(4).max(120),
    classId: z.string().trim().min(1).max(120),
    hostUid: z.string().trim().max(128).optional(),
    keyFingerprint: z.string().trim().max(128).optional(),
    expiresAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
      message: 'Fecha de expiración inválida',
    }),
    signature: z
      .string()
      .trim()
      .regex(/^[a-f0-9]{64}$/i, 'Firma HMAC-SHA256 malformada'),
  })
  .strict();

/**
 * Middleware genérico de validación Zod que sustituye req.body por datos saneados y tipados
 */
export function validateBody<T>(schema: z.ZodType<T>, allowEmptyBody = false) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rawBody =
      req.body === undefined || req.body === null
        ? (allowEmptyBody ? {} : undefined)
        : req.body;
    const parsed = schema.safeParse(rawBody);

    if (!parsed.success) {
      const traceId = (res.getHeader('X-Trace-Id') as string | undefined) || 'zod-guard';
      const issues = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      res.status(400).json({
        error: 'Validación estricta de esquema (Zod) rechazada.',
        code: 'ZOD_VALIDATION_ERROR',
        issues,
        traceId,
      });
      return;
    }

    req.body = parsed.data;
    next();
  };
}
