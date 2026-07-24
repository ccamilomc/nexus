import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useCreateRoutine } from '../hooks/use-routines'
import { createRoutineSchema, type CreateRoutineValues } from '../schemas/workout.schema'
import type { Routine } from '../types/workout.types'

interface RoutineFormProps {
  readonly onCreated: (routine: Routine) => void
  readonly onCancel: () => void
}

/** Formulario para crear una rutina (nombre y objetivo opcional). */
export function RoutineForm({ onCreated, onCancel }: RoutineFormProps) {
  const createRoutine = useCreateRoutine()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoutineValues>({
    resolver: zodResolver(createRoutineSchema),
    defaultValues: { name: '' },
  })

  const onSubmit = handleSubmit((values) => {
    createRoutine.mutate(values, { onSuccess: onCreated })
  })

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField id="routine-name" label="Nombre" error={errors.name?.message}>
            <Input
              id="routine-name"
              autoFocus
              placeholder="Ej. Fuerza 4 días"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <FormField id="routine-goal" label="Objetivo (opcional)" error={errors.goal?.message}>
            <Input
              id="routine-goal"
              placeholder="Ej. Hipertrofia, mantener…"
              aria-invalid={Boolean(errors.goal)}
              {...register('goal')}
            />
          </FormField>

          {createRoutine.isError ? <FormAlert>{createRoutine.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={createRoutine.isPending}>
              {createRoutine.isPending ? 'Creando…' : 'Crear rutina'}
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
