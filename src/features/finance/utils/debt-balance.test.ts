import { describe, expect, it } from 'vitest'

import type { DebtPayment, FinanceDebt, FinanceInterestKind } from '../types/finance.types'
import { calculateDebtBalance } from './debt-balance'

interface DebtOptions {
  readonly principal?: number
  readonly interestKind?: FinanceInterestKind
  readonly rate?: number | null
  readonly startedOn?: string
}

function debt({
  principal = 1_000_000,
  interestKind = 'none',
  rate = null,
  startedOn = '2026-01-15',
}: DebtOptions = {}): FinanceDebt {
  return {
    id: 'd-1',
    user_id: 'u-1',
    counterpart: 'Mi hermano',
    direction: 'i_owe',
    principal,
    interest_kind: interestKind,
    interest_rate: rate,
    started_on: startedOn,
    due_on: null,
    instalments: null,
    note: null,
    settled_at: null,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    deleted_at: null,
  }
}

/** Un abono mensual, empezando el mes siguiente al préstamo. */
function monthlyPayments(amount: number, count: number, day = 15): DebtPayment[] {
  return Array.from({ length: count }, (_, index) => ({
    amount,
    occurredOn: `2026-${String(index + 2).padStart(2, '0')}-${day}`,
  }))
}

describe('calculateDebtBalance · sin intereses', () => {
  it('lo que falta es lo que se debía menos lo abonado', () => {
    const balance = calculateDebtBalance(
      debt(),
      [{ amount: 300_000, occurredOn: '2026-02-15' }],
      '2026-03-15',
    )

    expect(balance).toEqual({
      principal: 1_000_000,
      interest: 0,
      paid: 300_000,
      remaining: 700_000,
    })
  })

  it('pagar de más no crea una deuda al revés', () => {
    // Redondear en contra o dejar el saldo en negativo diría que la otra
    // persona ahora te debe a ti, y eso no es lo que pasó.
    const balance = calculateDebtBalance(
      debt({ principal: 100_000 }),
      [{ amount: 150_000, occurredOn: '2026-02-15' }],
      '2026-03-15',
    )

    expect(balance.remaining).toBe(0)
  })
})

describe('calculateDebtBalance · sobre el capital', () => {
  const informal = debt({ interestKind: 'monthly_on_principal', rate: 2 })

  it('el interés es el mismo todos los meses, se abone o no', () => {
    // Es lo que significa «el 2 % del millón»: 20.000 el primer mes y el
    // décimo, aunque ya se haya pagado media deuda.
    const unMes = calculateDebtBalance(informal, [], '2026-02-15')
    const diezMeses = calculateDebtBalance(informal, monthlyPayments(100_000, 9), '2026-11-15')

    expect(unMes.interest).toBe(20_000)
    expect(diezMeses.interest).toBe(200_000)
  })

  it('el caso completo: un millón al 2 %, abonando cien mil al mes', () => {
    // Once meses corridos y once abonos: 220.000 de intereses.
    const balance = calculateDebtBalance(informal, monthlyPayments(100_000, 11), '2026-12-15')

    expect(balance.interest).toBe(220_000)
    expect(balance.paid).toBe(1_100_000)
    expect(balance.remaining).toBe(120_000)
  })
})

describe('calculateDebtBalance · sobre el saldo', () => {
  const bancario = debt({ interestKind: 'monthly_on_balance', rate: 2 })

  it('el interés baja a medida que se abona', () => {
    const unMes = calculateDebtBalance(bancario, [], '2026-02-15')
    const conAbonos = calculateDebtBalance(bancario, monthlyPayments(100_000, 5), '2026-06-15')

    expect(unMes.interest).toBe(20_000)
    // Cinco meses al 2 % sobre un millón fijo serían 100.000; abonando, sale
    // bastante menos porque el saldo va bajando.
    expect(conAbonos.interest).toBeLessThan(100_000)
    expect(conAbonos.interest).toBeGreaterThan(80_000)
  })

  it('sale casi la mitad que el mismo 2 % sobre el capital', () => {
    // **Ésta es la razón de que cada deuda lleve su forma.** Mismo préstamo,
    // misma tasa, mismos abonos, y la diferencia es de casi cien mil pesos.
    // Elegir la forma equivocada no es un matiz: es decirle a alguien que debe
    // casi el doble de lo que debe.
    const pagos = monthlyPayments(100_000, 11)
    const sobreSaldo = calculateDebtBalance(bancario, pagos, '2026-12-15')
    const sobreCapital = calculateDebtBalance(
      debt({ interestKind: 'monthly_on_principal', rate: 2 }),
      pagos,
      '2026-12-15',
    )

    expect(Math.round(sobreSaldo.interest)).toBe(126_503)
    expect(sobreCapital.interest).toBe(220_000)
  })

  it('deja de correr cuando la deuda queda saldada', () => {
    // Sin esto, una deuda pagada entera seguiría generando intereses para
    // siempre y el saldo crecería solo.
    const balance = calculateDebtBalance(
      bancario,
      [{ amount: 1_500_000, occurredOn: '2026-02-15' }],
      '2027-12-15',
    )

    expect(balance.remaining).toBe(0)
  })
})

describe('calculateDebtBalance · el paso del tiempo', () => {
  it('el mes no cuenta hasta que llega el día', () => {
    // Prestado el 25; al día 20 del mes siguiente todavía no ha pasado un mes,
    // y cobrar intereses ahí sería inventárselos.
    const prestamo = debt({
      interestKind: 'monthly_on_principal',
      rate: 2,
      startedOn: '2026-01-25',
    })

    expect(calculateDebtBalance(prestamo, [], '2026-02-20').interest).toBe(0)
    expect(calculateDebtBalance(prestamo, [], '2026-02-25').interest).toBe(20_000)
  })
})
