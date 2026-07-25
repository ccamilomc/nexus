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
