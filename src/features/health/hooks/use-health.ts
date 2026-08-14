import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { useNow } from '@/core/time'

import type { LogMeasurementsValues } from '../schemas/health.schema'
import type { HealthOverview } from '../services/health.service'
import { healthService } from '../services/health.service'
import type { BodyMetric, BodyMetricType, MetricHistory } from '../types/health.types'

export const healthKeys = {
  all: ['health'] as const,
  overview: (userId: string | undefined) => [...healthKeys.all, 'overview', userId] as const,
  history: (userId: string | undefined, metricType: string) =>
    [...healthKeys.all, 'history', userId, metricType] as const,
  weightSeries: (userId: string | undefined, rangeKey: string) =>
    [...healthKeys.all, 'weight-series', userId, rangeKey] as const,
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

/**
 * Cómo ha ido una medida. **Sólo se pide cuando se abre.**
 *
 * Con `null` la consulta ni se lanza: son ocho medidas y traerlas todas al
 * cargar la pantalla serían ocho viajes para enseñar uno.
 */
export function useMetricHistory(metricType: BodyMetricType | null) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<MetricHistory | null, AppError>({
    queryKey: healthKeys.history(userId, metricType ?? 'ninguna'),
    queryFn: () => (userId && metricType ? healthService.getHistory(userId, metricType) : null),
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

/**
 * Registra una vuelta de medidas: las que se hayan tomado, con su día.
 *
 * Sustituye al registro de una en una: incluso apuntar sólo el peso es rellenar
 * una casilla de éstas, así que tener dos caminos era tener uno de sobra.
 */
export function useLogMeasurements() {
  const { user } = useAuth()
  const now = useNow()
  const refresh = useRefreshHealth()

  return useMutation<BodyMetric[], AppError, LogMeasurementsValues>({
    mutationFn: (values) => healthService.logMeasurements(requireUserId(user?.id), values, now),
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
