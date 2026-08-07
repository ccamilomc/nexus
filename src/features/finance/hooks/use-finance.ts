import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'

import type { AccountValues, CategoryValues, TransactionValues } from '../schemas/finance.schema'
import { financeService } from '../services/finance.service'
import type { FinanceAccount, FinanceCategory, FinanceMonth } from '../types/finance.types'
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
