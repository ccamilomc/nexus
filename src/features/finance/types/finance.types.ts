import type { Enums, Tables } from '@/core/supabase'

export type FinanceAccountKind = Enums<'finance_account_kind'>
export type FinanceEntryKind = Enums<'finance_entry_kind'>

export type FinanceAccount = Tables<'finance_accounts'>
export type FinanceCategory = Tables<'finance_categories'>
export type FinanceTransaction = Tables<'finance_transactions'>

/**
 * Un movimiento con lo que hace falta para leerlo de un vistazo.
 *
 * La cuenta y la categoría llegan resueltas porque una lista de gastos sin el
 * nombre de la categoría no dice nada. Sólo su nombre: el resto de sus columnas
 * viajaría por nada.
 */
export interface FinanceTransactionWithNames extends FinanceTransaction {
  readonly account: { readonly name: string } | null
  /** La cuenta destino. Sólo en un traspaso. */
  readonly toAccount: { readonly name: string } | null
  readonly category: { readonly name: string } | null
}

/** Lo gastado y lo ingresado en un tramo, con su saldo. */
export interface FinanceTotals {
  readonly income: number
  readonly expense: number
  /** Ingresos menos gastos. Puede ser negativo, y eso es un dato. */
  readonly balance: number
}

/** Cuánto se fue en una categoría, para la comparación entre ellas. */
export interface CategorySpend {
  readonly categoryId: string | null
  /** «Sin categoría» cuando el movimiento no la tiene o se borró. */
  readonly name: string
  readonly amount: number
  /** Porción del gasto total del tramo, de 0 a 100. */
  readonly share: number
}

/** El mes en curso: totales, reparto por categoría y los últimos movimientos. */
export interface FinanceMonth {
  readonly totals: FinanceTotals
  readonly byCategory: readonly CategorySpend[]
  readonly recent: readonly FinanceTransactionWithNames[]
}
