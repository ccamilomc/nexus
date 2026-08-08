import { useSleepSummary } from '@/features/sleep'

import type { SummaryItem } from '../constants/dashboard-items'
import { SummaryCard } from './SummaryCard'
import { SummaryLines } from './SummaryLines'

/** Tarjeta de sueño con lo dormido anoche, su objetivo y la media de la semana. */
export function SleepSummaryCard({ to, label, Icon, emptyLabel }: SummaryItem) {
  const { isPending, isEmpty, lines, progress } = useSleepSummary()

  return (
    <SummaryCard to={to} label={label} Icon={Icon}>
      <SummaryLines
        isPending={isPending}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        lines={lines}
        progress={progress}
        loadingLabel="Cargando tu sueño"
      />
    </SummaryCard>
  )
}
