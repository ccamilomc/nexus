import { useMemo } from 'react'

import { useAuth } from '@/core/auth'
import { useNow } from '@/core/time'

import { getGreeting } from '../utils/greeting'

interface DashboardSummary {
  readonly name: string
  readonly greeting: string
  readonly todayLabel: string
}

/**
 * Prepara los datos de cabecera del dashboard (saludo, nombre y fecha).
 *
 * La hora viene del reloj de la aplicación, no de un `new Date()` al montar:
 * el saludo cambia tres veces al día y la fecha una, y quien deja la app
 * abierta merece leer la verdad y no la de cuando la abrió.
 */
export function useDashboard(): DashboardSummary {
  const { user } = useAuth()
  const now = useNow()

  return useMemo(() => {
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
  }, [user, now])
}
