import { Dumbbell } from 'lucide-react'

import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

import { ExerciseList } from '../components/ExerciseList'
import { useExercises } from '../hooks/use-exercises'

function ExercisesSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando ejercicios">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

export function WorkoutPage() {
  const { data, isPending, isError } = useExercises()

  return (
    <>
      <PageHeader title="Entrenamiento" description="Tu catálogo de ejercicios." />

      {isPending ? (
        <ExercisesSkeleton />
      ) : isError || !data ? (
        <EmptyState
          icon={Dumbbell}
          title="No pudimos cargar los ejercicios"
          description="Revisa tu conexión e inténtalo de nuevo en un momento."
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Aún no hay ejercicios"
          description="El catálogo aparecerá aquí."
        />
      ) : (
        <ExerciseList exercises={data} />
      )}
    </>
  )
}
