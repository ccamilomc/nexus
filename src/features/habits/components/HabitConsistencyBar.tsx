import { Progress } from '@/shared/components/ui/progress'

import type { HabitConsistency } from '../types/habits.types'

interface HabitConsistencyBarProps {
  readonly consistency: HabitConsistency
}

/**
 * Constancia del hábito: la tendencia, no el día suelto.
 *
 * Responde a «¿lo estoy manteniendo?», que es lo que un calendario mensual
 * contestaría, pero en una línea. Las vistas históricas más ricas viven en
 * Analytics (Sprint 12), no aquí.
 */
export function HabitConsistencyBar({ consistency }: HabitConsistencyBarProps) {
  const { doneDays, totalDays, percent } = consistency
  const label = `Constancia: ${percent}% en ${totalDays === 1 ? 'el último día' : `los últimos ${totalDays} días`}`

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">Constancia</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {doneDays} de {totalDays} {totalDays === 1 ? 'día' : 'días'} · {percent}%
        </span>
      </div>
      <Progress value={percent} label={label} />
    </div>
  )
}
