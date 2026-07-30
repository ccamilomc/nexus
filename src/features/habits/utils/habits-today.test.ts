import { describe, expect, it } from 'vitest'

import type { Habit, HabitLog } from '../types/habits.types'
import { toDateKey } from './date-key'
import { buildHabitsToday } from './habits-today'

const TODAY = new Date(2026, 6, 29)

function dayKey(offset: number): string {
  const day = new Date(TODAY)
  day.setDate(day.getDate() - offset)
  return toDateKey(day)
}

function habit(id: string, name: string): Habit {
  return {
    id,
    user_id: 'user-1',
    name,
    description: null,
    icon: 'circle-check',
    color: '#3b82f6',
    frequency: 'daily',
    target_count: 1,
    target_weekdays: null,
    is_active: true,
    archived_at: null,
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
    deleted_at: null,
  }
}

function log(habitId: string, offset: number, completed = true): HabitLog {
  return {
    id: `log-${habitId}-${offset}`,
    user_id: 'user-1',
    habit_id: habitId,
    date: dayKey(offset),
    count: 1,
    completed,
    notes: null,
    created_at: '2026-07-29T10:00:00.000Z',
    updated_at: '2026-07-29T10:00:00.000Z',
    deleted_at: null,
  }
}

describe('buildHabitsToday', () => {
  it('marca lo hecho hoy y calcula la racha', () => {
    const [entry] = buildHabitsToday(
      [habit('h1', 'Leer')],
      [log('h1', 0), log('h1', 1), log('h1', 2)],
      TODAY,
      7,
      30,
    )

    expect(entry?.isDoneToday).toBe(true)
    expect(entry?.streak).toBe(3)
  })

  it('un hábito sin registros aparece igual, a cero', () => {
    const [entry] = buildHabitsToday([habit('h1', 'Leer')], [], TODAY, 7, 30)

    expect(entry?.isDoneToday).toBe(false)
    expect(entry?.streak).toBe(0)
    expect(entry?.recentDays).toHaveLength(7)
    expect(entry?.recentDays.every((day) => !day.isDone)).toBe(true)
  })

  it('no mezcla los registros de dos hábitos', () => {
    const entries = buildHabitsToday(
      [habit('h1', 'Leer'), habit('h2', 'Meditar')],
      [log('h1', 0), log('h1', 1)],
      TODAY,
      7,
      30,
    )

    expect(entries[0]?.streak).toBe(2)
    expect(entries[1]?.streak).toBe(0)
    expect(entries[1]?.isDoneToday).toBe(false)
  })

  it('ignora los registros no cumplidos', () => {
    const [entry] = buildHabitsToday([habit('h1', 'Leer')], [log('h1', 0, false)], TODAY, 7, 30)

    expect(entry?.isDoneToday).toBe(false)
    expect(entry?.streak).toBe(0)
  })

  it('los días recientes van del más antiguo al más reciente y acaban hoy', () => {
    const [entry] = buildHabitsToday([habit('h1', 'Leer')], [log('h1', 0)], TODAY, 3, 30)
    const days = entry?.recentDays ?? []

    expect(days.map((day) => day.dateKey)).toEqual([dayKey(2), dayKey(1), dayKey(0)])
    expect(days.at(-1)?.isDone).toBe(true)
  })

  it('los días anteriores a la creación del hábito no se pueden marcar', () => {
    // El hábito nació el 1 de julio: en junio no existía, así que marcarlo ahí
    // sumaría a la racha días que la constancia no cuenta.
    const [entry] = buildHabitsToday([habit('h1', 'Leer')], [], new Date(2026, 6, 2), 7, 30)
    const days = entry?.recentDays ?? []

    expect(days.filter((day) => day.isEditable).map((day) => day.dateKey)).toEqual([
      '2026-07-01',
      '2026-07-02',
    ])
  })

  it('los días desde la creación son corregibles, estén hechos o no', () => {
    const [entry] = buildHabitsToday([habit('h1', 'Leer')], [log('h1', 1)], TODAY, 3, 30)

    expect(entry?.recentDays.every((day) => day.isEditable)).toBe(true)
  })

  it('calcula la constancia desde la creación del hábito, no antes', () => {
    // El hábito se creó el 1 de julio y hoy es el 29: la ventana de 30 días
    // empezaría el 30 de junio, así que se recorta a los 29 días que el hábito
    // lleva existiendo.
    const [entry] = buildHabitsToday(
      [habit('h1', 'Leer')],
      [log('h1', 0), log('h1', 1)],
      TODAY,
      7,
      30,
    )

    expect(entry?.consistency.doneDays).toBe(2)
    expect(entry?.consistency.totalDays).toBe(29)
  })
})
