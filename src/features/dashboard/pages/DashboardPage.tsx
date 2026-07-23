import { LayoutDashboard } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Hoy" description="Tu resumen del día y las acciones rápidas." />
      <EmptyState
        icon={LayoutDashboard}
        title="Todavía no hay nada que mostrar"
        description="El resumen del día, los widgets y las acciones rápidas llegan en el Sprint 5."
      />
    </>
  )
}
