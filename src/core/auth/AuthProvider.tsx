import type { Session } from '@supabase/supabase-js'
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'

import { env } from '@/core/config/env'
import { createAppError, isAppError } from '@/core/error'
import { logger } from '@/core/logger'

import { AuthContext } from './auth.context'
import { authRepository } from './auth.repository'
import { authService } from './auth.service'
import type { AuthContextValue, AuthStatus } from './auth.types'

/**
 * Mantiene la sesión del usuario y la sincroniza con Supabase Auth (persistencia
 * y refresco los gestiona el cliente). Expone estado y acciones vía contexto.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let active = true

    authRepository
      .getSession()
      .then(({ data }) => {
        if (!active) return
        // Auto-login de desarrollo: sin sesión y con credenciales de prueba,
        // entra solo; si la cuenta de prueba no existe, la crea.
        // onAuthStateChange actualizará el estado al haber sesión.
        if (!data.session && env.devUser) {
          const credentials = env.devUser

          authService
            .signIn(credentials)
            .catch(() =>
              authService.signUp(credentials).then(({ needsConfirmation }) => {
                if (needsConfirmation) {
                  throw createAppError(
                    'auth',
                    'La cuenta de prueba necesita confirmar el correo. Desactiva "Confirm email" en Supabase.',
                  )
                }
              }),
            )
            .catch((error: unknown) => {
              const detail = isAppError(error)
                ? `${error.code}: ${error.message}`
                : error instanceof Error
                  ? error.message
                  : String(error)
              logger.warn(`Auto-login de desarrollo falló — ${detail}`)
              if (active) setStatus('unauthenticated')
            })
          return
        }
        setSession(data.session)
        setStatus(data.session ? 'authenticated' : 'unauthenticated')
      })
      .catch((error: unknown) => {
        if (!active) return
        logger.error('No se pudo recuperar la sesión', {
          detail: error instanceof Error ? error.message : String(error),
        })
        setStatus('unauthenticated')
      })

    const {
      data: { subscription },
    } = authRepository.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'unauthenticated')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const requestPasswordReset = useCallback(
    (email: string, redirectTo: string) => authService.requestPasswordReset(email, redirectTo),
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      signIn: authService.signIn,
      signUp: authService.signUp,
      signOut: authService.signOut,
      requestPasswordReset,
      updatePassword: authService.updatePassword,
    }),
    [status, session, requestPasswordReset],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
