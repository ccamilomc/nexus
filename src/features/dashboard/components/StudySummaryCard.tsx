import { useStudySummary } from '@/features/study'

import type { SummaryItem } from '../constants/dashboard-items'
import { SummaryCard } from './SummaryCard'
import { SummaryLines } from './SummaryLines'

/** Tarjeta de estudio con lo de hoy y el avance de la semana. */
export function StudySummaryCard({ to, label, Icon, emptyLabel }: SummaryItem) {
  const { isPending, isEmpty, lines, progress } = useStudySummary()

  return (
    <SummaryCard to={to} label={label} Icon={Icon}>
      <SummaryLines
        isPending={isPending}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        lines={lines}
        progress={progress}
        loadingLabel="Cargando tu estudio"
      />
    </SummaryCard>
  )
}
