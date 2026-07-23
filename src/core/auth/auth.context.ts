import { createContext } from 'react'

import type { AuthContextValue } from './auth.types'

/** Contexto de sesión. Se consume siempre mediante `useAuth` (nunca directo). */
export const AuthContext = createContext<AuthContextValue | null>(null)
