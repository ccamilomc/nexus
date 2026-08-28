import { describe, expect, it } from 'vitest'

import type { DailyContext } from '@/decision-engine'

import { hasNothingSetUp } from './blank-slate'

/** Una cuenta recién creada: sin objetivos, sin hábitos, sin rutina y sin plan. */
function recienCreada(overrides: Partial<DailyContext> = {}): DailyContext {
  return {
    date: '2026-08-28',
    now: '2026-08-28T09:00:00.000Z',
    goals: {},
    plan: [],
    workout: { recentSessions: [], routineDays: [] },
    nutrition: {
      todayIntake: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      todayWaterMl: 0,
      todayFoods: [],
      pantry: [],
    },
    study: { weekMinutes: 0 },
    habits: { total: 0, done: 0 },
    sleep: {},
    ...overrides,
  }
}

describe('hasNothingSetUp', () => {
  it('una cuenta recien creada no tiene nada puesto en marcha', () => {
    expect(hasNothingSetUp(recienCreada())).toBe(true)
  })

  it('un objetivo de nutricion ya es haber empezado', () => {
    const conObjetivo = recienCreada({
      goals: {
        nutrition: { calories: 2200, proteinG: 150, carbsG: 220, fatG: 70, waterMl: 3000 },
      },
    })

    expect(hasNothingSetUp(conObjetivo)).toBe(false)
  })

  it('un objetivo de sueno tambien cuenta', () => {
    expect(hasNothingSetUp(recienCreada({ goals: { sleepMinutes: 480 } }))).toBe(false)
  })

  it('un objetivo de estudio tambien cuenta', () => {
    expect(hasNothingSetUp(recienCreada({ goals: { studyWeeklyMinutes: 600 } }))).toBe(false)
  })

  it('tener un habito, aunque no se haya cumplido, ya es haber empezado', () => {
    expect(hasNothingSetUp(recienCreada({ habits: { total: 1, done: 0 } }))).toBe(false)
  })

  it('tener una rutina cuenta, aunque no se haya entrenado nunca', () => {
    const conRutina = recienCreada({
      workout: {
        recentSessions: [],
        routineDays: [{ id: 'd1', routineName: 'Fuerza', dayName: 'Empuje', exercises: [] }],
      },
    })

    expect(hasNothingSetUp(conRutina)).toBe(false)
  })

  it('haberse propuesto algo hoy cuenta', () => {
    const conPlan = recienCreada({
      plan: [{ id: 'p1', domain: 'workout', status: 'pending', priority: 'medium' }],
    })

    expect(hasNothingSetUp(conPlan)).toBe(false)
  })

  it('registrar sin configurar nada NO cuenta como haber empezado', () => {
    // Es el matiz que importa: se mira lo que el usuario **configura**, no lo
    // que apunta. Beber agua un dia no crea un objetivo contra el que medir, asi
    // que el motor sigue sin tener nada que decir y «vas al dia» seguiria
    // sonando igual de raro.
    const conAgua = recienCreada({
      nutrition: {
        todayIntake: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
        todayWaterMl: 500,
        todayFoods: [],
        pantry: [],
      },
    })

    expect(hasNothingSetUp(conAgua)).toBe(true)
  })
})
