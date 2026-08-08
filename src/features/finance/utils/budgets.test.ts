import { describe, expect, it } from 'vitest'

import type { CategorySpend, FinanceBudget, FinanceCategory } from '../types/finance.types'
import { calculateBudgets, monthProgressPercent } from './budgets'

describe('monthProgressPercent', () => {
  it('el último día del mes es el 100 %', () => {
    expect(monthProgressPercent(new Date(2026, 7, 31))).toBe(100)
  })

  it('cuenta los días que tiene cada mes, no treinta siempre', () => {
    // El 14 de febrero es más de medio mes; el 14 de agosto, menos.
    expect(monthProgressPercent(new Date(2026, 1, 14))).toBeCloseTo(50, 0)
    expect(monthProgressPercent(new Date(2026, 7, 14))).toBeCloseTo(45.2, 0)
  })
})

function budget(categoryId: string, amount: number): FinanceBudget {
  return {
    id: `b-${categoryId}`,
    user_id: 'u-1',
    category_id: categoryId,
    amount,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  }
}

function spend(categoryId: string, name: string, amount: number): CategorySpend {
  return { categoryId, name, amount, share: 0 }
}

function category(id: string, name: string): FinanceCategory {
  return {
    id,
    name,
    user_id: 'u-1',
    kind: 'expense',
    archived_at: null,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  }
}

/** El catálogo del usuario, que es de donde sale el nombre de cada tope. */
const CATEGORIES = [
  category('cat-1', 'Mercado'),
  category('cat-2', 'Ocio'),
  category('cat-3', 'Ocio'),
  category('cat-4', 'Mercado'),
]

describe('calculateBudgets', () => {
  it('cruza lo gastado con su tope', () => {
    const [mercado] = calculateBudgets(
      [budget('cat-1', 500_000)],
      [spend('cat-1', 'Mercado', 380_000)],
      CATEGORIES,
    )

    expect(mercado).toMatchObject({
      name: 'Mercado',
      spent: 380_000,
      cap: 500_000,
      percent: 76,
      remaining: 120_000,
      isExceeded: false,
    })
  })

  it('un tope sin gastos aparece igual, con todo por gastar', () => {
    // Saber lo que queda es la mitad del sentido de poner un tope. Si sólo se
    // enseñaran los que ya se empezaron a gastar, el mes arrancaría en blanco.
    const [ocio] = calculateBudgets([budget('cat-2', 200_000)], [], CATEGORIES)

    expect(ocio).toMatchObject({ spent: 0, remaining: 200_000, percent: 0, isExceeded: false })
  })

  it('un tope sin gastos conserva su nombre', () => {
    // Salía vacío: el nombre se sacaba del gasto, así que faltaba justo en el
    // caso que más importa —el tope que aún no has empezado a gastar—.
    const [ocio] = calculateBudgets([budget('cat-2', 200_000)], [], CATEGORIES)

    expect(ocio?.name).toBe('Ocio')
  })

  it('si la categoría se archivó, el nombre se rescata del gasto', () => {
    const [huerfano] = calculateBudgets(
      [budget('cat-borrada', 100_000)],
      [spend('cat-borrada', 'Suscripciones', 40_000)],
      CATEGORIES,
    )

    expect(huerfano?.name).toBe('Suscripciones')
  })

  it('pasarse se dice entero, no recortado al 100 %', () => {
    // Recortarlo escondería justo cuánto te pasaste, que es el dato que hace
    // falta para decidir.
    const [arriendo] = calculateBudgets(
      [budget('cat-3', 100_000)],
      [spend('cat-3', 'Ocio', 150_000)],
      CATEGORIES,
    )

    expect(arriendo?.percent).toBe(150)
    expect(arriendo?.remaining).toBe(-50_000)
    expect(arriendo?.isExceeded).toBe(true)
  })

  it('gastar justo el tope todavía no es pasarse', () => {
    const [exacto] = calculateBudgets(
      [budget('cat-4', 100_000)],
      [spend('cat-4', 'Mercado', 100_000)],
      CATEGORIES,
    )

    expect(exacto?.isExceeded).toBe(false)
    expect(exacto?.remaining).toBe(0)
  })

  it('lo gastado sin tope no entra: eso ya lo cuenta «en qué se fue»', () => {
    const result = calculateBudgets([], [spend('cat-9', 'Regalos', 90_000)], CATEGORIES)

    expect(result).toEqual([])
  })

  it('primero lo más apretado, que es lo que hay que mirar', () => {
    const result = calculateBudgets(
      [budget('cat-1', 100_000), budget('cat-2', 100_000), budget('cat-3', 100_000)],
      [spend('cat-1', 'Mercado', 10_000), spend('cat-3', 'Ocio', 120_000)],
      CATEGORIES,
    )

    expect(result.map(({ categoryId }) => categoryId)).toEqual(['cat-3', 'cat-1', 'cat-2'])
  })
})
