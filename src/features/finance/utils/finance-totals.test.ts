import { describe, expect, it } from 'vitest'

import type { FinanceTransactionWithNames } from '../types/finance.types'
import {
  calculateAccountBalance,
  calculateByCategory,
  calculateTotals,
  transactionParts,
  UNCATEGORISED_LABEL,
} from './finance-totals'

interface MovementOptions {
  readonly kind?: 'income' | 'expense' | 'transfer'
  readonly amount: number
  readonly categoryId?: string | null
  readonly categoryName?: string | null
  readonly accountId?: string
  readonly toAccountId?: string | null
  /** Salió de un pago fijo confirmado. */
  readonly fromRecurring?: boolean
}

function movement({
  kind = 'expense',
  amount,
  categoryId = 'cat-1',
  categoryName = 'Mercado',
  accountId = 'acc-1',
  toAccountId = null,
  fromRecurring = false,
}: MovementOptions): FinanceTransactionWithNames {
  return {
    id: `t-${amount}-${categoryId ?? 'sin'}-${kind}-${accountId}`,
    user_id: 'u-1',
    account_id: accountId,
    counterpart_account_id: toAccountId,
    category_id: categoryId,
    debt_id: null,
    recurring_id: fromRecurring ? 'rec-1' : null,
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
    splits: [],
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

    expect(totals).toEqual({
      income: 3_000_000,
      expense: 120_800,
      fixedExpense: 0,
      balance: 2_879_200,
    })
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
    expect(calculateTotals([])).toEqual({ income: 0, expense: 0, fixedExpense: 0, balance: 0 })
  })

  it('separa lo fijo de lo que se decidió sobre la marcha', () => {
    // Lo fijo es **parte** del gasto, no algo aparte: un mes de dos millones no
    // se parece en nada si uno ochocientos son arriendo y servicios.
    const totals = calculateTotals([
      movement({ amount: 1_800_000, fromRecurring: true }),
      movement({ amount: 200_000 }),
    ])

    expect(totals.expense).toBe(2_000_000)
    expect(totals.fixedExpense).toBe(1_800_000)
  })

  it('un ingreso fijo no cuenta como gasto fijo', () => {
    // El salario es el pago fijo más fijo de todos, y no es un gasto.
    const totals = calculateTotals([
      movement({ kind: 'income', amount: 3_000_000, fromRecurring: true }),
    ])

    expect(totals.fixedExpense).toBe(0)
    expect(totals.income).toBe(3_000_000)
  })

  it('un traspaso no es gasto ni ingreso', () => {
    // Pasar dinero de efectivo a Nequi no cambia cuánto tienes ni cuánto
    // gastaste: el dinero sigue siendo tuyo, sólo cambió de cajón. Contarlo
    // inflaría los dos totales del mes.
    const totals = calculateTotals([movement({ amount: 30_000 }), transfer(500_000)])

    expect(totals).toEqual({ income: 0, expense: 30_000, fixedExpense: 0, balance: -30_000 })
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

/** Una compra repartida: el total se queda igual y las partes lo recortan. */
function repartido(
  amount: number,
  splits: readonly { categoryId: string | null; name: string | null; amount: number }[],
): FinanceTransactionWithNames {
  return {
    ...movement({ amount }),
    splits: splits.map((split) => ({
      category_id: split.categoryId,
      amount: split.amount,
      category: split.name === null ? null : { name: split.name },
    })),
  }
}

describe('transactionParts', () => {
  it('sin repartir, el movimiento entero va a su categoría', () => {
    expect(transactionParts(movement({ amount: 164_800 }))).toEqual([
      { categoryId: 'cat-1', name: 'Mercado', amount: 164_800 },
    ])
  })

  it('lo repartido se recorta del total y el resto se queda en su categoría', () => {
    // 164.800 de compra con 40.000 de hogar dentro: mercado son 124.800, y esa
    // cifra no la teclea nadie.
    const partes = transactionParts(
      repartido(164_800, [{ categoryId: 'cat-2', name: 'Hogar', amount: 40_000 }]),
    )

    expect(partes).toEqual([
      { categoryId: 'cat-1', name: 'Mercado', amount: 124_800 },
      { categoryId: 'cat-2', name: 'Hogar', amount: 40_000 },
    ])
  })

  it('las partes siempre suman el total', () => {
    // Es la propiedad que hace que el saldo no pueda descuadrar.
    const partes = transactionParts(
      repartido(200_000, [
        { categoryId: 'cat-2', name: 'Hogar', amount: 40_000 },
        { categoryId: 'cat-3', name: 'Aseo', amount: 25_000 },
      ]),
    )

    expect(partes.reduce((sum, parte) => sum + parte.amount, 0)).toBe(200_000)
  })

  it('repartido del todo, la categoría original no aparece con cero', () => {
    // Una categoría en la que se gastó cero no es una categoría en la que se
    // gastó, y saldría en el reparto como una porción vacía.
    const partes = transactionParts(
      repartido(100_000, [{ categoryId: 'cat-2', name: 'Hogar', amount: 100_000 }]),
    )

    expect(partes).toEqual([{ categoryId: 'cat-2', name: 'Hogar', amount: 100_000 }])
  })

  it('una parte que perdió su categoría se dice, no se calla', () => {
    const partes = transactionParts(
      repartido(100_000, [{ categoryId: null, name: null, amount: 30_000 }]),
    )

    expect(partes[1]).toEqual({ categoryId: null, name: 'Sin categoría', amount: 30_000 })
  })
})

describe('calculateByCategory con movimientos repartidos', () => {
  it('cada parte cuenta en su categoría', () => {
    const spend = calculateByCategory([
      repartido(164_800, [{ categoryId: 'cat-2', name: 'Hogar', amount: 40_000 }]),
    ])

    expect(spend).toEqual([
      { categoryId: 'cat-1', name: 'Mercado', amount: 124_800, share: expect.closeTo(75.7, 1) },
      { categoryId: 'cat-2', name: 'Hogar', amount: 40_000, share: expect.closeTo(24.3, 1) },
    ])
  })

  it('el reparto sigue sumando el 100 %', () => {
    // Un reparto que suma 80 % y calla el resto invita a confiar en una cifra
    // incompleta.
    const spend = calculateByCategory([
      repartido(200_000, [{ categoryId: 'cat-2', name: 'Hogar', amount: 50_000 }]),
      movement({ amount: 100_000, categoryId: 'cat-3', categoryName: 'Ocio' }),
    ])

    expect(spend.reduce((sum, entry) => sum + entry.share, 0)).toBeCloseTo(100, 5)
    expect(spend.reduce((sum, entry) => sum + entry.amount, 0)).toBe(300_000)
  })

  it('una parte se suma a lo que ya había en esa categoría', () => {
    const spend = calculateByCategory([
      repartido(100_000, [{ categoryId: 'cat-2', name: 'Hogar', amount: 30_000 }]),
      movement({ amount: 20_000, categoryId: 'cat-2', categoryName: 'Hogar' }),
    ])

    expect(spend.find((entry) => entry.categoryId === 'cat-2')?.amount).toBe(50_000)
  })
})

describe('un movimiento guardado antes de que existieran las partes', () => {
  /** Como llega de la caché del teléfono: sin `splits` en ninguna parte. */
  function deLaCacheVieja(): FinanceTransactionWithNames {
    const { splits: _splits, ...resto } = movement({ amount: 50_000 })
    return resto as FinanceTransactionWithNames
  }

  it('no deja la pantalla en blanco', () => {
    // Paso de verdad: al desplegar el reparto, la caché del móvil seguía
    // trayendo movimientos sin partes y la lista reventaba entera.
    expect(transactionParts(deLaCacheVieja())).toEqual([
      { categoryId: 'cat-1', name: 'Mercado', amount: 50_000 },
    ])
  })

  it('y el reparto por categorías sigue saliendo', () => {
    expect(calculateByCategory([deLaCacheVieja()])).toHaveLength(1)
  })
})
