import { type AppError, createAppError } from '@/core/error'

import { authRepository } from './auth.repository'
import type { Credentials, RegisterInput } from './auth.types'

/**
 * Reglas de negocio de autenticación: orquesta el repositorio y traduce los
 * errores técnicos de Supabase a mensajes humanos (docs/07). Nunca toca la UI.
 */
function mapAuthError(message: string | undefined): AppError {
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

export const authService = {
  async signIn(credentials: Credentials): Promise<void> {
    const { error } = await authRepository.signInWithPassword(credentials)
    if (error) throw mapAuthError(error.message)
  },

  async signUp(input: RegisterInput): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await authRepository.signUp(input)
    if (error) throw mapAuthError(error.message)
    // Sin sesión inmediata => el proyecto exige confirmación por correo.
    return { needsConfirmation: data.session === null }
  },

  async signOut(): Promise<void> {
    const { error } = await authRepository.signOut()
    if (error) throw mapAuthError(error.message)
  },

  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    const { error } = await authRepository.resetPasswordForEmail(email, redirectTo)
    if (error) throw mapAuthError(error.message)
  },

  async updatePassword(password: string): Promise<void> {
    const { error } = await authRepository.updatePassword(password)
    if (error) throw mapAuthError(error.message)
  },
}
