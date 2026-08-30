import { describe, expect, it } from 'vitest'

import type { FinanceTransactionWithNames } from '../types/finance.types'
import { categoryTypicals, typicalOf, unusualParts } from './category-typicals'

interface GastoOptions {
  readonly amount: number
  readonly categoryId?: string | null
  readonly kind?: 'income' | 'expense' | 'transfer'
  readonly splits?: readonly { categoryId: string | null; amount: number }[]
}

let contador = 0

function gasto({
  amount,
  categoryId = 'mercado',
  kind = 'expense',
  splits = [],
}: GastoOptions): FinanceTransactionWithNames {
  contador += 1

  return {
    id: `t-${contador}`,
    user_id: 'u-1',
    account_id: 'acc-1',
    counterpart_account_id: null,
    category_id: categoryId,
    debt_id: null,
    recurring_id: null,
    kind,
    amount,
    occurred_on: '2026-08-07',
    note: null,
    created_at: '2026-08-07T10:00:00Z',
    updated_at: '2026-08-07T10:00:00Z',
    deleted_at: null,
    account: { name: 'Efectivo' },
    toAccount: null,
    category: categoryId === null ? null : { name: categoryId },
    splits: splits.map((split) => ({
      category_id: split.categoryId,
      amount: split.amount,
      category: split.categoryId === null ? null : { name: split.categoryId },
    })),
  }
}

/** Ocho mercados alrededor de 155.300, como los de verdad. */
const OCHO_MERCADOS = [155_300, 155_300, 138_400, 172_200, 155_300, 149_000, 161_600, 155_300].map(
  (amount) => gasto({ amount }),
)

describe('categoryTypicals', () => {
  it('con ocho gastos ya dice lo normal', () => {
    const [mercado] = categoryTypicals(OCHO_MERCADOS)

    expect(mercado?.categoryId).toBe('mercado')
    expect(mercado?.typical).toBe(155_300)
    expect(mercado?.days).toBe(8)
  })

  it('con siete todavía no', () => {
    // Con cinco muestras el vaivén no es el de la categoría, es el del azar.
    expect(categoryTypicals(OCHO_MERCADOS.slice(1))).toEqual([])
  })

  it('lleva el vaivén, que es la mitad del dato', () => {
    // Los desvíos de esos ocho sobre 155.300 son 0 · 0 · 0 · 0 · 6.300 ·
    // 16.900 · 6.300 · 16.900, y su mediana es 3.150.
    const [mercado] = categoryTypicals(OCHO_MERCADOS)

    expect(mercado?.spread).toBe(3150)
  })

  it('lo que no tiene categoría se queda fuera', () => {
    // Ahí caen un arriendo y un café: una costumbre de esa mezcla no significa
    // nada.
    const sinCategoria = Array.from({ length: 8 }, () =>
      gasto({ amount: 50_000, categoryId: null }),
    )

    expect(categoryTypicals(sinCategoria)).toEqual([])
  })

  it('los ingresos no son gastos', () => {
    const sueldos = Array.from({ length: 8 }, () =>
      gasto({ amount: 3_500_000, categoryId: 'salario', kind: 'income' }),
    )

    expect(categoryTypicals(sueldos)).toEqual([])
  })

  it('un traspaso no se gasta en nada', () => {
    // Cambia de cajón. Contarlo inflaría la costumbre de su categoría.
    const traspasos = Array.from({ length: 8 }, () =>
      gasto({ amount: 200_000, categoryId: 'ahorro', kind: 'transfer' }),
    )

    expect(categoryTypicals(traspasos)).toEqual([])
  })

  it('un gasto repartido cuenta en cada una de sus partes', () => {
    // Igual que el reparto del mes: contarlo entero en una de las dos
    // ensuciaría las dos costumbres.
    const repartidos = Array.from({ length: 8 }, () =>
      gasto({ amount: 100_000, splits: [{ categoryId: 'hogar', amount: 40_000 }] }),
    )

    const porId = Object.fromEntries(categoryTypicals(repartidos).map((t) => [t.categoryId, t]))

    expect(porId['hogar']?.typical).toBe(40_000)
    // El resto se queda en la categoría del movimiento, no los 100.000 enteros.
    expect(porId['mercado']?.typical).toBe(60_000)
  })

  it('cada categoría por su lado', () => {
    const mezcla = [
      ...OCHO_MERCADOS,
      ...Array.from({ length: 8 }, () => gasto({ amount: 10_200, categoryId: 'transporte' })),
    ]

    const porId = Object.fromEntries(categoryTypicals(mezcla).map((t) => [t.categoryId, t]))

    expect(porId['mercado']?.typical).toBe(155_300)
    expect(porId['transporte']?.typical).toBe(10_200)
  })

  it('sin movimientos, ninguna costumbre', () => {
    expect(categoryTypicals([])).toEqual([])
  })
})

describe('typicalOf', () => {
  const TYPICALS = categoryTypicals(OCHO_MERCADOS)

  it('encuentra la de su categoría', () => {
    expect(typicalOf(TYPICALS, 'mercado')?.typical).toBe(155_300)
  })

  it('sin categoría no hay contra qué comparar', () => {
    expect(typicalOf(TYPICALS, null)).toBeNull()
  })

  it('de una categoría que no habla, nada', () => {
    expect(typicalOf(TYPICALS, 'transporte')).toBeNull()
  })
})

describe('unusualParts', () => {
  const TYPICALS = categoryTypicals(OCHO_MERCADOS)

  it('un mercado corriente no se marca', () => {
    // Lo normal son 155.300 con vaivén 3.150: tres vaivenes son 9.450.
    expect(unusualParts(gasto({ amount: 160_000 }), TYPICALS)).toEqual([])
  })

  it('uno que se sale del vaivén, sí', () => {
    const [parte] = unusualParts(gasto({ amount: 200_000 }), TYPICALS)

    expect(parte?.name).toBe('mercado')
    expect(parte?.reading.difference).toBe(44_700)
  })

  it('también por debajo, que es donde se pilla un cero de menos', () => {
    // 15.530 en vez de 155.300 es el error que más duele: entra callado y
    // deja el mes cuadrando mal para siempre.
    const [parte] = unusualParts(gasto({ amount: 15_530 }), TYPICALS)

    expect(parte?.reading.difference).toBe(-139_770)
  })

  it('con dos vaivenes hablaría de más, y por eso son tres', () => {
    // El vaivén es 3.150: dos son 6.300 y tres, 9.450. Un mercado de 163.300 se
    // aparta 8.000, que cae justo entre los dos. Con el umbral del peso esta
    // nota saldría; con el del dinero se calla, y por eso la lista no se llena.
    expect(unusualParts(gasto({ amount: 163_300 }), TYPICALS)).toEqual([])

    // Y uno que se aparta 9.500, que ya pasa los tres, sí sale.
    expect(unusualParts(gasto({ amount: 164_800 }), TYPICALS)).toHaveLength(1)
  })

  it('un ingreso no se compara con los gastos', () => {
    const sueldo = gasto({ amount: 3_500_000, categoryId: 'mercado', kind: 'income' })

    expect(unusualParts(sueldo, TYPICALS)).toEqual([])
  })

  it('un traspaso tampoco', () => {
    const traspaso = gasto({ amount: 3_500_000, categoryId: 'mercado', kind: 'transfer' })

    expect(unusualParts(traspaso, TYPICALS)).toEqual([])
  })

  it('de una categoría sin costumbre no dice nada', () => {
    const taxi = gasto({ amount: 500_000, categoryId: 'transporte' })

    expect(unusualParts(taxi, TYPICALS)).toEqual([])
  })

  it('en un gasto repartido mira cada parte por su lado', () => {
    // El resto se queda en mercado: 300.000 menos 40.000 son 260.000, que se
    // sale. Los 40.000 de hogar no se comparan con nada, porque de hogar no se
    // sabe todavia.
    const repartido = gasto({ amount: 300_000, splits: [{ categoryId: 'hogar', amount: 40_000 }] })

    const partes = unusualParts(repartido, TYPICALS)

    expect(partes).toHaveLength(1)
    expect(partes[0]?.name).toBe('mercado')
    expect(partes[0]?.reading.difference).toBe(104_700)
  })
})
