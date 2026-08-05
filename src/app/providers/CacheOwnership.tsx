import { useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, useEffect } from 'react'

import { useAuth } from '@/core/auth'

import { clearPersistedCache } from './query-persister'

/**
 * La caché pertenece a quien inició sesión, y se va con él.
 *
 * Sin sesión se vacía la caché en memoria **y** la guardada en el dispositivo.
 * Si sobreviviera, la siguiente persona que abriera este navegador se
 * encontraría el peso, las comidas y el sueño de la anterior: la RLS protege el
 * servidor, no el disco (ver ADR-0007).
 *
 * Da igual si la sesión se cerró ahora o si nunca la hubo: en ambos casos lo
 * guardado pertenece a alguien que ya no está. Lo único que no decide nada es
 * `loading`, que es el estado mientras se comprueba la sesión; borrar ahí
 * vaciaría la caché en cada arranque, justo lo contrario de lo que se busca.
 *
 * Vive en `app/` y no en `core/auth` porque conoce **dónde** se persiste, que es
 * una decisión de la aplicación; la sesión no tiene por qué saberlo.
 */
export function CacheOwnership({ children }: PropsWithChildren) {
  const { status } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (status !== 'unauthenticated') return

    queryClient.clear()
    clearPersistedCache()
  }, [status, queryClient])

  return children
}
