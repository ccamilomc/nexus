import { describe, expect, it } from 'vitest'

import type { HabitToday } from '../types/habits.types'
import { pendingToday } from './pending-today'

function entry(id: string, name: string, isDoneToday: boolean, appliesToday = true): HabitToday {
  return {
    habit: {
      id,
      user_id: 'u1',
      name,
      description: null,
      frequency: 'daily',
      color: '#6d5efc',
      icon: 'check',
      is_active: true,
      target_count: 1,
      target_weekdays: null,
      archived_at: null,
      deleted_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    isDoneToday,
    appliesToday,
    streak: 0,
    daysSinceDone: null,
    recentDays: [],
    consistency: { doneDays: 0, totalDays: 30, percent: 0 },
  }
}

describe('pendingToday', () => {
  it('deja fuera los que ya están hechos', () => {
    const actual = pendingToday([entry('a', 'Estirar', true), entry('b', 'Meditar', false)], 3)

    expect(actual.pending).toEqual([{ id: 'b', name: 'Meditar' }])
  })

  it('recorta a lo que cabe y cuenta el resto', () => {
    const habits = ['a', 'b', 'c', 'd', 'e'].map((id) => entry(id, `Hábito ${id}`, false))

    const actual = pendingToday(habits, 3)

    expect(actual.pending).toHaveLength(3)
    expect(actual.hiddenCount).toBe(2)
  })

  it('sin nada que ocultar no cuenta de más', () => {
    expect(pendingToday([entry('a', 'Estirar', false)], 3).hiddenCount).toBe(0)
  })

  it('con todos hechos lo dice', () => {
    const actual = pendingToday([entry('a', 'Estirar', true)], 3)

    expect(actual.pending).toEqual([])
    expect(actual.isAllDone).toBe(true)
  })

  it('sin hábitos NO felicita: no es lo mismo que tenerlos todos hechos', () => {
    expect(pendingToday([], 3).isAllDone).toBe(false)
  })
})
