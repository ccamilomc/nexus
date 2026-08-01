import { type QueryKey, useQuery } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'

/**
 * Resultado de una serie: lo que la pantalla necesita para pintarla o explicar
 * por qué no puede.
 *
 * Cubre los estados obligatorios de la interfaz (cargando, error con salida, y
 * el dato) sin exponer la API entera de TanStack Query: quien consume una serie
 * no debería tener que conocerla.
 */
export interface SeriesQuery<TData> {
  readonly isPending: boolean
  readonly isError: boolean
  readonly errorMessage: string | null
  readonly retry: () => void
  readonly data: TData | null
}

interface SeriesQueryOptions<TData> {
  /**
   * Construye la clave de caché con el usuario.
   *
   * Es una función y no una clave ya hecha porque el `user_id` **tiene que
   * entrar en la clave**: dos usuarios no comparten datos, y una clave sin él
   * les serviría la caché del otro al cambiar de sesión.
   */
  readonly queryKey: (userId: string | undefined) => QueryKey
  /** Trae la serie. Recibe el usuario ya resuelto, nunca `undefined`. */
  readonly fetch: (userId: string) => Promise<TData>
}

/**
 * Base de los `useXSeries` de cada dominio.
 *
 * Los seis hooks de serie repetían la misma decena de líneas: resolver el
 * usuario, no consultar sin él, y traducir el estado de la consulta a esta
 * forma. Aquí vive una sola vez; cada dominio sólo aporta **su clave y su
 * consulta**, que es lo único suyo.
 *
 * Sin sesión devuelve `null` en lugar de consultar: la RLS rechazaría la
 * petición de todos modos y el error no le diría nada al usuario.
 */
export function useSeriesQuery<TData>({
  queryKey,
  fetch,
}: SeriesQueryOptions<TData>): SeriesQuery<TData> {
  const { user } = useAuth()
  const userId = user?.id

  const query = useQuery<TData | null, AppError>({
    queryKey: queryKey(userId),
    queryFn: () => (userId ? fetch(userId) : null),
  })

  return {
    isPending: query.isPending,
    isError: query.isError,
    errorMessage: query.error?.message ?? null,
    retry: () => void query.refetch(),
    data: query.data ?? null,
  }
}
