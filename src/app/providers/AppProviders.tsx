import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { queryClient } from '@/app/providers/query-client'
import { AuthProvider } from '@/core/auth'
import { AppErrorBoundary } from '@/core/error'
import { ThemeProvider } from '@/core/theme'
import { TimeProvider } from '@/core/time'

/**
 * Composición de providers globales. El orden importa: la frontera de errores
 * envuelve a todo; la sesión (AuthProvider) queda disponible para toda la app.
 *
 * El reloj (TimeProvider) va dentro de la sesión porque todo lo que fecha algo
 * pertenece a un usuario, y fuera de nada más: no depende de nadie.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TimeProvider>{children}</TimeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  )
}
