import { Dumbbell, Plus } from 'lucide-react'
import { useState } from 'react'

import { EmptyState, FormAlert, LoadFailure, SkeletonList } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'

import { ExerciseForm } from '../components/ExerciseForm'
import { ExerciseList } from '../components/ExerciseList'
import { useDeleteExercise, useExercises } from '../hooks/use-exercises'
import type { Exercise } from '../types/workout.types'

/** Catálogo de ejercicios (globales y propios), y creación/edición/borrado de los propios. */
export function ExercisesPage() {
  const { data, isPending, isError, error, refetch } = useExercises()
  const deleteExercise = useDeleteExercise()
  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [savedName, setSavedName] = useState<string | null>(null)

  if (isPending) return <SkeletonList label="Cargando ejercicios" rows={6} rowClassName="h-14" />
  if (isError) return <LoadFailure message={error.message} onRetry={() => void refetch()} />

  const isFormOpen = isCreating || editing !== null

  const openCreate = () => {
    setEditing(null)
    setSavedName(null)
    deleteExercise.reset()
    setIsCreating(true)
  }

  const openEdit = (exercise: Exercise) => {
    setIsCreating(false)
    setSavedName(null)
    deleteExercise.reset()
    setEditing(exercise)
  }

  const onSaved = (exercise: Exercise) => {
    setIsCreating(false)
    setEditing(null)
    setSavedName(exercise.name)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? 'ejercicio' : 'ejercicios'}
        </p>
        {isFormOpen ? null : (
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus aria-hidden />
            Crear ejercicio
          </Button>
        )}
      </div>

      {savedName ? (
        <FormAlert variant="success">Guardamos «{savedName}» en tu catálogo.</FormAlert>
      ) : null}

      {deleteExercise.isError ? <FormAlert>{deleteExercise.error.message}</FormAlert> : null}

      {editing ? (
        <ExerciseForm exercise={editing} onSaved={onSaved} onCancel={() => setEditing(null)} />
      ) : isCreating ? (
        <ExerciseForm onSaved={onSaved} onCancel={() => setIsCreating(false)} />
      ) : null}

      {data.length === 0 ? (
        isFormOpen ? null : (
          <EmptyState
            icon={Dumbbell}
            title="Aún no hay ejercicios"
            description="Crea tu primer ejercicio para empezar tu catálogo."
          />
        )
      ) : (
        <ExerciseList
          exercises={data}
          onEdit={openEdit}
          onDelete={(exercise) => {
            setSavedName(null)
            deleteExercise.mutate(exercise.id)
          }}
        />
      )}
    </div>
  )
}
