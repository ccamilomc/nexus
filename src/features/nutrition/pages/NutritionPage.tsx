import { UtensilsCrossed } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function NutritionPage() {
  return (
    <>
      <PageHeader title="Nutrición" description="Comidas, macros, agua y presupuesto." />
      <EmptyState
        icon={UtensilsCrossed}
        title="Aún no hay comidas registradas"
        description="El registro de comidas con macros y coste llega en el Sprint 7."
      />
    </>
  )
}
