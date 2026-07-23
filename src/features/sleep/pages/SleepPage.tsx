import { Moon } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function SleepPage() {
  return (
    <>
      <PageHeader title="Sueño" description="Descanso, calidad y regularidad." />
      <EmptyState
        icon={Moon}
        title="Aún no hay registros de sueño"
        description="El registro de sueño y su calidad llegan en el Sprint 10."
      />
    </>
  )
}
