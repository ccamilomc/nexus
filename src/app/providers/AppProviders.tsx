import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { PropsWithChildren } from 'react'

import { CacheOwnership } from '@/app/providers/CacheOwnership'
import { queryClient } from '@/app/providers/query-client'
import { CACHE_BUSTER, CACHE_MAX_AGE_MS, queryPersister } from '@/app/providers/query-persister'
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
 *
 * La caché se **persiste** para que abrir sin señal enseñe lo último conocido en
 * lugar de una pantalla vacía (ADR-0007), y `CacheOwnership` la borra cuando no
 * hay sesión. Va dentro de `AuthProvider` porque necesita saber si la hay.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge: CACHE_MAX_AGE_MS,
            buster: CACHE_BUSTER,
          }}
        >
          <AuthProvider>
            <CacheOwnership>
              <TimeProvider>{children}</TimeProvider>
            </CacheOwnership>
          </AuthProvider>
        </PersistQueryClientProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  )
}
