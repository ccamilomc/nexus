import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Plus } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { useToday } from '@/core/time'
import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { toDateKey } from '@/shared/utils'

import { RECURRENCE_LABELS } from '../constants/finance.constants'
import { useCreateRecurring, useUpdateRecurring } from '../hooks/use-finance'
import { recurringSchema, type RecurringValues } from '../schemas/finance.schema'
import type { FinanceAccount, FinanceCategory, FinanceRecurring } from '../types/finance.types'
import { AccountField } from './AccountField'

interface RecurringFormProps {
  readonly accounts: readonly FinanceAccount[]
  readonly categories: readonly FinanceCategory[]
  /** El fijo que se está corrigiendo, o `null` para apuntar uno nuevo. */
  readonly editing?: FinanceRecurring | null
  readonly onFinishEditing?: () => void
}

/**
 * Apuntar un pago fijo: el gimnasio, el arriendo, una suscripción.
 *
 * **El mismo formulario corrige.** Un arriendo sube de precio todos los años, y
 * sin poder editarlo la única salida era borrarlo y rehacerlo: se perdía el día
 * acordado y había que volver a teclearlo todo para cambiar una cifra.
 */
export function RecurringForm({
  accounts,
  categories,
  editing = null,
  onFinishEditing,
}: RecurringFormProps) {
  const today = useToday()
  const create = useCreateRecurring()
  const update = useUpdateRecurring()

  const blankValues: RecurringValues = {
    name: '',
    kind: 'expense',
    amount: Number.NaN,
    accountId: accounts[0]?.id ?? '',
    categoryId: null,
    frequency: 'monthly',
    nextDueOn: toDateKey(today),
    note: '',
  }

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecurringValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: blankValues,
  })

  // Depende de `editing.id` y no del objeto: los datos se refrescan tras
  // guardar y un objeto nuevo con el mismo contenido reharía el formulario
  // encima de lo que el usuario estuviera escribiendo.
  const editingId = editing?.id ?? null
  useEffect(() => {
    if (!editing) return

    reset({
      name: editing.name,
      kind: editing.kind,
      amount: editing.amount,
      accountId: editing.account_id,
      categoryId: editing.category_id,
      frequency: editing.frequency,
      nextDueOn: editing.next_due_on,
      note: editing.note ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver el comentario
  }, [editingId, reset])

  const kind = watch('kind')
  const visibleCategories = categories.filter((category) => category.kind === kind)

  const onSubmit = handleSubmit((values) => {
    if (editing) {
      update.mutate(
        { recurringId: editing.id, values, currentNextDueOn: editing.next_due_on },
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
        // `reset()` sin argumentos: con un objeto parcial los campos omitidos
        // conservan lo que había, y el monto del fijo anterior se quedaba puesto.
        reset()
        setValue('kind', values.kind)
        setValue('frequency', values.frequency)
      },
    })
  })

  const pending = create.isPending || update.isPending
  const failure = create.error ?? update.error

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="recurring-name">¿Qué es?</Label>
          <Input
            id="recurring-name"
            placeholder="Gimnasio, arriendo, Netflix…"
            {...register('name')}
          />
          {errors.name ? <FormAlert>{errors.name.message}</FormAlert> : null}
        </div>

        <div>
          <Label htmlFor="recurring-amount">Monto</Label>
          <Input
            id="recurring-amount"
            type="number"
            inputMode="numeric"
            step={1}
            placeholder="120000"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount ? <FormAlert>{errors.amount.message}</FormAlert> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="recurring-kind">¿Sale o entra?</Label>
          <Select
            id="recurring-kind"
            {...register('kind', {
              onChange: () => setValue('categoryId', null),
            })}
          >
            <option value="expense">Sale (un gasto)</option>
            <option value="income">Entra (un ingreso)</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="recurring-frequency">¿Cada cuánto?</Label>
          <Select id="recurring-frequency" {...register('frequency')}>
            {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AccountField
          id="recurring-account"
          label="Cuenta"
          accounts={accounts}
          registration={register('accountId')}
          error={errors.accountId?.message}
        />

        <div>
          <Label htmlFor="recurring-category">Categoría</Label>
          <Select
            id="recurring-category"
            {...register('categoryId', {
              setValueAs: (value: string) => (value === '' ? null : value),
            })}
          >
            <option value="">Sin categoría</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Una fecha no necesita 935 px de ancho. El resto de campos de este
          formulario ya comparten fila; éste se había quedado suelto. */}
      <div className="sm:max-w-xs">
        <Label htmlFor="recurring-next">¿Cuándo toca el siguiente?</Label>
        <Input id="recurring-next" type="date" {...register('nextDueOn')} />
        {/* De esta fecha sale el día acordado, y por eso importa: un arriendo
            del 31 lo conserva aunque febrero lo recorte una vez. */}
        {errors.nextDueOn ? <FormAlert>{errors.nextDueOn.message}</FormAlert> : null}
      </div>

      <div>
        <Label htmlFor="recurring-note">Nota (opcional)</Label>
        <Input
          id="recurring-note"
          placeholder="Se cobra solo de la tarjeta"
          {...register('note')}
        />
        {errors.note ? <FormAlert>{errors.note.message}</FormAlert> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting || pending}>
          {editing ? <Check aria-hidden /> : <Plus aria-hidden />}
          {pending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Apuntar el fijo'}
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
