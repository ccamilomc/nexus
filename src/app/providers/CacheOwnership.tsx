import { useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, useEffect } from 'react'

import { useAuth } from '@/core/auth'

import {
  clearPersistedCache,
  hasPersistedCache,
  readCacheOwner,
  writeCacheOwner,
} from './query-persister'

/**
 * La caché pertenece a quien inició sesión, y se va con él.
 *
 * Sin sesión se vacía la caché en memoria **y** la guardada en el dispositivo.
 * Si sobreviviera, la siguiente persona que abriera este navegador se
 * encontraría el peso, las comidas y el sueño de la anterior: la RLS protege el
 * servidor, no el disco (ver ADR-0007).
 *
 * **Y también se va si es de otro.** No basta con borrar al cerrar sesión: eso
 * da por hecho que siempre se pasa por ahí, y son dos cosas distintas. Lo que
 * importa no es qué transición ocurrió, sino de quién es lo que hay guardado, y
 * eso se puede preguntar. Nexus va a tener dos cuentas —cada una con su sesión—
 * y puede que compartan un ordenador; con una sola daba igual equivocarse.
 *
 * Lo único que no decide nada es `loading`, que es el estado mientras se
 * comprueba la sesión; borrar ahí vaciaría la caché en cada arranque, justo lo
 * contrario de lo que se busca.
 *
 * Vive en `app/` y no en `core/auth` porque conoce **dónde** se persiste, que es
 * una decisión de la aplicación; la sesión no tiene por qué saberlo.
 */
export function CacheOwnership({ children }: PropsWithChildren) {
  const { status, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  useEffect(() => {
    if (status === 'loading') return

    // Sin sesión no hay dueño posible: lo guardado es de alguien que ya no está.
    if (status !== 'authenticated' || !userId) {
      queryClient.clear()
      clearPersistedCache()
      return
    }

    if (readCacheOwner() === userId) return

    // Hay sesión, pero lo guardado lo dejó otra persona —o nadie lo firmó, que
    // para el caso es igual de desconocido—. Se tira antes de firmar.
    //
    // Y sólo si hay algo: en el primer arranque de alguien no hay nada guardado
    // y vaciar aquí tiraría lo que las pantallas acaban de pedir, obligándolas a
    // pedirlo otra vez para nada.
    if (hasPersistedCache() || readCacheOwner() !== null) {
      queryClient.clear()
      clearPersistedCache()
    }

    writeCacheOwner(userId)
  }, [status, userId, queryClient])

  return children
}
