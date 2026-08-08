import { describe, expect, it } from 'vitest'

import type { DailyContext, Priority, Recommendation, Rule } from '@/decision-engine'
import { evaluate } from '@/decision-engine'

const CONTEXT: DailyContext = {
  date: '2026-07-22',
  now: '2026-07-22T10:00:00.000Z',
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
}

function makeRecommendation(title: string, priority: Priority): Recommendation {
  return {
    key: `regla:${title}`,
    type: 'insight',
    priority,
    title,
    message: 'mensaje',
    reason: 'motivo',
    data: {},
  }
}

function makeRule(id: string, priority: Priority, applies = true): Rule {
  return {
    id,
    appliesTo: () => applies,
    evaluate: () => [makeRecommendation(id, priority)],
  }
}

describe('evaluate', () => {
  it('devuelve una lista vacia cuando no hay reglas', () => {
    expect(evaluate(CONTEXT, [])).toEqual([])
  })

  it('ignora las reglas que no aplican al contexto', () => {
    const result = evaluate(CONTEXT, [
      makeRule('aplica', 'medium'),
      makeRule('no-aplica', 'high', false),
    ])

    expect(result.map((item) => item.title)).toEqual(['aplica'])
  })

  it('ordena las recomendaciones por prioridad descendente', () => {
    const result = evaluate(CONTEXT, [
      makeRule('baja', 'low'),
      makeRule('critica', 'critical'),
      makeRule('media', 'medium'),
      makeRule('alta', 'high'),
    ])

    expect(result.map((item) => item.title)).toEqual(['critica', 'alta', 'media', 'baja'])
  })

  it('es determinista: mismas entradas producen la misma salida', () => {
    const rules = [makeRule('a', 'high'), makeRule('b', 'low')]

    expect(evaluate(CONTEXT, rules)).toEqual(evaluate(CONTEXT, rules))
  })
})
