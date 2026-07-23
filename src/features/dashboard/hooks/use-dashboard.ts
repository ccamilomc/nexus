import { useMemo } from 'react'

import { useAuth } from '@/core/auth'

import { getGreeting } from '../utils/greeting'

interface DashboardSummary {
  readonly name: string
  readonly greeting: string
  readonly todayLabel: string
}

/**
 * Prepara los datos de cabecera del dashboard (saludo, nombre y fecha).
 * A medida que aterricen las features, aquí se compondrá el resumen real del día.
 */
export function useDashboard(): DashboardSummary {
  const { user } = useAuth()

  return useMemo(() => {
    const now = new Date()

    const metadataName =
      user && typeof user.user_metadata.display_name === 'string'
        ? user.user_metadata.display_name
        : undefined
    const emailName = user?.email ? user.email.split('@')[0] : undefined

    const rawDate = now.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

    return {
      name: metadataName ?? emailName ?? '',
      greeting: getGreeting(now.getHours()),
      todayLabel: rawDate.charAt(0).toUpperCase() + rawDate.slice(1),
    }
  }, [user])
}
