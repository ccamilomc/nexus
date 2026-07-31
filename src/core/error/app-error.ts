import { logger } from '@/core/logger'

/**
 * Normalización de errores (ver docs/07-convenciones-de-codigo.md).
 *
 * Todo error que llegue a la UI se convierte primero en un `AppError`, cuyo
 * `message` es **humano** y apto para mostrar. Los detalles técnicos nunca se
 * exponen al usuario: se registran mediante el logger.
 */

export type AppErrorCode =
  | 'unknown'
  | 'offline'
  | 'network'
  | 'auth'
  | 'permission'
  | 'not_found'
  | 'validation'
  | 'conflict'

export interface AppError {
  readonly code: AppErrorCode
  /** Mensaje corto, claro y humano. Apto para mostrar en la interfaz. */
  readonly message: string
}

const HUMAN_MESSAGES: Readonly<Record<AppErrorCode, string>> = {
  unknown: 'Algo no ha ido bien. Vuelve a intentarlo en un momento.',
  // No promete guardar y sincronizar: la cola offline llega en el Sprint 14 y
  // hasta entonces el registro se pierde. Cuando exista, este mensaje cambia.
  offline: 'No hay conexión. Vuelve a intentarlo cuando tengas señal.',
  network: 'No hemos podido conectar. Comprueba tu conexión e inténtalo de nuevo.',
  auth: 'Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.',
  permission: 'No tienes permiso para hacer esto.',
  not_found: 'No hemos encontrado lo que buscabas.',
  validation: 'Revisa los datos introducidos: hay algo que no es válido.',
  conflict: 'Estos datos han cambiado en otro dispositivo. Vuelve a cargarlos.',
}

export function createAppError(code: AppErrorCode, message?: string): AppError {
  return { code, message: message ?? HUMAN_MESSAGES[code] }
}

/** Los códigos que puede tener un `AppError`, para reconocerlo con certeza. */
const APP_ERROR_CODES: ReadonlySet<string> = new Set(Object.keys(HUMAN_MESSAGES))

/**
 * ¿Es un error ya traducido, listo para mostrar?
 *
 * Comprueba el **código**, no sólo que exista: los errores de Supabase tienen
 * exactamente la misma forma (`{ code, message, details, hint }`), así que
 * mirar únicamente que haya `code` y `message` los daba por buenos y su texto
 * técnico —«TypeError: Failed to fetch»— acababa en la pantalla del usuario.
 */
export function isAppError(value: unknown): value is AppError {
  if (typeof value !== 'object' || value === null) return false
  if (!('code' in value) || !('message' in value)) return false

  const { code, message } = value as { code: unknown; message: unknown }

  return typeof message === 'string' && typeof code === 'string' && APP_ERROR_CODES.has(code)
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

/**
 * Convierte cualquier valor lanzado en un `AppError` seguro para la interfaz y
 * registra el detalle técnico para depuración.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error

  if (isOffline()) return createAppError('offline')

  const code: AppErrorCode = error instanceof TypeError ? 'network' : 'unknown'

  logger.error('Error no controlado', {
    code,
    detail: error instanceof Error ? error.message : String(error),
  })

  return createAppError(code)
}
