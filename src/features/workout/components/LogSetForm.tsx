import { zodResolver } from '@hookform/resolvers/zod'
import { Flame, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

import { useLogSet } from '../hooks/use-workout-sets'
import { logSetSchema, type LogSetValues } from '../schemas/workout.schema'
import { type Rir, RIR_OPTIONS, rpeFromRir } from '../utils/effort'

interface LogSetFormProps {
  readonly sessionId: string
  readonly exerciseId: string
  readonly exerciseName: string
  /** Última serie del ejercicio: repetirla es el caso habitual en el gimnasio. */
  readonly lastSet: LogSetValues | null
  readonly onLogged: () => void
}

/** Cómo se lee cada opción en voz alta; en pantalla sólo va la cifra. */
const RIR_LABELS: Readonly<Record<Rir, string>> = {
  0: 'Llegué al fallo',
  1: 'Me quedaba 1',
  2: 'Me quedaban 2',
  3: 'Me quedaban 3',
  4: 'Me quedaban 4 o más',
}

/**
 * Registra una serie del ejercicio.
 *
 * Lo obligatorio siguen siendo dos campos —repeticiones y peso— y un botón; lo
 * de abajo es opcional y no estorba al camino rápido, que es el que se usa
 * entre serie y serie con el móvil en una mano.
 *
 * **El calentamiento se queda puesto entre series y el esfuerzo no.** No es un
 * capricho: los calentamientos vienen en tanda de dos o tres seguidos, así que
 * se marca una vez y se quita al empezar lo serio —y para que no se olvide
 * puesto, el botón de guardar cambia a «Añadir calentamiento»—. El esfuerzo, en
 * cambio, es distinto en cada serie, así que arrastrarlo sería mentir.
 */
export function LogSetForm({
  sessionId,
  exerciseId,
  exerciseName,
  lastSet,
  onLogged,
}: LogSetFormProps) {
  const logSet = useLogSet()
  const [isWarmup, setIsWarmup] = useState(false)
  const [rir, setRir] = useState<Rir | null>(null)
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
      {
        sessionId,
        exerciseId,
        reps: values.reps,
        weightKg: values.weightKg,
        isWarmup,
        rpe: rir === null ? null : rpeFromRir(rir),
      },
      {
        onSuccess: () => {
          setRir(null)
          onLogged()
        },
      },
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
          aria-label={`${isWarmup ? 'Añadir calentamiento' : 'Añadir serie'} a ${exerciseName}`}
          className="w-full sm:w-auto"
        >
          <Plus aria-hidden />
          {logSet.isPending ? 'Guardando…' : isWarmup ? 'Añadir calentamiento' : 'Añadir serie'}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button
          type="button"
          size="sm"
          variant={isWarmup ? 'default' : 'outline'}
          aria-pressed={isWarmup}
          onClick={() => {
            setIsWarmup((previous) => !previous)
            // Un calentamiento no lleva esfuerzo: si había uno elegido, sobra.
            setRir(null)
          }}
        >
          <Flame aria-hidden />
          Calentamiento
        </Button>

        {isWarmup ? null : (
          <div className="flex items-center gap-1" role="group" aria-label="Cuántas te quedaban">
            <span className="mr-1 text-xs text-muted-foreground">¿Te quedaban?</span>
            {RIR_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                size="icon"
                variant={rir === option ? 'default' : 'ghost'}
                aria-pressed={rir === option}
                aria-label={RIR_LABELS[option]}
                // Volver a tocarla la quita: es opcional y hay que poder deshacerla.
                onClick={() => setRir((previous) => (previous === option ? null : option))}
              >
                <span aria-hidden className="tabular-nums">
                  {option === 4 ? '4+' : option}
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {logSet.error ? <FormAlert>{logSet.error.message}</FormAlert> : null}
    </form>
  )
}
