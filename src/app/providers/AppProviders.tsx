import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { queryClient } from '@/app/providers/query-client'
import { AuthProvider } from '@/core/auth'
import { AppErrorBoundary } from '@/core/error'
import { ThemeProvider } from '@/core/theme'

/**
 * Composición de providers globales. El orden importa: la frontera de errores
 * envuelve a todo; la sesión (AuthProvider) queda disponible para toda la app.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  )
}
