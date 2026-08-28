import { describe, expect, it } from 'vitest'

import type { FinanceTransactionWithNames } from '../types/finance.types'
import {
  filterTransactions,
  hasFilters,
  NO_CATEGORY,
  NO_FILTERS,
  type TransactionFilters,
} from './filter-transactions'

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
    note: 'Almuerzo con Andrés',
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

const filtros = (overrides: Partial<TransactionFilters> = {}): TransactionFilters => ({
  ...NO_FILTERS,
  ...overrides,
})

describe('filterTransactions', () => {
  it('sin filtros devuelve todo', () => {
    const lista = [movimiento(), movimiento(), movimiento()]

    expect(filterTransactions(lista, NO_FILTERS)).toHaveLength(3)
  })

  it('busca en la nota', () => {
    const lista = [movimiento({ note: 'Mercado' }), movimiento({ note: 'Gasolina' })]

    expect(filterTransactions(lista, filtros({ query: 'merc' }))).toHaveLength(1)
  })

  it('busca sin tildes ni mayusculas', () => {
    const lista = [movimiento({ note: 'Almuerzo con Andrés' })]

    expect(filterTransactions(lista, filtros({ query: 'ANDRES' }))).toHaveLength(1)
  })

  it('busca en la categoria y en la cuenta', () => {
    const lista = [movimiento()]

    expect(filterTransactions(lista, filtros({ query: 'restaurantes' }))).toHaveLength(1)
    expect(filterTransactions(lista, filtros({ query: 'nequi' }))).toHaveLength(1)
  })

  it('busca por el monto tecleado sin puntos', () => {
    // En pantalla pone «$ 45.000» y uno teclea «45000». Si no encontrara nada,
    // el buscador pareceria roto justo en el caso mas util.
    const lista = [movimiento({ amount: 45_000 }), movimiento({ amount: 12_500 })]

    expect(filterTransactions(lista, filtros({ query: '45000' }))).toHaveLength(1)
  })

  it('filtra por tipo', () => {
    const lista = [movimiento(), movimiento({ kind: 'income' }), movimiento({ kind: 'transfer' })]

    expect(filterTransactions(lista, filtros({ kind: 'income' }))).toHaveLength(1)
  })

  it('filtra por categoria', () => {
    const lista = [movimiento({ category_id: 'c1' }), movimiento({ category_id: 'c2' })]

    expect(filterTransactions(lista, filtros({ categoryId: 'c2' }))).toHaveLength(1)
  })

  it('«sin categoria» encuentra justo los que no tienen', () => {
    // Es el filtro que sirve para repasar lo que quedo a medio apuntar.
    const lista = [
      movimiento({ category_id: 'c1' }),
      movimiento({ category_id: null, category: null }),
    ]

    const encontrados = filterTransactions(lista, filtros({ categoryId: NO_CATEGORY }))

    expect(encontrados).toHaveLength(1)
    expect(encontrados[0]?.category_id).toBeNull()
  })

  it('los filtros se acumulan, no se sustituyen', () => {
    const lista = [
      movimiento({ kind: 'expense', note: 'Mercado' }),
      movimiento({ kind: 'income', note: 'Mercado' }),
      movimiento({ kind: 'income', note: 'Sueldo' }),
    ]

    const encontrados = filterTransactions(lista, filtros({ kind: 'income', query: 'mercado' }))

    expect(encontrados).toHaveLength(1)
    expect(encontrados[0]?.note).toBe('Mercado')
  })

  it('no reordena lo que le llega', () => {
    const lista = [
      movimiento({ note: 'primero', amount: 1 }),
      movimiento({ note: 'segundo', amount: 900 }),
      movimiento({ note: 'tercero', amount: 50 }),
    ]

    expect(filterTransactions(lista, NO_FILTERS).map((t) => t.note)).toEqual([
      'primero',
      'segundo',
      'tercero',
    ])
  })
})

describe('hasFilters', () => {
  it('sin nada puesto, no hay filtros', () => {
    expect(hasFilters(NO_FILTERS)).toBe(false)
  })

  it('unos espacios en el buscador no son un filtro', () => {
    expect(hasFilters(filtros({ query: '   ' }))).toBe(false)
  })

  it('cualquiera de los tres cuenta', () => {
    expect(hasFilters(filtros({ query: 'a' }))).toBe(true)
    expect(hasFilters(filtros({ kind: 'income' }))).toBe(true)
    expect(hasFilters(filtros({ categoryId: 'c1' }))).toBe(true)
  })
})
