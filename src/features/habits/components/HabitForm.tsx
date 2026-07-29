import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useCreateHabit } from '../hooks/use-habits'
import { createHabitSchema, type CreateHabitValues } from '../schemas/habits.schema'

interface HabitFormProps {
  readonly onCreated: () => void
  readonly onCancel: () => void
}

/** Formulario para crear un hábito. Pide lo mínimo para no estorbar. */
export function HabitForm({ onCreated, onCancel }: HabitFormProps) {
  const createHabit = useCreateHabit()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateHabitValues>({
    resolver: zodResolver(createHabitSchema),
    defaultValues: { name: '' },
  })

  const onSubmit = handleSubmit((values) => createHabit.mutate(values, { onSuccess: onCreated }))

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField id="habit-name" label="Nombre" error={errors.name?.message}>
            <Input
              id="habit-name"
              autoFocus
              placeholder="Ej. Leer 20 minutos"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <FormField
            id="habit-description"
            label="Nota (opcional)"
            error={errors.description?.message}
          >
            <Input
              id="habit-description"
              placeholder="Ej. Antes de dormir"
              {...register('description')}
            />
          </FormField>

          {createHabit.isError ? <FormAlert>{createHabit.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={createHabit.isPending}>
              {createHabit.isPending ? 'Creando…' : 'Crear hábito'}
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
