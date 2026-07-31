import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'

import { METRIC_LABELS, METRIC_TYPES_IN_ORDER, METRIC_UNITS } from '../constants/health.constants'
import { useLogMetric } from '../hooks/use-health'
import { logMetricSchema, type LogMetricValues } from '../schemas/health.schema'

/** Registrar una medición: qué se mide y cuánto dio. */
export function MetricForm() {
  const logMetric = useLogMetric()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LogMetricValues>({
    resolver: zodResolver(logMetricSchema),
    defaultValues: { metricType: 'weight' },
  })

  const metricType = watch('metricType')

  const onSubmit = handleSubmit((values) =>
    // Se conserva la medida elegida: lo normal es seguir con la misma.
    logMetric.mutate(values, { onSuccess: () => reset({ metricType: values.metricType }) }),
  )

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-40 flex-1">
              <FormField id="metric-type" label="Medida" error={errors.metricType?.message}>
                <Select id="metric-type" {...register('metricType')}>
                  {METRIC_TYPES_IN_ORDER.map((type) => (
                    <option key={type} value={type}>
                      {METRIC_LABELS[type]}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="min-w-32 flex-1">
              <FormField
                id="metric-value"
                label={`Valor (${METRIC_UNITS[metricType] ?? ''})`}
                error={errors.value?.message}
              >
                <Input
                  id="metric-value"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder="Ej. 74,5"
                  aria-invalid={Boolean(errors.value)}
                  {...register('value', { valueAsNumber: true })}
                />
              </FormField>
            </div>
          </div>

          {logMetric.isError ? <FormAlert>{logMetric.error.message}</FormAlert> : null}

          <Button type="submit" disabled={logMetric.isPending}>
            <Plus aria-hidden />
            {logMetric.isPending ? 'Guardando…' : 'Registrar medición'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
