import type { FinanceRecurring, FinanceTotals, MonthProjection } from '../types/finance.types'
import { nextDueDate } from './recurrence'

/**
 * Días transcurridos que hacen falta para hablar de un ritmo de gasto.
 *
 * El mismo criterio que la tendencia de Analytics, que no se dibuja con menos de
 * tres días: el día 2, una salida cara convertiría el mes entero en una ruina
 * que no va a ocurrir.
 */
const MIN_DAYS_FOR_RATE = 3

/**
 * A cuánto se redondea lo estimado.
 *
 * Un «$433.917» estimado finge una precisión que no tiene. Redondeado a miles
 * se lee como lo que es: una cuenta aproximada.
 */
const ESTIMATE_ROUNDING = 1000

/**
 * Cortafuegos del recorrido de vencimientos.
 *
 * No es una regla de negocio: el bucle siempre avanza y siempre para al salirse
 * del mes. Está por si un fijo semanal lleva años sin confirmarse, para que dar
 * con el mes no cueste miles de vueltas.
 */
const MAX_STEPS = 200

interface PendingRecurring {
  readonly expense: number
  readonly income: number
  readonly count: number
}

/**
 * Lo que los pagos fijos aún tienen que mover antes de acabar el mes.
 *
 * Se recorren **todas las veces que un fijo vence dentro del mes**, no sólo la
 * próxima: un semanal de $50.000 con cuatro viernes por delante son $200.000,
 * y contarlo una vez dejaría la proyección corta justo en los fijos que más se
 * repiten.
 *
 * **Lo que venció en meses anteriores y sigue sin confirmarse no entra.** Un
 * arriendo pendiente desde junio es un pendiente de junio; sumarlo aquí diría
 * que este mes van a salir tres arriendos, y eso no va a pasar.
 */
function sumPending(
  items: readonly FinanceRecurring[],
  monthStartKey: string,
  monthEndKey: string,
): PendingRecurring {
  let expense = 0
  let income = 0
  let count = 0

  for (const item of items) {
    // Un fijo en pausa se dejó a propósito: no va a salir y no cuenta.
    if (item.paused_at !== null) continue

    let dueKey = item.next_due_on

    for (let step = 0; step < MAX_STEPS && dueKey <= monthEndKey; step += 1) {
      if (dueKey >= monthStartKey) {
        if (item.kind === 'income') income += item.amount
        else expense += item.amount
        count += 1
      }

      dueKey = nextDueDate(dueKey, item.frequency, item.anchor_day)
    }
  }

  return { expense, income, count }
}

function roundEstimate(amount: number): number {
  return Math.round(amount / ESTIMATE_ROUNDING) * ESTIMATE_ROUNDING
}

/**
 * Cómo termina el mes de `today`.
 *
 * Junta lo que ya se sabe —el balance de lo apuntado más los fijos que faltan
 * por vencer— con lo que se puede suponer: que el gasto variable de lo que queda
 * se parecerá al de los días que llevas.
 *
 * **Sólo se proyecta el gasto variable, nunca el ingreso.** Los ingresos que no
 * son fijos son esporádicos —una venta, un regalo—, y repartirlos a tanto por
 * día inventaría plata que nadie ha dicho que vaya a llegar. Quedarse corto en
 * los ingresos deja la proyección del lado prudente; quedarse largo la haría
 * peligrosa.
 *
 * Devuelve `null` cuando no hay nada que añadir a lo que ya dicen los totales.
 */
export function projectMonthEnd(
  totals: FinanceTotals,
  recurring: readonly FinanceRecurring[],
  today: Date,
): MonthProjection | null {
  const year = today.getFullYear()
  const month = today.getMonth()
  // Día 0 del mes siguiente es el último del actual: así funciona en febrero y
  // en los bisiestos sin saber cuántos días tiene cada mes.
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  const pending = sumPending(recurring, `${monthPrefix}-01`, `${monthPrefix}-${daysInMonth}`)

  const daysElapsed = today.getDate()
  const daysLeft = daysInMonth - daysElapsed
  const variableExpense = totals.expense - totals.fixedExpense

  // Sin días suficientes no hay ritmo del que hablar, y el último día ya no
  // queda nada por delante que estimar.
  const estimatedVariable =
    daysElapsed >= MIN_DAYS_FOR_RATE && daysLeft > 0
      ? roundEstimate((variableExpense / daysElapsed) * daysLeft)
      : null

  // Nada por vencer y nada que estimar: la tarjeta repetiría el balance que
  // está justo encima, y una tarjeta que no añade nada estorba.
  if (pending.count === 0 && (estimatedVariable === null || estimatedVariable === 0)) return null

  const committedBalance = totals.balance + pending.income - pending.expense

  return {
    daysLeft,
    pendingExpense: pending.expense,
    pendingIncome: pending.income,
    pendingCount: pending.count,
    committedBalance,
    estimatedVariable,
    projectedBalance: estimatedVariable === null ? null : committedBalance - estimatedVariable,
  }
}
