import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'

import { SESSION_HISTORY_LIMIT } from '../constants/workout.constants'
import { workoutService } from '../services/workout.service'
import type { SessionDetail } from '../types/workout.types'
import { workoutKeys } from './workout.keys'

/**
 * Entrenamientos terminados, del más reciente al más antiguo.
 *
 * Trae un tramo y **crece a demanda**: con tres meses de gimnasio ya hay más de
 * cuarenta sesiones, y hasta ahora el historial se paraba en las veinte últimas
 * sin decirlo. Las anteriores no se podían ver desde ninguna parte.
 *
 * Se pide **un tramo mayor** en lugar de páginas encadenadas
 * (`useInfiniteQuery`). Con listas de decenas la diferencia es un viaje que trae
 * de más lo que ya estaba, y a cambio la lista sigue siendo una sola consulta y
 * una sola entrada de caché. **Si esto llegara a cientos de sesiones**, o si al
 * ampliar se notara la espera, ahí sí toca paginar de verdad.
 */
export function useSessionHistory() {
  const { user } = useAuth()
  const userId = user?.id
  const [limit, setLimit] = useState(SESSION_HISTORY_LIMIT)

  const query = useQuery<SessionDetail[], AppError>({
    queryKey: workoutKeys.history(userId, limit),
    queryFn: () => (userId ? workoutService.getSessionHistory(userId, limit) : []),
  })

  return {
    ...query,
    /**
     * Si puede haber más de las que se ven.
     *
     * Se deduce de que el servidor haya devuelto el tramo completo: si trajo
     * menos de lo pedido, no queda nada detrás. No cuesta una consulta extra.
     */
    hasMore: (query.data?.length ?? 0) >= limit,
    isLoadingMore: query.isFetching && !query.isPending,
    showMore: () => setLimit((current) => current + SESSION_HISTORY_LIMIT),
  }
}
