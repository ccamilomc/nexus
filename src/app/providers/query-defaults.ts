import type { DefaultOptions } from '@tanstack/react-query'

/**
 * Los ajustes por defecto de todas las consultas.
 *
 * **Viven aparte del cliente y sin una sola importación** para que se puedan
 * probar. `query-client.ts` arrastra las mutaciones offline, y ésas arrastran
 * las seis features enteras y con ellas Supabase: importarlo desde una prueba
 * revienta en integración continua, donde no hay `.env`.
 */
export const QUERY_DEFAULTS: DefaultOptions = {
  queries: {
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
}
