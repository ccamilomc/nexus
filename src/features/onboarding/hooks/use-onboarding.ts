import { useCallback, useMemo, useState } from 'react'

import { useAuth } from '@/core/auth'
import { useToday } from '@/core/time'
import { useSaveGoal } from '@/features/nutrition'
import { profileService, useProfile } from '@/features/profile'
import { useSaveSleepGoal } from '@/features/sleep'

import type { TrackableId } from '../constants/onboarding.constants'
import type { BodyValues, GoalsValues } from '../schemas/onboarding.schema'
import { suggestCalories } from '../utils/calorie-suggestion'
import { splitIntoTargets } from '../utils/macro-split'
import { type StepId, stepsFor } from '../utils/steps'

/** Lo que se va recogiendo mientras se avanza. */
interface Draft {
  readonly displayName: string
  readonly tracked: readonly TrackableId[]
  readonly body: BodyValues | null
}

const EMPTY: Draft = {
  displayName: '',
  tracked: [],
  body: null,
}

/**
 * El estado de la bienvenida y lo que ocurre al terminarla.
 *
 * **Nada se guarda hasta el final.** Mientras se avanza, todo vive aquí en
 * memoria: así «atrás» de verdad vuelve atrás, y quien cierre la aplicación a
 * mitad no se queda con un perfil a medio llenar que después nadie sabe si
 * completó o no.
 */
export function useOnboarding() {
  const { user } = useAuth()
  const today = useToday()
  const { data: profile } = useProfile()
  const saveNutritionGoal = useSaveGoal()
  const saveSleepGoal = useSaveSleepGoal()

  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [index, setIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const steps = useMemo(() => stepsFor(draft.tracked), [draft.tracked])
  const step: StepId = steps[Math.min(index, steps.length - 1)] ?? 'welcome'

  const suggestion = useMemo(
    () =>
      suggestCalories(
        {
          weightKg: draft.body?.weightKg ?? null,
          heightCm: draft.body?.heightCm ?? profile?.height_cm ?? null,
          birthDate: draft.body?.birthDate ?? profile?.birth_date ?? null,
          sex: draft.body?.sex ?? profile?.sex ?? 'unspecified',
        },
        today,
      ),
    [draft.body, profile, today],
  )

  const next = useCallback(() => setIndex((current) => current + 1), [])
  const back = useCallback(() => setIndex((current) => Math.max(0, current - 1)), [])

  const setName = useCallback((displayName: string) => setDraft((d) => ({ ...d, displayName })), [])
  /**
   * Marca o desmarca un modulo.
   *
   * Recibe el id y no la lista entera **a proposito**: calculando la lista nueva
   * fuera, dos toques seguidos leen la misma copia vieja y el segundo pisa al
   * primero. Con la actualizacion funcional cada toque parte de lo que hay.
   */
  const toggleTracked = useCallback(
    (id: TrackableId) =>
      setDraft((d) => ({
        ...d,
        tracked: d.tracked.includes(id)
          ? d.tracked.filter((current) => current !== id)
          : [...d.tracked, id],
      })),
    [],
  )
  const setBody = useCallback((body: BodyValues) => setDraft((d) => ({ ...d, body })), [])

  /**
   * Guarda todo de una vez y deja anotado que ya pasó por aquí.
   *
   * El perfil se marca como completado **aunque no se haya llenado nada**: quien
   * se salta la bienvenida está diciendo que no la quiere, y volver a
   * enseñársela cada vez que entra sería no escucharle. Todo lo que se pregunta
   * aquí se puede poner después en su propia pantalla.
   */
  const finish = useCallback(
    async (goals: GoalsValues | null) => {
      if (!user?.id) return

      setIsSaving(true)
      try {
        await profileService.save(user.id, {
          ...(draft.displayName.trim() && { displayName: draft.displayName.trim() }),
          ...(draft.body && {
            heightCm: draft.body.heightCm,
            birthDate: draft.body.birthDate,
            sex: draft.body.sex,
          }),
        })

        if (goals && draft.tracked.includes('nutrition')) {
          await saveNutritionGoal.mutateAsync(
            splitIntoTargets(goals.caloriesTarget, draft.body?.weightKg ?? null),
          )
        }

        if (goals && draft.tracked.includes('sleep')) {
          await saveSleepGoal.mutateAsync({ targetHours: goals.sleepHours })
        }

        await profileService.completeOnboarding(user.id)
      } finally {
        setIsSaving(false)
      }
    },
    [draft, saveNutritionGoal, saveSleepGoal, user?.id],
  )

  return {
    step,
    stepNumber: Math.min(index, steps.length - 1) + 1,
    stepCount: steps.length,
    draft,
    suggestion,
    isSaving,
    next,
    back,
    setName,
    toggleTracked,
    setBody,
    finish,
  }
}
