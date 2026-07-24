import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/core/auth'
import { env } from '@/core/config/env'

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
    return <Navigate to={typeof from === 'string' ? from : ROUTES.dashboard} replace />
  }
  return <Outlet />
}
