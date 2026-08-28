import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Plus } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { useToday } from '@/core/time'
import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { MoneyField } from '@/shared/components/ui/money-input'
import { Select } from '@/shared/components/ui/select'
import { toDateKey } from '@/shared/utils'

import { INTEREST_KIND_LABELS } from '../constants/finance.constants'
import { useCreateDebt, useUpdateDebt } from '../hooks/use-finance'
import { debtSchema, type DebtValues } from '../schemas/finance.schema'
import type { FinanceDebt } from '../types/finance.types'

interface DebtFormProps {
  /** La deuda que se está corrigiendo, o `null` para apuntar una nueva. */
  readonly editing?: FinanceDebt | null
  readonly onFinishEditing?: () => void
}

/**
 * Apuntar una deuda.
 *
 * **La tasa sólo se pide cuando hay intereses.** La mayoría de las deudas
 * personales no los tienen —lo que le prestas a un hermano no cobra 2 %— y
 * enseñar un campo vacío invita a rellenarlo con cualquier cosa.
 *
 * **El mismo formulario corrige**, y aquí importa más que en ningún otro sitio:
 * los abonos son movimientos con `debt_id`, así que borrar la deuda para
 * rehacerla los desvincula todos. Quien se equivocó en un cero tendría que
 * elegir entre la cifra mal o perder el rastro de lo que ya pagó.
 */
export function DebtForm({ editing = null, onFinishEditing }: DebtFormProps) {
  const today = useToday()
  const create = useCreateDebt()
  const update = useUpdateDebt()

  const blankValues: DebtValues = {
    counterpart: '',
    direction: 'i_owe',
    principal: Number.NaN,
    interestKind: 'none',
    interestRate: null,
    startedOn: toDateKey(today),
    dueOn: null,
    instalments: null,
    note: '',
  }

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DebtValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: blankValues,
  })

  // Depende de `editing.id` y no del objeto: los datos se refrescan tras
  // guardar y un objeto nuevo con el mismo contenido reharía el formulario
  // encima de lo que se estuviera escribiendo.
  const editingId = editing?.id ?? null
  useEffect(() => {
    if (!editing) return

    reset({
      counterpart: editing.counterpart,
      direction: editing.direction,
      principal: editing.principal,
      interestKind: editing.interest_kind,
      interestRate: editing.interest_rate,
      startedOn: editing.started_on,
      dueOn: editing.due_on,
      instalments: editing.instalments,
      note: editing.note ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver el comentario
  }, [editingId, reset])

  const interestKind = watch('interestKind')
  const hasInterest = interestKind !== 'none'

  const onSubmit = handleSubmit((values) => {
    if (editing) {
      update.mutate(
        { debtId: editing.id, values },
        {
          onSuccess: () => {
            reset(blankValues)
            onFinishEditing?.()
          },
        },
      )
      return
    }

    create.mutate(values, {
      onSuccess: () => {
        // `reset()` **sin argumentos**, que vuelve a los valores por defecto y
        // vacía todo lo demás. Con un objeto parcial sólo se aplica lo que se
        // lista y los campos omitidos **conservan lo que había**: así el monto
        // de la deuda anterior se quedaba puesto en el formulario, listo para
        // apuntar la siguiente con la cifra equivocada.
        reset()
        // Salvo el sentido: quien apunta una deuda suele apuntar otra igual.
        setValue('direction', values.direction)
      },
    })
  })

  const pending = create.isPending || update.isPending
  const failure = create.error ?? update.error

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
          <MoneyField
            control={control}
            name="principal"
            id="debt-principal"
            placeholder="1000000"
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

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting || pending}>
          {editing ? <Check aria-hidden /> : <Plus aria-hidden />}
          {pending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Apuntar la deuda'}
        </Button>

        {editing ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              reset(blankValues)
              onFinishEditing?.()
            }}
          >
            Cancelar
          </Button>
        ) : null}
      </div>

      {failure ? <FormAlert>{failure.message}</FormAlert> : null}
    </form>
  )
}
