import type { Enums, Tables } from '@/core/supabase'
import type { SeriesPoint } from '@/shared/utils'

export type FinanceAccountKind = Enums<'finance_account_kind'>
export type FinanceInterestKind = Enums<'finance_interest_kind'>

export type FinanceDebt = Tables<'finance_debts'>
export type FinanceRecurrence = Enums<'finance_recurrence'>
export type FinanceBudget = Tables<'finance_budgets'>
export type FinanceMonthBudget = Tables<'finance_month_budgets'>

/**
 * Lo gastado contra un límite, sea el de una categoría o el del mes entero.
 *
 * Vive aparte para que las dos cuentas no puedan separarse: si una recortara el
 * porcentaje a 100 y la otra no, la misma barra significaría cosas distintas
 * dentro de la misma tarjeta.
 */
export interface SpendAgainstCap {
  readonly spent: number
  readonly cap: number
  /** Puede pasar de 100, y entonces `isExceeded`. */
  readonly percent: number
  /** Lo que queda. Negativo cuando se pasó, y eso es el dato. */
  readonly remaining: number
  readonly isExceeded: boolean
}

/** Cómo va el tope mensual de una categoría. */
export interface BudgetStatus extends SpendAgainstCap {
  readonly categoryId: string
  readonly name: string
}

/**
 * Los topes de un mes: el del mes entero y el de cada categoría.
 *
 * **Van juntos porque se leen juntos.** El presupuesto del mes es el marco y
 * los topes son el detalle; separarlos en dos consultas traería dos veces los
 * mismos movimientos para responder a la misma pregunta.
 */
export interface BudgetsOverview {
  /**
   * Si el mes que se mira es el de hoy.
   *
   * Un tope es un valor único, no un histórico: medir julio con el tope de
   * agosto sería medir con una regla que entonces no existía. Fuera del mes en
   * curso la pantalla no dibuja nada, y sin este dato «vacío» y «no aplica» se
   * verían igual.
   */
  readonly isCurrentMonth: boolean
  /** El presupuesto del mes entero. `null` cuando no se ha puesto. */
  readonly month: SpendAgainstCap | null
  readonly categories: readonly BudgetStatus[]
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
  /** Lo que significan sus cuotas hoy. `null` cuando no se pactó a plazos. */
  readonly instalments: DebtInstalments | null
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
/**
 * Una parte de un movimiento que se fue a otra categoría.
 *
 * **Se recorta del total, no lo sustituye.** El movimiento conserva su `amount`
 * —lo que salió de la cuenta— y su categoría se queda con lo que no se repartió.
 */
export interface TransactionSplit {
  readonly category_id: string | null
  readonly amount: number
  readonly category: { readonly name: string } | null
}

export interface FinanceTransactionWithNames extends FinanceTransaction {
  readonly account: { readonly name: string } | null
  /** La cuenta destino. Sólo en un traspaso. */
  readonly toAccount: { readonly name: string } | null
  readonly category: { readonly name: string } | null
  /** Lo que se repartió a otras categorías. Vacío es el caso normal. */
  readonly splits: readonly TransactionSplit[]
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

/** Cuánto de un movimiento cayó en una categoría. Casi siempre, todo. */
export interface CategoryPart {
  readonly categoryId: string | null
  /** «Sin categoría» cuando no la tiene o se borró. */
  readonly name: string
  readonly amount: number
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

/**
 * Cómo va una deuda pactada a plazos.
 *
 * Hasta ahora las cuotas se guardaban y se escribían —«12 cuotas»— sin calcular
 * nada. Un dato en pantalla que no responde ninguna pregunta es peor que no
 * tenerlo, porque parece que la app lo está siguiendo.
 */
export interface DebtInstalments {
  /** Lo que toca pagar cada mes según lo acordado, redondeado a pesos. */
  readonly amount: number
  /** Cuántas se pactaron. */
  readonly total: number
  /** Cuántas cubren los abonos hechos. */
  readonly paid: number
  /** Cuántas deberían estar cubiertas a día de hoy. */
  readonly due: number
  /** Cuántas van con retraso. Cero cuando se va al día. */
  readonly overdueCount: number
  /** Cuánto hay que poner para ponerse al día. Cero cuando se va al día. */
  readonly overdueAmount: number
  /** Cuándo toca la siguiente. `null` cuando ya están todas cubiertas. */
  readonly nextDueOn: string | null
  readonly isComplete: boolean
}
