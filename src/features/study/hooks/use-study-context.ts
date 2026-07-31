import { useToday } from '@/core/time'
import type { DailyContext } from '@/decision-engine'

import { useWeekStudy } from './use-study'

/** Parte del contexto diario que aporta estudio. */
export interface StudyContext {
  readonly isPending: boolean
  readonly study: DailyContext['study']
  /** Objetivo semanal conjunto en minutos; `undefined` si no hay ninguno. */
  readonly weeklyTargetMinutes: number | undefined
}

/**
 * Lo que el Decision Engine necesita saber de estudio.
 *
 * Devuelve **datos**, no frases: el motor razona con ellos. Es el contrato
 * hermano de `useStudySummary`, que devuelve texto para el dashboard.
 */
export function useStudyContext(): StudyContext {
  const today = useToday()
  const { data, isPending } = useWeekStudy(today)

  return {
    isPending,
    study: { weekMinutes: data?.totalMinutes ?? 0 },
    weeklyTargetMinutes: data?.targetMinutes ?? undefined,
  }
}
