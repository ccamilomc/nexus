import { useToday } from '@/core/time'
import { type SeriesQuery, useSeriesQuery } from '@/shared/hooks'
import { toDateKey, type WindowBaseline } from '@/shared/utils'

import { workoutService } from '../services/workout.service'
import { workoutKeys } from './workout.keys'

/**
 * Cuánto volumen sueles levantar en un tramo.
 *
 * Es la referencia con la que el panel decide si una semana es noticia. Comparar
 * con la semana anterior es comparar con una muestra de uno: sobre 16 semanas
 * reales, seis salían anunciadas siendo corrientes y una rara se callaba.
 *
 * Ventana móvil, así que la clave lleva el día y no el tramo que se esté
 * mirando: lo normal en ti no cambia al retroceder en el selector.
 */
export function useWorkoutWindowTypicals(): SeriesQuery<readonly WindowBaseline[]> {
  const today = useToday()

  return useSeriesQuery({
    queryKey: (userId) => workoutKeys.windowTypicals(userId, toDateKey(today)),
    fetch: (userId) => workoutService.getWindowTypicals(userId, today),
  })
}
