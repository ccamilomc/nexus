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

import { RECURRENCE_LABELS } from '../constants/finance.constants'
import { useCreateRecurring } from '../hooks/use-finance'
import { recurringSchema, type RecurringValues } from '../schemas/finance.schema'
import type { FinanceAccount, FinanceCategory } from '../types/finance.types'
import { AccountField } from './AccountField'

interface RecurringFormProps {
  readonly accounts: readonly FinanceAccount[]
  readonly categories: readonly FinanceCategory[]
}

/** Apuntar un pago fijo: el gimnasio, el arriendo, una suscripción. */
export function RecurringForm({ accounts, categories }: RecurringFormProps) {
  const today = useToday()
  const create = useCreateRecurring()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecurringValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      kind: 'expense',
      frequency: 'monthly',
      accountId: accounts[0]?.id ?? '',
      categoryId: null,
      nextDueOn: toDateKey(today),
    },
  })

  const kind = watch('kind')
  const visibleCategories = categories.filter((category) => category.kind === kind)

  const onSubmit = handleSubmit((values) => {
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

      <div>
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

      <Button type="submit" disabled={isSubmitting || create.isPending}>
        <Plus aria-hidden />
        {create.isPending ? 'Guardando…' : 'Apuntar el fijo'}
      </Button>

      {create.error ? <FormAlert>{create.error.message}</FormAlert> : null}
    </form>
  )
}
