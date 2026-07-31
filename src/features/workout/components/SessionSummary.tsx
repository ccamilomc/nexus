import { formatMinutes } from '@/shared/utils'

import type { SessionStats } from '../types/workout.types'
import { formatVolume } from '../utils/format'

interface SessionSummaryProps {
  readonly stats: SessionStats
  /** La duración sólo tiene sentido cuando la sesión ya terminó. */
  readonly withDuration?: boolean
}

/** Cifras de un entrenamiento: ejercicios, series, volumen y duración. */
export function SessionSummary({ stats, withDuration = false }: SessionSummaryProps) {
  const items: readonly { label: string; value: string }[] = [
    { label: 'Ejercicios', value: String(stats.exerciseCount) },
    { label: 'Series', value: String(stats.setCount) },
    { label: 'Volumen', value: formatVolume(stats.totalVolumeKg) },
    ...(withDuration ? [{ label: 'Duración', value: formatMinutes(stats.durationMinutes) }] : []),
  ]

  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-2">
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
