import { describe, expect, it } from 'vitest'

import type { FinanceTransactionWithNames } from '../types/finance.types'
import {
  calculateAccountBalance,
  calculateByCategory,
  calculateTotals,
  UNCATEGORISED_LABEL,
} from './finance-totals'

interface MovementOptions {
  readonly kind?: 'income' | 'expense' | 'transfer'
  readonly amount: number
  readonly categoryId?: string | null
  readonly categoryName?: string | null
  readonly accountId?: string
  readonly toAccountId?: string | null
}

function movement({
  kind = 'expense',
  amount,
  categoryId = 'cat-1',
  categoryName = 'Mercado',
  accountId = 'acc-1',
  toAccountId = null,
}: MovementOptions): FinanceTransactionWithNames {
  return {
    id: `t-${amount}-${categoryId ?? 'sin'}-${kind}-${accountId}`,
    user_id: 'u-1',
    account_id: accountId,
    counterpart_account_id: toAccountId,
    category_id: categoryId,
    debt_id: null,
    kind,
    amount,
    occurred_on: '2026-08-07',
    note: null,
    created_at: '2026-08-07T10:00:00Z',
    updated_at: '2026-08-07T10:00:00Z',
    deleted_at: null,
    account: { name: 'Efectivo' },
    toAccount: toAccountId === null ? null : { name: 'Nequi' },
    category: categoryName === null ? null : { name: categoryName },
  }
}

/** Un traspaso: de una cuenta propia a otra. Ni gasto ni ingreso. */
function transfer(amount: number, from = 'acc-1', to = 'acc-2') {
  return movement({
    kind: 'transfer',
    amount,
    accountId: from,
    toAccountId: to,
    categoryId: null,
    categoryName: null,
  })
}

describe('calculateTotals', () => {
  it('separa lo que entra de lo que sale', () => {
    const totals = calculateTotals([
      movement({ kind: 'income', amount: 3_000_000 }),
      movement({ amount: 800 }),
      movement({ amount: 120_000 }),
    ])

    expect(totals).toEqual({ income: 3_000_000, expense: 120_800, balance: 2_879_200 })
  })

  it('el saldo negativo se devuelve tal cual', () => {
    // Recortarlo a cero para que no asuste sería mentir justo cuando más
    // importa acertar: gastar más de lo que entra es el dato.
    const totals = calculateTotals([
      movement({ kind: 'income', amount: 100_000 }),
      movement({ amount: 250_000 }),
    ])

    expect(totals.balance).toBe(-150_000)
  })

  it('sin movimientos, todo en cero', () => {
    expect(calculateTotals([])).toEqual({ income: 0, expense: 0, balance: 0 })
  })

  it('un traspaso no es gasto ni ingreso', () => {
    // Pasar dinero de efectivo a Nequi no cambia cuánto tienes ni cuánto
    // gastaste: el dinero sigue siendo tuyo, sólo cambió de cajón. Contarlo
    // inflaría los dos totales del mes.
    const totals = calculateTotals([movement({ amount: 30_000 }), transfer(500_000)])

    expect(totals).toEqual({ income: 0, expense: 30_000, balance: -30_000 })
  })
})

describe('calculateByCategory', () => {
  it('agrupa el gasto y lo ordena de más a menos', () => {
    const spend = calculateByCategory([
      movement({ amount: 20_000, categoryId: 'cat-1', categoryName: 'Mercado' }),
      movement({ amount: 60_000, categoryId: 'cat-2', categoryName: 'Arriendo' }),
      movement({ amount: 20_000, categoryId: 'cat-1', categoryName: 'Mercado' }),
    ])

    expect(spend.map(({ name, amount }) => [name, amount])).toEqual([
      ['Arriendo', 60_000],
      ['Mercado', 40_000],
    ])
  })

  it('los ingresos no entran en el reparto', () => {
    // Mezclar el salario con el mercado haría que «en qué se me va la plata»
    // respondiera cualquier cosa.
    const spend = calculateByCategory([
      movement({ kind: 'income', amount: 3_000_000, categoryName: 'Salario' }),
      movement({ amount: 50_000 }),
    ])

    expect(spend).toHaveLength(1)
    expect(spend[0]?.share).toBe(100)
  })

  it('lo que no tiene categoría se enseña, no se esconde', () => {
    // Un reparto que suma 80 % y calla el resto invita a confiar en una cifra
    // incompleta.
    const spend = calculateByCategory([
      movement({ amount: 75_000, categoryId: 'cat-1', categoryName: 'Mercado' }),
      movement({ amount: 25_000, categoryId: null, categoryName: null }),
    ])

    expect(spend.map(({ name, share }) => [name, share])).toEqual([
      ['Mercado', 75],
      [UNCATEGORISED_LABEL, 25],
    ])
  })

  it('sin gastos no divide por cero', () => {
    expect(calculateByCategory([movement({ kind: 'income', amount: 1000 })])).toEqual([])
  })
})

describe('calculateAccountBalance', () => {
  it('parte de lo que había y aplica sólo lo de esa cuenta', () => {
    const balance = calculateAccountBalance(
      500_000,
      [
        movement({ amount: 100_000, accountId: 'acc-1' }),
        movement({ amount: 900_000, accountId: 'otra' }),
        movement({ kind: 'income', amount: 50_000, accountId: 'acc-1' }),
      ],
      'acc-1',
    )

    expect(balance).toBe(450_000)
  })

  it('el traspaso sí mueve el saldo: sale de una cuenta y entra en la otra', () => {
    // No cuenta en los totales del mes, pero el dinero cambió de sitio de
    // verdad. Ignorarlo aquí dejaría los dos saldos mal.
    const movements = [transfer(200_000, 'acc-1', 'acc-2')]

    expect(calculateAccountBalance(500_000, movements, 'acc-1')).toBe(300_000)
    expect(calculateAccountBalance(0, movements, 'acc-2')).toBe(200_000)
  })
})
