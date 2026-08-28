import { describe, expect, it } from 'vitest'

import type { FinanceTransactionWithNames } from '../types/finance.types'
import { toTransactionsCsv, transactionsCsvFileName } from './transactions-csv'

function movimiento(
  overrides: Partial<FinanceTransactionWithNames> = {},
): FinanceTransactionWithNames {
  return {
    id: crypto.randomUUID(),
    user_id: 'u1',
    account_id: 'a1',
    counterpart_account_id: null,
    category_id: 'c1',
    debt_id: null,
    recurring_id: null,
    kind: 'expense',
    amount: 45_000,
    occurred_on: '2026-08-10',
    note: 'Almuerzo',
    created_at: '2026-08-10T12:00:00.000Z',
    updated_at: '2026-08-10T12:00:00.000Z',
    deleted_at: null,
    account: { name: 'Nequi' },
    toAccount: null,
    category: { name: 'Restaurantes' },
    splits: [],
    ...overrides,
  }
}

/** Las líneas sin la marca de UTF-8 ni la línea en blanco del final. */
function lineas(csv: string): string[] {
  return csv.replace('\uFEFF', '').trimEnd().split('\r\n')
}

describe('toTransactionsCsv', () => {
  it('empieza por la marca de UTF-8', () => {
    // Sin ella Excel abre el archivo con la codificación del sistema y
    // «Categoría» sale «CategorÃ­a».
    expect(toTransactionsCsv([])).toMatch(/^\uFEFF/)
  })

  it('separa con punto y coma, no con coma', () => {
    // Con coma, Excel en español mete todas las columnas en una sola.
    const [cabecera] = lineas(toTransactionsCsv([]))

    expect(cabecera).toBe('Fecha;Tipo;Monto;Categoría;Cuenta;Cuenta destino;Nota;Fijo')
  })

  it('sin movimientos deja el archivo con la cabecera sola', () => {
    // Un archivo vacío del todo parece una descarga fallida.
    expect(lineas(toTransactionsCsv([]))).toHaveLength(1)
  })

  it('una fila por movimiento, en el orden en que llegan', () => {
    const csv = toTransactionsCsv([
      movimiento({ note: 'primero' }),
      movimiento({ note: 'segundo' }),
    ])

    const filas = lineas(csv).slice(1)

    expect(filas).toHaveLength(2)
    expect(filas[0]).toContain('primero')
    expect(filas[1]).toContain('segundo')
  })

  it('el monto va sin puntos de millar y en positivo', () => {
    // En pantalla pone «−$ 45.000»; aquí tiene que poder sumarse.
    const [, fila] = lineas(toTransactionsCsv([movimiento({ amount: 45_000 })]))

    expect(fila).toContain(';45000;')
    expect(fila).not.toContain('45.000')
    expect(fila).not.toContain('-45000')
  })

  it('la fecha va en ISO', () => {
    // «10/08/2026» sería el 8 de octubre para media hoja de cálculo.
    const [, fila] = lineas(toTransactionsCsv([movimiento({ occurred_on: '2026-08-10' })]))

    expect(fila).toMatch(/^2026-08-10;/)
  })

  it('entrecomilla la nota que lleva punto y coma', () => {
    const [, fila] = lineas(toTransactionsCsv([movimiento({ note: 'Pan; leche' })]))

    expect(fila).toContain('"Pan; leche"')
  })

  it('duplica las comillas de dentro', () => {
    const [, fila] = lineas(toTransactionsCsv([movimiento({ note: 'El "bueno"' })]))

    expect(fila).toContain('"El ""bueno"""')
  })

  it('entrecomilla la nota con salto de línea', () => {
    const csv = toTransactionsCsv([movimiento({ note: 'Uno\nDos' })])

    expect(csv).toContain('"Uno\nDos"')
  })

  it('no deja que una nota se ejecute como fórmula', () => {
    // Al abrirlo, Excel ejecutaría lo que empiece por «=».
    const [, fila] = lineas(toTransactionsCsv([movimiento({ note: '=1+1' })]))

    expect(fila).toContain("'=1+1")
  })

  it('el monto no lleva la comilla de las fórmulas', () => {
    // Lo genera la app y empieza por dígito: si se le colara, Excel lo leería
    // como texto y no se podría sumar.
    const [, fila] = lineas(toTransactionsCsv([movimiento({ amount: 45_000 })]))

    expect(fila).not.toContain("'45000")
  })

  it('dice el tipo en cristiano', () => {
    const csv = toTransactionsCsv([
      movimiento({ kind: 'expense' }),
      movimiento({ kind: 'income' }),
      movimiento({ kind: 'transfer' }),
    ])

    const tipos = lineas(csv)
      .slice(1)
      .map((fila) => fila.split(';')[1])

    expect(tipos).toEqual(['Gasto', 'Ingreso', 'Traspaso'])
  })

  it('el traspaso va sin categoría y con la cuenta destino', () => {
    // Un traspaso no se gasta en nada: cambia de cajón.
    const [, fila] = lineas(
      toTransactionsCsv([
        movimiento({
          kind: 'transfer',
          category: { name: 'Restaurantes' },
          toAccount: { name: 'Ahorros' },
        }),
      ]),
    )

    const columnas = fila?.split(';') ?? []

    expect(columnas[3]).toBe('')
    expect(columnas[5]).toBe('Ahorros')
  })

  it('lo que no tiene categoría se dice, no se deja en blanco', () => {
    const [, fila] = lineas(toTransactionsCsv([movimiento({ category_id: null, category: null })]))

    expect(fila?.split(';')[3]).toBe('Sin categoría')
  })

  it('marca lo que salió de un pago fijo', () => {
    const csv = toTransactionsCsv([
      movimiento({ recurring_id: 'r1' }),
      movimiento({ recurring_id: null }),
    ])

    const fijos = lineas(csv)
      .slice(1)
      .map((fila) => fila.split(';').at(-1))

    expect(fijos).toEqual(['Sí', 'No'])
  })
})

describe('transactionsCsvFileName', () => {
  it('lleva el mes delante para que se ordene solo', () => {
    expect(transactionsCsvFileName(new Date(2026, 7, 15))).toBe('nexus-movimientos-2026-08.csv')
  })

  it('rellena el mes de una cifra', () => {
    expect(transactionsCsvFileName(new Date(2026, 0, 3))).toBe('nexus-movimientos-2026-01.csv')
  })
})

describe('toTransactionsCsv con un gasto repartido', () => {
  const repartido = movimiento({
    amount: 164_800,
    category: { name: 'Mercado' },
    splits: [{ category_id: 'c2', amount: 40_000, category: { name: 'Hogar' } }],
  })

  it('saca una fila por categoría, no una por movimiento', () => {
    // En una sola fila, cualquier tabla dinámica contaría los 164.800 enteros
    // como mercado: justo el error que repartirlo venía a evitar.
    const filas = lineas(toTransactionsCsv([repartido])).slice(1)

    expect(filas).toHaveLength(2)
    expect(filas[0]).toContain('Mercado')
    expect(filas[1]).toContain('Hogar')
  })

  it('las filas suman lo que se pagó', () => {
    const montos = lineas(toTransactionsCsv([repartido]))
      .slice(1)
      .map((fila) => Number(fila.split(';')[2]))

    expect(montos).toEqual([124_800, 40_000])
    expect(montos.reduce((sum, monto) => sum + monto, 0)).toBe(164_800)
  })

  it('lo que no está repartido sigue saliendo en una sola fila', () => {
    expect(lineas(toTransactionsCsv([movimiento()]))).toHaveLength(2)
  })
})
