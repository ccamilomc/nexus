import { Dumbbell, Plus } from 'lucide-react'
import { useState } from 'react'

import { EmptyState, FormAlert, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

import { ExerciseForm } from '../components/ExerciseForm'
import { ExerciseList } from '../components/ExerciseList'
import { useExercises } from '../hooks/use-exercises'

/** Catálogo de ejercicios (globales y propios) y creación de ejercicios propios. */
export function ExercisesPage() {
  const { data, isPending, isError, error, refetch } = useExercises()
  const [isCreating, setIsCreating] = useState(false)
  const [createdName, setCreatedName] = useState<string | null>(null)

  if (isPending) return <SkeletonList label="Cargando ejercicios" rows={6} rowClassName="h-14" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? 'ejercicio' : 'ejercicios'}
        </p>
        {isCreating ? null : (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCreatedName(null)
              setIsCreating(true)
            }}
          >
            <Plus aria-hidden />
            Crear ejercicio
          </Button>
        )}
      </div>

      {createdName ? (
        <FormAlert variant="success">Guardamos «{createdName}» en tu catálogo.</FormAlert>
      ) : null}

      {isCreating ? (
        <ExerciseForm
          onCreated={(exercise) => {
            setIsCreating(false)
            setCreatedName(exercise.name)
          }}
          onCancel={() => setIsCreating(false)}
        />
      ) : null}

      {data.length === 0 ? (
        isCreating ? null : (
          <EmptyState
            icon={Dumbbell}
            title="Aún no hay ejercicios"
            description="Crea tu primer ejercicio para empezar tu catálogo."
          />
        )
      ) : (
        <ExerciseList exercises={data} />
      )}
    </div>
  )
}
