import { createAppError } from '@/core/error'

/**
 * Garantiza el usuario para una escritura.
 *
 * Las rutas ya están protegidas, así que llegar aquí sin sesión sólo puede
 * significar que caducó. Lanza el `AppError` de sesión para tratarlo como el
 * resto de errores.
 */
export function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
}
