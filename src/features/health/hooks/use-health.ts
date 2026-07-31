import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'

import type { LogMetricValues } from '../schemas/health.schema'
import type { HealthOverview } from '../services/health.service'
import { healthService } from '../services/health.service'
import type { BodyMetric, BodyMetricType } from '../types/health.types'

export const healthKeys = {
  all: ['health'] as const,
  overview: (userId: string | undefined) => [...healthKeys.all, 'overview', userId] as const,
  history: (userId: string | undefined, metricType: string) =>
    [...healthKeys.all, 'history', userId, metricType] as const,
}

/** Las escrituras necesitan usuario; sin él, la sesión caducó. */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
}

/** Última lectura de cada medida, con el IMC. */
export function useHealthOverview() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<HealthOverview | null, AppError>({
    queryKey: healthKeys.overview(userId),
    queryFn: () => (userId ? healthService.getOverview(userId) : null),
  })
}

/** El histórico de una medida. Sólo se pide cuando se abre. */
export function useMetricHistory(metricType: BodyMetricType | null) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<BodyMetric[], AppError>({
    queryKey: healthKeys.history(userId, metricType ?? 'none'),
    queryFn: () => (userId && metricType ? healthService.getHistory(userId, metricType) : []),
    enabled: metricType !== null,
  })
}

/** Refresca el módulo entero tras cualquier cambio. */
function useRefreshHealth() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: healthKeys.all }),
    [queryClient],
  )
}

/** Registra una medición. */
export function useLogMetric() {
  const { user } = useAuth()
  const refresh = useRefreshHealth()

  return useMutation<void, AppError, LogMetricValues>({
    mutationFn: (values) => healthService.logMetric(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

/** Quita una medición apuntada por error. */
export function useRemoveMetric() {
  const refresh = useRefreshHealth()

  return useMutation<void, AppError, string>({
    mutationFn: (metricId) => healthService.removeMetric(metricId),
    onSuccess: refresh,
  })
}

/** Guarda la altura del perfil (sólo para el IMC). */
export function useSaveHeight() {
  const { user } = useAuth()
  const refresh = useRefreshHealth()

  return useMutation<void, AppError, number>({
    mutationFn: (heightCm) => healthService.saveHeight(requireUserId(user?.id), heightCm),
    onSuccess: refresh,
  })
}
