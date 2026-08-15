import { useWorkoutSummary } from '@/features/workout'

import type { SummaryItem } from '../constants/dashboard-items'
import { SummaryCard } from './SummaryCard'
import { SummaryLines } from './SummaryLines'

/** Tarjeta de entrenamiento con lo entrenado hoy. */
export function WorkoutSummaryCard({ to, label, Icon, emptyLabel }: SummaryItem) {
  const { isPending, isEmpty, lines } = useWorkoutSummary()

  return (
    <SummaryCard to={to} label={label} Icon={Icon}>
      <SummaryLines
        isPending={isPending}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        lines={lines}
        loadingLabel="Cargando tus entrenamientos"
      />
    </SummaryCard>
  )
}
