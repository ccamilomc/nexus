import type { FinanceAccountKind, FinanceInterestKind } from '../types/finance.types'

/** Cómo se llama cada tipo de cuenta en pantalla. */
export const ACCOUNT_KIND_LABELS: Readonly<Record<FinanceAccountKind, string>> = {
  cash: 'Efectivo',
  bank: 'Cuenta bancaria',
  wallet: 'Billetera digital',
  credit_card: 'Tarjeta de crédito',
  savings: 'Ahorros',
}

/**
 * Cómo corre el interés, dicho en cristiano.
 *
 * La diferencia no es de matiz: sobre un millón al 2 % abonando cien mil al
 * mes, la primera forma suma 220.000 de intereses y la segunda 126.503.
 */
export const INTEREST_KIND_LABELS: Readonly<Record<FinanceInterestKind, string>> = {
  none: 'sin intereses',
  monthly_on_principal: 'sobre el monto original',
  monthly_on_balance: 'sobre lo que falte',
}
