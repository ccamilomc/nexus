import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/core/auth'

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

  if (status === 'loading') return <FullScreenLoader />
  if (status === 'unauthenticated') {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Evita que un usuario con sesión vea las pantallas de auth. */
export function RedirectIfAuth() {
  const { status } = useAuth()

  if (status === 'loading') return <FullScreenLoader />
  if (status === 'authenticated') return <Navigate to={ROUTES.dashboard} replace />
  return <Outlet />
}
