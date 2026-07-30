import { useNutritionSummary } from '@/features/nutrition'

import type { SummaryItem } from '../constants/dashboard-items'
import { SummaryCard } from './SummaryCard'
import { SummaryLines } from './SummaryLines'

/** Tarjeta de nutrición con lo consumido hoy. */
export function NutritionSummaryCard({ to, label, Icon, emptyLabel }: SummaryItem) {
  const { isPending, isEmpty, lines } = useNutritionSummary()

  return (
    <SummaryCard to={to} label={label} Icon={Icon}>
      <SummaryLines
        isPending={isPending}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        lines={lines}
        loadingLabel="Cargando tu nutrición de hoy"
      />
    </SummaryCard>
  )
}
