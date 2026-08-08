import { describe, expect, it } from 'vitest'

import type { StudySessionWithSubject } from '../types/study.types'
import { buildStudySeries } from './study-series'

const DAYS = [new Date(2026, 6, 27), new Date(2026, 6, 28), new Date(2026, 6, 29)]
const PREVIOUS_DAYS = [new Date(2026, 6, 24), new Date(2026, 6, 25), new Date(2026, 6, 26)]

function session(
  day: Date,
  minutes: number,
  subject: { id: string; name: string } | null = null,
): StudySessionWithSubject {
  const started = new Date(day)
  started.setHours(19, 0, 0, 0)

  return {
    id: `s-${day.getDate()}-${minutes}`,
    user_id: 'u1',
    subject_id: subject?.id ?? null,
    started_at: started.toISOString(),
    ended_at: new Date(started.getTime() + minutes * 60_000).toISOString(),
    duration_minutes: minutes,
    target_minutes: null,
    focus_rating: null,
    technique: null,
    notes: null,
    created_at: started.toISOString(),
    updated_at: started.toISOString(),
    deleted_at: null,
    subject: subject ? { id: subject.id, name: subject.name, color: '#2563eb' } : null,
  }
}

describe('buildStudySeries', () => {
  it('suma los minutos de cada día', () => {
    const series = buildStudySeries(
      [session(DAYS[0] as Date, 60), session(DAYS[2] as Date, 45)],
      DAYS,
      [],
    )

    expect(series.points).toEqual([
      { dateKey: '2026-07-27', value: 60 },
      { dateKey: '2026-07-28', value: 0 },
      { dateKey: '2026-07-29', value: 45 },
    ])
    expect(series.totalMinutes).toBe(105)
  })

  it('un día sin estudiar vale cero, no es un hueco', () => {
    const series = buildStudySeries([], DAYS, [])

    expect(series.points.every(({ value }) => value === 0)).toBe(true)
    expect(series.daysStudied).toBe(0)
  })

  it('suma varias sesiones del mismo día en un punto', () => {
    const series = buildStudySeries(
      [session(DAYS[1] as Date, 30), session(DAYS[1] as Date, 45)],
      DAYS,
      [],
    )

    expect(series.points[1]).toEqual({ dateKey: '2026-07-28', value: 75 })
    expect(series.daysStudied).toBe(1)
  })

  it('la media es por día estudiado, no por día del periodo', () => {
    // 105 minutos en 2 días estudiados son 53 de media, no 35 repartidos entre
    // los tres días del periodo.
    const series = buildStudySeries(
      [session(DAYS[0] as Date, 60), session(DAYS[2] as Date, 45)],
      DAYS,
      [],
    )

    expect(series.averageMinutesPerStudiedDay).toBe(53)
  })

  it('separa el tramo anterior del actual', () => {
    const sessions = [session(PREVIOUS_DAYS[0] as Date, 90), session(DAYS[0] as Date, 30)]

    const series = buildStudySeries(sessions, DAYS, PREVIOUS_DAYS)

    expect(series.totalMinutes).toBe(30)
    expect(series.previousTotalMinutes).toBe(90)
    expect(series.daysStudied).toBe(1)
    expect(series.previousDaysStudied).toBe(1)
  })

  it('elige la materia con más tiempo', () => {
    const calculo = { id: 'c', name: 'Cálculo' }
    const fisica = { id: 'f', name: 'Física' }
    const sessions = [
      session(DAYS[0] as Date, 30, calculo),
      session(DAYS[1] as Date, 90, fisica),
      session(DAYS[2] as Date, 20, calculo),
    ]

    expect(buildStudySeries(sessions, DAYS, []).topSubject).toEqual({
      name: 'Física',
      minutes: 90,
    })
  })

  it('el tiempo sin materia no desaparece del total', () => {
    const series = buildStudySeries([session(DAYS[0] as Date, 40)], DAYS, [])

    expect(series.totalMinutes).toBe(40)
    expect(series.topSubject).toEqual({ name: 'Sin materia', minutes: 40 })
  })

  it('sin sesiones no inventa una media', () => {
    expect(buildStudySeries([], DAYS, []).averageMinutesPerStudiedDay).toBeNull()
  })
})
