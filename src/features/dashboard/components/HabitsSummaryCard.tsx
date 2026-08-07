import { useHabitsSummary } from '@/features/habits'

import type { SummaryItem } from '../constants/dashboard-items'
import { SummaryCard } from './SummaryCard'
import { SummaryLines } from './SummaryLines'

/** Tarjeta de hábitos con lo cumplido hoy y la mejor racha. */
export function HabitsSummaryCard({ to, label, Icon, emptyLabel }: SummaryItem) {
  const { isPending, isEmpty, lines, progress } = useHabitsSummary()

  return (
    <SummaryCard to={to} label={label} Icon={Icon}>
      <SummaryLines
        isPending={isPending}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        lines={lines}
        progress={progress}
        loadingLabel="Cargando tus hábitos de hoy"
      />
    </SummaryCard>
  )
}
