import { useMemo, useState } from 'react'

import { useToday } from '@/core/time'

import { ANALYTICS_PERIODS, DEFAULT_PERIOD_ID } from '../constants/dashboard.constants'
import type { AnalyticsPeriodId, PeriodWindow } from '../types/dashboard.types'
import { periodWindow } from '../utils/period'

interface AnalyticsPeriodState {
  readonly periodId: AnalyticsPeriodId
  readonly setPeriodId: (id: AnalyticsPeriodId) => void
  readonly window: PeriodWindow
  /** Mueve el tramo un periodo hacia atras. */
  readonly goBack: () => void
  /** Lo acerca al presente. No hace nada si ya termina hoy. */
  readonly goForward: () => void
  /** Si se puede avanzar; falso cuando el tramo ya acaba hoy. */
  readonly canGoForward: boolean
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
  const [periodId, setPeriodIdState] = useState<AnalyticsPeriodId>(DEFAULT_PERIOD_ID)
  const [offset, setOffset] = useState(0)

  const window = useMemo(
    () => periodWindow(today, ANALYTICS_PERIODS[periodId], offset),
    [today, periodId, offset],
  )

  return {
    periodId,
    // Cambiar de tamano vuelve al presente: retroceder tres tramos de 7 dias y
    // pasar a 90 dejaria mirando hace nueve meses sin haberlo pedido.
    setPeriodId: (id: AnalyticsPeriodId) => {
      setPeriodIdState(id)
      setOffset(0)
    },
    window,
    goBack: () => setOffset((current) => current + 1),
    goForward: () => setOffset((current) => Math.max(0, current - 1)),
    canGoForward: offset > 0,
  }
}
