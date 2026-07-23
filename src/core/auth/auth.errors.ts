import { type AppError, createAppError } from '@/core/error'

/**
 * Traduce los errores técnicos de Supabase Auth a mensajes humanos (docs/07).
 * Función pura y sin dependencias de red: fácil de probar en aislamiento.
 */
export function mapAuthError(message: string | undefined): AppError {
  const text = (message ?? '').toLowerCase()

  if (text.includes('invalid login credentials')) {
    return createAppError('auth', 'Correo o contraseña incorrectos.')
  }
  if (text.includes('email not confirmed')) {
    return createAppError('auth', 'Confirma tu correo antes de iniciar sesión.')
  }
  if (text.includes('already registered') || text.includes('already been registered')) {
    return createAppError('validation', 'Ese correo ya tiene una cuenta.')
  }
  if (text.includes('password')) {
    return createAppError('validation', 'La contraseña no cumple los requisitos mínimos.')
  }
  if (text.includes('rate limit') || text.includes('too many')) {
    return createAppError('unknown', 'Demasiados intentos. Espera un momento e inténtalo de nuevo.')
  }
  return createAppError('unknown')
}
