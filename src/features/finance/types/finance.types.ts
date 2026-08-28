import type { Enums, Tables } from '@/core/supabase'
import type { SeriesPoint } from '@/shared/utils'

export type FinanceAccountKind = Enums<'finance_account_kind'>
export type FinanceEntryKind = Enums<'finance_entry_kind'>
export type FinanceDebtDirection = Enums<'finance_debt_direction'>
export type FinanceInterestKind = Enums<'finance_interest_kind'>

export type FinanceDebt = Tables<'finance_debts'>
export type FinanceRecurrence = Enums<'finance_recurrence'>
export type FinanceBudget = Tables<'finance_budgets'>

/** Cómo va un tope mensual: lo gastado, el límite y lo que queda. */
export interface BudgetStatus {
  readonly categoryId: string
  readonly name: string
  readonly spent: number
  readonly cap: number
  /** Puede pasar de 100, y entonces `isExceeded`. */
  readonly percent: number
  /** Lo que queda. Negativo cuando se pasó, y eso es el dato. */
  readonly remaining: number
  readonly isExceeded: boolean
}
export type FinanceRecurring = Tables<'finance_recurring'>

/** Un pago fijo con lo que hace falta para decidir si toca ya. */
export interface RecurringWithStatus {
  readonly recurring: FinanceRecurring
  /** Días para el próximo. Negativo si ya venció. */
  readonly daysLeft: number
  /** Vencido o vence hoy: es lo que se ofrece confirmar. */
  readonly isDue: boolean
}

/** Un abono a una deuda: cuánto y cuándo. Sale de un movimiento real. */
export interface DebtPayment {
  readonly amount: number
  readonly occurredOn: string
}

/** Un abono tal como llega de la base, antes de agruparlo por deuda. */
export interface DebtPaymentRow {
  readonly debt_id: string | null
  readonly amount: number
  readonly occurred_on: string
}

/** Una deuda con sus cuentas hechas. */
export interface DebtWithBalance {
  readonly debt: FinanceDebt
  readonly balance: {
    readonly principal: number
    readonly interest: number
    readonly paid: number
    readonly remaining: number
  }
}

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
  /**
   * Cuánto del gasto vino de un pago fijo.
   *
   * Es parte de `expense`, no se suma aparte: separar lo que se repite de lo
   * que se decide cada día es lo que deja ver **sobre cuánto se manda de
   * verdad**. Un mes con $2.000.000 gastados no se parece en nada si $1.800.000
   * son arriendo y servicios.
   */
  readonly fixedExpense: number
  /** Ingresos menos gastos. Puede ser negativo, y eso es un dato. */
  readonly balance: number
}

/**
 * Cómo termina el mes en curso.
 *
 * **Dos cifras y no una, a propósito.** Una parte ya está decidida —los fijos
 * que faltan por vencer— y la otra sale de suponer que el resto del mes se
 * parece a lo que va. Fundirlas en un solo número escondería cuál de las dos
 * puede fallar, y es justo lo que hay que saber para hacer algo al respecto.
 */
export interface MonthProjection {
  /** Días que quedan del mes, sin contar hoy. */
  readonly daysLeft: number
  /** Lo que falta por salir de pagos fijos que vencen este mes. */
  readonly pendingExpense: number
  /** Lo que falta por entrar de fijos que vencen este mes. */
  readonly pendingIncome: number
  /** Cuántos vencimientos hay detrás de esas dos cifras. */
  readonly pendingCount: number
  /** El cierre contando sólo lo que ya está decidido. Puede ser negativo. */
  readonly committedBalance: number
  /**
   * Lo que se iría en gasto variable al ritmo de estos días, redondeado.
   *
   * `null` cuando el mes es demasiado nuevo para hablar de un ritmo.
   */
  readonly estimatedVariable: number | null
  /** El cierre contando también el ritmo. `null` cuando no se puede estimar. */
  readonly projectedBalance: number | null
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

/**
 * Las finanzas de un periodo, tal y como las consume Analytics.
 *
 * **Un día sin movimientos apuntados es un cero, no un hueco.** Es el mismo
 * criterio que entrenamiento y estudio, y el contrario que nutrición o sueño:
 * un gasto se apunta en el momento de hacerlo, así que un día en blanco
 * significa que no salió dinero. La app asume que se apunta todo —registrar
 * cuesta dos toques justamente por eso— y sin ese supuesto ninguna cifra de
 * finanzas valdría nada.
 */
export interface FinancePeriodSeries {
  /** Gasto de cada día del periodo. */
  readonly expensePoints: readonly SeriesPoint[]
  readonly totalExpense: number
  readonly previousTotalExpense: number
  readonly totalIncome: number
  readonly previousTotalIncome: number
  /** Ingresos menos gastos. Puede ser negativo, y eso es el dato. */
  readonly balance: number
  /** Cuánto del gasto salió de un pago fijo. Es parte del total, no aparte. */
  readonly fixedExpense: number
  /** Días con al menos un movimiento. Lo que hace honesto al gráfico. */
  readonly daysWithMovements: number
  /** En qué se fue el gasto del periodo, de más a menos. */
  readonly byCategory: readonly CategorySpend[]
}

/** El mes en curso: totales, reparto por categoría y los últimos movimientos. */
export interface FinanceMonth {
  readonly totals: FinanceTotals
  readonly byCategory: readonly CategorySpend[]
  /** Todos los del mes, del mas reciente al mas antiguo. */
  readonly transactions: readonly FinanceTransactionWithNames[]
}
