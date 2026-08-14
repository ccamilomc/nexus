import { describe, expect, it } from 'vitest'

import type { MealItemSample, MealLogSample } from '../types/nutrition.types'
import { buildWeekNutrition } from './week-nutrition'

const LUNES = new Date(2026, 7, 10)
const MARTES = new Date(2026, 7, 11)
const MIERCOLES = new Date(2026, 7, 12)
const SEMANA = [
  LUNES,
  MARTES,
  MIERCOLES,
  new Date(2026, 7, 13),
  new Date(2026, 7, 14),
  new Date(2026, 7, 15),
  new Date(2026, 7, 16),
]

function log(id: string, day: Date): MealLogSample {
  return {
    id,
    logged_at: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12).toISOString(),
  }
}

/** Un alimento de 100 kcal y 10 g de proteína por porción. */
function item(logId: string, servings = 1): MealItemSample {
  return {
    meal_log_id: logId,
    servings,
    food: { calories: 100, protein_g: 10, carbs_g: 5, fat_g: 2, cost_per_serving: 1000 },
  }
}

describe('buildWeekNutrition', () => {
  it('no promedia con un solo día registrado', () => {
    // Esa «media» sería el día de hoy, que ya está encima en la pantalla.
    const week = buildWeekNutrition([log('a', LUNES)], [item('a')], SEMANA)

    expect(week).toBeNull()
  })

  it('sin registros no hay semana que contar', () => {
    expect(buildWeekNutrition([], [], SEMANA)).toBeNull()
  })

  it('reparte entre los días registrados, no entre siete', () => {
    // Con dos días de 200 kcal la media es 200, no 57: los cinco días sin
    // apuntar no son días de ayuno.
    const week = buildWeekNutrition(
      [log('a', LUNES), log('b', MARTES)],
      [item('a', 2), item('b', 2)],
      SEMANA,
    )

    expect(week?.averages.calories).toBe(200)
    expect(week?.daysLogged).toBe(2)
    expect(week?.daysInWeek).toBe(7)
  })

  it('junta las comidas del mismo día antes de promediar', () => {
    // Desayuno y almuerzo del lunes son un día, no dos.
    const week = buildWeekNutrition(
      [log('desayuno', LUNES), log('almuerzo', LUNES), log('cena', MARTES)],
      [item('desayuno'), item('almuerzo'), item('cena', 2)],
      SEMANA,
    )

    expect(week?.daysLogged).toBe(2)
    expect(week?.averages.calories).toBe(200)
  })

  it('promedia también los macros', () => {
    const week = buildWeekNutrition(
      [log('a', LUNES), log('b', MARTES)],
      [item('a', 3), item('b', 1)],
      SEMANA,
    )

    expect(week?.averages.proteinG).toBe(20)
    expect(week?.averages.carbsG).toBe(10)
    expect(week?.averages.fatG).toBe(4)
  })

  it('una comida creada y vacía no cuenta como día registrado', () => {
    // Metería un cero y hundiría la media.
    const week = buildWeekNutrition(
      [log('a', LUNES), log('b', MARTES), log('vacia', MIERCOLES)],
      [item('a'), item('b')],
      SEMANA,
    )

    expect(week?.daysLogged).toBe(2)
    expect(week?.averages.calories).toBe(100)
  })

  it('deja fuera lo que no cae en la semana', () => {
    const week = buildWeekNutrition(
      [log('a', LUNES), log('b', MARTES), log('viejo', new Date(2026, 6, 1))],
      [item('a'), item('b'), item('viejo', 10)],
      SEMANA,
    )

    expect(week?.daysLogged).toBe(2)
    expect(week?.averages.calories).toBe(100)
  })
})
