import { mapAuthError } from './auth.errors'
import { authRepository } from './auth.repository'
import type { Credentials, RegisterInput } from './auth.types'

/**
 * Reglas de negocio de autenticación: orquesta el repositorio y traduce los
 * errores técnicos a mensajes humanos (ver auth.errors.ts). Nunca toca la UI.
 */
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
