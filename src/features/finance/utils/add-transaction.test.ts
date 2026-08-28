import { describe, expect, it } from 'vitest'

import type { FinanceMonth, FinanceTransactionWithNames } from '../types/finance.types'
import { addTransactionToMonth } from './add-transaction'

function movimiento(
  overrides: Partial<FinanceTransactionWithNames> = {},
): FinanceTransactionWithNames {
  return {
    id: 't-nuevo',
    user_id: 'u1',
    account_id: 'a1',
    counterpart_account_id: null,
    category_id: 'c1',
    debt_id: null,
    kind: 'expense',
    amount: 20_000,
    occurred_on: '2026-08-15',
    note: null,
    recurring_id: null,
    deleted_at: null,
    created_at: '2026-08-15T10:00:00.000Z',
    updated_at: '2026-08-15T10:00:00.000Z',
    account: { name: 'Efectivo' },
    toAccount: null,
    category: { name: 'Mercado' },
    splits: [],
    ...overrides,
  }
}

function mes(overrides: Partial<FinanceMonth> = {}): FinanceMonth {
  return {
    totals: { income: 100_000, expense: 80_000, fixedExpense: 30_000, balance: 20_000 },
    byCategory: [{ categoryId: 'c1', name: 'Mercado', amount: 80_000, share: 100 }],
    transactions: [],
    ...overrides,
  }
}

describe('addTransactionToMonth', () => {
  it('pone el movimiento el primero de la lista', () => {
    const actual = addTransactionToMonth(mes(), movimiento())

    expect(actual.transactions[0]?.id).toBe('t-nuevo')
  })

  it('un gasto sube el gasto y baja el saldo', () => {
    const actual = addTransactionToMonth(mes(), movimiento())

    expect(actual.totals).toMatchObject({ expense: 100_000, income: 100_000, balance: 0 })
  })

  it('un ingreso sube el ingreso y el saldo', () => {
    const actual = addTransactionToMonth(mes(), movimiento({ kind: 'income', amount: 50_000 }))

    expect(actual.totals).toMatchObject({ income: 150_000, expense: 80_000, balance: 70_000 })
  })

  it('un traspaso no es gasto ni ingreso: el dinero sólo cambió de cajón', () => {
    const actual = addTransactionToMonth(mes(), movimiento({ kind: 'transfer' }))

    expect(actual.totals).toEqual(mes().totals)
    expect(actual.byCategory).toEqual(mes().byCategory)
    expect(actual.transactions[0]?.id).toBe('t-nuevo')
  })

  it('no toca el gasto fijo: lo que se apunta a mano no viene de un pago recurrente', () => {
    expect(addTransactionToMonth(mes(), movimiento()).totals.fixedExpense).toBe(30_000)
  })

  it('suma a su categoría si ya estaba', () => {
    const actual = addTransactionToMonth(mes(), movimiento())

    expect(actual.byCategory).toEqual([
      { categoryId: 'c1', name: 'Mercado', amount: 100_000, share: 100 },
    ])
  })

  it('abre la categoría si es la primera vez, y rehace las porciones', () => {
    // Todas, no sólo la nueva: el total cambió, así que las de antes ya no valen
    // y sumarían más de cien.
    const actual = addTransactionToMonth(
      mes(),
      movimiento({ category_id: 'c2', category: { name: 'Transporte' }, amount: 20_000 }),
    )

    expect(actual.byCategory).toEqual([
      { categoryId: 'c1', name: 'Mercado', amount: 80_000, share: 80 },
      { categoryId: 'c2', name: 'Transporte', amount: 20_000, share: 20 },
    ])
  })

  it('un gasto sin categoría se enseña como lo que es, no se esconde', () => {
    const actual = addTransactionToMonth(
      mes({ byCategory: [] }),
      movimiento({ category_id: null, category: null }),
    )

    expect(actual.byCategory[0]).toMatchObject({ categoryId: null, name: 'Sin categoría' })
  })

  it('el mes se queda con todos los movimientos, no con los ultimos', () => {
    // Antes la lista se cortaba en ocho y la pantalla ensenaba ocho de ciento
    // quince sin decirlo. Ahora vienen todos y quien recorta es el filtro.
    const lleno = mes({
      transactions: Array.from({ length: 40 }, (_, i) => movimiento({ id: `viejo-${i}` })),
    })

    const actual = addTransactionToMonth(lleno, movimiento({ id: 't-nuevo' }))

    expect(actual.transactions).toHaveLength(41)
    expect(actual.transactions[0]?.id).toBe('t-nuevo')
    expect(actual.transactions.at(-1)?.id).toBe('viejo-39')
  })
})
