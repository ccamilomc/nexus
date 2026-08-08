import { describe, expect, it } from 'vitest'

import type { StudySessionWithSubject, SubjectRef } from '../types/study.types'
import { buildDayStudy } from './day-study'

const CALCULO: SubjectRef = { id: 's1', name: 'Cálculo', color: '#3b82f6' }
const HISTORIA: SubjectRef = { id: 's2', name: 'Historia', color: '#f59e0b' }

function session(
  id: string,
  minutes: number,
  subject: SubjectRef | null = CALCULO,
): StudySessionWithSubject {
  return {
    id,
    user_id: 'user-1',
    subject_id: subject?.id ?? null,
    duration_minutes: minutes,
    started_at: '2026-07-30T14:00:00.000Z',
    ended_at: '2026-07-30T15:00:00.000Z',
    target_minutes: null,
    focus_rating: null,
    technique: null,
    notes: null,
    created_at: '2026-07-30T15:00:00.000Z',
    updated_at: '2026-07-30T15:00:00.000Z',
    deleted_at: null,
    subject,
  }
}

describe('buildDayStudy', () => {
  it('un día sin sesiones queda a cero, no vacío a medias', () => {
    const day = buildDayStudy([])

    expect(day.totalMinutes).toBe(0)
    expect(day.bySubject).toEqual([])
  })

  it('suma el tiempo de varias sesiones de la misma materia', () => {
    const day = buildDayStudy([session('a', 45), session('b', 30)])

    expect(day.totalMinutes).toBe(75)
    expect(day.bySubject).toEqual([{ subject: CALCULO, minutes: 75 }])
  })

  it('ordena las materias de más a menos estudiada', () => {
    const day = buildDayStudy([
      session('a', 30, CALCULO),
      session('b', 90, HISTORIA),
      session('c', 20, CALCULO),
    ])

    expect(day.bySubject.map(({ subject }) => subject.name)).toEqual(['Historia', 'Cálculo'])
    expect(day.bySubject.map(({ minutes }) => minutes)).toEqual([90, 50])
  })

  it('una sesión sin materia suma al total pero no inventa una fila', () => {
    // El esquema permite `subject_id` nulo aunque la aplicación siempre la pida.
    const day = buildDayStudy([session('a', 40, null), session('b', 20, CALCULO)])

    expect(day.totalMinutes).toBe(60)
    expect(day.bySubject).toEqual([{ subject: CALCULO, minutes: 20 }])
  })

  it('conserva las sesiones tal cual, para poder listarlas', () => {
    const sessions = [session('a', 45), session('b', 30)]

    expect(buildDayStudy(sessions).sessions).toBe(sessions)
  })
})
