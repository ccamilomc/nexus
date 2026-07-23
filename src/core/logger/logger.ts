/**
 * Punto único de logging de la aplicación (ver docs/12-seguridad.md).
 *
 * Reglas:
 * - NUNCA registrar contraseñas, tokens ni datos personales innecesarios.
 * - En producción sólo se emiten `warn` y `error`; `debug`/`info` son no-op.
 * - Es el único lugar que habrá que tocar para enchufar Sentry/PostHog.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContext = Readonly<Record<string, unknown>>

const isDevelopment = import.meta.env.DEV

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (!isDevelopment && (level === 'debug' || level === 'info')) return

  const payload = context ? [message, context] : [message]

  // Punto único de salida: sustituir aquí por el transporte real (Sentry…).

  console[level](...payload)
}

export const logger = {
  debug: (message: string, context?: LogContext): void => {
    write('debug', message, context)
  },
  info: (message: string, context?: LogContext): void => {
    write('info', message, context)
  },
  warn: (message: string, context?: LogContext): void => {
    write('warn', message, context)
  },
  error: (message: string, context?: LogContext): void => {
    write('error', message, context)
  },
} as const
