import { useToday } from '@/core/time'
import { type SeriesQuery, useSeriesQuery } from '@/shared/hooks'
import { toDateKey, type WindowBaseline } from '@/shared/utils'

import { studyService } from '../services/study.service'
import { studyKeys } from './study.keys'

/**
 * Cuánto sueles estudiar en un tramo.
 *
 * Es la referencia con la que el panel decide si una semana es noticia. Comparar
 * con la semana anterior es comparar con una muestra de uno: sobre 15 semanas
 * reales, diez salían anunciadas siendo corrientes.
 *
 * Ventana móvil, así que la clave lleva el día y no el tramo que se esté
 * mirando: lo normal en ti no cambia al retroceder en el selector.
 */
export function useStudyWindowTypicals(): SeriesQuery<readonly WindowBaseline[]> {
  const today = useToday()

  return useSeriesQuery({
    queryKey: (userId) => studyKeys.windowTypicals(userId, toDateKey(today)),
    fetch: (userId) => studyService.getWindowTypicals(userId, today),
  })
}
