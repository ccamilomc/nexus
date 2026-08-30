import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { OFFLINE_MUTATIONS } from '@/core/offline'
import { useToday } from '@/core/time'
import { toDateKey } from '@/shared/utils'

import type {
  AccountValues,
  CategoryValues,
  DebtValues,
  RecurringValues,
  TransactionValues,
} from '../schemas/finance.schema'
import { financeService } from '../services/finance.service'
import type { CreateTransactionInput } from '../services/transactions.service'
import type { SpendingTypicals } from '../services/transactions.service'
import type {
  BudgetsOverview,
  DebtWithBalance,
  FinanceAccount,
  FinanceBudget,
  FinanceCategory,
  FinanceDebt,
  FinanceMonth,
  FinanceRecurring,
  FinanceTransactionWithNames,
  MonthProjection,
  RecurringWithStatus,
} from '../types/finance.types'
import { addTransactionToMonth } from '../utils/add-transaction'
import { projectMonthEnd } from '../utils/projection'
import { financeKeys } from './finance.keys'

/** Las escrituras necesitan usuario; sin él, la sesión caducó. */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
}

/** Clave estable del mes de una fecha: `2026-08`. */
function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Las cuentas vivas del usuario. */
export function useAccounts() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<FinanceAccount[], AppError>({
    queryKey: financeKeys.accounts(userId),
    queryFn: () => (userId ? financeService.getAccounts(userId) : []),
  })
}

/** Las categorías disponibles (las del catálogo y las propias). */
export function useCategories() {
  return useQuery<FinanceCategory[], AppError>({
    queryKey: financeKeys.categories(),
    queryFn: () => financeService.getCategories(),
  })
}

/** El mes de una fecha: totales, reparto por categoría y últimos movimientos. */
export function useMonth(date: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<FinanceMonth | null, AppError>({
    queryKey: financeKeys.month(userId, monthKeyOf(date)),
    queryFn: () => (userId ? financeService.getMonth(userId, date) : null),
  })
}

/**
 * Cuánto sueles gastar: por categoría y por tramo.
 *
 * Ventana móvil, así que la clave lleva el día: al cambiar de día se vuelve a
 * pedir, y no al cambiar de mes en el selector.
 */
export function useSpendingTypicals() {
  const { user } = useAuth()
  const today = useToday()
  const userId = user?.id

  return useQuery<SpendingTypicals | null, AppError>({
    queryKey: financeKeys.spendingTypicals(userId, toDateKey(today)),
    queryFn: () => (userId ? financeService.getSpendingTypicals(userId, today) : null),
  })
}

/** Las deudas con sus cuentas hechas a día de hoy. */
export function useDebts() {
  const { user } = useAuth()
  const today = useToday()
  const userId = user?.id

  return useQuery<DebtWithBalance[], AppError>({
    // El día entra en la clave: los intereses corridos cambian al pasar de
    // fecha, y sin él la caché seguiría enseñando los de ayer.
    queryKey: financeKeys.debts(userId, toDateKey(today)),
    queryFn: () => (userId ? financeService.getDebts(userId, today) : []),
  })
}

/** Refresca lo registrado tras cualquier cambio. */
function useRefreshMovements() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: financeKeys.movements() }),
    [queryClient],
  )
}

/** Lo que el formulario necesita, sin las variables internas de la mutación. */
interface CreateTransactionMutation {
  readonly isPending: boolean
  readonly error: AppError | null
  /**
   * `onApuntado` corre **en cuanto el movimiento queda a salvo**, esté enviado o
   * esperando red. No es `onSuccess`: una mutación pausada nunca lo llamaría, y
   * el formulario se quedaría con el monto puesto como si no hubiera guardado.
   */
  readonly mutate: (
    values: TransactionValues,
    options?: { readonly onApuntado?: () => void },
  ) => void
}

/**
 * Registra un movimiento.
 *
 * **Un gasto se apunta en la calle**, así que sobrevive a quedarse sin red
 * (ADR-0011): aparece en la lista al momento, espera guardado y sale solo al
 * recuperar la conexión.
 */
export function useCreateTransaction(): CreateTransactionMutation {
  const { user } = useAuth()
  const today = useToday()
  const queryClient = useQueryClient()
  const refresh = useRefreshMovements()
  const monthKey = financeKeys.month(user?.id, monthKeyOf(today))

  const mutation = useMutation<void, AppError, CreateTransactionInput>({
    mutationKey: OFFLINE_MUTATIONS.createTransaction,
    mutationFn: (input) => financeService.createTransaction(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: monthKey })
      const previous = queryClient.getQueryData<FinanceMonth>(monthKey)
      if (!previous) return { previous }

      const named = toNamedTransaction(input, queryClient, user?.id)
      queryClient.setQueryData<FinanceMonth>(monthKey, addTransactionToMonth(previous, named))

      return { previous }
    },

    // Si falla de verdad (sin red se pausa, no falla) se deshace: un gasto que
    // parece apuntado y no está descuadra lo que queda del presupuesto.
    onError: (_error, _input, context) => {
      const previous = (context as { previous?: FinanceMonth } | undefined)?.previous
      if (previous !== undefined) queryClient.setQueryData(monthKey, previous)
    },

    onSettled: refresh,
  })

  const { mutate } = mutation

  return {
    // Pausada no es «en marcha»: sin red el movimiento ya está guardado, y
    // bloquear impediría apuntar el siguiente gasto de la misma salida.
    isPending: mutation.isPending && !mutation.isPaused,
    error: mutation.error,

    mutate: useCallback(
      (values, options) => {
        mutate({ id: crypto.randomUUID(), userId: requireUserId(user?.id), values })
        options?.onApuntado?.()
      },
      [mutate, user?.id],
    ),
  }
}

/**
 * El movimiento con los nombres puestos, que es como lo enseña la lista.
 *
 * Salen de las cuentas y categorías que ya están cargadas —de ahí se acaban de
 * elegir—, así que no hace falta preguntar a nadie para pintarlo.
 */
function toNamedTransaction(
  input: CreateTransactionInput,
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
): FinanceTransactionWithNames {
  const { values } = input
  const accounts = queryClient.getQueryData<FinanceAccount[]>(financeKeys.accounts(userId)) ?? []
  const categories = queryClient.getQueryData<FinanceCategory[]>(financeKeys.categories()) ?? []
  const nameOf = <T extends { id: string; name: string }>(list: readonly T[], id: string | null) =>
    id === null ? null : (list.find((entry) => entry.id === id) ?? null)

  const isTransfer = values.kind === 'transfer'
  const now = new Date().toISOString()

  return {
    id: input.id,
    user_id: input.userId,
    account_id: values.accountId,
    counterpart_account_id: isTransfer ? values.toAccountId : null,
    category_id: isTransfer ? null : values.categoryId,
    debt_id: isTransfer ? null : values.debtId,
    kind: values.kind,
    amount: values.amount,
    occurred_on: values.occurredOn,
    note: values.note?.trim() ? values.note.trim() : null,
    recurring_id: null,
    deleted_at: null,
    created_at: now,
    updated_at: now,
    account: nameOf(accounts, values.accountId),
    toAccount: isTransfer ? nameOf(accounts, values.toAccountId) : null,
    category: isTransfer ? null : nameOf(categories, values.categoryId),
    // Las partes también, con su nombre: sin esto un gasto repartido sin red se
    // pinta como si no lo estuviera, y al volver la conexión cambiaría solo.
    splits: isTransfer
      ? []
      : values.splits.map((split) => ({
          category_id: split.categoryId,
          amount: split.amount,
          category: nameOf(categories, split.categoryId),
        })),
  }
}

interface UpdateTransactionVariables {
  readonly transactionId: string
  readonly values: TransactionValues
}

/** Corrige un movimiento ya apuntado. */
export function useUpdateTransaction() {
  const { user } = useAuth()
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, UpdateTransactionVariables>({
    mutationFn: ({ transactionId, values }) =>
      financeService.updateTransaction(transactionId, requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

/** Quita un movimiento apuntado por error. */
export function useRemoveTransaction() {
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, string>({
    mutationFn: (transactionId) => financeService.removeTransaction(transactionId),
    onSuccess: refresh,
  })
}

/** Refresca cuentas y categorías, que se consumen juntas en los formularios. */
function useRefreshCatalog() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
    [queryClient],
  )
}

/** Crea una cuenta. */
export function useCreateAccount() {
  const { user } = useAuth()
  const refresh = useRefreshCatalog()

  return useMutation<FinanceAccount, AppError, AccountValues>({
    mutationFn: (values) => financeService.createAccount(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

/** Retira una cuenta de los formularios sin tocar su histórico. */
export function useArchiveAccount() {
  const refresh = useRefreshCatalog()

  return useMutation<void, AppError, string>({
    mutationFn: (accountId) => financeService.archiveAccount(accountId),
    onSuccess: refresh,
  })
}

/** Lo que se enseña mientras carga o cuando no hay usuario: nada. */
export const NO_BUDGETS: BudgetsOverview = { isCurrentMonth: false, month: null, categories: [] }

/** El presupuesto del mes y los topes por categoría. Vacío fuera del mes en curso. */
export function useBudgets(month: Date) {
  const { user } = useAuth()
  const today = useToday()
  const userId = user?.id

  return useQuery<BudgetsOverview, AppError>({
    queryKey: financeKeys.budgets(userId, monthKeyOf(month)),
    queryFn: () => (userId ? financeService.getBudgets(userId, month, today) : NO_BUDGETS),
  })
}

/** Los topes tal cual, para editarlos. */
export function useBudgetCaps() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<FinanceBudget[], AppError>({
    queryKey: financeKeys.budgetCaps(userId),
    queryFn: () => (userId ? financeService.getBudgetCaps(userId) : []),
  })
}

interface SetBudgetVariables {
  readonly categoryId: string
  readonly amount: number
}

/** Pone o cambia el tope de una categoría. */
export function useSetBudget() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<void, AppError, SetBudgetVariables>({
    mutationFn: ({ categoryId, amount }) =>
      financeService.setBudget(requireUserId(user?.id), categoryId, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  })
}

/** Quita el tope de una categoría. */
export function useRemoveBudget() {
  const queryClient = useQueryClient()

  return useMutation<void, AppError, string>({
    mutationFn: (budgetId) => financeService.removeBudget(budgetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  })
}

/** Pone o cambia el presupuesto del mes entero. */
export function useSetMonthBudget() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<void, AppError, number>({
    mutationFn: (amount) => financeService.setMonthBudget(requireUserId(user?.id), amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  })
}

/** Quita el presupuesto del mes. */
export function useRemoveMonthBudget() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<void, AppError, void>({
    mutationFn: () => financeService.removeMonthBudget(requireUserId(user?.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  })
}

/** Los pagos fijos con su estado a día de hoy. */
export function useRecurring() {
  const { user } = useAuth()
  const today = useToday()
  const userId = user?.id

  return useQuery<RecurringWithStatus[], AppError>({
    // El día entra en la clave: «faltan 3 días» cambia al pasar de fecha.
    queryKey: financeKeys.recurring(userId, toDateKey(today)),
    queryFn: () => (userId ? financeService.getRecurring(userId, today) : []),
  })
}

/**
 * Cómo termina el mes: lo que falta por salir de fijos y lo que se iría al ritmo
 * de estos días.
 *
 * **Sólo el mes en curso**, igual que los topes: proyectar un mes que ya cerró
 * no es proyectar, es contar un pasado distinto del que fue.
 *
 * Compone dos consultas que ya existen y no añade ninguna —los fijos son los
 * mismos que enseña su pestaña, y TanStack los comparte por clave—, así que el
 * cálculo cabe en un `useMemo` en vez de en una consulta propia. Devuelve `null`
 * mientras cargan: la tarjeta aparece cuando hay algo que decir, no antes.
 */
export function useMonthProjection(month: Date): MonthProjection | null {
  const today = useToday()
  const { data: monthData } = useMonth(month)
  const { data: recurring } = useRecurring()

  const totals = monthData?.totals
  const isCurrentMonth = monthKeyOf(month) === monthKeyOf(today)

  return useMemo(() => {
    if (!isCurrentMonth || !totals || !recurring) return null

    return projectMonthEnd(
      totals,
      recurring.map((item) => item.recurring),
      today,
    )
  }, [isCurrentMonth, totals, recurring, today])
}

/** Crea un pago fijo. */
export function useCreateRecurring() {
  const { user } = useAuth()
  const refresh = useRefreshMovements()

  return useMutation<FinanceRecurring, AppError, RecurringValues>({
    mutationFn: (values) => financeService.createRecurring(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

interface UpdateRecurringVariables {
  readonly recurringId: string
  readonly values: RecurringValues
  /**
   * La fecha que tenía antes de editar.
   *
   * Va aquí porque el servicio la necesita para saber si el día acordado se
   * rehace: pedírsela a la base otra vez sería un viaje para un dato que quien
   * abre el formulario ya tiene delante.
   */
  readonly currentNextDueOn: string
}

/** Corrige un pago fijo ya apuntado. */
export function useUpdateRecurring() {
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, UpdateRecurringVariables>({
    mutationFn: ({ recurringId, values, currentNextDueOn }) =>
      financeService.updateRecurring(recurringId, values, currentNextDueOn),
    onSuccess: refresh,
  })
}

/** Confirma que un fijo se pagó: lo apunta y lo mueve al siguiente. */
export function useConfirmRecurring() {
  const { user } = useAuth()
  const today = useToday()
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, FinanceRecurring>({
    mutationFn: (item) =>
      financeService.confirmRecurring(requireUserId(user?.id), item, toDateKey(today)),
    onSuccess: refresh,
  })
}

interface PauseRecurringVariables {
  readonly recurringId: string
  readonly isPaused: boolean
}

/** Pausa un fijo o lo reanuda. */
export function usePauseRecurring() {
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, PauseRecurringVariables>({
    mutationFn: ({ recurringId, isPaused }) =>
      financeService.setRecurringPaused(recurringId, isPaused),
    onSuccess: refresh,
  })
}

/** Quita un fijo. Los movimientos que ya confirmó se quedan. */
export function useRemoveRecurring() {
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, string>({
    mutationFn: (recurringId) => financeService.removeRecurring(recurringId),
    onSuccess: refresh,
  })
}

/** Crea una deuda. */
export function useCreateDebt() {
  const { user } = useAuth()
  const refresh = useRefreshMovements()

  return useMutation<FinanceDebt, AppError, DebtValues>({
    mutationFn: (values) => financeService.createDebt(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

interface UpdateDebtVariables {
  readonly debtId: string
  readonly values: DebtValues
}

/** Corrige una deuda ya apuntada. Sus abonos siguen contando. */
export function useUpdateDebt() {
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, UpdateDebtVariables>({
    mutationFn: ({ debtId, values }) => financeService.updateDebt(debtId, values),
    onSuccess: refresh,
  })
}

interface SettleDebtVariables {
  readonly debtId: string
  readonly isSettled: boolean
}

/** Da una deuda por saldada, o la reabre. */
export function useSettleDebt() {
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, SettleDebtVariables>({
    mutationFn: ({ debtId, isSettled }) => financeService.setDebtSettled(debtId, isSettled),
    onSuccess: refresh,
  })
}

/** Quita una deuda apuntada por error. Sus abonos siguen siendo gastos. */
export function useRemoveDebt() {
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, string>({
    mutationFn: (debtId) => financeService.removeDebt(debtId),
    onSuccess: refresh,
  })
}

/** Crea una categoría propia. */
export function useCreateCategory() {
  const { user } = useAuth()
  const refresh = useRefreshCatalog()

  return useMutation<FinanceCategory, AppError, CategoryValues>({
    mutationFn: (values) => financeService.createCategory(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

/** Retira una categoría propia. Las del catálogo las protege la RLS. */
export function useArchiveCategory() {
  const refresh = useRefreshCatalog()

  return useMutation<void, AppError, string>({
    mutationFn: (categoryId) => financeService.archiveCategory(categoryId),
    onSuccess: refresh,
  })
}
