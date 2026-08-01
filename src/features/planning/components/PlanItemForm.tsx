import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormAlert } from '@/shared/components/feedback'
import { FormField } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

import { planItemSchema, type PlanItemValues } from '../schemas/planning.schema'

interface PlanItemFormProps {
  readonly onSubmit: (values: PlanItemValues) => void
  readonly onCancel: () => void
  readonly isSaving: boolean
  readonly errorMessage: string | null
}

/** Etiqueta de cada dominio, como lo diría el usuario. */
const DOMAIN_LABELS = {
  workout: 'Entrenamiento',
  nutrition: 'Nutrición',
  study: 'Estudio',
  habit: 'Hábito',
  sleep: 'Sueño',
  health: 'Salud',
} as const

/**
 * Añade algo al plan de hoy.
 *
 * La hora y la duración son opcionales: hay cosas que uno se propone hacer
 * «hoy» sin decidir cuándo, y obligar a inventarse una hora sólo produce horas
 * falsas que luego el motor se tomaría en serio.
 */
export function PlanItemForm({ onSubmit, onCancel, isSaving, errorMessage }: PlanItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlanItemValues>({
    resolver: zodResolver(planItemSchema),
    defaultValues: { domain: 'workout', startTime: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <FormField id="plan-title" label="Qué quieres hacer" error={errors.title?.message}>
        <Input id="plan-title" placeholder="Ej. Entrenar pierna" {...register('title')} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="plan-domain" label="Dónde encaja" error={errors.domain?.message}>
          <select
            id="plan-domain"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register('domain')}
          >
            {Object.entries(DOMAIN_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="plan-start" label="Hora (opcional)" error={errors.startTime?.message}>
          <Input id="plan-start" type="time" {...register('startTime')} />
        </FormField>
      </div>

      <FormField
        id="plan-duration"
        label="Cuánto durará (opcional)"
        error={errors.durationMinutes?.message}
      >
        <Input
          id="plan-duration"
          type="number"
          inputMode="numeric"
          placeholder="Minutos"
          {...register('durationMinutes', {
            setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
          })}
        />
      </FormField>

      {errorMessage ? <FormAlert>{errorMessage}</FormAlert> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? 'Añadiendo…' : 'Añadir al plan'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
