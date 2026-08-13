import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { useToday } from '@/core/time'
import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { toDateKey } from '@/shared/utils'

import { useStartPastSession } from '../hooks/use-active-session'
import { pastSessionSchema, type PastSessionValues } from '../schemas/workout.schema'

interface PastSessionFormProps {
  readonly onCancel: () => void
}

/** Lo que más se apunta después es lo de hoy o lo de ayer, y a media tarde. */
const DEFAULT_START_TIME = '18:00'
const DEFAULT_DURATION_MINUTES = 60

/**
 * Apuntar un entrenamiento que ya se hizo.
 *
 * Pide sólo cuándo y cuánto duró; los ejercicios se registran después, en la
 * misma pantalla que un entrenamiento en directo. Es lo que evita tener dos
 * formas distintas de anotar series.
 */
export function PastSessionForm({ onCancel }: PastSessionFormProps) {
  const today = useToday()
  const startPastSession = useStartPastSession()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PastSessionValues>({
    resolver: zodResolver(pastSessionSchema),
    defaultValues: {
      date: toDateKey(today),
      startTime: DEFAULT_START_TIME,
      durationMinutes: DEFAULT_DURATION_MINUTES,
    },
  })

  const onSubmit = handleSubmit((values) => startPastSession.mutate(values))

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-sm font-medium">Apuntar un entrenamiento que ya hiciste</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Dinos cuándo fue y cuánto duró. Los ejercicios los añades a continuación.
        </p>

        <form onSubmit={onSubmit} className="mt-3 space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="past-date" label="Día" error={errors.date?.message}>
              <Input
                id="past-date"
                type="date"
                // Un entrenamiento del futuro no se ha hecho todavía.
                max={toDateKey(today)}
                aria-invalid={Boolean(errors.date)}
                {...register('date')}
              />
            </FormField>

            <FormField id="past-start" label="Empecé a las" error={errors.startTime?.message}>
              <Input
                id="past-start"
                type="time"
                aria-invalid={Boolean(errors.startTime)}
                {...register('startTime')}
              />
            </FormField>

            <FormField
              id="past-duration"
              label="Duró (minutos)"
              error={errors.durationMinutes?.message}
            >
              <Input
                id="past-duration"
                type="number"
                inputMode="numeric"
                step={5}
                min={1}
                aria-invalid={Boolean(errors.durationMinutes)}
                {...register('durationMinutes', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          {startPastSession.isError ? (
            <FormAlert>{startPastSession.error.message}</FormAlert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={startPastSession.isPending}>
              {startPastSession.isPending ? 'Abriendo…' : 'Añadir los ejercicios'}
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
