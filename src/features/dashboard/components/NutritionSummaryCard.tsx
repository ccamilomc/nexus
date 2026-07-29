import type { LucideIcon } from 'lucide-react'

import { useNutritionSummary } from '@/features/nutrition'
import { Skeleton } from '@/shared/components/feedback'

import { SummaryCard } from './SummaryCard'

interface NutritionSummaryCardProps {
  readonly to: string
  readonly label: string
  readonly Icon: LucideIcon
  /** Qué decir cuando aún no se ha registrado nada hoy. */
  readonly emptyLabel: string
}

/** Tarjeta de nutrición con lo consumido hoy. */
export function NutritionSummaryCard({ to, label, Icon, emptyLabel }: NutritionSummaryCardProps) {
  const { isPending, isEmpty, lines } = useNutritionSummary()

  return (
    <SummaryCard to={to} label={label} Icon={Icon}>
      {isPending ? (
        <div className="space-y-1.5" role="status" aria-label="Cargando tu nutrición de hoy">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : isEmpty ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="space-y-0.5">
          {lines.map((line) => (
            <li key={line} className="text-sm tabular-nums">
              {line}
            </li>
          ))}
        </ul>
      )}
    </SummaryCard>
  )
}
