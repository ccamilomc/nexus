import { useFinanceSummary } from '@/features/finance'

import type { SummaryItem } from '../constants/dashboard-items'
import { SummaryCard } from './SummaryCard'
import { SummaryLines } from './SummaryLines'

/** Tarjeta de finanzas con lo que va del mes. */
export function FinanceSummaryCard({ to, label, Icon, emptyLabel }: SummaryItem) {
  const { isPending, isEmpty, lines, progress } = useFinanceSummary()

  return (
    <SummaryCard to={to} label={label} Icon={Icon}>
      <SummaryLines
        isPending={isPending}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        lines={lines}
        progress={progress}
        loadingLabel="Cargando tus finanzas del mes"
      />
    </SummaryCard>
  )
}
