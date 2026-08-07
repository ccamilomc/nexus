import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { useToday } from '@/core/time'
import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { toDateKey } from '@/shared/utils'

import { INTEREST_KIND_LABELS } from '../constants/finance.constants'
import { useCreateDebt } from '../hooks/use-finance'
import { debtSchema, type DebtValues } from '../schemas/finance.schema'

/**
 * Apuntar una deuda.
 *
 * **La tasa sólo se pide cuando hay intereses.** La mayoría de las deudas
 * personales no los tienen —lo que le prestas a un hermano no cobra 2 %— y
 * enseñar un campo vacío invita a rellenarlo con cualquier cosa.
 */
export function DebtForm() {
  const today = useToday()
  const create = useCreateDebt()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DebtValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      direction: 'i_owe',
      interestKind: 'none',
      interestRate: null,
      startedOn: toDateKey(today),
      dueOn: null,
      instalments: null,
    },
  })

  const interestKind = watch('interestKind')
  const hasInterest = interestKind !== 'none'

  const onSubmit = handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: () =>
        reset({
          direction: values.direction,
          interestKind: 'none',
          interestRate: null,
          startedOn: toDateKey(today),
          dueOn: null,
          instalments: null,
          counterpart: '',
        }),
    })
  })

  /**
   * Un campo numérico vacío significa «no lo puse», y hay que decirlo entero.
   *
   * Se comprobaron **todas** las formas de vacío a propósito: con sólo mirar
   * `''` el formulario rechazaba una deuda sin cuotas —que es el caso normal—
   * porque el valor llegaba como `undefined` y `Number(undefined)` es `NaN`.
   */
  const optionalNumber = (value: unknown) => {
    if (value === '' || value === null || value === undefined) return null

    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  const optionalText = (value: unknown) => (value === '' || value == null ? null : String(value))

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="debt-direction">¿Qué es?</Label>
          <Select id="debt-direction" {...register('direction')}>
            <option value="i_owe">Le debo a alguien</option>
            <option value="owed_to_me">Alguien me debe</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="debt-counterpart">¿A quién?</Label>
          <Input
            id="debt-counterpart"
            placeholder="Mi hermano, Bancolombia…"
            {...register('counterpart')}
          />
          {errors.counterpart ? <FormAlert>{errors.counterpart.message}</FormAlert> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="debt-principal">Monto</Label>
          <Input
            id="debt-principal"
            type="number"
            inputMode="numeric"
            step={1}
            placeholder="1000000"
            {...register('principal', { valueAsNumber: true })}
          />
          {errors.principal ? <FormAlert>{errors.principal.message}</FormAlert> : null}
        </div>

        <div>
          <Label htmlFor="debt-started">Desde</Label>
          <Input id="debt-started" type="date" {...register('startedOn')} />
          {errors.startedOn ? <FormAlert>{errors.startedOn.message}</FormAlert> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="debt-interest-kind">Intereses</Label>
          <Select id="debt-interest-kind" {...register('interestKind')}>
            {Object.entries(INTEREST_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {value === 'none' ? 'Sin intereses' : `Mensual ${label}`}
              </option>
            ))}
          </Select>
        </div>

        {hasInterest ? (
          <div>
            <Label htmlFor="debt-rate">Tasa mensual (%)</Label>
            <Input
              id="debt-rate"
              type="number"
              inputMode="decimal"
              step={0.1}
              placeholder="2"
              {...register('interestRate', { setValueAs: optionalNumber })}
            />
            {errors.interestRate ? <FormAlert>{errors.interestRate.message}</FormAlert> : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="debt-due">Fecha límite (opcional)</Label>
          <Input id="debt-due" type="date" {...register('dueOn', { setValueAs: optionalText })} />
        </div>

        <div>
          <Label htmlFor="debt-instalments">Cuotas (opcional)</Label>
          <Input
            id="debt-instalments"
            type="number"
            inputMode="numeric"
            step={1}
            min={1}
            placeholder="12"
            {...register('instalments', { setValueAs: optionalNumber })}
          />
          {errors.instalments ? <FormAlert>{errors.instalments.message}</FormAlert> : null}
        </div>
      </div>

      <div>
        <Label htmlFor="debt-note">Nota (opcional)</Label>
        <Input id="debt-note" placeholder="Para la moto" {...register('note')} />
        {errors.note ? <FormAlert>{errors.note.message}</FormAlert> : null}
      </div>

      <Button type="submit" disabled={isSubmitting || create.isPending}>
        <Plus aria-hidden />
        {create.isPending ? 'Guardando…' : 'Apuntar la deuda'}
      </Button>

      {create.error ? <FormAlert>{create.error.message}</FormAlert> : null}
    </form>
  )
}
