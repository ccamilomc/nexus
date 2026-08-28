import type { DebtInstalments, FinanceDebt } from '../types/finance.types'
import type { DebtBalance } from './debt-balance'
import { monthsBetween } from './debt-balance'

/**
 * Sumar meses a una fecha, sin desbordar el mes corto.
 *
 * `new Date(2026, 0, 31 + 1 mes)` da el 3 de marzo, no el 28 de febrero. Con
 * cuotas eso corre el vencimiento de una deuda empezada un día 31 al mes
 * siguiente, así que el día se recorta al último que tenga el mes destino.
 */
function addMonths(dateKey: string, months: number): string {
  const [year = 0, month = 0, day = 1] = dateKey.split('-').map(Number)
  const lastDayOfTarget = new Date(year, month - 1 + months + 1, 0).getDate()
  const target = new Date(year, month - 1 + months, Math.min(day, lastDayOfTarget))

  const y = target.getFullYear()
  const m = String(target.getMonth() + 1).padStart(2, '0')
  const d = String(target.getDate()).padStart(2, '0')

  return `${y}-${m}-${d}`
}

/**
 * Cuánto es cada cuota, según cómo corran los intereses.
 *
 * Las tres formas tienen respuesta exacta, y son tres respuestas distintas:
 *
 * - Sin intereses, el monto repartido y ya.
 * - `monthly_on_principal`: el interés es el mismo todos los meses porque se
 *   calcula sobre el monto original, así que se suma entero a cada cuota.
 * - `monthly_on_balance`: la cuota fija de toda la vida —la del sistema
 *   francés—, que es como cobran bancos y tarjetas. Al principio casi todo es
 *   interés y al final casi todo es capital, pero se paga siempre lo mismo.
 *
 * Un millón al 2 % en doce cuotas sale a **103.333 al mes** de la segunda forma
 * y a **94.560** de la tercera. Repartir a ojo se equivocaría en 105.000 pesos
 * a lo largo de la deuda.
 */
function instalmentAmount(debt: FinanceDebt, total: number): number {
  const rate = (debt.interest_rate ?? 0) / 100

  if (debt.interest_kind === 'none' || rate === 0) return Math.round(debt.principal / total)

  if (debt.interest_kind === 'monthly_on_principal') {
    return Math.round(debt.principal / total + debt.principal * rate)
  }

  return Math.round((debt.principal * rate) / (1 - (1 + rate) ** -total))
}

/**
 * Qué significan las cuotas de una deuda, hoy.
 *
 * Hasta ahora se guardaban y se escribían —«12 cuotas»— sin calcular nada: ni
 * cuánto tocaba al mes, ni cuántas iban, ni si se iba con retraso. Un dato en
 * pantalla que no responde ninguna pregunta es peor que no tenerlo, porque
 * parece que la app lo está siguiendo.
 *
 * **La primera cuota vence al mes de empezar**, no el mismo día: quien pide
 * prestado el 15 de agosto paga la primera el 15 de septiembre.
 *
 * Devuelve `null` cuando la deuda no se pactó a plazos, que es la mayoría.
 */
export function calculateInstalments(
  debt: FinanceDebt,
  balance: DebtBalance,
  todayKey: string,
): DebtInstalments | null {
  const total = debt.instalments
  if (total === null || total <= 0) return null

  const amount = instalmentAmount(debt, total)
  if (amount <= 0) return null

  // Se cuenta por lo abonado, no por los meses que han pasado: lo que dice si
  // vas al día es el dinero puesto, y quien adelanta dos cuotas va adelantado.
  const paid = Math.min(total, Math.floor(balance.paid / amount))
  const due = Math.min(total, monthsBetween(debt.started_on, todayKey))

  // La próxima es la que viene **después** de todo lo cubierto y todo lo
  // vencido: si vas atrasado, las de en medio no son «la próxima», son deuda.
  const nextNumber = Math.max(paid, due) + 1

  return {
    amount,
    total,
    paid,
    due,
    overdueCount: Math.max(0, due - paid),
    overdueAmount: Math.max(0, due * amount - balance.paid),
    nextDueOn: nextNumber > total ? null : addMonths(debt.started_on, nextNumber),
    isComplete: paid >= total,
  }
}
