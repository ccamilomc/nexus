import { Dumbbell } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function WorkoutPage() {
  return (
    <>
      <PageHeader title="Entrenamiento" description="Rutinas, sesiones y progreso de fuerza." />
      <EmptyState
        icon={Dumbbell}
        title="Aún no hay entrenamientos"
        description="Rutinas, ejercicios, series e historial llegan en el Sprint 6."
      />
    </>
  )
}
