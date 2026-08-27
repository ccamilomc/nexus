import type { QueryClient } from '@tanstack/react-query'

import { registerOfflineMutation } from '@/core/offline'

import { financeService } from './services/finance.service'
import type { CreateTransactionInput } from './services/transactions.service'

/**
 * Cómo se envían los movimientos que se apuntaron sin red.
 *
 * Vive fuera de los hooks porque se reanudan **sin pantalla**: al abrir la
 * aplicación, lo encolado sale antes de que se monte nada.
 */
export function registerFinanceOfflineMutations(client: QueryClient): void {
  registerOfflineMutation<CreateTransactionInput>(client, 'createTransaction', (input) =>
    financeService.createTransaction(input),
  )
}
