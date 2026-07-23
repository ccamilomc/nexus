import { HeartPulse } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function HealthPage() {
  return (
    <>
      <PageHeader title="Salud" description="Peso, medidas y progreso físico." />
      <EmptyState
        icon={HeartPulse}
        title="Aún no hay mediciones"
        description="Peso, medidas, fotos de progreso e IMC llegan en el Sprint 11."
      />
    </>
  )
}
