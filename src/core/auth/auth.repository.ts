import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

import { supabase } from '@/core/supabase'

import type { Credentials, RegisterInput } from './auth.types'

/**
 * Único punto de acceso a Supabase Auth. Sólo lee/escribe; sin reglas de negocio
 * (esas viven en auth.service.ts).
 */
export const authRepository = {
  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) =>
    supabase.auth.onAuthStateChange(callback),

  signInWithPassword: ({ email, password }: Credentials) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: ({ email, password, displayName }: RegisterInput) =>
    supabase.auth.signUp({
      email,
      password,
      ...(displayName ? { options: { data: { display_name: displayName } } } : {}),
    }),

  /** Manda un enlace de un solo uso al correo. Sin contrasena de por medio. */
  signInWithLink: (email: string, redirectTo: string) =>
    supabase.auth.signInWithOtp({
      email,
      // `shouldCreateUser: false` a propósito: este enlace **entra**, no crea
      // cuentas. Con él en `true`, un correo mal escrito abriría una cuenta
      // vacía en silencio y la persona creería que ya estaba registrada.
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    }),

  signOut: () => supabase.auth.signOut(),

  resetPasswordForEmail: (email: string, redirectTo: string) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo }),

  updatePassword: (password: string) => supabase.auth.updateUser({ password }),
}
