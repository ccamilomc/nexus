import { describe, expect, it } from 'vitest'

import type { Habit, HabitLog } from '../types/habits.types'
import { buildHabitsSeries } from './habits-series'

const DAYS = [new Date(2026, 6, 27), new Date(2026, 6, 28), new Date(2026, 6, 29)]
const PREVIOUS_DAYS = [new Date(2026, 6, 24), new Date(2026, 6, 25), new Date(2026, 6, 26)]

function habit(id: string, createdAt: Date): Habit {
  return {
    id,
    user_id: 'u1',
    name: `Hábito ${id}`,
    description: null,
    icon: 'check',
    color: '#2563eb',
    frequency: 'daily',
    target_count: 1,
    target_weekdays: null,
    is_active: true,
    archived_at: null,
    created_at: createdAt.toISOString(),
    updated_at: createdAt.toISOString(),
    deleted_at: null,
  }
}

function log(habitId: string, dateKey: string, completed = true): HabitLog {
  return {
    id: `${habitId}-${dateKey}`,
    user_id: 'u1',
    habit_id: habitId,
    date: dateKey,
    completed,
    count: completed ? 1 : 0,
    notes: null,
    created_at: `${dateKey}T12:00:00.000Z`,
    updated_at: `${dateKey}T12:00:00.000Z`,
    deleted_at: null,
  }
}

const OLD = new Date(2026, 0, 1)

describe('buildHabitsSeries', () => {
  it('mide el porcentaje cumplido de lo que tocaba cada día', () => {
    const habits = [habit('a', OLD), habit('b', OLD)]
    const logs = [log('a', '2026-07-27'), log('a', '2026-07-28'), log('b', '2026-07-28')]

    const series = buildHabitsSeries(habits, logs, DAYS, [])

    expect(series.points).toEqual([
      { dateKey: '2026-07-27', value: 50 },
      { dateKey: '2026-07-28', value: 100 },
      { dateKey: '2026-07-29', value: 0 },
    ])
  })

  it('proponerse más hábitos no cuenta como retroceso', () => {
    // Cumplir 2 de 2 es 100 %, igual que cumplir 1 de 1: la cuenta absoluta
    // diría que el día de un solo hábito fue peor, y no lo fue.
    const unHabito = buildHabitsSeries([habit('a', OLD)], [log('a', '2026-07-27')], DAYS, [])
    const dosHabitos = buildHabitsSeries(
      [habit('a', OLD), habit('b', OLD)],
      [log('a', '2026-07-27'), log('b', '2026-07-27')],
      DAYS,
      [],
    )

    expect(unHabito.points[0]?.value).toBe(100)
    expect(dosHabitos.points[0]?.value).toBe(100)
  })

  it('no cuenta días anteriores a la creación del hábito', () => {
    // Creado el 28: el 27 no existía y no puede figurar como incumplido.
    const series = buildHabitsSeries(
      [habit('a', new Date(2026, 6, 28))],
      [log('a', '2026-07-28')],
      DAYS,
      [],
    )

    expect(series.points[0]?.value).toBeNull()
    expect(series.points[1]?.value).toBe(100)
    expect(series.completionPercent).toBe(50)
  })

  it('un día sin hábitos vigentes es hueco, no un cero', () => {
    const series = buildHabitsSeries([], [], DAYS, [])

    expect(series.points.every(({ value }) => value === null)).toBe(true)
    expect(series.completionPercent).toBeNull()
  })

  it('cuenta los días perfectos', () => {
    const habits = [habit('a', OLD), habit('b', OLD)]
    const logs = [
      log('a', '2026-07-27'),
      log('b', '2026-07-27'),
      log('a', '2026-07-28'),
      log('a', '2026-07-29'),
      log('b', '2026-07-29'),
    ]

    expect(buildHabitsSeries(habits, logs, DAYS, []).perfectDays).toBe(2)
  })

  it('un registro sin cumplir no suma', () => {
    const series = buildHabitsSeries([habit('a', OLD)], [log('a', '2026-07-27', false)], DAYS, [])

    expect(series.points[0]?.value).toBe(0)
  })

  it('separa el tramo anterior del actual', () => {
    const habits = [habit('a', OLD)]
    const logs = [log('a', '2026-07-24'), log('a', '2026-07-25'), log('a', '2026-07-27')]

    const series = buildHabitsSeries(habits, logs, DAYS, PREVIOUS_DAYS)

    expect(series.completionPercent).toBe(33)
    expect(series.previousCompletionPercent).toBe(67)
  })

  it('la racha se mide desde el final del periodo', () => {
    const habits = [habit('a', OLD)]
    const logs = [log('a', '2026-07-27'), log('a', '2026-07-28'), log('a', '2026-07-29')]

    expect(buildHabitsSeries(habits, logs, DAYS, []).bestStreak).toBe(3)
  })
})

describe('buildHabitsSeries: el que menos se cumple', () => {
  it('señala el hábito con menos cumplimiento y con qué porcentaje', () => {
    // La constancia global no distingue tres a medias de dos perfectos y uno
    // abandonado, y lo que se hace con esa información es distinto.
    const habits = [habit('a', OLD), habit('b', OLD)]
    const logs = [
      log('a', '2026-07-27'),
      log('a', '2026-07-28'),
      log('a', '2026-07-29'),
      log('b', '2026-07-27'),
    ]

    const series = buildHabitsSeries(habits, logs, DAYS, [])

    expect(series.hardest).toEqual({ name: 'Hábito b', percent: 33 })
  })

  it('con un solo hábito no dice nada: sería la constancia global repetida', () => {
    const series = buildHabitsSeries([habit('a', OLD)], [log('a', '2026-07-27')], DAYS, [])

    expect(series.hardest).toBeNull()
  })

  it('sólo cuenta desde que el hábito existe, como el resto de cifras', () => {
    // El de ayer no puede salir peor por los días en que no existía.
    const habits = [habit('a', OLD), habit('nuevo', new Date(2026, 6, 29))]
    const logs = [log('a', '2026-07-27'), log('nuevo', '2026-07-29')]

    const series = buildHabitsSeries(habits, logs, DAYS, [])

    // «nuevo» cumplió su único día vigente: el que peor va es «a», con 1 de 3.
    expect(series.hardest).toEqual({ name: 'Hábito a', percent: 33 })
  })
})
