import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

import { useAddRoutineDay } from '../hooks/use-routine-detail'
import { addRoutineDaySchema, type AddRoutineDayValues } from '../schemas/workout.schema'

interface AddDayFormProps {
  readonly routineId: string
  readonly onAdded: () => void
  readonly onCancel: () => void
}

/** Añade un día (p. ej. «Empuje») a una rutina. */
export function AddDayForm({ routineId, onAdded, onCancel }: AddDayFormProps) {
  const addDay = useAddRoutineDay(routineId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddRoutineDayValues>({
    resolver: zodResolver(addRoutineDaySchema),
    defaultValues: { name: '' },
  })

  const onSubmit = handleSubmit((values) => addDay.mutate(values.name, { onSuccess: onAdded }))

  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <FormField id="day-name" label="Nombre del día" error={errors.name?.message}>
        <Input
          id="day-name"
          autoFocus
          placeholder="Ej. Empuje, Pierna…"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>

      {addDay.isError ? <FormAlert>{addDay.error.message}</FormAlert> : null}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={addDay.isPending}>
          {addDay.isPending ? 'Añadiendo…' : 'Añadir día'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
