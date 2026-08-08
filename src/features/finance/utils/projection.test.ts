import { describe, expect, it } from 'vitest'

import type { FinanceRecurrence, FinanceRecurring, FinanceTotals } from '../types/finance.types'
import { projectMonthEnd } from './projection'

/** Agosto de 2026 tiene 31 días; el 7 es el que se usa como «hoy» por defecto. */
const AUGUST_7 = new Date(2026, 7, 7)

function totals(partial: Partial<FinanceTotals> = {}): FinanceTotals {
  return { income: 0, expense: 0, fixedExpense: 0, balance: 0, ...partial }
}

interface RecurringOptions {
  readonly kind?: FinanceRecurring['kind']
  readonly frequency?: FinanceRecurrence
  readonly pausedAt?: string | null
}

function recurring(
  name: string,
  amount: number,
  nextDueOn: string,
  { kind = 'expense', frequency = 'monthly', pausedAt = null }: RecurringOptions = {},
): FinanceRecurring {
  const [, , day = 1] = nextDueOn.split('-').map(Number)

  return {
    id: `r-${name}`,
    user_id: 'u-1',
    account_id: 'a-1',
    category_id: 'c-1',
    name,
    amount,
    kind,
    frequency,
    next_due_on: nextDueOn,
    anchor_day: day,
    paused_at: pausedAt,
    note: null,
    deleted_at: null,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  }
}

describe('projectMonthEnd', () => {
  it('resta del cierre los fijos que todavía no han vencido', () => {
    const projection = projectMonthEnd(
      totals({ income: 3_000_000, expense: 1_000_000, fixedExpense: 400_000, balance: 2_000_000 }),
      [recurring('Arriendo', 1_200_000, '2026-08-30')],
      AUGUST_7,
    )

    expect(projection).toMatchObject({
      daysLeft: 24,
      pendingExpense: 1_200_000,
      pendingCount: 1,
      committedBalance: 800_000,
    })
  })

  it('un fijo semanal cuenta todas las veces que vence en el mes', () => {
    // Contarlo una sola vez dejaría la proyección corta justo en los fijos que
    // más se repiten: del 8 al 31 de agosto cabe cuatro veces.
    const projection = projectMonthEnd(
      totals({ balance: 1_000_000 }),
      [recurring('Mercado', 50_000, '2026-08-08', { frequency: 'weekly' })],
      AUGUST_7,
    )

    expect(projection?.pendingExpense).toBe(200_000)
    expect(projection?.pendingCount).toBe(4)
  })

  it('lo que venció en meses anteriores no se suma a este mes', () => {
    // Un arriendo sin confirmar desde junio es un pendiente de junio. Sumarlo
    // aquí diría que en agosto van a salir tres arriendos, y eso no va a pasar.
    const projection = projectMonthEnd(
      totals({ balance: 1_000_000 }),
      [recurring('Arriendo', 900_000, '2026-06-05')],
      AUGUST_7,
    )

    expect(projection?.pendingExpense).toBe(900_000)
    expect(projection?.pendingCount).toBe(1)
  })

  it('un fijo que vence el mes que viene no entra', () => {
    const projection = projectMonthEnd(
      totals({ balance: 1_000_000 }),
      [recurring('Seguro', 300_000, '2026-09-05')],
      AUGUST_7,
    )

    expect(projection).toBeNull()
  })

  it('un fijo en pausa no cuenta: se dejó a propósito', () => {
    const projection = projectMonthEnd(
      totals({ balance: 1_000_000 }),
      [recurring('Gimnasio', 120_000, '2026-08-20', { pausedAt: '2026-08-01T10:00:00Z' })],
      AUGUST_7,
    )

    expect(projection).toBeNull()
  })

  it('un fijo de ingreso suma al cierre en vez de restar', () => {
    const projection = projectMonthEnd(
      totals({ income: 0, expense: 500_000, fixedExpense: 0, balance: -500_000 }),
      [recurring('Sueldo', 3_000_000, '2026-08-30', { kind: 'income' })],
      AUGUST_7,
    )

    expect(projection?.pendingIncome).toBe(3_000_000)
    expect(projection?.committedBalance).toBe(2_500_000)
  })

  it('el ritmo sale del gasto variable, no del que ya era fijo', () => {
    // Repartir el arriendo a tanto por día lo cobraría treinta veces: lo fijo
    // sale una vez y ya está contado en los pendientes.
    const projection = projectMonthEnd(
      totals({ income: 0, expense: 1_000_000, fixedExpense: 900_000, balance: -1_000_000 }),
      [],
      new Date(2026, 7, 10),
    )

    // $100.000 variables en 10 días son $10.000 al día por los 21 que quedan.
    expect(projection?.estimatedVariable).toBe(210_000)
    expect(projection?.projectedBalance).toBe(-1_210_000)
  })

  it('los primeros días del mes no dan para hablar de un ritmo', () => {
    // El día 2, una salida cara convertiría el mes entero en una ruina que no
    // va a ocurrir.
    const projection = projectMonthEnd(
      totals({ expense: 600_000, balance: -600_000 }),
      [recurring('Arriendo', 1_200_000, '2026-08-30')],
      new Date(2026, 7, 2),
    )

    expect(projection?.estimatedVariable).toBeNull()
    expect(projection?.projectedBalance).toBeNull()
    // Lo que sí se sabe se sigue diciendo: los fijos no son una suposición.
    expect(projection?.committedBalance).toBe(-1_800_000)
  })

  it('el último día del mes ya no estima nada por delante', () => {
    const projection = projectMonthEnd(
      totals({ expense: 600_000, balance: -600_000 }),
      [recurring('Arriendo', 1_200_000, '2026-08-31')],
      new Date(2026, 7, 31),
    )

    expect(projection?.daysLeft).toBe(0)
    expect(projection?.estimatedVariable).toBeNull()
  })

  it('lo estimado va redondeado a miles: es una cuenta aproximada y se nota', () => {
    const projection = projectMonthEnd(
      totals({ expense: 100_001, balance: -100_001 }),
      [],
      AUGUST_7,
    )

    // $342.860,57 exactos serían fingir una precisión que no existe.
    expect(projection?.estimatedVariable).toBe(343_000)
  })

  it('sin nada por vencer y sin gasto no hay nada que proyectar', () => {
    // Repetiría el balance que está justo encima, y una tarjeta que no añade
    // nada estorba.
    const projection = projectMonthEnd(
      totals({ income: 2_000_000, balance: 2_000_000 }),
      [],
      AUGUST_7,
    )

    expect(projection).toBeNull()
  })

  it('el cierre negativo se devuelve tal cual, no recortado a cero', () => {
    const projection = projectMonthEnd(
      totals({ income: 500_000, expense: 400_000, balance: 100_000 }),
      [recurring('Arriendo', 1_200_000, '2026-08-30')],
      AUGUST_7,
    )

    expect(projection?.committedBalance).toBe(-1_100_000)
  })
})
