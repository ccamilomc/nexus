import { Dumbbell } from 'lucide-react'

import { EmptyState, LoadFailure, SkeletonList } from '@/shared/components/feedback'

import { ExerciseList } from '../components/ExerciseList'
import { useExercises } from '../hooks/use-exercises'

/** Catálogo de ejercicios disponibles (globales y propios). */
export function ExercisesPage() {
  const { data, isPending, isError, error, refetch } = useExercises()

  if (isPending) return <SkeletonList label="Cargando ejercicios" rows={6} rowClassName="h-14" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Aún no hay ejercicios"
        description="El catálogo aparecerá aquí."
      />
    )
  }

  return <ExerciseList exercises={data} />
}
