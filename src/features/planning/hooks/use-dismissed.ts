import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import type { Recommendation } from '@/decision-engine'
import { toDateKey } from '@/shared/utils'

import { planningService } from '../services/planning.service'

export const planningKeys = {
  all: ['planning'] as const,
  dismissed: (userId: string | undefined, dateKey: string) =>
    [...planningKeys.all, 'dismissed', userId, dateKey] as const,
}

/**
 * Las recomendaciones que el usuario ya descartó hoy.
 *
 * Se piden por día: el descarte dura hasta medianoche, así que al cambiar el
 * día la clave cambia y la lista se vacía sola.
 */
export function useDismissedKeys(today: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<readonly string[], AppError>({
    queryKey: planningKeys.dismissed(userId, toDateKey(today)),
    queryFn: () => (userId ? planningService.getDismissedKeys(userId, today) : []),
  })
}

/** Descarta una recomendación durante el resto del día. */
export function useDismissRecommendation(today: Date) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: planningKeys.all }),
    [queryClient],
  )

  return useMutation<void, AppError, Recommendation>({
    mutationFn: (recommendation) => {
      if (!user?.id) throw createAppError('auth')

      return planningService.dismiss(user.id, recommendation, today)
    },
    onSuccess: refresh,
  })
}
