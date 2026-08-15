import { useMutationState } from '@tanstack/react-query'

/**
 * Cuántos registros están esperando a que vuelva la conexión.
 *
 * Una mutación **pausada** es justo eso: TanStack la retiene sin lanzarla
 * mientras no hay red, y la reanuda sola al volver. Contarlas es lo que permite
 * decirle al usuario que lo suyo está guardado y pendiente de enviar, en vez de
 * dejarle mirando un botón que no responde.
 */
export function usePendingWrites(): number {
  return useMutationState({
    filters: { predicate: (mutation) => mutation.state.isPaused },
  }).length
}
