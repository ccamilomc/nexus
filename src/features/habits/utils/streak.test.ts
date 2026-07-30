import { describe, expect, it } from 'vitest'

import type { HabitLog } from '../types/habits.types'
import { toDateKey } from './date-key'
import { calculateStreak, hasCompletedOn } from './streak'

/** Conjunto de fechas cumplidas a partir de desplazamientos desde `today`. */
function completed(today: Date, ...offsets: readonly number[]): Set<string> {
  return new Set(
    offsets.map((offset) => {
      const day = new Date(today)
      day.setDate(day.getDate() - offset)
      return toDateKey(day)
    }),
  )
}

const TODAY = new Date(2026, 6, 29)

describe('calculateStreak', () => {
  it('cuenta los días consecutivos incluyendo hoy', () => {
    expect(calculateStreak(completed(TODAY, 0, 1, 2), TODAY)).toBe(3)
  })

  it('no rompe la racha si hoy aún no está marcado', () => {
    // Ayer y anteayer hechos, hoy todavía no: el día no ha terminado.
    expect(calculateStreak(completed(TODAY, 1, 2), TODAY)).toBe(2)
  })

  it('se rompe en cuanto falta un día anterior', () => {
    // Hoy y ayer sí, pero anteayer no: la racha son 2.
    expect(calculateStreak(completed(TODAY, 0, 1, 3, 4), TODAY)).toBe(2)
  })

  it('sin registros la racha es cero', () => {
    expect(calculateStreak(new Set(), TODAY)).toBe(0)
  })

  it('marcar sólo hoy empieza una racha de uno', () => {
    expect(calculateStreak(completed(TODAY, 0), TODAY)).toBe(1)
  })

  it('un hueco de dos días no cuenta como racha aunque haya registros viejos', () => {
    expect(calculateStreak(completed(TODAY, 5, 6, 7), TODAY)).toBe(0)
  })

  it('atraviesa el cambio de mes', () => {
    // 1 de agosto: la racha viene del 31 y 30 de julio.
    const firstOfAugust = new Date(2026, 7, 1)

    expect(calculateStreak(completed(firstOfAugust, 0, 1, 2), firstOfAugust)).toBe(3)
  })
})

/** Registro de un hábito en una fecha, cumplido o intentado. */
function log(dateKey: string, isCompleted: boolean): HabitLog {
  return {
    id: `log-${dateKey}`,
    user_id: 'user-1',
    habit_id: 'h1',
    date: dateKey,
    count: 1,
    completed: isCompleted,
    notes: null,
    created_at: `${dateKey}T10:00:00.000Z`,
    updated_at: `${dateKey}T10:00:00.000Z`,
    deleted_at: null,
  }
}

describe('hasCompletedOn', () => {
  it('reconoce el día cumplido', () => {
    expect(hasCompletedOn([log('2026-07-01', true)], '2026-07-01')).toBe(true)
  })

  it('un día registrado pero no cumplido no cuenta', () => {
    // Si contara, se pediría un tramo más de historial para nada: la racha ya
    // está rota en ese día.
    expect(hasCompletedOn([log('2026-07-01', false)], '2026-07-01')).toBe(false)
  })

  it('no confunde días vecinos', () => {
    expect(hasCompletedOn([log('2026-07-02', true)], '2026-07-01')).toBe(false)
  })

  it('sin registros es falso', () => {
    expect(hasCompletedOn([], '2026-07-01')).toBe(false)
  })
})
