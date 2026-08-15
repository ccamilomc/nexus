import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

import { useLogSet } from '../hooks/use-workout-sets'
import { logSetSchema, type LogSetValues } from '../schemas/workout.schema'

interface LogSetFormProps {
  readonly sessionId: string
  readonly exerciseId: string
  readonly exerciseName: string
  /** Última serie del ejercicio: repetirla es el caso habitual en el gimnasio. */
  readonly lastSet: LogSetValues | null
  readonly onLogged: () => void
}

/** Registra una serie del ejercicio: repeticiones y peso. */
export function LogSetForm({
  sessionId,
  exerciseId,
  exerciseName,
  lastSet,
  onLogged,
}: LogSetFormProps) {
  const logSet = useLogSet()
  const repsId = `reps-${exerciseId}`
  const weightId = `weight-${exerciseId}`

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LogSetValues>({
    resolver: zodResolver(logSetSchema),
    // Sólo al montar: los valores se conservan entre series para poder repetir.
    ...(lastSet ? { defaultValues: lastSet } : {}),
  })

  const onSubmit = handleSubmit((values) => {
    logSet.mutate(
      { sessionId, exerciseId, reps: values.reps, weightKg: values.weightKg },
      { onSuccess: onLogged },
    )
  })

  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <div className="flex flex-wrap items-end gap-2">
        <FormField
          id={repsId}
          label="Reps"
          error={errors.reps?.message}
          className="min-w-24 flex-1"
        >
          <Input
            id={repsId}
            type="number"
            inputMode="numeric"
            step={1}
            min={1}
            placeholder="10"
            aria-invalid={Boolean(errors.reps)}
            {...register('reps', { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          id={weightId}
          label="Peso (kg)"
          error={errors.weightKg?.message}
          className="min-w-24 flex-1"
        >
          <Input
            id={weightId}
            type="number"
            inputMode="decimal"
            step={0.5}
            min={0}
            placeholder="60"
            aria-invalid={Boolean(errors.weightKg)}
            {...register('weightKg', { valueAsNumber: true })}
          />
        </FormField>

        <Button
          type="submit"
          variant="secondary"
          disabled={logSet.isPending}
          aria-label={`Añadir serie a ${exerciseName}`}
          className="w-full sm:w-auto"
        >
          <Plus aria-hidden />
          {logSet.isPending ? 'Guardando…' : 'Añadir serie'}
        </Button>
      </div>

      {logSet.error ? <FormAlert>{logSet.error.message}</FormAlert> : null}
    </form>
  )
}
