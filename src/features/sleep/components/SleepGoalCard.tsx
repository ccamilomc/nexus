import { zodResolver } from '@hookform/resolvers/zod'
import { Target } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { formatMinutes } from '@/shared/utils'

import { useSaveSleepGoal, useSleepGoal } from '../hooks/use-sleep'
import { sleepGoalSchema, type SleepGoalValues } from '../schemas/sleep.schema'

/** Lo que la mayoría de la gente persigue, y un punto de partida razonable. */
const DEFAULT_TARGET_HOURS = 8

/**
 * Cuánto quieres dormir.
 *
 * **Es lo que hace personal el aviso de dormir poco.** Sin objetivo, Nexus usa
 * seis horas para todo el mundo: a quien necesita ocho no le dice nada aunque
 * duerma siete, y a quien se apaña con cinco y media le avisa cada mañana.
 * Cuánto es poco depende de cada uno, y ese dato lo tiene el usuario.
 *
 * Se pide en horas porque así se piensa el sueño; los minutos son cosa de la
 * base.
 */
export function SleepGoalCard() {
  const { data: goal, isPending } = useSleepGoal()
  const save = useSaveSleepGoal()
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SleepGoalValues>({
    resolver: zodResolver(sleepGoalSchema),
    defaultValues: {
      targetHours: goal ? goal.target_minutes / 60 : DEFAULT_TARGET_HOURS,
    },
  })

  if (isPending) return null

  const onSubmit = handleSubmit((values) =>
    save.mutate(values, { onSuccess: () => setIsEditing(false) }),
  )

  if (!isEditing) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              <Target className="h-3.5 w-3.5" aria-hidden />
              Quieres dormir
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">
              {goal ? formatMinutes(goal.target_minutes) : 'Sin fijar'}
            </p>
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            {goal ? 'Cambiar' : 'Fijar objetivo'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Un campo corto no se estira: en escritorio ocupaba 935 px para
              teclear «8». La regla vale para números, fechas, horas y
              desplegables; el texto libre sí puede ir a ancho completo. */}
          <FormField
            id="sleep-target"
            label="¿Cuántas horas quieres dormir?"
            error={errors.targetHours?.message}
            className="sm:max-w-xs"
          >
            <Input
              id="sleep-target"
              type="number"
              inputMode="decimal"
              // Medias horas: nadie se propone dormir 7 h 23 min.
              step={0.5}
              min={3}
              max={14}
              autoFocus
              aria-invalid={Boolean(errors.targetHours)}
              {...register('targetHours', { valueAsNumber: true })}
            />
          </FormField>

          <p className="text-xs text-muted-foreground">
            Con esto, el aviso de «dormiste poco» se mide contra lo tuyo y no contra una cifra
            general. Al cambiarlo se guarda el objetivo anterior.
          </p>

          {save.isError ? <FormAlert>{save.error.message}</FormAlert> : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : 'Guardar objetivo'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
