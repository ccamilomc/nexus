import { describe, expect, it } from 'vitest'

import type { FinanceTransactionWithNames } from '../types/finance.types'
import {
  categoryTypicals,
  typicalOf,
  unusualParts,
  windowTypicalOf,
  windowTypicals,
} from './category-typicals'

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

describe('windowTypicals', () => {
  const HOY = new Date(2026, 7, 29)

  /** Un gasto en un día concreto, contando hacia atrás desde hoy. */
  const haceDias = (dias: number, amount: number) => {
    const d = new Date(HOY)
    d.setDate(d.getDate() - dias)
    return { ...gasto({ amount }), occurred_on: d.toISOString().slice(0, 10) }
  }

  /** Medio año de 10.000 al día: 70.000 a la semana y 300.000 al mes. */
  const MEDIO_ANO = Array.from({ length: 179 }, (_, i) => haceDias(i + 1, 10_000))

  it('con cinco tramos enteros ya dice lo normal', () => {
    const cinco = Array.from({ length: 36 }, (_, i) => haceDias(i + 1, 10_000))

    const [semana] = windowTypicals(cinco, HOY, [7])

    expect(semana?.days).toBe(7)
    expect(semana?.typical.typical).toBe(70_000)
  })

  it('con cuatro tramos de historia todavía no', () => {
    // Cuatro semanas no son una costumbre. Y no se rellena con ceros: los
    // tramos anteriores al primer gasto no son semanas sin gastar, son semanas
    // sin usar la aplicación. Esto lo encontró una prueba: rellenando, la
    // mediana de 25 semanas con 21 vacías es cero, y con «lo normal» en cero
    // cualquier semana sale rara.
    const cuatro = Array.from({ length: 28 }, (_, i) => haceDias(i + 1, 10_000))

    expect(windowTypicals(cuatro, HOY, [7])).toEqual([])
  })

  it('el tramo de hoy no entra, que está a medias', () => {
    // Un gasto enorme hoy no puede mover «lo normal»: hoy no ha terminado.
    const conHoy = [...MEDIO_ANO, haceDias(0, 5_000_000)]

    expect(windowTypicalOf(windowTypicals(conHoy, HOY, [7]), 7)?.typical).toBe(70_000)
  })

  it('los ingresos no cuentan, y sin gastos no hay historia', () => {
    const ingresos = MEDIO_ANO.map((g) => ({ ...g, kind: 'income' as const }))

    expect(windowTypicals(ingresos, HOY, [7])).toEqual([])
  })

  it('cada tamaño por su lado', () => {
    const tramos = windowTypicals(MEDIO_ANO, HOY, [7, 30])

    expect(windowTypicalOf(tramos, 7)?.typical).toBe(70_000)
    expect(windowTypicalOf(tramos, 30)?.typical).toBe(300_000)
  })

  it('de un tamaño que no cabe cinco veces no se sabe', () => {
    // En 180 días caben dos tramos de 90. Con dos no hay costumbre, y por eso
    // el panel a 90 días sigue comparando contra el tramo anterior.
    expect(windowTypicalOf(windowTypicals(MEDIO_ANO, HOY, [90]), 90)).toBeNull()
  })

  it('lleva el vaivén, que es lo que separa la semana rara de la normal', () => {
    // Cinco semanas de 70.000 y una de 140.000: la mediana es 70.000 y los
    // desvíos son 0 · 0 · 0 · 0 · 0 · 70.000, cuya mediana es cero.
    const irregular = [...MEDIO_ANO, haceDias(3, 70_000)]

    expect(windowTypicalOf(windowTypicals(irregular, HOY, [7]), 7)?.spread).toBe(0)
  })

  it('con la historia justa, contar desde hoy haría hablar de más', () => {
    // 34 días de historia. Contando los tramos desde ayer caben cuatro enteros
    // y no cinco, así que se calla. Contando desde hoy saldrían cinco y hablaría
    // con historia que no tiene.
    //
    // Esta prueba existe porque la de arriba no bastaba: la mediana es tan
    // robusta que meter el tramo de hoy, con cinco millones dentro, no la movía
    // ni un peso. Lo que cambia no es el valor, es si hay respuesta.
    const treintaYCuatro = Array.from({ length: 34 }, (_, i) => haceDias(i + 1, 10_000))

    expect(windowTypicals(treintaYCuatro, HOY, [7])).toEqual([])
  })

  it('sin movimientos no se inventa', () => {
    expect(windowTypicals([], HOY, [7])).toEqual([])
  })
})
