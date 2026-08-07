import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { useToday } from '@/core/time'
import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/utils'
import { toDateKey } from '@/shared/utils'

import { useCreateTransaction } from '../hooks/use-finance'
import { transactionSchema, type TransactionValues } from '../schemas/finance.schema'
import type { FinanceAccount, FinanceCategory } from '../types/finance.types'

interface TransactionFormProps {
  readonly accounts: readonly FinanceAccount[]
  readonly categories: readonly FinanceCategory[]
}

/**
 * Registrar un movimiento.
 *
 * **Está pensado para costar poco, no para ser completo.** Finanzas es el único
 * dominio donde un hueco invalida el resultado: si se olvidan tres compras, la
 * proyección miente. Por eso la fecha viene puesta en hoy, la cuenta en la
 * primera, la categoría puede quedarse vacía y la nota es opcional — en el caso
 * corriente sólo hay que escribir el monto y pulsar.
 */
export function TransactionForm({ accounts, categories }: TransactionFormProps) {
  const today = useToday()
  const create = useCreateTransaction()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      kind: 'expense',
      accountId: accounts[0]?.id ?? '',
      categoryId: null,
      occurredOn: toDateKey(today),
    },
  })

  const kind = watch('kind')
  const visibleCategories = categories.filter((category) => category.kind === kind)

  const onSubmit = handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: () => {
        // Se vacían **sólo** el monto y la nota, y con `resetField`, que es la
        // API que existe para esto: un `reset` con las demás claves parecía
        // funcionar y dejaba el monto puesto, así que el siguiente gasto se
        // apuntaba con la cifra del anterior si no te fijabas.
        //
        // La cuenta, la fecha y el tipo se quedan: quien apunta un gasto suele
        // apuntar el siguiente igual y el mismo día.
        resetField('amount')
        resetField('note')
      },
    })
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">¿Qué apuntas?</legend>
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map((option) => (
            <Button
              key={option}
              type="button"
              variant={kind === option ? 'default' : 'outline'}
              onClick={() => {
                setValue('kind', option)
                // La categoría del otro tipo no aplica: dejarla puesta guardaría
                // un gasto clasificado como «Salario».
                setValue('categoryId', null)
              }}
              className={cn('flex-1')}
            >
              {option === 'expense' ? 'Un gasto' : 'Un ingreso'}
            </Button>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="finance-amount">Monto</Label>
        <Input
          id="finance-amount"
          type="number"
          inputMode="numeric"
          step={1}
          min={1}
          placeholder="12500"
          autoFocus
          {...register('amount', { valueAsNumber: true })}
        />
        {errors.amount ? <FormAlert>{errors.amount.message}</FormAlert> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="finance-account">Cuenta</Label>
          <Select id="finance-account" {...register('accountId')}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
          {errors.accountId ? <FormAlert>{errors.accountId.message}</FormAlert> : null}
        </div>

        <div>
          <Label htmlFor="finance-category">Categoría</Label>
          <Select
            id="finance-category"
            {...register('categoryId', {
              // Un `<select>` no sabe de `null`: la opción vacía llega como '' y
              // aquí se traduce a «sin categoría», que es lo que significa.
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
        <Label htmlFor="finance-date">Fecha</Label>
        <Input id="finance-date" type="date" {...register('occurredOn')} />
        {errors.occurredOn ? <FormAlert>{errors.occurredOn.message}</FormAlert> : null}
      </div>

      <div>
        <Label htmlFor="finance-note">Nota (opcional)</Label>
        <Input id="finance-note" placeholder="Almuerzo con Andrés" {...register('note')} />
        {errors.note ? <FormAlert>{errors.note.message}</FormAlert> : null}
      </div>

      <Button type="submit" disabled={isSubmitting || create.isPending}>
        <Check aria-hidden />
        {create.isPending ? 'Guardando…' : 'Apuntar'}
      </Button>

      {create.error ? <FormAlert>{create.error.message}</FormAlert> : null}
    </form>
  )
}
