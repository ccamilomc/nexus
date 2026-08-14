import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useToday } from '@/core/time'
import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'
import { toDateKey } from '@/shared/utils'

import { METRIC_LABELS, METRIC_TYPES_IN_ORDER, METRIC_UNITS } from '../constants/health.constants'
import { useLogMeasurements } from '../hooks/use-health'
import { logMeasurementsSchema, type LogMeasurementsValues } from '../schemas/health.schema'

interface MetricFormProps {
  /** Abierto cuando todavía no hay nada que consultar. */
  readonly defaultOpen?: boolean
}

/**
 * Registrar medidas: las que se hayan tomado, con su día.
 *
 * **Se toman juntas, así que se apuntan juntas.** Antes iba de una en una: una
 * vuelta de cinta métrica —cintura, cadera, pecho, brazo, muslo— eran cinco
 * formularios seguidos, y siempre con la fecha de hoy.
 *
 * Ver las ocho casillas es además cómo se descubre **qué se puede medir**: la
 * pantalla sólo enseñaba las medidas que ya tenían datos, así que quien nunca se
 * midió el cuello no sabía que podía.
 *
 * **Va plegado.** Con las ocho casillas y el día, desplegado mide más que la
 * pantalla de un móvil: dejarlo abierto empujaba el peso y el resto de medidas
 * por debajo de pantalla y media, y Salud se abre muchas más veces para mirar
 * cómo va uno que para apuntar. Un toque de más al registrar sale mucho más
 * barato que ese arrastre en cada visita.
 *
 * Si aún no hay ninguna medición se abre solo: sin nada que consultar, lo único
 * que cabe hacer aquí es registrar.
 */
export function MetricForm({ defaultOpen = false }: MetricFormProps) {
  const today = useToday()
  const logMeasurements = useLogMeasurements()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const formId = useId()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogMeasurementsValues>({
    resolver: zodResolver(logMeasurementsSchema),
    defaultValues: { date: toDateKey(today), values: {} },
  })

  const onSubmit = handleSubmit((values) =>
    // Se conserva el día: lo normal tras apuntar una vuelta es corregir algo de
    // esa misma, no saltar a otra fecha.
    logMeasurements.mutate(values, { onSuccess: () => reset({ date: values.date, values: {} }) }),
  )

  return (
    <Card>
      <CardContent className="p-4">
        <h2>
          <button
            type="button"
            // 44 px para el dedo, como el resto de controles de la app; con
            // ratón no hace falta y volvería a su altura natural.
            className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-medium sm:min-h-0"
            aria-expanded={isOpen}
            aria-controls={formId}
            onClick={() => setIsOpen((open) => !open)}
          >
            <Plus aria-hidden className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1">Apuntar medidas</span>
            <ChevronDown
              aria-hidden
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-fast ease-out',
                isOpen && 'rotate-180',
              )}
            />
          </button>
        </h2>

        {isOpen ? (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              Rellena las que te hayas tomado. Las que dejes en blanco no se guardan.
            </p>

            <form id={formId} onSubmit={onSubmit} className="mt-3 space-y-4" noValidate>
              <div className="sm:max-w-56">
                <FormField id="metric-date" label="Día" error={errors.date?.message}>
                  <Input
                    id="metric-date"
                    type="date"
                    // Medirse mañana no ha pasado todavía.
                    max={toDateKey(today)}
                    aria-invalid={Boolean(errors.date)}
                    {...register('date')}
                  />
                </FormField>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {METRIC_TYPES_IN_ORDER.map((type) => (
                  <FormField
                    key={type}
                    id={`metric-${type}`}
                    label={`${METRIC_LABELS[type]} (${METRIC_UNITS[type]})`}
                    error={errors.values?.[type]?.message}
                  >
                    <Input
                      id={`metric-${type}`}
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      aria-invalid={Boolean(errors.values?.[type])}
                      {...register(`values.${type}`, {
                        // Vacío es «no me lo medí», no cero ni `NaN`.
                        setValueAs: (raw: string) => (raw === '' ? undefined : Number(raw)),
                      })}
                    />
                  </FormField>
                ))}
              </div>

              {/* El «escribe al menos una» vive en el objeto, no en un campo: no es
              culpa de ninguna casilla en concreto. */}
              {errors.values?.root ? <FormAlert>{errors.values.root.message}</FormAlert> : null}
              {errors.values?.message ? <FormAlert>{errors.values.message}</FormAlert> : null}
              {logMeasurements.isError ? (
                <FormAlert>{logMeasurements.error.message}</FormAlert>
              ) : null}
              {logMeasurements.isSuccess && logMeasurements.data.length > 0 ? (
                <FormAlert variant="success">
                  {logMeasurements.data.length === 1
                    ? 'Guardamos tu medida.'
                    : `Guardamos ${logMeasurements.data.length} medidas.`}
                </FormAlert>
              ) : null}

              <Button type="submit" disabled={logMeasurements.isPending}>
                <Plus aria-hidden />
                {logMeasurements.isPending ? 'Guardando…' : 'Guardar'}
              </Button>
            </form>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
