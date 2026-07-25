import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'

import { EQUIPMENT_OPTIONS, MUSCLE_GROUP_OPTIONS } from '../constants/workout.constants'
import { useCreateExercise, useUpdateExercise } from '../hooks/use-exercises'
import { createExerciseSchema, type CreateExerciseValues } from '../schemas/workout.schema'
import type { Exercise } from '../types/workout.types'
import { MuscleGroupChips } from './MuscleGroupChips'

interface ExerciseFormProps {
  /** Nombre inicial al crear desde una búsqueda sin resultados (modo creación). */
  readonly initialName?: string
  /** Si se indica, el formulario edita ese ejercicio en lugar de crear uno. */
  readonly exercise?: Exercise
  readonly onSaved: (exercise: Exercise) => void
  readonly onCancel: () => void
}

/** Valores del formulario a partir de un ejercicio existente (modo edición). */
function toFormValues(exercise: Exercise): CreateExerciseValues {
  return {
    name: exercise.name,
    muscleGroup: exercise.muscle_group,
    equipment: exercise.equipment,
    secondaryMuscles: exercise.secondary_muscles,
    ...(exercise.instructions ? { instructions: exercise.instructions } : {}),
  }
}

/** Formulario para crear o editar un ejercicio propio. */
export function ExerciseForm({ initialName = '', exercise, onSaved, onCancel }: ExerciseFormProps) {
  const createExercise = useCreateExercise()
  const updateExercise = useUpdateExercise()
  const isEditing = exercise !== undefined
  const pending = isEditing ? updateExercise : createExercise

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateExerciseValues>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: exercise
      ? toFormValues(exercise)
      : { name: initialName, muscleGroup: 'chest', equipment: 'none', secondaryMuscles: [] },
  })

  const primaryMuscle = watch('muscleGroup')

  const onSubmit = handleSubmit((values) => {
    if (exercise) {
      updateExercise.mutate({ exerciseId: exercise.id, values }, { onSuccess: onSaved })
    } else {
      createExercise.mutate(values, { onSuccess: onSaved })
    }
  })

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField id="exercise-name" label="Nombre" error={errors.name?.message}>
            <Input
              id="exercise-name"
              autoFocus
              placeholder="Ej. Press inclinado con mancuernas"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="exercise-muscle"
              label="Grupo muscular"
              error={errors.muscleGroup?.message}
            >
              <Select id="exercise-muscle" {...register('muscleGroup')}>
                {MUSCLE_GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="exercise-equipment" label="Equipo" error={errors.equipment?.message}>
              <Select id="exercise-equipment" {...register('equipment')}>
                {EQUIPMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Grupo de chips: no es un único control, así que se etiqueta con
              role="group" en vez de un <label htmlFor>. */}
          <div role="group" aria-labelledby="exercise-secondary-label" className="space-y-1.5">
            <p id="exercise-secondary-label" className="text-sm font-medium leading-none">
              También trabaja (opcional)
            </p>
            <Controller
              control={control}
              name="secondaryMuscles"
              render={({ field }) => (
                <MuscleGroupChips
                  value={field.value ?? []}
                  onChange={field.onChange}
                  exclude={primaryMuscle}
                />
              )}
            />
          </div>

          <FormField
            id="exercise-instructions"
            label="Notas (opcional)"
            error={errors.instructions?.message}
          >
            <Textarea
              id="exercise-instructions"
              rows={3}
              placeholder="Técnica, agarre, referencias…"
              aria-invalid={Boolean(errors.instructions)}
              {...register('instructions')}
            />
          </FormField>

          {pending.isError ? <FormAlert>{pending.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending.isPending}>
              {pending.isPending
                ? 'Guardando…'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Guardar ejercicio'}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
