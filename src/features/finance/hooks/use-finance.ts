import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
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
import type {
  BudgetStatus,
  DebtWithBalance,
  FinanceAccount,
  FinanceBudget,
  FinanceCategory,
  FinanceDebt,
  FinanceMonth,
  FinanceRecurring,
  RecurringWithStatus,
} from '../types/finance.types'
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

/** Registra un movimiento. */
export function useCreateTransaction() {
  const { user } = useAuth()
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, TransactionValues>({
    mutationFn: (values) => financeService.createTransaction(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

interface UpdateTransactionVariables {
  readonly transactionId: string
  readonly values: TransactionValues
}

/** Corrige un movimiento ya apuntado. */
export function useUpdateTransaction() {
  const refresh = useRefreshMovements()

  return useMutation<void, AppError, UpdateTransactionVariables>({
    mutationFn: ({ transactionId, values }) =>
      financeService.updateTransaction(transactionId, values),
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

/** Cómo van los topes de un mes. Vacío si no es el mes en curso. */
export function useBudgets(month: Date) {
  const { user } = useAuth()
  const today = useToday()
  const userId = user?.id

  return useQuery<BudgetStatus[], AppError>({
    queryKey: financeKeys.budgets(userId, monthKeyOf(month)),
    queryFn: () => (userId ? financeService.getBudgets(userId, month, today) : []),
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

/** Crea un pago fijo. */
export function useCreateRecurring() {
  const { user } = useAuth()
  const refresh = useRefreshMovements()

  return useMutation<FinanceRecurring, AppError, RecurringValues>({
    mutationFn: (values) => financeService.createRecurring(requireUserId(user?.id), values),
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
