import { CalendarCheck } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function PlanningPage() {
  return (
    <>
      <PageHeader title="Plan" description="Tu plan del día, recalculado cuando algo cambia." />
      <EmptyState
        icon={CalendarCheck}
        title="Aún no hay un plan para hoy"
        description="El plan adaptativo llega en el Sprint 13, junto al motor que recalcula tu día."
      />
    </>
  )
}
