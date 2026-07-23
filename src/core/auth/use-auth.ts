import { useContext } from 'react'

import { AuthContext } from './auth.context'
import type { AuthContextValue } from './auth.types'

/** Acceso a la sesión y las acciones de autenticación. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  }
  return context
}
