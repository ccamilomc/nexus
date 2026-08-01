import { describe, expect, it } from 'vitest'

import type { SessionSample, VolumeSetSample } from '../types/workout.types'
import { buildWorkoutSeries } from './workout-series'

const DAYS = [new Date(2026, 6, 27), new Date(2026, 6, 28), new Date(2026, 6, 29)]
const PREVIOUS_DAYS = [new Date(2026, 6, 24), new Date(2026, 6, 25), new Date(2026, 6, 26)]

function session(id: string, day: Date, minutes: number | null = 60): SessionSample {
  const started = new Date(day)
  started.setHours(18, 0, 0, 0)

  const ended = minutes === null ? null : new Date(started.getTime() + minutes * 60_000)

  return { id, started_at: started.toISOString(), ended_at: ended?.toISOString() ?? null }
}

function set(
  sessionId: string,
  reps: number,
  weight: number,
  extra: Partial<VolumeSetSample> = {},
): VolumeSetSample {
  return {
    session_id: sessionId,
    reps,
    weight,
    is_warmup: false,
    completed: true,
    ...extra,
  }
}

describe('buildWorkoutSeries', () => {
  it('suma el volumen de cada día', () => {
    const sessions = [session('s1', DAYS[0] as Date), session('s2', DAYS[2] as Date)]
    const sets = [set('s1', 10, 50), set('s2', 5, 100)]

    const series = buildWorkoutSeries(sessions, sets, DAYS, [])

    expect(series.volumePoints).toEqual([
      { dateKey: '2026-07-27', value: 500 },
      { dateKey: '2026-07-28', value: 0 },
      { dateKey: '2026-07-29', value: 500 },
    ])
    expect(series.totalVolumeKg).toBe(1000)
  })

  it('un día sin entrenar vale cero, no es un hueco', () => {
    const series = buildWorkoutSeries([], [], DAYS, [])

    expect(series.volumePoints.every(({ value }) => value === 0)).toBe(true)
    expect(series.daysTrained).toBe(0)
  })

  it('ignora calentamientos y series sin completar', () => {
    const sessions = [session('s1', DAYS[0] as Date)]
    const sets = [
      set('s1', 10, 50),
      set('s1', 10, 40, { is_warmup: true }),
      set('s1', 10, 60, { completed: false }),
    ]

    const series = buildWorkoutSeries(sessions, sets, DAYS, [])

    expect(series.totalVolumeKg).toBe(500)
    // Las series descartadas siguen contando como series hechas.
    expect(series.setCount).toBe(3)
  })

  it('suma dos entrenamientos del mismo día en un solo punto', () => {
    const sessions = [session('s1', DAYS[0] as Date), session('s2', DAYS[0] as Date)]
    const sets = [set('s1', 10, 50), set('s2', 10, 50)]

    const series = buildWorkoutSeries(sessions, sets, DAYS, [])

    expect(series.volumePoints[0]).toEqual({ dateKey: '2026-07-27', value: 1000 })
    expect(series.sessionCount).toBe(2)
    expect(series.daysTrained).toBe(1)
  })

  it('separa el tramo anterior del actual', () => {
    const sessions = [session('viejo', PREVIOUS_DAYS[1] as Date), session('nuevo', DAYS[1] as Date)]
    const sets = [set('viejo', 10, 30), set('nuevo', 10, 50)]

    const series = buildWorkoutSeries(sessions, sets, DAYS, PREVIOUS_DAYS)

    expect(series.totalVolumeKg).toBe(500)
    expect(series.previousTotalVolumeKg).toBe(300)
    expect(series.sessionCount).toBe(1)
    expect(series.previousSessionCount).toBe(1)
  })

  it('la duración media es por entrenamiento y descarta los que siguen abiertos', () => {
    const sessions = [
      session('s1', DAYS[0] as Date, 60),
      session('s2', DAYS[1] as Date, 90),
      session('s3', DAYS[2] as Date, null),
    ]

    const series = buildWorkoutSeries(sessions, [], DAYS, [])

    expect(series.averageDurationMinutes).toBe(75)
  })

  it('sin entrenamientos no inventa una duración media', () => {
    expect(buildWorkoutSeries([], [], DAYS, []).averageDurationMinutes).toBeNull()
  })

  it('un entrenamiento de la noche cuenta en su día, no en el siguiente', () => {
    const lateNight = new Date(2026, 6, 28)
    lateNight.setHours(22, 45, 0, 0)
    const sessions: SessionSample[] = [
      { id: 's1', started_at: lateNight.toISOString(), ended_at: null },
    ]

    const series = buildWorkoutSeries(sessions, [set('s1', 10, 50)], DAYS, [])

    expect(series.volumePoints[1]).toEqual({ dateKey: '2026-07-28', value: 500 })
  })
})
