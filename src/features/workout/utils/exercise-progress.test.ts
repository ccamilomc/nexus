import { describe, expect, it } from 'vitest'

import type { ExerciseSetSample } from '../types/workout.types'
import { buildExerciseProgress } from './exercise-progress'

interface SampleOptions {
  readonly warmup?: boolean
}

function sample(
  sessionId: string,
  day: number,
  reps: number,
  weight: number,
  { warmup = false }: SampleOptions = {},
): ExerciseSetSample {
  return {
    reps,
    weight,
    is_warmup: warmup,
    session: {
      id: sessionId,
      started_at: `2026-08-${String(day).padStart(2, '0')}T18:00:00.000Z`,
      ended_at: `2026-08-${String(day).padStart(2, '0')}T19:00:00.000Z`,
    },
  }
}

describe('buildExerciseProgress', () => {
  it('el récord de peso es el más alto que se levantó', () => {
    const progress = buildExerciseProgress('press', [
      sample('s1', 1, 8, 70),
      sample('s2', 8, 5, 80),
      sample('s3', 15, 10, 60),
    ])

    expect(progress.heaviest?.set).toEqual({ reps: 5, weightKg: 80 })
    expect(progress.heaviest?.performedAt).toContain('2026-08-08')
  })

  it('a igual peso, el récord es el de más repeticiones', () => {
    const progress = buildExerciseProgress('press', [
      sample('s1', 1, 5, 80),
      sample('s2', 8, 8, 80),
    ])

    expect(progress.heaviest?.set).toEqual({ reps: 8, weightKg: 80 })
  })

  it('la mejor serie no tiene por qué ser la más pesada', () => {
    // 100×1 son 100 kg de volumen; 80×8 son 640. Son logros distintos y por eso
    // se cuentan aparte.
    const progress = buildExerciseProgress('press', [
      sample('s1', 1, 1, 100),
      sample('s2', 8, 8, 80),
    ])

    expect(progress.heaviest?.set).toEqual({ reps: 1, weightKg: 100 })
    expect(progress.bestVolume?.set).toEqual({ reps: 8, weightKg: 80 })
  })

  it('el calentamiento no hace récords', () => {
    const progress = buildExerciseProgress('press', [
      sample('s1', 1, 20, 200, { warmup: true }),
      sample('s1', 1, 8, 70),
    ])

    expect(progress.heaviest?.set).toEqual({ reps: 8, weightKg: 70 })
    expect(progress.setCount).toBe(1)
  })

  it('la progresión guarda el mejor peso de cada entrenamiento, en orden', () => {
    // Sin el ruido de las series de bajada: la línea enseña si se sube.
    const progress = buildExerciseProgress('press', [
      sample('s2', 8, 8, 75),
      sample('s2', 8, 6, 60),
      sample('s1', 1, 8, 70),
    ])

    expect(progress.topWeightBySession.map(({ weightKg }) => weightKg)).toEqual([70, 75])
    expect(progress.sessionCount).toBe(2)
  })

  it('sin series no inventa marcas', () => {
    const progress = buildExerciseProgress('press', [])

    expect(progress.heaviest).toBeNull()
    expect(progress.bestVolume).toBeNull()
    expect(progress.topWeightBySession).toEqual([])
    expect(progress.sessionCount).toBe(0)
  })

  it('un ejercicio de solo calentamiento tampoco deja marcas', () => {
    const progress = buildExerciseProgress('press', [sample('s1', 1, 12, 20, { warmup: true })])

    expect(progress.heaviest).toBeNull()
    expect(progress.setCount).toBe(0)
  })
})
