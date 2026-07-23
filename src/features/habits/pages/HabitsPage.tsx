import { Repeat } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function HabitsPage() {
  return (
    <>
      <PageHeader title="Hábitos" description="Constancia, rachas y calendario." />
      <EmptyState
        icon={Repeat}
        title="Aún no has creado hábitos"
        description="Hábitos, rachas y calendario llegan en el Sprint 8."
      />
    </>
  )
}
