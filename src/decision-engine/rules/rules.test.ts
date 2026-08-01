import { describe, expect, it } from 'vitest'

import type { DailyContext } from '../contracts/context.types'
import { habitsPendingRule } from './habits-pending'
import { mealSwapRule } from './meal-swap'
import { sleepShortRule } from './sleep-short'
import { studyBehindRule } from './study-behind'
import { waterPendingRule } from './water-pending'
import { workoutGapRule } from './workout-gap'
import { workoutOpenSessionRule } from './workout-open-session'

/** Contexto vacío: cada test enciende sólo lo que su regla necesita. */
const EMPTY: DailyContext = {
  date: '2026-07-30',
  now: '2026-07-30T10:00:00.000Z',
  profile: { sex: 'unspecified' },
  goals: {},
  plan: [],
  workout: { recentSessions: [] },
  nutrition: {
    todayIntake: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    todaySpend: 0,
    todayWaterMl: 0,
    todayFoods: [],
    pantry: [],
  },
  study: { weekMinutes: 0 },
  habits: { total: 0, done: 0 },
  sleep: {},
  constraints: {},
}

/** `now` a una hora local concreta del día del contexto. */
function at(hour: number): string {
  return new Date(2026, 6, 30, hour, 0).toISOString()
}

describe('waterPendingRule', () => {
  const withWater = (todayWaterMl: number, waterMl: number, now = at(10)): DailyContext => ({
    ...EMPTY,
    now,
    goals: { nutrition: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, waterMl } },
    nutrition: { ...EMPTY.nutrition, todayWaterMl },
  })

  it('no aplica sin objetivo de agua', () => {
    expect(waterPendingRule.appliesTo(EMPTY)).toBe(false)
  })

  it('no aplica cuando ya se cumplió', () => {
    expect(waterPendingRule.appliesTo(withWater(2000, 2000))).toBe(false)
  })

  it('dice cuánta agua falta, en litros cuando pasa del litro', () => {
    const [recommendation] = waterPendingRule.evaluate(withWater(800, 2000))

    expect(recommendation?.message).toContain('1,2 L')
    expect(recommendation?.data).toMatchObject({ remainingMl: 1200 })
  })

  it('en mililitros cuando queda poco', () => {
    const [recommendation] = waterPendingRule.evaluate(withWater(1750, 2000))

    expect(recommendation?.message).toContain('250 ml')
  })

  it('sube de prioridad al caer la tarde', () => {
    // A las nueve de la mañana faltar agua es normal; a las nueve de la noche,
    // significa que el día se acaba sin cumplirlo.
    expect(waterPendingRule.evaluate(withWater(500, 2000, at(9)))[0]?.priority).toBe('medium')
    expect(waterPendingRule.evaluate(withWater(500, 2000, at(21)))[0]?.priority).toBe('high')
  })

  it('siempre explica el porqué', () => {
    expect(waterPendingRule.evaluate(withWater(500, 2000))[0]?.reason).toContain('500 ml de 2 L')
  })
})

describe('habitsPendingRule', () => {
  const withHabits = (done: number, total: number, now = at(10)): DailyContext => ({
    ...EMPTY,
    now,
    habits: { total, done },
  })

  it('no aplica sin hábitos', () => {
    expect(habitsPendingRule.appliesTo(EMPTY)).toBe(false)
  })

  it('no aplica con el día completo', () => {
    expect(habitsPendingRule.appliesTo(withHabits(3, 3))).toBe(false)
  })

  it('concuerda en singular', () => {
    const [recommendation] = habitsPendingRule.evaluate(withHabits(2, 3))

    expect(recommendation?.title).toBe('Te queda 1 hábito')
  })

  it('concuerda en plural', () => {
    expect(habitsPendingRule.evaluate(withHabits(1, 4))[0]?.title).toBe('Te quedan 3 hábitos')
  })

  it('no recrimina: habla de lo que queda, no de lo fallado', () => {
    const [recommendation] = habitsPendingRule.evaluate(withHabits(0, 2))

    expect(recommendation?.message).not.toMatch(/fall|perd|romp/i)
    expect(recommendation?.reason).toContain('0 de 2')
  })
})

describe('workoutGapRule', () => {
  const withLastSession = (date: string): DailyContext => ({
    ...EMPTY,
    workout: { recentSessions: [{ id: 's1', date, durationMinutes: 45 }] },
  })

  it('no dice nada a quien todavía no ha empezado', () => {
    // Recordarle que no ha entrenado nunca no ayuda a nadie.
    expect(workoutGapRule.appliesTo(EMPTY)).toBe(false)
  })

  it('dos días de descanso no son un aviso', () => {
    expect(workoutGapRule.appliesTo(withLastSession('2026-07-28'))).toBe(false)
  })

  it('a partir del tercer día avisa', () => {
    const context = withLastSession('2026-07-27')

    expect(workoutGapRule.appliesTo(context)).toBe(true)
    expect(workoutGapRule.evaluate(context)[0]?.title).toBe('Llevas 3 días sin entrenar')
  })

  it('una semana parada sube la prioridad', () => {
    expect(workoutGapRule.evaluate(withLastSession('2026-07-23'))[0]?.priority).toBe('high')
  })

  it('fecha la última sesión en cristiano, no en ISO', () => {
    // «2026-07-27» no se lee; «lunes, 27 de julio» sí.
    const [recommendation] = workoutGapRule.evaluate(withLastSession('2026-07-27'))

    expect(recommendation?.reason).toContain('27 de julio')
    expect(recommendation?.reason).not.toContain('2026-07-27')
  })

  it('usa el entrenamiento más reciente, no el primero de la lista', () => {
    const context: DailyContext = {
      ...EMPTY,
      workout: {
        recentSessions: [
          { id: 'viejo', date: '2026-07-10', durationMinutes: 45 },
          { id: 'nuevo', date: '2026-07-27', durationMinutes: 45 },
        ],
      },
    }

    expect(workoutGapRule.evaluate(context)[0]?.data).toMatchObject({ days: 3 })
  })
})

describe('sleepShortRule', () => {
  const withSleep = (lastNightMinutes: number): DailyContext => ({
    ...EMPTY,
    sleep: { lastNightMinutes },
  })

  it('no aplica sin registro de sueño', () => {
    // Callar es mejor que suponer que se durmió mal.
    expect(sleepShortRule.appliesTo(EMPTY)).toBe(false)
  })

  it('no aplica con una noche normal', () => {
    expect(sleepShortRule.appliesTo(withSleep(7 * 60))).toBe(false)
    expect(sleepShortRule.appliesTo(withSleep(6 * 60))).toBe(false)
  })

  it('avisa por debajo de seis horas y cruza al entrenamiento', () => {
    // Primera regla que mira un dominio para hablar de otro.
    const [recommendation] = sleepShortRule.evaluate(withSleep(5 * 60 + 20))

    expect(recommendation?.domain).toBe('sleep')
    expect(recommendation?.message).toContain('entrenas')
    expect(recommendation?.reason).toContain('5 h 20 min')
  })

  it('por debajo de cinco horas sube la prioridad', () => {
    expect(sleepShortRule.evaluate(withSleep(5 * 60 + 30))[0]?.priority).toBe('medium')
    expect(sleepShortRule.evaluate(withSleep(4 * 60 + 30))[0]?.priority).toBe('high')
  })

  it('sugiere sin prometer resultados ni dar consejo médico', () => {
    const [recommendation] = sleepShortRule.evaluate(withSleep(5 * 60))

    expect(recommendation?.message).toMatch(/plantéate|considera/i)
    expect(recommendation?.message).not.toMatch(/debes|tienes que|necesitas/i)
  })
})

describe('workoutOpenSessionRule', () => {
  const withOpenSession = (startedAt: string, now = at(20)): DailyContext => ({
    ...EMPTY,
    now,
    workout: { recentSessions: [], activeSessionStartedAt: startedAt },
  })

  it('no aplica si no hay ninguna sesión abierta', () => {
    expect(workoutOpenSessionRule.appliesTo(EMPTY)).toBe(false)
  })

  it('no molesta a quien está entrenando ahora mismo', () => {
    // Una hora de gimnasio es un entrenamiento, no un olvido.
    expect(workoutOpenSessionRule.appliesTo(withOpenSession(at(19), at(20)))).toBe(false)
  })

  it('avisa cuando la sesión lleva horas abierta', () => {
    const context = withOpenSession(at(6), at(20))

    expect(workoutOpenSessionRule.appliesTo(context)).toBe(true)
    expect(workoutOpenSessionRule.evaluate(context)[0]?.reason).toContain('14 horas')
  })

  it('cuenta en días cuando lleva más de uno', () => {
    // El caso real que lo motivó: una sesión vacía con el cronómetro en 108 h.
    const [recommendation] = workoutOpenSessionRule.evaluate(
      withOpenSession(new Date(2026, 6, 26, 8, 0).toISOString(), at(20)),
    )

    expect(recommendation?.reason).toContain('4 días')
    expect(recommendation?.message).toContain('no cuenta en tu historial')
  })
})

describe('studyBehindRule', () => {
  /** `date` es jueves 30 (día 4 de 7) salvo que se indique otra cosa. */
  const withStudy = (weekMinutes: number, target: number, date = '2026-07-30'): DailyContext => ({
    ...EMPTY,
    date,
    goals: { studyWeeklyMinutes: target },
    study: { weekMinutes },
  })

  it('no aplica sin objetivo semanal', () => {
    expect(studyBehindRule.appliesTo({ ...EMPTY, study: { weekMinutes: 0 } })).toBe(false)
  })

  it('no avisa el lunes: la semana acaba de empezar', () => {
    // 27 de julio de 2026 es lunes.
    expect(studyBehindRule.appliesTo(withStudy(0, 700, '2026-07-27'))).toBe(false)
  })

  it('compara con el ritmo que toca, no con el objetivo entero', () => {
    // Jueves: tocarían 4/7 de 700 = 400 min. Con 380 va bien (dentro del margen).
    expect(studyBehindRule.appliesTo(withStudy(380, 700))).toBe(false)
    expect(studyBehindRule.appliesTo(withStudy(200, 700))).toBe(true)
  })

  it('dice cuánto falta y cuántos días quedan', () => {
    const [recommendation] = studyBehindRule.evaluate(withStudy(100, 700))

    expect(recommendation?.message).toContain('10 h')
    expect(recommendation?.message).toContain('3 días')
  })

  it('el último día de la semana el aviso es urgente', () => {
    // 2 de agosto de 2026 es domingo.
    const [recommendation] = studyBehindRule.evaluate(withStudy(100, 700, '2026-08-02'))

    expect(recommendation?.priority).toBe('high')
    expect(recommendation?.message).toContain('Hoy acaba la semana')
  })

  it('explica el ritmo esperado, no sólo el retraso', () => {
    const [recommendation] = studyBehindRule.evaluate(withStudy(100, 700))

    expect(recommendation?.reason).toContain('1 h 40 min de 11 h 40 min')
    expect(recommendation?.reason).toContain('6 h 40 min')
  })
})

describe('mealSwapRule', () => {
  const HAMBURGUESA = {
    foodId: 'burger',
    name: 'Hamburguesa sencilla',
    mealType: 'lunch' as const,
    servings: 1,
    calories: 550,
    proteinG: 25,
    costCop: 18000,
  }

  const POLLO = {
    id: 'pollo',
    name: 'Pechuga de pollo',
    calories: 248,
    proteinG: 46,
    costPerServing: 2400,
  }

  const withNutrition = (
    todayFoods: DailyContext['nutrition']['todayFoods'],
    pantry: DailyContext['nutrition']['pantry'],
  ): DailyContext => ({
    ...EMPTY,
    nutrition: { ...EMPTY.nutrition, todayFoods, pantry },
  })

  it('no aplica sin nada registrado hoy', () => {
    expect(mealSwapRule.appliesTo(withNutrition([], [POLLO]))).toBe(false)
  })

  it('no aplica sin despensa con precios', () => {
    expect(mealSwapRule.appliesTo(withNutrition([HAMBURGUESA], []))).toBe(false)
  })

  it('no aplica si lo registrado no tiene precio', () => {
    const { costCop: _costCop, ...sinPrecio } = HAMBURGUESA

    expect(mealSwapRule.appliesTo(withNutrition([sinPrecio], [POLLO]))).toBe(false)
  })

  it('propone la alternativa y cifra el ahorro', () => {
    const [recommendation] = mealSwapRule.evaluate(withNutrition([HAMBURGUESA], [POLLO]))

    // 550 kcal / 248 por porción = 2,22 → 2,25 porciones = $5.400.
    expect(recommendation?.type).toBe('meal_swap')
    expect(recommendation?.message).toContain('Pechuga de pollo')
    expect(recommendation?.data.savingCop).toBe(12600)
    expect(recommendation?.data.servings).toBe(2.25)
  })

  it('mira hacia adelante: lo comido ya no tiene vuelta', () => {
    const [recommendation] = mealSwapRule.evaluate(withNutrition([HAMBURGUESA], [POLLO]))

    expect(recommendation?.message).toContain('La próxima vez')
  })

  it('explica siempre de dónde sale la cifra', () => {
    const [recommendation] = mealSwapRule.evaluate(withNutrition([HAMBURGUESA], [POLLO]))

    expect(recommendation?.reason).toContain('550 kcal')
    expect(recommendation?.reason).toContain('Hamburguesa sencilla')
  })

  it('calla si el ahorro es calderilla', () => {
    const casiIgual = { ...POLLO, costPerServing: 7800 }

    expect(mealSwapRule.evaluate(withNutrition([HAMBURGUESA], [casiIgual]))).toEqual([])
  })

  it('no propone algo que empeore la proteína', () => {
    // Barato y con calorías de sobra, pero aporta menos proteína: abaratar
    // comiendo peor no es un consejo.
    const arroz = { id: 'arroz', name: 'Arroz', calories: 195, proteinG: 4, costPerServing: 250 }

    expect(mealSwapRule.evaluate(withNutrition([HAMBURGUESA], [arroz]))).toEqual([])
  })

  it('no propone raciones incomibles', () => {
    // Igualar 550 kcal exigiría más de 4 porciones.
    const ensalada = {
      id: 'ensalada',
      name: 'Ensalada',
      calories: 45,
      proteinG: 40,
      costPerServing: 100,
    }

    expect(mealSwapRule.evaluate(withNutrition([HAMBURGUESA], [ensalada]))).toEqual([])
  })

  it('no se propone a sí mismo', () => {
    const mismo = {
      id: 'burger',
      name: 'Hamburguesa sencilla',
      calories: 550,
      proteinG: 25,
      costPerServing: 18000,
    }

    expect(mealSwapRule.evaluate(withNutrition([HAMBURGUESA], [mismo]))).toEqual([])
  })

  it('elige el mayor ahorro cuando hay varias opciones', () => {
    const atun = { id: 'atun', name: 'Atún', calories: 92, proteinG: 20, costPerServing: 4200 }
    const [recommendation] = mealSwapRule.evaluate(withNutrition([HAMBURGUESA], [atun, POLLO]))

    expect(recommendation?.data.alternativeFoodId).toBe('pollo')
  })

  it('sube la prioridad cuando el ahorro es de los que se notan', () => {
    const [alto] = mealSwapRule.evaluate(withNutrition([HAMBURGUESA], [POLLO]))
    expect(alto?.priority).toBe('high')

    const gaseosa = {
      foodId: 'gaseosa',
      name: 'Gaseosa',
      mealType: 'snack' as const,
      servings: 1,
      calories: 150,
      proteinG: 0,
      costCop: 3500,
    }
    const leche = { id: 'leche', name: 'Leche', calories: 122, proteinG: 6.4, costPerServing: 1000 }
    const [medio] = mealSwapRule.evaluate(withNutrition([gaseosa], [leche]))

    expect(medio?.priority).toBe('medium')
  })
})
