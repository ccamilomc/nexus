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
  offline: 'No hay conexión. Guardaremos tus cambios y se sincronizarán solos.',
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

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as AppError).message === 'string'
  )
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
