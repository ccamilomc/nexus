import { describe, expect, it } from 'vitest'

import type { DailyContext } from '../contracts/context.types'
import { alternativeRoutineRule } from './alternative-routine'
import { dayRecalculationRule } from './day-recalculation'
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
    workout: { recentSessions: [{ id: 's1', date, durationMinutes: 45 }], routineDays: [] },
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
        routineDays: [],
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

  describe('con objetivo propio', () => {
    const withGoal = (lastNightMinutes: number, targetMinutes: number): DailyContext => ({
      ...EMPTY,
      sleep: { lastNightMinutes },
      goals: { sleepMinutes: targetMinutes },
    })

    it('avisa aunque se pasen las seis horas, si el objetivo es mayor', () => {
      // El caso que la regla no cubría: quien necesita ocho y duerme siete no
      // oía nada, porque seis horas era el listón de todo el mundo.
      expect(sleepShortRule.appliesTo(withGoal(7 * 60, 8 * 60))).toBe(true)
    })

    it('calla por debajo de seis horas si eso es lo que buscabas', () => {
      // Y al revés: a quien se apaña con cinco y media no se le avisa cada
      // mañana de algo que decidió.
      expect(sleepShortRule.appliesTo(withGoal(5 * 60 + 30, 5 * 60 + 30))).toBe(false)
    })

    it('media hora de menos no es dormir poco', () => {
      // Sin tolerancia, un objetivo de 8 h haría saltar la regla casi todas las
      // noches, y una regla que habla siempre se deja de leer.
      expect(sleepShortRule.appliesTo(withGoal(7 * 60 + 30, 8 * 60))).toBe(false)
      expect(sleepShortRule.appliesTo(withGoal(7 * 60 + 10, 8 * 60))).toBe(true)
    })

    it('el motivo se mide contra tu objetivo, no contra las seis horas', () => {
      const [recommendation] = sleepShortRule.evaluate(withGoal(6 * 60 + 30, 8 * 60))

      expect(recommendation?.reason).toContain('1 h 30 min menos de tu objetivo')
      expect(recommendation?.reason).not.toContain('por debajo de las 6 h')
    })

    it('quedarse a más de una hora sube la prioridad', () => {
      expect(sleepShortRule.evaluate(withGoal(7 * 60, 8 * 60))[0]?.priority).toBe('high')
      // 55 min por debajo: aviso, pero sin subir el tono.
      expect(sleepShortRule.evaluate(withGoal(7 * 60 + 5, 8 * 60))[0]?.priority).toBe('medium')
    })
  })
})

describe('workoutOpenSessionRule', () => {
  const withOpenSession = (startedAt: string, now = at(20)): DailyContext => ({
    ...EMPTY,
    now,
    workout: { recentSessions: [], activeSessionStartedAt: startedAt, routineDays: [] },
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

describe('alternativeRoutineRule', () => {
  const PIERNA = {
    id: 'pierna',
    routineName: 'Push Pull Legs',
    dayName: 'Pierna',
    exercises: [
      { name: 'Sentadilla', sets: 4 },
      { name: 'Peso muerto', sets: 4 },
      { name: 'Zancadas', sets: 3 },
      { name: 'Curl femoral', sets: 3 },
      { name: 'Gemelos', sets: 3 },
    ],
  }

  const withRoutine = (
    routineDays: DailyContext['workout']['routineDays'],
    now = at(20),
    recentSessions: DailyContext['workout']['recentSessions'] = [],
  ): DailyContext => ({
    ...EMPTY,
    now,
    workout: { recentSessions, routineDays },
  })

  it('no habla de día: aún queda tarde para la sesión entera', () => {
    expect(alternativeRoutineRule.appliesTo(withRoutine([PIERNA], at(11)))).toBe(false)
  })

  it('no habla sin rutinas que acortar', () => {
    expect(alternativeRoutineRule.appliesTo(withRoutine([]))).toBe(false)
  })

  it('no molesta a quien ya entrenó hoy', () => {
    const hoy = [{ id: 's1', date: EMPTY.date, durationMinutes: 50 }]

    expect(alternativeRoutineRule.appliesTo(withRoutine([PIERNA], at(20), hoy))).toBe(false)
  })

  it('no interrumpe a quien está entrenando ahora mismo', () => {
    const context: DailyContext = {
      ...withRoutine([PIERNA]),
      workout: { recentSessions: [], routineDays: [PIERNA], activeSessionStartedAt: at(19) },
    }

    expect(alternativeRoutineRule.appliesTo(context)).toBe(false)
  })

  it('propone la cabeza de la lista, que son los básicos', () => {
    const [recommendation] = alternativeRoutineRule.evaluate(withRoutine([PIERNA]))

    expect(recommendation?.type).toBe('alternative_routine')
    expect(recommendation?.message).toContain('Sentadilla, Peso muerto y Zancadas')
    expect(recommendation?.message).not.toContain('Gemelos')
  })

  it('compara la versión corta con la entera', () => {
    const [recommendation] = alternativeRoutineRule.evaluate(withRoutine([PIERNA]))

    // 17 series ≈ 60 min enteras; 11 series ≈ 40 min la corta.
    expect(recommendation?.message).toContain('los 5 ejercicios de Pierna')
    expect(recommendation?.data.estimatedMinutes).toBe(40)
  })

  it('explica el porqué sin recriminar', () => {
    const [recommendation] = alternativeRoutineRule.evaluate(withRoutine([PIERNA]))

    expect(recommendation?.reason).toContain('aún no has entrenado')
    expect(recommendation?.reason).not.toMatch(/fall|deberías|tarde ya/i)
  })

  it('elige el día que lleva más tiempo sin tocarse', () => {
    const empuje = { ...PIERNA, id: 'empuje', dayName: 'Empuje' }
    const sessions = [
      { id: 's1', date: '2026-07-29', durationMinutes: 50, routineDayId: 'pierna' },
      { id: 's2', date: '2026-07-20', durationMinutes: 50, routineDayId: 'empuje' },
    ]

    const [recommendation] = alternativeRoutineRule.evaluate(
      withRoutine([PIERNA, empuje], at(20), sessions),
    )

    expect(recommendation?.data.routineDayId).toBe('empuje')
  })

  it('prefiere un día nunca entrenado', () => {
    const nuevo = { ...PIERNA, id: 'nuevo', dayName: 'Espalda' }
    const sessions = [{ id: 's1', date: '2026-07-29', durationMinutes: 50, routineDayId: 'pierna' }]

    const [recommendation] = alternativeRoutineRule.evaluate(
      withRoutine([PIERNA, nuevo], at(20), sessions),
    )

    expect(recommendation?.data.routineDayId).toBe('nuevo')
  })

  it('nombra el día sin adjetivarlo: el nombre lo pone el usuario', () => {
    // «Pierna entero» no concuerda, y el día puede llamarse como sea.
    const [recommendation] = alternativeRoutineRule.evaluate(withRoutine([PIERNA]))

    expect(recommendation?.message).not.toMatch(/Pierna (entero|completo)/)
  })

  it('no finge la hora exacta', () => {
    // A las 20:30, decir «son las 20:00» es falso; «pasadas las 20:00», no.
    const [recommendation] = alternativeRoutineRule.evaluate(
      withRoutine([PIERNA], new Date(2026, 6, 30, 20, 30).toISOString()),
    )

    expect(recommendation?.reason).toContain('Pasadas las 20:00')
  })

  it('calla si el día ya es corto: no hay nada que recortar', () => {
    const corto = { ...PIERNA, exercises: PIERNA.exercises.slice(0, 3) }

    expect(alternativeRoutineRule.evaluate(withRoutine([corto]))).toEqual([])
  })
})

describe('dayRecalculationRule', () => {
  /** Un elemento del plan a una hora, con la duración que se le calcula. */
  const item = (
    id: string,
    hour: number,
    minutes: number,
    status: DailyContext['plan'][number]['status'] = 'pending',
  ) => {
    const start = new Date(2026, 6, 30, hour, 0)

    return {
      id,
      domain: 'workout' as const,
      status,
      priority: 'medium' as const,
      scheduledStart: start.toISOString(),
      scheduledEnd: new Date(start.getTime() + minutes * 60_000).toISOString(),
    }
  }

  const withPlan = (plan: DailyContext['plan'], now = at(21)): DailyContext => ({
    ...EMPTY,
    now,
    plan,
  })

  it('no habla sin plan: no hay nada que recalcular', () => {
    expect(dayRecalculationRule.appliesTo(withPlan([]))).toBe(false)
  })

  it('calla si lo que queda cabe en el día', () => {
    // A las 21:00 quedan 120 min de día útil y el plan pide 60.
    expect(dayRecalculationRule.evaluate(withPlan([item('a', 18, 60)]))).toEqual([])
  })

  it('avisa cuando lo pendiente no cabe, y dice cuánto sobra', () => {
    // Quedan 120 min; el plan pide 180.
    const [recommendation] = dayRecalculationRule.evaluate(
      withPlan([item('a', 18, 90), item('b', 20, 90)]),
    )

    expect(recommendation?.type).toBe('day_recalculation')
    expect(recommendation?.data.excessMinutes).toBe(60)
    expect(recommendation?.message).toContain('1 h')
  })

  it('lo hecho no cuenta como pendiente', () => {
    const plan = [item('a', 18, 90, 'done'), item('b', 20, 90)]

    expect(dayRecalculationRule.evaluate(withPlan(plan))).toEqual([])
  })

  it('lo saltado tampoco', () => {
    const plan = [item('a', 18, 90, 'skipped'), item('b', 20, 90)]

    expect(dayRecalculationRule.evaluate(withPlan(plan))).toEqual([])
  })

  it('señala lo que ya pasó de su hora', () => {
    const [recommendation] = dayRecalculationRule.evaluate(
      withPlan([item('a', 18, 90), item('b', 20, 90)]),
    )

    expect(recommendation?.data.lateItemIds).toEqual(['a', 'b'])
    expect(recommendation?.reason).toContain('ya pasaron de su hora')
  })

  it('media hora de retraso no es un plan roto', () => {
    // Empezar diez minutos tarde es la vida, no una alarma.
    const [recommendation] = dayRecalculationRule.evaluate(withPlan([item('a', 20, 200)], at(20)))

    expect(recommendation?.data.lateItemIds).toEqual([])
  })

  it('a un elemento sin horas se le calcula media hora', () => {
    const sinHoras = [
      { id: 'x', domain: 'study' as const, status: 'pending' as const, priority: 'low' as const },
    ]

    // 30 min caben en los 120 que quedan: no hay aviso.
    expect(dayRecalculationRule.evaluate(withPlan(sinHoras))).toEqual([])
    expect(dayRecalculationRule.appliesTo(withPlan(sinHoras))).toBe(true)
  })

  it('no promete la última hora del día', () => {
    // A las 22:30 sólo quedan 30 min útiles, no 90 hasta medianoche.
    const [recommendation] = dayRecalculationRule.evaluate(
      withPlan([item('a', 18, 60)], new Date(2026, 6, 30, 22, 30).toISOString()),
    )

    expect(recommendation?.data.availableMinutes).toBe(30)
  })

  it('propone mover, no reprograma por su cuenta', () => {
    const [recommendation] = dayRecalculationRule.evaluate(
      withPlan([item('a', 18, 90), item('b', 20, 90)]),
    )

    expect(recommendation?.message).toMatch(/Mueve/)
    expect(recommendation?.message).not.toMatch(/he movido|se movió|reprogramado/i)
  })
})
