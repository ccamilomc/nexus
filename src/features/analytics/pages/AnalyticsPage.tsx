import { ChartColumn } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analíticas" description="Tendencias y comparativas de tus módulos." />
      <EmptyState
        icon={ChartColumn}
        title="Aún no hay datos suficientes"
        description="Los KPIs y las gráficas llegan en el Sprint 12, cuando haya datos que analizar."
      />
    </>
  )
}
