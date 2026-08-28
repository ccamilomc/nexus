/**
 * Reconocimiento de errores de Postgres que llegan vía Supabase.
 *
 * Sólo lo justo para traducirlos a un `AppError` con mensaje humano en el
 * service; no es un cliente ni conoce tablas.
 */

/** Código de violación de clave foránea en Postgres (`foreign_key_violation`). */
const FOREIGN_KEY_VIOLATION = '23503'

function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code: unknown }
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

/**
 * ¿El error es porque otra fila aún referencia a la que se intenta borrar?
 *
 * Ocurre al borrar un ejercicio usado en una rutina o en una serie
 * (`on delete restrict`, ver la migración de workout).
 */
export function isForeignKeyViolation(error: unknown): boolean {
  return errorCode(error) === FOREIGN_KEY_VIOLATION
}

/**
 * SQLSTATE de un `raise exception` de plpgsql sin código propio.
 *
 * Los triggers de Nexus lanzan un nombre corto —`splits_exceed_total`— en vez de
 * una frase: el texto que ve el usuario se escribe en el service, en español y
 * con el contexto de lo que estaba haciendo, no dentro de una migración.
 */
const RAISE_EXCEPTION = 'P0001'

function errorMessage(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message: unknown }
    return typeof message === 'string' ? message : undefined
  }
  return undefined
}

/** ¿El error viene de un `raise exception` con este nombre? */
export function isRaisedError(error: unknown, name: string): boolean {
  return errorCode(error) === RAISE_EXCEPTION && (errorMessage(error)?.includes(name) ?? false)
}
