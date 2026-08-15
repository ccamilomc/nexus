import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { PropsWithChildren } from 'react'

import { CacheOwnership } from '@/app/providers/CacheOwnership'
import { queryClient } from '@/app/providers/query-client'
import { CACHE_BUSTER, CACHE_MAX_AGE_MS, queryPersister } from '@/app/providers/query-persister'
import { AuthProvider } from '@/core/auth'
import { AppErrorBoundary } from '@/core/error'
import { isResumableMutation } from '@/core/offline'
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
/**
 * Envía lo que quedó pendiente en cuanto se restaura lo guardado.
 *
 * **Hay que pedirlo:** restaurar la caché deja las mutaciones donde estaban,
 * pero no las lanza. Sin esta línea los registros hechos sin señal sobrevivían
 * al cierre y no salían nunca — comprobado antes de escribirla, con dos vasos de
 * agua que seguían en el disco y no llegaban a la base.
 *
 * Después se refresca lo que hay en pantalla, que se pintó con lo de ayer.
 */
function resumePendingWrites(): void {
  void queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries())
}

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
            // Sin esto se guardaba toda mutación pausada, también las que no
            // pueden reanudarse: quedaban en el disco para siempre y el aviso
            // prometía enviar registros que nunca iban a salir (ADR-0011).
            dehydrateOptions: { shouldDehydrateMutation: isResumableMutation },
          }}
          onSuccess={resumePendingWrites}
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
