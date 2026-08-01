import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import type { PlanItemValues } from '../schemas/planning.schema'
import { planningService } from '../services/planning.service'
import type { PlanItem, TodayPlan } from '../types/planning.types'
import { planningKeys } from './use-dismissed'

/** El plan que el usuario se ha puesto para hoy. */
export function useTodayPlan(today: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<TodayPlan | null, AppError>({
    queryKey: planningKeys.plan(userId, toDateKey(today)),
    queryFn: () => (userId ? planningService.getTodayPlan(userId, today) : null),
  })
}

/** Refresca el plan entero tras cualquier cambio. */
function useRefreshPlan() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: planningKeys.all }),
    [queryClient],
  )
}

export function useAddPlanItem(today: Date) {
  const { user } = useAuth()
  const refresh = useRefreshPlan()

  return useMutation<void, AppError, PlanItemValues>({
    mutationFn: (values) => {
      if (!user?.id) throw createAppError('auth')

      return planningService.addPlanItem(user.id, today, values)
    },
    onSuccess: refresh,
  })
}

interface StatusChange {
  readonly itemId: string
  readonly status: PlanItem['status']
}

export function useSetPlanItemStatus() {
  const refresh = useRefreshPlan()

  return useMutation<void, AppError, StatusChange>({
    mutationFn: ({ itemId, status }) => planningService.setPlanItemStatus(itemId, status),
    onSuccess: refresh,
  })
}

export function useRemovePlanItem() {
  const refresh = useRefreshPlan()

  return useMutation<void, AppError, string>({
    mutationFn: (itemId) => planningService.removePlanItem(itemId),
    onSuccess: refresh,
  })
}
