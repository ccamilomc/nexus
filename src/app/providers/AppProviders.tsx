import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { queryClient } from '@/app/providers/query-client'

/**
 * Composición de providers globales de la aplicación. En el Sprint 2 se añadirán
 * aquí el Router, el Theme y el ErrorBoundary global.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
