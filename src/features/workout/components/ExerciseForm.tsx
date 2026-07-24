import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'

import { EQUIPMENT_OPTIONS, MUSCLE_GROUP_OPTIONS } from '../constants/workout.constants'
import { useCreateExercise } from '../hooks/use-exercises'
import { createExerciseSchema, type CreateExerciseValues } from '../schemas/workout.schema'
import type { Exercise } from '../types/workout.types'

interface ExerciseFormProps {
  /** Nombre inicial: útil al crear desde una búsqueda sin resultados. */
  readonly initialName?: string
  readonly onCreated: (exercise: Exercise) => void
  readonly onCancel: () => void
}

/** Formulario para crear un ejercicio propio. Reutilizable en tab y selector. */
export function ExerciseForm({ initialName = '', onCreated, onCancel }: ExerciseFormProps) {
  const createExercise = useCreateExercise()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateExerciseValues>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: { name: initialName, muscleGroup: 'chest', equipment: 'none' },
  })

  const onSubmit = handleSubmit((values) => {
    createExercise.mutate(values, { onSuccess: onCreated })
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

          {createExercise.isError ? <FormAlert>{createExercise.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={createExercise.isPending}>
              {createExercise.isPending ? 'Guardando…' : 'Guardar ejercicio'}
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
