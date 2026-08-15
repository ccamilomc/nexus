import { zodResolver } from '@hookform/resolvers/zod'
import { Moon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'
import { formatMinutes, formatTime, toDateKey } from '@/shared/utils'

import { QUALITY_LABELS, QUALITY_VALUES } from '../constants/sleep.constants'
import { useLogSleep } from '../hooks/use-sleep'
import { logSleepSchema, type LogSleepValues } from '../schemas/sleep.schema'
import type { SleepLog } from '../types/sleep.types'
import type { SleepPattern } from '../utils/sleep-pattern'
import { sleepMinutes } from '../utils/sleep-time'

interface SleepFormProps {
  readonly today: Date
  /** Registro de anoche, si ya existe: el formulario lo corrige. */
  readonly log: SleepLog | null
  /** Tu horario habitual, para no empezar de cero. `null` si aún no lo hay. */
  readonly pattern?: SleepPattern | null
  readonly onSaved: () => void
  readonly onCancel?: (() => void) | undefined
}

/** Horario de fábrica, para quien todavía no tiene costumbre registrada. */
const FALLBACK_PATTERN: SleepPattern = { bedtime: '23:00', wakeTime: '07:00' }

/**
 * Registrar la noche: a qué hora te acostaste y cuándo despertaste.
 *
 * Se piden las horas y no la duración porque es lo que uno recuerda. El total
 * se muestra mientras se escribe, para confirmar de un vistazo que las horas
 * son las que se querían poner.
 */
export function SleepForm({ today, log, pattern = null, onSaved, onCancel }: SleepFormProps) {
  const logSleep = useLogSleep(today)
  // Sin costumbre registrada se cae a un horario de fábrica; con ella, el
  // formulario arranca donde el usuario suele estar y casi nunca hay que tocarlo.
  const start = pattern ?? FALLBACK_PATTERN

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LogSleepValues>({
    resolver: zodResolver(logSleepSchema),
    defaultValues: {
      date: toDateKey(today),
      bedtime: log?.bedtime ? formatTime(log.bedtime) : start.bedtime,
      wakeTime: log?.wake_time ? formatTime(log.wake_time) : start.wakeTime,
      ...(log?.quality_rating === null || log?.quality_rating === undefined
        ? {}
        : { qualityRating: log.quality_rating }),
    },
  })

  const [bedtime, wakeTime, quality] = watch(['bedtime', 'wakeTime', 'qualityRating'])
  const minutes = sleepMinutes(bedtime ?? '', wakeTime ?? '')

  const onSubmit = handleSubmit((values) => logSleep.mutate(values, { onApuntado: onSaved }))

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* La fecha va en su propia fila y las dos horas juntas debajo: son
              cosas distintas —qué noche, y de cuándo a cuándo— y apretadas en
              una sola fila el móvil dejaba «Desperté el día» arriba y «Desperté»
              suelto abajo, que se leen casi igual. El campo no se estira: es
              corto y estirarlo sólo deja hueco. */}
          <FormField
            id="sleep-date"
            label="Desperté el día"
            error={errors.date?.message}
            className="max-w-44"
          >
            <Input
              id="sleep-date"
              type="date"
              // Una noche del futuro todavía no se ha dormido.
              max={toDateKey(today)}
              aria-invalid={Boolean(errors.date)}
              {...register('date')}
            />
          </FormField>

          <div className="flex flex-wrap gap-3">
            <FormField id="sleep-bedtime" label="Me acosté" error={errors.bedtime?.message}>
              <Input id="sleep-bedtime" type="time" {...register('bedtime')} />
            </FormField>
            <FormField id="sleep-wake" label="Desperté" error={errors.wakeTime?.message}>
              <Input id="sleep-wake" type="time" {...register('wakeTime')} />
            </FormField>
          </div>

          {minutes === null ? null : (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Moon className="h-4 w-4" aria-hidden />
              Habrás dormido <strong className="text-foreground">{formatMinutes(minutes)}</strong>
            </p>
          )}

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">¿Qué tal dormiste? (opcional)</legend>
            <div className="flex flex-wrap gap-2">
              {QUALITY_VALUES.map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-pressed={quality === value}
                  className={cn(quality === value && 'border-primary bg-primary/10 text-primary')}
                  onClick={() =>
                    setValue('qualityRating', quality === value ? undefined : value, {
                      shouldValidate: true,
                    })
                  }
                >
                  {QUALITY_LABELS[value]}
                </Button>
              ))}
            </div>
          </fieldset>

          {logSleep.error ? <FormAlert>{logSleep.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={logSleep.isPending}>
              {logSleep.isPending ? 'Guardando…' : log ? 'Guardar cambios' : 'Registrar noche'}
            </Button>
            {onCancel ? (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
