import type { DebtPayment, FinanceDebt } from '../types/finance.types'

/** Cómo va una deuda: lo que se debía, lo corrido, lo abonado y lo que falta. */
export interface DebtBalance {
  readonly principal: number
  /** Intereses corridos hasta hoy. Cero cuando la deuda no los tiene. */
  readonly interest: number
  readonly paid: number
  /** Lo que falta. Nunca baja de cero: pagar de más no crea una deuda al revés. */
  readonly remaining: number
}

/** Cuántos meses completos van de una fecha a otra. */
export function monthsBetween(fromKey: string, toKey: string): number {
  const [fromYear = 0, fromMonth = 0, fromDay = 0] = fromKey.split('-').map(Number)
  const [toYear = 0, toMonth = 0, toDay = 0] = toKey.split('-').map(Number)

  const months = (toYear - fromYear) * 12 + (toMonth - fromMonth)

  // El mes no se cuenta hasta que llega el día: al día 20 de un préstamo hecho
  // el 25 todavía no ha pasado un mes, y cobrarlo sería inventarse intereses.
  return Math.max(0, toDay < fromDay ? months - 1 : months)
}

/**
 * Cómo va una deuda a día de hoy.
 *
 * Las dos formas de correr intereses dan cifras **muy** distintas y por eso cada
 * deuda lleva la suya (ver el enum en la migración):
 *
 * - `monthly_on_principal`: un porcentaje fijo del monto original cada mes. Es
 *   lo de los préstamos informales —«el 2 % del millón»— y no baja aunque se
 *   abone: sobre un millón al 2 % son 20.000 el primer mes y el décimo.
 * - `monthly_on_balance`: el porcentaje corre sobre lo que queda por pagar, así
 *   que baja con cada abono. Es como funcionan bancos y tarjetas.
 *
 * En el mismo caso —un millón al 2 %, abonando cien mil al mes— la primera
 * suma unos 220.000 de intereses y la segunda unos 130.000. Elegir mal no es un
 * matiz: es decirle a alguien que debe casi el doble.
 *
 * **Esto calcula y devuelve; no escribe nada.** Nexus no se apunta movimientos
 * que el usuario no hizo.
 */
export function calculateDebtBalance(
  debt: FinanceDebt,
  payments: readonly DebtPayment[],
  todayKey: string,
): DebtBalance {
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const rate = (debt.interest_rate ?? 0) / 100

  if (debt.interest_kind === 'none' || rate === 0) {
    return {
      principal: debt.principal,
      interest: 0,
      paid,
      remaining: Math.max(0, debt.principal - paid),
    }
  }

  const elapsed = monthsBetween(debt.started_on, todayKey)

  if (debt.interest_kind === 'monthly_on_principal') {
    const interest = debt.principal * rate * elapsed

    return {
      principal: debt.principal,
      interest,
      paid,
      remaining: Math.max(0, debt.principal + interest - paid),
    }
  }

  // Sobre el saldo: hay que recorrer mes a mes, porque cuánto interés corre en
  // cada uno depende de lo que se había abonado antes. No hay fórmula cerrada
  // con abonos irregulares, que es justo lo que hace una persona real.
  let balance = debt.principal
  let interest = 0

  for (let month = 1; month <= elapsed && balance > 0; month += 1) {
    const monthInterest = balance * rate
    interest += monthInterest
    balance += monthInterest

    // Los abonos de ese mes se descuentan después de correr el interés, que es
    // el orden en que ocurre: primero se causa, luego se paga.
    for (const payment of payments) {
      if (monthsBetween(debt.started_on, payment.occurredOn) === month) balance -= payment.amount
    }
  }

  // Lo abonado antes del primer mes cumplido no entró en el bucle.
  for (const payment of payments) {
    if (monthsBetween(debt.started_on, payment.occurredOn) === 0) balance -= payment.amount
  }

  return { principal: debt.principal, interest, paid, remaining: Math.max(0, balance) }
}
