import { BookOpen } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function StudyPage() {
  return (
    <>
      <PageHeader title="Estudio" description="Materias y sesiones de foco." />
      <EmptyState
        icon={BookOpen}
        title="Aún no hay sesiones de estudio"
        description="Materias, sesiones y horas variables llegan en el Sprint 9."
      />
    </>
  )
}
