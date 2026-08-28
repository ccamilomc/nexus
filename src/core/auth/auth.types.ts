import type { Session, User } from '@supabase/supabase-js'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface Credentials {
  email: string
  password: string
}

export interface RegisterInput extends Credentials {
  displayName?: string | undefined
}

export interface AuthContextValue {
  status: AuthStatus
  session: Session | null
  user: User | null
  signIn: (credentials: Credentials) => Promise<void>
  signUp: (input: RegisterInput) => Promise<{ needsConfirmation: boolean }>
  /** Manda un enlace al correo para entrar sin contrasena. */
  requestSignInLink: (email: string, redirectTo: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string, redirectTo: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}
