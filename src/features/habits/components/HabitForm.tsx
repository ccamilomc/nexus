import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

import { useCreateHabit, useUpdateHabit } from '../hooks/use-habits'
import { createHabitSchema, type CreateHabitValues } from '../schemas/habits.schema'
import type { Habit } from '../types/habits.types'
import { WeekdayPicker } from './WeekdayPicker'

interface HabitFormProps {
  /** Si se indica, el formulario cambia ese hábito en lugar de crear uno. */
  readonly habit?: Habit
  readonly onCreated: () => void
  readonly onCancel: () => void
}

/**
 * Formulario para crear un hábito, o para corregir uno que ya existe.
 *
 * Pide lo mínimo para no estorbar: nombre y, si se quiere, una nota.
 *
 * **Editar no toca los registros ni la fecha de creación**, que es lo que
 * sostiene la racha y la constancia. Antes no se podía cambiar el nombre, así
 * que una errata obligaba a archivar el hábito y empezar otro de cero.
 */
export function HabitForm({ habit, onCreated, onCancel }: HabitFormProps) {
  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()
  const isEditing = habit !== undefined
  const pending = isEditing ? updateHabit : createHabit

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateHabitValues>({
    resolver: zodResolver(createHabitSchema),
    defaultValues: habit
      ? {
          name: habit.name,
          weekdays: habit.target_weekdays ?? [],
          ...(habit.description ? { description: habit.description } : {}),
        }
      : { name: '', weekdays: [] },
  })

  const onSubmit = handleSubmit((values) => {
    if (habit) updateHabit.mutate({ habitId: habit.id, values }, { onSuccess: onCreated })
    else createHabit.mutate(values, { onSuccess: onCreated })
  })

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

          {/* Debajo del nombre y la nota, no encima: la mayoría de los hábitos
              son diarios y no hay que tocarlo, así que no puede ser lo primero
              que se encuentre quien sólo quiere escribir un nombre y guardar. */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">¿Qué días?</p>
            <Controller
              control={control}
              name="weekdays"
              render={({ field }) => (
                <WeekdayPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {pending.isError ? <FormAlert>{pending.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending.isPending}>
              {pending.isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear hábito'}
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
