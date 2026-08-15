import { useMemo, useState } from 'react'

import { useToday } from '@/core/time'

import { ANALYTICS_PERIODS, DEFAULT_PERIOD_ID } from '../constants/dashboard.constants'
import type { AnalyticsPeriodId, PeriodWindow } from '../types/dashboard.types'
import { periodWindow } from '../utils/period'

interface AnalyticsPeriodState {
  readonly periodId: AnalyticsPeriodId
  readonly setPeriodId: (id: AnalyticsPeriodId) => void
  readonly window: PeriodWindow
}

/**
 * El periodo que mira la página, resuelto en fechas.
 *
 * Una sola fuente para toda la pantalla: si cada dominio eligiera el suyo, dos
 * cifras contiguas hablarían de tramos distintos sin avisar.
 *
 * El día lo da `useToday()`, nunca `new Date()`: así la página no se recalcula
 * sola a medianoche ni difiere de lo que muestra el resto de la aplicación.
 */
export function useDashboardPeriod(): AnalyticsPeriodState {
  const today = useToday()
  const [periodId, setPeriodId] = useState<AnalyticsPeriodId>(DEFAULT_PERIOD_ID)

  const window = useMemo(() => periodWindow(today, ANALYTICS_PERIODS[periodId]), [today, periodId])

  return { periodId, setPeriodId, window }
}
