import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { queryClient } from '@/app/providers/query-client'
import { AppErrorBoundary } from '@/core/error'
import { ThemeProvider } from '@/core/theme'

/**
 * Composición de providers globales. El orden importa: la frontera de errores
 * envuelve a todo para poder capturar fallos de cualquier provider interior.
 * En el Sprint 4 se añadirá aquí el provider de autenticación.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  )
}
