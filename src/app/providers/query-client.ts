import { QueryClient } from '@tanstack/react-query'

import { QUERY_DEFAULTS } from './query-defaults'
import { registerOfflineMutations } from './register-offline-mutations'

/**
 * Cliente único de TanStack Query. Es el único canal de server state de la app
 * (ver docs/02-arquitectura.md).
 */
export const queryClient = new QueryClient({
  defaultOptions: QUERY_DEFAULTS,
})

/**
 * Al crear el cliente, no dentro de un componente: lo encolado se reanuda en
 * cuanto se restaura la caché, y para entonces ya tiene que estar registrado
 * (ADR-0011).
 */
registerOfflineMutations(queryClient)
