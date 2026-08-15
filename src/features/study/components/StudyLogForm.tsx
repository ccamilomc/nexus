import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { useToday } from '@/core/time'
import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { toDateKey } from '@/shared/utils'

import { useLogStudy } from '../hooks/use-study'
import { logStudySchema, type LogStudyValues } from '../schemas/study.schema'
import type { Subject } from '../types/study.types'

interface StudyLogFormProps {
  readonly subjects: readonly Subject[]
}

/** Atajos con las duraciones típicas de una sesión de foco. */
const QUICK_MINUTES = [25, 50, 90]

/**
 * Registra lo que se acaba de estudiar.
 *
 * Pide sólo materia y minutos: cuantos menos campos, más veces se registra. Los
 * atajos cubren el pomodoro (25), la clase (50) y el bloque largo (90).
 */
export function StudyLogForm({ subjects }: StudyLogFormProps) {
  const today = useToday()
  const logStudy = useLogStudy(today)

  const {
    register,
    handleSubmit,
    setValue,
    resetField,
    formState: { errors },
  } = useForm<LogStudyValues>({
    resolver: zodResolver(logStudySchema),
    defaultValues: { date: toDateKey(today), subjectId: subjects[0]?.id ?? '' },
  })

  const onSubmit = handleSubmit((values) =>
    logStudy.mutate(values, {
      // Se vacían **sólo** los minutos, y con `resetField`, que es la API que
      // existe para esto: un `reset` con el día y la materia parecía hacerlo y
      // dejaba los minutos puestos, así que la siguiente sesión se apuntaba con
      // la duración de la anterior si no te fijabas. Es el mismo fallo que tenía
      // el formulario de movimientos.
      //
      // El día y la materia se quedan: lo normal es seguir apuntando lo de la
      // misma tarde, y volver a poner la fecha cada vez sería un estorbo.
      onApuntado: () => resetField('minutes'),
    }),
  )

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        {/* Con encabezado, y con el mismo estilo que el cronómetro: son las dos
            formas de registrar y van una debajo de la otra. Sin él, este bloque
            era casi idéntico al de arriba —materia, 25/50/90— pero anónimo, y
            había que deducir qué hacía por el texto del botón del final. */}
        <div>
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Plus className="h-4 w-4" aria-hidden />
            Apuntar lo ya estudiado
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Para lo que hiciste sin cronómetro: pon la materia y los minutos.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* El día va aparte y sin estirarse: es de otra naturaleza que la
              materia y los minutos, y por defecto es hoy. Está para recuperar la
              tarde de estudio que se quedó sin apuntar. */}
          <FormField id="study-date" label="Día" error={errors.date?.message} className="max-w-44">
            <Input
              id="study-date"
              type="date"
              // Estudiar mañana todavía no ha pasado.
              max={toDateKey(today)}
              aria-invalid={Boolean(errors.date)}
              {...register('date')}
            />
          </FormField>

          {/* Comparten fila desde `sm`: sueltos ocupaban 943 px cada uno para
              una materia y un número de dos cifras. En móvil se apilan. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="study-subject" label="Materia" error={errors.subjectId?.message}>
              <Select
                id="study-subject"
                aria-invalid={Boolean(errors.subjectId)}
                {...register('subjectId')}
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="study-minutes" label="Minutos" error={errors.minutes?.message}>
              <Input
                id="study-minutes"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="Ej. 50"
                aria-invalid={Boolean(errors.minutes)}
                {...register('minutes', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_MINUTES.map((minutes) => (
              <Button
                key={minutes}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('minutes', minutes, { shouldValidate: true })}
              >
                {minutes} min
              </Button>
            ))}
          </div>

          {logStudy.error ? <FormAlert>{logStudy.error.message}</FormAlert> : null}

          <Button type="submit" disabled={logStudy.isPending}>
            <Plus aria-hidden />
            {logStudy.isPending ? 'Guardando…' : 'Registrar estudio'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
