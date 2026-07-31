import { describe, expect, it } from 'vitest'

import type { StudySessionWithSubject, Subject } from '../types/study.types'
import { buildWeekStudy } from './week-study'

function subject(id: string, name: string, weeklyTargetMinutes: number | null): Subject {
  return {
    id,
    user_id: 'user-1',
    name,
    color: '#3b82f6',
    weekly_target_minutes: weeklyTargetMinutes,
    is_active: true,
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
    deleted_at: null,
  }
}

function session(subjectId: string | null, minutes: number): StudySessionWithSubject {
  return {
    id: `session-${subjectId}-${minutes}`,
    user_id: 'user-1',
    subject_id: subjectId,
    duration_minutes: minutes,
    started_at: '2026-07-29T14:00:00.000Z',
    ended_at: '2026-07-29T15:00:00.000Z',
    focus_rating: null,
    technique: null,
    notes: null,
    created_at: '2026-07-29T15:00:00.000Z',
    updated_at: '2026-07-29T15:00:00.000Z',
    deleted_at: null,
    subject: null,
  }
}

const CALCULO = subject('s1', 'Cálculo', 600)
const HISTORIA = subject('s2', 'Historia', 300)
const LECTURA = subject('s3', 'Lectura', null)

describe('buildWeekStudy', () => {
  it('mide cada materia contra su objetivo', () => {
    const week = buildWeekStudy([CALCULO], [session('s1', 300)])

    expect(week.bySubject[0]?.minutes).toBe(300)
    expect(week.bySubject[0]?.progress?.percent).toBe(50)
    expect(week.bySubject[0]?.progress?.remaining).toBe(300)
  })

  it('una materia con objetivo aparece aunque esté a cero', () => {
    // Es justo la que hay que ver: la que se olvidó toda la semana.
    const week = buildWeekStudy([CALCULO, HISTORIA], [session('s1', 120)])

    expect(week.bySubject).toHaveLength(2)
    expect(week.bySubject[1]).toMatchObject({ minutes: 0 })
    expect(week.bySubject[1]?.progress?.percent).toBe(0)
  })

  it('una materia sin objetivo sólo aparece si se estudió', () => {
    const sinTiempo = buildWeekStudy([LECTURA], [])
    const conTiempo = buildWeekStudy([LECTURA], [session('s3', 45)])

    expect(sinTiempo.bySubject).toEqual([])
    expect(conTiempo.bySubject[0]?.minutes).toBe(45)
    expect(conTiempo.bySubject[0]?.progress).toBeNull()
  })

  it('las que persiguen un objetivo van primero', () => {
    const week = buildWeekStudy(
      [LECTURA, HISTORIA, CALCULO],
      [session('s3', 500), session('s2', 100), session('s1', 200)],
    )

    expect(week.bySubject.map(({ subject: s }) => s.name)).toEqual([
      'Cálculo',
      'Historia',
      'Lectura',
    ])
  })

  it('suma los objetivos para dar el avance de la semana', () => {
    const week = buildWeekStudy([CALCULO, HISTORIA, LECTURA], [session('s1', 450)])

    // 600 + 300; la materia sin objetivo no infla la meta.
    expect(week.targetMinutes).toBe(900)
    expect(week.totalMinutes).toBe(450)
    expect(week.progress?.percent).toBe(50)
  })

  it('sin ningún objetivo no se inventa una meta', () => {
    const week = buildWeekStudy([LECTURA], [session('s3', 60)])

    expect(week.targetMinutes).toBeNull()
    expect(week.progress).toBeNull()
    expect(week.totalMinutes).toBe(60)
  })

  it('una sesión sin materia suma al total pero no a ninguna fila', () => {
    const week = buildWeekStudy([CALCULO], [session(null, 30), session('s1', 60)])

    expect(week.totalMinutes).toBe(90)
    expect(week.bySubject[0]?.minutes).toBe(60)
  })

  it('pasarse del objetivo se ve, no se oculta', () => {
    const week = buildWeekStudy([HISTORIA], [session('s2', 400)])

    expect(week.bySubject[0]?.progress).toMatchObject({
      percent: 100,
      isExceeded: true,
      remaining: 0,
    })
  })

  it('una semana en blanco no falla', () => {
    const week = buildWeekStudy([], [])

    expect(week).toEqual({
      totalMinutes: 0,
      targetMinutes: null,
      progress: null,
      bySubject: [],
    })
  })
})
