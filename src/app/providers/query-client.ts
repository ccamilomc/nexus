import { QueryClient } from '@tanstack/react-query'

/**
 * Cliente único de TanStack Query. Es el único canal de server state de la app
 * (ver docs/02-arquitectura.md). Las opciones se afinarán por feature y con la
 * capa offline (Sprint 14).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
