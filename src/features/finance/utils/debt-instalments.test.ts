import { describe, expect, it } from 'vitest'

import type { FinanceDebt } from '../types/finance.types'
import type { DebtBalance } from './debt-balance'
import { calculateInstalments } from './debt-instalments'

function deuda(overrides: Partial<FinanceDebt> = {}): FinanceDebt {
  return {
    id: 'd1',
    user_id: 'u1',
    counterpart: 'Mi hermano',
    direction: 'i_owe',
    principal: 1_200_000,
    interest_kind: 'none',
    interest_rate: null,
    started_on: '2026-01-15',
    due_on: null,
    instalments: 12,
    note: null,
    settled_at: null,
    created_at: '2026-01-15T12:00:00.000Z',
    updated_at: '2026-01-15T12:00:00.000Z',
    deleted_at: null,
    ...overrides,
  }
}

const saldo = (paid: number): DebtBalance => ({
  principal: 1_200_000,
  interest: 0,
  paid,
  remaining: Math.max(0, 1_200_000 - paid),
})

describe('calculateInstalments', () => {
  it('sin plazos pactados no dice nada', () => {
    // Es la mayoría de las deudas: «te presté cien mil» y ya.
    expect(calculateInstalments(deuda({ instalments: null }), saldo(0), '2026-06-15')).toBeNull()
  })

  it('sin intereses reparte el monto', () => {
    const cuotas = calculateInstalments(deuda(), saldo(0), '2026-01-15')

    expect(cuotas?.amount).toBe(100_000)
    expect(cuotas?.total).toBe(12)
  })

  it('sobre el monto original suma el mismo interés todos los meses', () => {
    // 1.000.000 / 12 + el 2 % del millón.
    const cuotas = calculateInstalments(
      deuda({ principal: 1_000_000, interest_kind: 'monthly_on_principal', interest_rate: 2 }),
      saldo(0),
      '2026-01-15',
    )

    expect(cuotas?.amount).toBe(103_333)
  })

  it('sobre el saldo usa la cuota fija de siempre', () => {
    // La del sistema francés: al principio casi todo es interés, pero se paga
    // lo mismo cada mes.
    const cuotas = calculateInstalments(
      deuda({ principal: 1_000_000, interest_kind: 'monthly_on_balance', interest_rate: 2 }),
      saldo(0),
      '2026-01-15',
    )

    expect(cuotas?.amount).toBe(94_560)
  })

  it('las dos formas de interés no dan la misma cuota', () => {
    // Repartir a ojo se equivocaría en más de cien mil pesos en toda la deuda.
    const base = { principal: 1_000_000, interest_rate: 2 } as const
    const sobreMonto = calculateInstalments(
      deuda({ ...base, interest_kind: 'monthly_on_principal' }),
      saldo(0),
      '2026-01-15',
    )
    const sobreSaldo = calculateInstalments(
      deuda({ ...base, interest_kind: 'monthly_on_balance' }),
      saldo(0),
      '2026-01-15',
    )

    expect(sobreMonto?.amount).toBeGreaterThan(sobreSaldo?.amount ?? 0)
  })

  it('la primera cuota vence al mes, no el mismo día', () => {
    // Quien pide prestado el 15 de enero no debe nada el 15 de enero.
    const cuotas = calculateInstalments(deuda(), saldo(0), '2026-01-15')

    expect(cuotas?.due).toBe(0)
    expect(cuotas?.overdueAmount).toBe(0)
    expect(cuotas?.nextDueOn).toBe('2026-02-15')
  })

  it('cuenta lo pagado por el dinero puesto, no por los meses', () => {
    const cuotas = calculateInstalments(deuda(), saldo(300_000), '2026-04-15')

    expect(cuotas?.paid).toBe(3)
    expect(cuotas?.due).toBe(3)
    expect(cuotas?.overdueCount).toBe(0)
    expect(cuotas?.nextDueOn).toBe('2026-05-15')
  })

  it('dice cuánto falta para ponerse al día', () => {
    // Van tres meses y sólo hay una cuota puesta.
    const cuotas = calculateInstalments(deuda(), saldo(100_000), '2026-04-15')

    expect(cuotas?.overdueCount).toBe(2)
    expect(cuotas?.overdueAmount).toBe(200_000)
    // La próxima no es la 2, que ya venció: es la 4. Las de en medio son deuda.
    expect(cuotas?.nextDueOn).toBe('2026-05-15')
  })

  it('el retraso se mide en dinero, no en cuotas redondas', () => {
    // Media cuota puesta sigue siendo casi una cuota de retraso.
    const cuotas = calculateInstalments(deuda(), saldo(50_000), '2026-02-15')

    expect(cuotas?.overdueAmount).toBe(50_000)
  })

  it('quien adelanta no aparece con retraso, y su próxima es más lejos', () => {
    const cuotas = calculateInstalments(deuda(), saldo(500_000), '2026-02-15')

    expect(cuotas?.paid).toBe(5)
    expect(cuotas?.overdueCount).toBe(0)
    expect(cuotas?.nextDueOn).toBe('2026-07-15')
  })

  it('con todo cubierto ya no hay próxima', () => {
    const cuotas = calculateInstalments(deuda(), saldo(1_200_000), '2027-01-15')

    expect(cuotas?.isComplete).toBe(true)
    expect(cuotas?.paid).toBe(12)
    expect(cuotas?.nextDueOn).toBeNull()
  })

  it('no cuenta más cuotas de las pactadas aunque se pague de más', () => {
    const cuotas = calculateInstalments(deuda(), saldo(5_000_000), '2027-06-15')

    expect(cuotas?.paid).toBe(12)
    expect(cuotas?.overdueCount).toBe(0)
  })

  it('una deuda empezada un día 31 no se salta el mes corto', () => {
    // Sumar un mes al 31 de enero da el 3 de marzo si se hace a lo bruto.
    const cuotas = calculateInstalments(deuda({ started_on: '2026-01-31' }), saldo(0), '2026-02-01')

    expect(cuotas?.nextDueOn).toBe('2026-02-28')
  })

  it('cruza el año sin perderse', () => {
    const cuotas = calculateInstalments(
      deuda({ started_on: '2026-11-15' }),
      saldo(100_000),
      '2026-12-20',
    )

    expect(cuotas?.nextDueOn).toBe('2027-01-15')
  })
})
