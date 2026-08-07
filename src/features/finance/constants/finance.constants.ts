import type { FinanceAccountKind } from '../types/finance.types'

/** Cómo se llama cada tipo de cuenta en pantalla. */
export const ACCOUNT_KIND_LABELS: Readonly<Record<FinanceAccountKind, string>> = {
  cash: 'Efectivo',
  bank: 'Cuenta bancaria',
  wallet: 'Billetera digital',
  credit_card: 'Tarjeta de crédito',
  savings: 'Ahorros',
}
