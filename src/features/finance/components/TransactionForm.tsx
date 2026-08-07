import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { useToday } from '@/core/time'
import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/utils'
import { formatCop, toDateKey } from '@/shared/utils'

import { useCreateTransaction, useUpdateTransaction } from '../hooks/use-finance'
import { transactionSchema, type TransactionValues } from '../schemas/finance.schema'
import type {
  DebtWithBalance,
  FinanceAccount,
  FinanceCategory,
  FinanceTransactionWithNames,
} from '../types/finance.types'
import { AccountField } from './AccountField'

interface TransactionFormProps {
  readonly accounts: readonly FinanceAccount[]
  readonly categories: readonly FinanceCategory[]
  readonly debts: readonly DebtWithBalance[]
  /** El movimiento que se está corrigiendo, o `null` para apuntar uno nuevo. */
  readonly editing?: FinanceTransactionWithNames | null
  readonly onFinishEditing?: () => void
}

const KIND_OPTIONS = [
  { value: 'expense', label: 'Un gasto' },
  { value: 'income', label: 'Un ingreso' },
  { value: 'transfer', label: 'Un traspaso' },
] as const

/**
 * Registrar un movimiento.
 *
 * **Está pensado para costar poco, no para ser completo.** Finanzas es el único
 * dominio donde un hueco invalida el resultado: si se olvidan tres compras, la
 * proyección miente. Por eso la fecha viene puesta en hoy, la cuenta en la
 * primera, la categoría puede quedarse vacía y la nota es opcional — en el caso
 * corriente sólo hay que escribir el monto y pulsar.
 */
export function TransactionForm({
  accounts,
  categories,
  debts,
  editing = null,
  onFinishEditing,
}: TransactionFormProps) {
  const today = useToday()
  const create = useCreateTransaction()
  const update = useUpdateTransaction()

  const blankValues: TransactionValues = {
    kind: 'expense',
    amount: Number.NaN,
    accountId: accounts[0]?.id ?? '',
    toAccountId: null,
    categoryId: null,
    debtId: null,
    occurredOn: toDateKey(today),
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: blankValues,
  })

  // Al elegir un movimiento para corregir, el formulario se llena con lo que
  // tenía. Depende de `editing.id` y no del objeto: los datos se refrescan tras
  // guardar y un objeto nuevo con el mismo contenido rehaciría el formulario
  // encima de lo que el usuario estuviera escribiendo.
  const editingId = editing?.id ?? null
  useEffect(() => {
    if (!editing) return

    reset({
      kind: editing.kind,
      amount: editing.amount,
      accountId: editing.account_id,
      toAccountId: editing.counterpart_account_id,
      categoryId: editing.category_id,
      debtId: editing.debt_id,
      occurredOn: editing.occurred_on,
      note: editing.note ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver el comentario
  }, [editingId, reset])

  const kind = watch('kind')
  const accountId = watch('accountId')
  const isTransfer = kind === 'transfer'
  // Un traspaso no tiene categoría: no se gastó en nada.
  const visibleCategories = isTransfer
    ? []
    : categories.filter((category) => category.kind === kind)
  // A sí misma no se traspasa nada, así que la cuenta origen no se ofrece.
  const destinations = accounts.filter((account) => account.id !== accountId)
  // Con una sola cuenta no hay a dónde traspasar: ofrecerlo sería un callejón
  // sin salida —se elige el tipo y el desplegable de destino sale vacío—.
  const visibleKinds = KIND_OPTIONS.filter(
    ({ value }) => value !== 'transfer' || accounts.length > 1,
  )
  // Pagar lo que debes es un gasto; cobrar lo que te deben, un ingreso. Ofrecer
  // las del otro sentido dejaría abonar una deuda con dinero que entró.
  const relevantDebts = debts.filter(
    ({ debt }) =>
      debt.settled_at === null && debt.direction === (kind === 'income' ? 'owed_to_me' : 'i_owe'),
  )

  const onSubmit = handleSubmit((values) => {
    if (editing) {
      update.mutate(
        { transactionId: editing.id, values },
        {
          // Al terminar de corregir se vuelve a apuntar en limpio: quedarse en
          // modo edición invitaría a modificar el mismo movimiento otra vez.
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

  const pending = create.isPending || update.isPending
  const failure = create.error ?? update.error

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          {editing ? 'Corrige el movimiento' : '¿Qué apuntas?'}
        </legend>
        <div className="flex flex-wrap gap-2">
          {visibleKinds.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              variant={kind === value ? 'default' : 'outline'}
              onClick={() => {
                setValue('kind', value)
                // Lo que no aplica al tipo nuevo se limpia: dejarlo puesto
                // guardaría un gasto clasificado como «Salario», o un traspaso
                // con la cuenta destino de otro tipo.
                setValue('categoryId', null)
                setValue('toAccountId', null)
              }}
              className={cn('min-w-24 flex-1')}
            >
              {label}
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
        <AccountField
          id="finance-account"
          label={isTransfer ? 'Desde' : 'Cuenta'}
          accounts={accounts}
          registration={register('accountId')}
          error={errors.accountId?.message}
        />

        {isTransfer ? (
          <div>
            <Label htmlFor="finance-to-account">Hacia</Label>
            <Select
              id="finance-to-account"
              {...register('toAccountId', {
                setValueAs: (value: string) => (value === '' ? null : value),
              })}
            >
              <option value="">Elige una cuenta</option>
              {destinations.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
            {errors.toAccountId ? <FormAlert>{errors.toAccountId.message}</FormAlert> : null}
          </div>
        ) : (
          <div>
            <Label htmlFor="finance-category">Categoría</Label>
            <Select
              id="finance-category"
              {...register('categoryId', {
                // Un `<select>` no sabe de `null`: la opción vacía llega como ''
                // y aquí se traduce a «sin categoría», que es lo que significa.
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
        )}
      </div>

      {/* Sólo aparece si hay deudas del sentido que toca: pagar una deuda es un
          gasto, y cobrar lo que te deben es un ingreso. Sin deudas vivas, el
          campo no existe y el formulario no crece por nada. */}
      {relevantDebts.length > 0 ? (
        <div>
          <Label htmlFor="finance-debt">
            {kind === 'income' ? '¿Te abonan una deuda?' : '¿Abona una deuda?'}
          </Label>
          <Select
            id="finance-debt"
            {...register('debtId', {
              setValueAs: (value: string) => (value === '' ? null : value),
            })}
          >
            <option value="">No</option>
            {relevantDebts.map(({ debt, balance }) => (
              <option key={debt.id} value={debt.id}>
                {debt.counterpart} · faltan {formatCop(balance.remaining)}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

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

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting || pending}>
          <Check aria-hidden />
          {pending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Apuntar'}
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
