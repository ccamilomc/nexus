import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/core/auth'
import { env } from '@/core/config/env'
import { useProfile } from '@/features/profile'

import { ROUTES } from './routes'

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div
        role="status"
        aria-label="Cargando"
        className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground"
      />
    </div>
  )
}

/** Protege las rutas privadas: sin sesión, redirige a iniciar sesión. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  // Puenteo de desarrollo: permite ver las rutas protegidas sin sesión.
  if (env.authDisabled) return <Outlet />

  if (status === 'loading') return <FullScreenLoader />
  if (status === 'unauthenticated') {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Evita que un usuario con sesión vea las pantallas de auth. */
export function RedirectIfAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullScreenLoader />
  if (status === 'authenticated') {
    // Si llegó redirigido desde una ruta protegida, vuelve a ella tras entrar.
    const from: unknown = location.state?.from
    return <Navigate to={typeof from === 'string' ? from : ROUTES.today} replace />
  }
  return <Outlet />
}

/**
 * Manda a la bienvenida a quien nunca ha pasado por ella.
 *
 * Va **dentro** de `RequireAuth` y **fuera** del cascarón: hace falta sesión
 * para saber si ya la vio, y la bienvenida no lleva barra ni menú.
 *
 * **Mientras el perfil está cargando no redirige a ningún lado**, deja pasar. Un
 * desvío basado en un dato que todavía no ha llegado mandaría a la bienvenida a
 * quien ya la hizo, cada vez que abre la aplicación.
 */
export function RequireOnboarding() {
  const { data: profile, isPending } = useProfile()

  if (env.authDisabled || isPending) return <Outlet />
  if (profile && !profile.onboarding_completed) return <Navigate to={ROUTES.onboarding} replace />

  return <Outlet />
}
