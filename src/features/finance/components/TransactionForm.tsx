import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useToday } from '@/core/time'
import { type FoodPurchase, useRepriceFoods } from '@/features/nutrition'
import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { MoneyField } from '@/shared/components/ui/money-input'
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
import { FoodPricingSection } from './FoodPricingSection'
import { TransactionSplits } from './TransactionSplits'

interface TransactionFormProps {
  readonly accounts: readonly FinanceAccount[]
  readonly categories: readonly FinanceCategory[]
  readonly debts: readonly DebtWithBalance[]
  /** El movimiento que se está corrigiendo, o `null` para apuntar uno nuevo. */
  readonly editing?: FinanceTransactionWithNames | null
  readonly onFinishEditing?: () => void
  /**
   * La deuda que se viene a abonar, cuando se llega desde su tarjeta.
   *
   * Un abono es un movimiento como cualquier otro —por eso se usa este mismo
   * formulario y no otro— pero llegando desde la deuda ya se sabe **el sentido
   * y cuál es**: pagar lo que debes es un gasto y cobrar lo que te deben, un
   * ingreso. Dejar que se eligieran a mano sería pedir dos veces algo que ya
   * está dicho, y permitiría equivocarse.
   */
  readonly payingDebt?: DebtWithBalance | null
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
  payingDebt = null,
}: TransactionFormProps) {
  const today = useToday()
  const create = useCreateTransaction()
  const update = useUpdateTransaction()
  const reprice = useRepriceFoods()
  // Lo comprado, si el gasto vino del supermercado. Vacío es el caso normal.
  const [purchases, setPurchases] = useState<readonly FoodPurchase[]>([])
  // Sube tras guardar para vaciar los campos de la compra remontándolos.
  const [purchaseReset, setPurchaseReset] = useState(0)

  // Llegando desde una deuda, el sentido y la deuda vienen resueltos.
  const blankValues: TransactionValues = {
    kind: payingDebt
      ? payingDebt.debt.direction === 'owed_to_me'
        ? 'income'
        : 'expense'
      : 'expense',
    amount: Number.NaN,
    accountId: accounts[0]?.id ?? '',
    toAccountId: null,
    categoryId: null,
    debtId: payingDebt?.debt.id ?? null,
    occurredOn: toDateKey(today),
    splits: [],
  }

  const {
    register,
    control,
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
      // Las partes que ya tenía: sin esto, corregir cualquier cosa de un gasto
      // repartido lo dejaría sin repartir sin avisar.
      splits: editing.splits.map((split) => ({
        categoryId: split.category_id ?? '',
        amount: split.amount,
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver el comentario
  }, [editingId, reset])

  const kind = watch('kind')
  const amount = watch('amount')
  const splits = watch('splits')
  const categoryId = watch('categoryId')
  const accountId = watch('accountId')
  const isTransfer = kind === 'transfer'
  // Con quién se queda lo que no se reparta. Sin categoría elegida también hay
  // resto: va a «Sin categoría», y decirlo evita pensar que se pierde.
  const restName =
    categories.find((category) => category.id === categoryId)?.name ?? 'Sin categoría'
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

    // `onApuntado` y no `onSuccess`: sin red el movimiento queda encolado y
    // nunca «termina», así que el formulario se quedaría con el monto puesto
    // como si no se hubiera guardado. Aquí ya está a salvo.
    create.mutate(values, {
      onApuntado: () => {
        // Se vacían **sólo** el monto y la nota, y con `resetField`, que es la
        // API que existe para esto: un `reset` con las demás claves parecía
        // funcionar y dejaba el monto puesto, así que el siguiente gasto se
        // apuntaba con la cifra del anterior si no te fijabas.
        //
        // La cuenta, la fecha y el tipo se quedan: quien apunta un gasto suele
        // apuntar el siguiente igual y el mismo día.
        resetField('amount')
        resetField('note')

        if (purchases.length === 0) return

        // **El gasto primero y los precios después, en ese orden.** Sin
        // transacciones desde el cliente, si falla lo segundo el dinero ya
        // quedó apuntado —que es lo que no se puede perder— y los precios se
        // reintentan sin coste, con los campos todavía llenos. Al revés se
        // perdería el gasto por no haber podido actualizar un precio.
        reprice.mutate(purchases, {
          onSuccess: () => {
            setPurchases([])
            setPurchaseReset((key) => key + 1)
          },
        })
      },
    })
  })

  const pending = create.isPending || update.isPending || reprice.isPending
  const failure = create.error ?? update.error
  const repriced = reprice.data ?? []

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
                // La compra también: el bloque desaparece al salir de «gasto»,
                // pero lo escrito seguía en memoria y se habría aplicado al
                // guardar un ingreso, que es justo lo que nadie espera.
                setPurchases([])
                setPurchaseReset((key) => key + 1)
              }}
              className={cn('min-w-24 flex-1')}
            >
              {label}
            </Button>
          ))}
        </div>
      </fieldset>

      {/* Monto y fecha comparten fila en pantalla ancha. Sueltos ocupaban el
          ancho entero de la tarjeta —casi 900 px para teclear cinco dígitos—,
          que es lo que pasa cuando un diseño móvil no se adapta al escritorio.
          No se ve midiendo: no hay desbordamiento, sólo desproporción. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="finance-amount">Monto</Label>
          <MoneyField
            control={control}
            name="amount"
            id="finance-amount"
            placeholder="12500"
            autoFocus
          />
          {errors.amount ? <FormAlert>{errors.amount.message}</FormAlert> : null}
        </div>

        <div>
          <Label htmlFor="finance-date">Fecha</Label>
          <Input id="finance-date" type="date" {...register('occurredOn')} />
          {errors.occurredOn ? <FormAlert>{errors.occurredOn.message}</FormAlert> : null}
        </div>
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

      {/* Un traspaso no se reparte: cambia de cajón, no se gasta en nada. */}
      {!isTransfer ? (
        <TransactionSplits
          control={control}
          register={register}
          categories={visibleCategories}
          amount={amount}
          restName={restName}
          splits={splits}
          error={errors.splits?.message ?? errors.splits?.root?.message}
        />
      ) : null}

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
        <Label htmlFor="finance-note">Nota (opcional)</Label>
        <Input id="finance-note" placeholder="Almuerzo con Andrés" {...register('note')} />
        {errors.note ? <FormAlert>{errors.note.message}</FormAlert> : null}
      </div>

      {/* Sólo al apuntar un gasto nuevo. Corregir un movimiento de hace tres
          semanas no es venir del supermercado, y repreciar entonces pondría el
          precio de entonces como si fuera el de hoy. */}
      {kind === 'expense' && !editing ? (
        <FoodPricingSection onChange={setPurchases} resetKey={purchaseReset} />
      ) : null}

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

      {/* El fallo de los precios se cuenta aparte del de arriba, y diciendo que
          el gasto sí quedó: si no, parecería que se perdió todo. */}
      {reprice.isError ? (
        <FormAlert>
          El gasto quedó apuntado, pero no se pudieron actualizar los precios.{' '}
          {reprice.error.message}
        </FormAlert>
      ) : null}

      {repriced.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {repriced.length === 1
            ? `Precio de ${repriced[0]?.name} puesto al día.`
            : `Precio de ${repriced.length} alimentos puesto al día.`}
        </p>
      ) : null}
    </form>
  )
}
