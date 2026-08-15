import { describe, expect, it } from 'vitest'

import type { HabitToday } from '../types/habits.types'
import { toggleHabitDay } from './toggle-today'

const HOY = '2026-08-15'
const AYER = '2026-08-14'

function entry(overrides: Partial<HabitToday> = {}): HabitToday {
  return {
    habit: {
      id: 'h1',
      user_id: 'u1',
      name: 'Meditar',
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
    isDoneToday: false,
    streak: 3,
    daysSinceDone: 1,
    recentDays: [
      { dateKey: AYER, isDone: true, isToday: false, isEditable: true },
      { dateKey: HOY, isDone: false, isToday: true, isEditable: true },
    ],
    consistency: { doneDays: 20, totalDays: 30, percent: 67 },
    ...overrides,
  }
}

describe('toggleHabitDay', () => {
  it('marca hoy y alarga la racha en uno', () => {
    // La racha venía contada hasta ayer, porque hoy no ha terminado: marcarlo
    // la extiende exactamente en un día.
    const actual = toggleHabitDay(entry(), HOY, false)

    expect(actual.isDoneToday).toBe(true)
    expect(actual.streak).toBe(4)
    expect(actual.recentDays[1]?.isDone).toBe(true)
  })

  it('desmarca hoy y la acorta en uno', () => {
    const actual = toggleHabitDay(entry({ isDoneToday: true, streak: 4 }), HOY, true)

    expect(actual.isDoneToday).toBe(false)
    expect(actual.streak).toBe(3)
  })

  it('nunca deja la racha en negativo', () => {
    const actual = toggleHabitDay(entry({ isDoneToday: true, streak: 0 }), HOY, true)

    expect(actual.streak).toBe(0)
  })

  it('en un día pasado cambia el cuadrito y deja la racha quieta', () => {
    // Marcar un hueco puede unir dos rachas, y eso no se sabe sin mirar más
    // atrás de lo que hay en pantalla: mejor tarde que mal.
    const actual = toggleHabitDay(entry(), AYER, true)

    expect(actual.recentDays[0]?.isDone).toBe(false)
    expect(actual.streak).toBe(3)
    expect(actual.isDoneToday).toBe(false)
  })

  it('no toca la constancia, que se mide sobre una ventana más larga', () => {
    expect(toggleHabitDay(entry(), HOY, false).consistency).toEqual(entry().consistency)
  })
})
