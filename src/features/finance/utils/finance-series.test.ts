import { describe, expect, it } from 'vitest'

import type { FinanceTransactionWithNames } from '../types/finance.types'
import { buildFinanceSeries } from './finance-series'

/** Del 5 al 7 de agosto de 2026; el tramo anterior son el 2, 3 y 4. */
const DAYS = [new Date(2026, 7, 5), new Date(2026, 7, 6), new Date(2026, 7, 7)]
const PREVIOUS_DAYS = [new Date(2026, 7, 2), new Date(2026, 7, 3), new Date(2026, 7, 4)]

interface MovementOptions {
  readonly kind?: 'income' | 'expense' | 'transfer'
  readonly amount: number
  readonly on: string
  readonly fromRecurring?: boolean
}

function movement({
  kind = 'expense',
  amount,
  on,
  fromRecurring = false,
}: MovementOptions): FinanceTransactionWithNames {
  return {
    id: `t-${on}-${amount}-${kind}`,
    user_id: 'u-1',
    account_id: 'acc-1',
    counterpart_account_id: kind === 'transfer' ? 'acc-2' : null,
    category_id: kind === 'transfer' ? null : 'cat-1',
    debt_id: null,
    recurring_id: fromRecurring ? 'rec-1' : null,
    kind,
    amount,
    occurred_on: on,
    note: null,
    created_at: `${on}T10:00:00Z`,
    updated_at: `${on}T10:00:00Z`,
    deleted_at: null,
    account: { name: 'Efectivo' },
    toAccount: kind === 'transfer' ? { name: 'Nequi' } : null,
    category: kind === 'transfer' ? null : { name: 'Mercado' },
  }
}

describe('buildFinanceSeries', () => {
  it('reparte el gasto por día', () => {
    const series = buildFinanceSeries(
      [
        movement({ amount: 30_000, on: '2026-08-05' }),
        movement({ amount: 20_000, on: '2026-08-05' }),
        movement({ amount: 45_000, on: '2026-08-07' }),
      ],
      DAYS,
      PREVIOUS_DAYS,
    )

    expect(series.expensePoints.map(({ value }) => value)).toEqual([50_000, 0, 45_000])
    expect(series.totalExpense).toBe(95_000)
  })

  it('un día sin movimientos vale cero, no hueco', () => {
    // Un gasto se apunta al hacerlo: un día en blanco significa que no salió
    // dinero. Es el criterio de entrenamiento, no el de nutrición.
    const series = buildFinanceSeries([movement({ amount: 10_000, on: '2026-08-06' })], DAYS, [])

    expect(series.expensePoints.map(({ value }) => value)).toEqual([0, 10_000, 0])
  })

  it('separa el tramo anterior del actual', () => {
    const series = buildFinanceSeries(
      [
        movement({ amount: 80_000, on: '2026-08-03' }),
        movement({ amount: 50_000, on: '2026-08-06' }),
      ],
      DAYS,
      PREVIOUS_DAYS,
    )

    expect(series.totalExpense).toBe(50_000)
    expect(series.previousTotalExpense).toBe(80_000)
  })

  it('los ingresos no se mezclan con el gasto ni en el gráfico ni en el total', () => {
    const series = buildFinanceSeries(
      [
        movement({ kind: 'income', amount: 3_000_000, on: '2026-08-05' }),
        movement({ amount: 40_000, on: '2026-08-05' }),
      ],
      DAYS,
      PREVIOUS_DAYS,
    )

    expect(series.expensePoints[0]?.value).toBe(40_000)
    expect(series.totalExpense).toBe(40_000)
    expect(series.totalIncome).toBe(3_000_000)
    expect(series.balance).toBe(2_960_000)
  })

  it('un traspaso no es actividad: ni barra, ni total, ni día con movimiento', () => {
    // Mover dinero de un cajón a otro no es gastar. Una barra por ello diría
    // que ese día salió dinero que nunca salió.
    const series = buildFinanceSeries(
      [movement({ kind: 'transfer', amount: 500_000, on: '2026-08-06' })],
      DAYS,
      PREVIOUS_DAYS,
    )

    expect(series.expensePoints.map(({ value }) => value)).toEqual([0, 0, 0])
    expect(series.totalExpense).toBe(0)
    expect(series.daysWithMovements).toBe(0)
  })

  it('cuenta los días con movimiento, que es lo que hace honesto al gráfico', () => {
    const series = buildFinanceSeries(
      [
        movement({ amount: 10_000, on: '2026-08-05' }),
        movement({ amount: 20_000, on: '2026-08-05' }),
        movement({ kind: 'income', amount: 90_000, on: '2026-08-07' }),
      ],
      DAYS,
      PREVIOUS_DAYS,
    )

    // Dos días: el 5 con dos gastos y el 7 con un ingreso.
    expect(series.daysWithMovements).toBe(2)
  })

  it('lo fijo se cuenta aparte sin salirse del gasto', () => {
    const series = buildFinanceSeries(
      [
        movement({ amount: 1_200_000, on: '2026-08-05', fromRecurring: true }),
        movement({ amount: 45_000, on: '2026-08-06' }),
      ],
      DAYS,
      PREVIOUS_DAYS,
    )

    expect(series.totalExpense).toBe(1_245_000)
    expect(series.fixedExpense).toBe(1_200_000)
  })

  it('sin movimientos devuelve ceros, no huecos', () => {
    const series = buildFinanceSeries([], DAYS, PREVIOUS_DAYS)

    expect(series.expensePoints.map(({ value }) => value)).toEqual([0, 0, 0])
    expect(series).toMatchObject({ totalExpense: 0, totalIncome: 0, daysWithMovements: 0 })
  })
})
