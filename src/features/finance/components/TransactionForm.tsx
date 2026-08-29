import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { useToday } from '@/core/time'
import { FormAlert } from '@/shared/components/feedback'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { MoneyField } from '@/shared/components/ui/money-input'
import { toDateKey } from '@/shared/utils'

import { useCreateTransaction, useUpdateTransaction } from '../hooks/use-finance'
import { useFoodPricing } from '../hooks/use-food-pricing'
import { transactionSchema, type TransactionValues } from '../schemas/finance.schema'
import type {
  DebtWithBalance,
  FinanceAccount,
  FinanceCategory,
  FinanceTransactionWithNames,
} from '../types/finance.types'
import { FoodPricingSection } from './FoodPricingSection'
import { TransactionDebtField } from './TransactionDebtField'
import { TransactionKindPicker } from './TransactionKindPicker'
import { TransactionSplits } from './TransactionSplits'
import { TransactionTarget } from './TransactionTarget'

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
/** Un `<select>` no sabe de `null`: la opción vacía llega como cadena vacía. */
const toNullable = (value: string) => (value === '' ? null : value)

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
  // Los precios del supermercado son de Nutrición, no del formulario: aquí
  // sólo se ofrecen en el momento en que la persona tiene el recibo delante.
  const pricing = useFoodPricing()

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

        // Con el gasto ya a salvo. El porqué del orden está en el hook.
        pricing.submit()
      },
    })
  })

  const pending = create.isPending || update.isPending || pricing.isPending
  const failure = create.error ?? update.error

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <TransactionKindPicker
        options={visibleKinds}
        value={kind}
        isEditing={Boolean(editing)}
        onSelect={(next) => {
          setValue('kind', next)
          // Lo que no aplica al tipo nuevo se limpia: dejarlo puesto guardaría
          // un gasto clasificado como «Salario», o un traspaso con la cuenta
          // destino de otro tipo.
          setValue('categoryId', null)
          setValue('toAccountId', null)
          // La compra también: el bloque desaparece al salir de «gasto», pero
          // lo escrito seguía en memoria y se habría aplicado al guardar un
          // ingreso, que es justo lo que nadie espera.
          pricing.clear()
        }}
      />

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

      <TransactionTarget
        accounts={accounts}
        destinations={destinations}
        categories={visibleCategories}
        isTransfer={isTransfer}
        accountRegistration={register('accountId')}
        toAccountRegistration={register('toAccountId', { setValueAs: toNullable })}
        categoryRegistration={register('categoryId', { setValueAs: toNullable })}
        accountError={errors.accountId?.message}
        toAccountError={errors.toAccountId?.message}
      />

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

      <TransactionDebtField
        debts={relevantDebts}
        isIncome={kind === 'income'}
        registration={register('debtId', { setValueAs: toNullable })}
      />

      <div>
        <Label htmlFor="finance-note">Nota (opcional)</Label>
        <Input id="finance-note" placeholder="Almuerzo con Andrés" {...register('note')} />
        {errors.note ? <FormAlert>{errors.note.message}</FormAlert> : null}
      </div>

      {/* Sólo al apuntar un gasto nuevo. Corregir un movimiento de hace tres
          semanas no es venir del supermercado, y repreciar entonces pondría el
          precio de entonces como si fuera el de hoy. */}
      {kind === 'expense' && !editing ? (
        <FoodPricingSection onChange={pricing.setPurchases} resetKey={pricing.resetKey} />
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
      {pricing.error ? (
        <FormAlert>
          El gasto quedó apuntado, pero no se pudieron actualizar los precios.{' '}
          {pricing.error.message}
        </FormAlert>
      ) : null}

      {pricing.repriced.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {pricing.repriced.length === 1
            ? `Precio de ${pricing.repriced[0]?.name} puesto al día.`
            : `Precio de ${pricing.repriced.length} alimentos puesto al día.`}
        </p>
      ) : null}
    </form>
  )
}
