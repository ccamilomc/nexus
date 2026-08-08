import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAppError } from '@/core/error'

import { studyRepository } from '../repositories/study.repository'
import type {
  StudySession,
  StudySessionWithSubject,
  Subject,
  SubjectRef,
} from '../types/study.types'
import { studyService } from './study.service'

/**
 * El repositorio se sustituye por completo: estos tests comprueban **reglas de
 * negocio**, no consultas. Con la factoría, el módulo real ni siquiera se carga,
 * así que no arrastra el cliente de Supabase (ni sus variables de entorno).
 */
vi.mock('../repositories/study.repository', () => ({
  studyRepository: {
    listSubjects: vi.fn(),
    insertSubject: vi.fn(),
    updateSubject: vi.fn(),
    listSessionsBetween: vi.fn(),
    findActiveSession: vi.fn(),
    insertSession: vi.fn(),
    updateSession: vi.fn(),
    softDeleteSession: vi.fn(),
  },
}))

const listSubjects = vi.mocked(studyRepository.listSubjects)
const insertSubject = vi.mocked(studyRepository.insertSubject)
const updateSubject = vi.mocked(studyRepository.updateSubject)
const listSessionsBetween = vi.mocked(studyRepository.listSessionsBetween)
const findActiveSession = vi.mocked(studyRepository.findActiveSession)
const insertSession = vi.mocked(studyRepository.insertSession)
const updateSession = vi.mocked(studyRepository.updateSession)
const softDeleteSession = vi.mocked(studyRepository.softDeleteSession)

const USER_ID = 'user-1'
/** 30 de julio de 2026, a las seis de la tarde. */
const DATE = new Date(2026, 6, 30, 18, 0)

const CALCULO: SubjectRef = { id: 'subject-1', name: 'Cálculo', color: '#3b82f6' }

const SAVED_SUBJECT: Subject = {
  ...CALCULO,
  user_id: USER_ID,
  weekly_target_minutes: null,
  is_active: true,
  created_at: '2026-07-30T10:00:00.000Z',
  updated_at: '2026-07-30T10:00:00.000Z',
  deleted_at: null,
}

const SAVED_SESSION: StudySession = {
  id: 'session-1',
  user_id: USER_ID,
  subject_id: CALCULO.id,
  duration_minutes: 50,
  started_at: '2026-07-30T22:10:00.000Z',
  ended_at: '2026-07-30T23:00:00.000Z',
  target_minutes: null,
  focus_rating: null,
  technique: null,
  notes: null,
  created_at: '2026-07-30T23:00:00.000Z',
  updated_at: '2026-07-30T23:00:00.000Z',
  deleted_at: null,
}

function session(id: string, minutes: number): StudySessionWithSubject {
  return { ...SAVED_SESSION, id, duration_minutes: minutes, subject: CALCULO }
}

/** Sesión en marcha: la que todavía no tiene fin. */
function running(startedAt: string): StudySessionWithSubject {
  return {
    ...SAVED_SESSION,
    id: 'en-curso',
    started_at: startedAt,
    ended_at: null,
    duration_minutes: 0,
    subject: CALCULO,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  listSubjects.mockResolvedValue([])
  listSessionsBetween.mockResolvedValue([])
  findActiveSession.mockResolvedValue(null)
  insertSubject.mockResolvedValue(SAVED_SUBJECT)
  updateSubject.mockResolvedValue(SAVED_SUBJECT)
  insertSession.mockResolvedValue(SAVED_SESSION)
  updateSession.mockResolvedValue(SAVED_SESSION)
})

describe('studyService.createSubject', () => {
  it('traduce el objetivo de horas a los minutos que guarda la base', () => {
    void studyService.createSubject(USER_ID, { name: 'Cálculo', weeklyTargetHours: 7.5 })

    expect(insertSubject).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, name: 'Cálculo', weekly_target_minutes: 450 }),
    )
  })

  it('sin objetivo guarda ausencia de dato, no cero horas', async () => {
    await studyService.createSubject(USER_ID, { name: 'Inglés' })

    expect(insertSubject).toHaveBeenCalledWith(
      expect.objectContaining({ weekly_target_minutes: null }),
    )
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    insertSubject.mockRejectedValue(new Error('duplicate key value violates unique constraint'))

    const error: unknown = await studyService
      .createSubject(USER_ID, { name: 'Cálculo' })
      .catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('duplicate')
  })
})

describe('studyService.deleteSubject', () => {
  it('retira la materia con una fecha, sin tocar lo ya estudiado', async () => {
    // Borrado lógico: ese tiempo se estudió de verdad y sigue contando.
    await studyService.deleteSubject('subject-1')

    const [subjectId, patch] = updateSubject.mock.calls[0] ?? []
    expect(subjectId).toBe('subject-1')
    expect(typeof patch?.deleted_at).toBe('string')
  })
})

describe('studyService.logStudy', () => {
  it('coloca la sesión hacia atrás desde ahora, con su duración', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(DATE)

    await studyService.logStudy(USER_ID, { subjectId: CALCULO.id, minutes: 90 })

    const input = insertSession.mock.calls[0]?.[0]
    expect(input).toMatchObject({
      user_id: USER_ID,
      subject_id: CALCULO.id,
      duration_minutes: 90,
      ended_at: DATE.toISOString(),
    })
    // 90 minutos antes de las 18:00 son las 16:30.
    expect(input?.started_at).toBe(new Date(2026, 6, 30, 16, 30).toISOString())

    vi.useRealTimers()
  })

  it('sin valoración de foco no envía el campo', async () => {
    await studyService.logStudy(USER_ID, { subjectId: CALCULO.id, minutes: 25 })

    expect(insertSession.mock.calls[0]?.[0]).not.toHaveProperty('focus_rating')
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    insertSession.mockRejectedValue(new Error('violates row-level security policy'))

    const error: unknown = await studyService
      .logStudy(USER_ID, { subjectId: CALCULO.id, minutes: 25 })
      .catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('row-level security')
  })
})

describe('studyService.startSession', () => {
  it('arranca el cronómetro para la materia elegida', async () => {
    findActiveSession
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(running('2026-07-30T21:00:00.000Z'))

    const active = await studyService.startSession(USER_ID, CALCULO.id, null)

    expect(insertSession).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: USER_ID, subject_id: CALCULO.id }),
    )
    // La sesión vuelve con su materia, que la inserción no trae.
    expect(active.subject).toEqual(CALCULO)
    expect(active.ended_at).toBeNull()
  })

  it('no abre una segunda sesión si ya hay uno corriendo', async () => {
    // Doble pulsación, o el móvil y el portátil a la vez.
    const enCurso = running('2026-07-30T21:00:00.000Z')
    findActiveSession.mockResolvedValue(enCurso)

    const active = await studyService.startSession(USER_ID, 'otra-materia', null)

    expect(insertSession).not.toHaveBeenCalled()
    expect(active.id).toBe(enCurso.id)
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    insertSession.mockRejectedValue(new Error('violates row-level security policy'))

    const error: unknown = await studyService
      .startSession(USER_ID, CALCULO.id, null)
      .catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('row-level security')
  })
})

describe('studyService.finishSession', () => {
  it('guarda la duración medida desde la hora de inicio del servidor', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(DATE)

    // Empezó a las 16:45; son las 18:00.
    await studyService.finishSession('en-curso', new Date(2026, 6, 30, 16, 45).toISOString())

    expect(updateSession).toHaveBeenCalledWith('en-curso', {
      ended_at: DATE.toISOString(),
      duration_minutes: 75,
    })

    vi.useRealTimers()
  })

  it('parar enseguida guarda un minuto, no una sesión vacía', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(DATE)

    await studyService.finishSession('en-curso', new Date(DATE.getTime() - 20_000).toISOString())

    expect(updateSession).toHaveBeenCalledWith(
      'en-curso',
      expect.objectContaining({ duration_minutes: 1 }),
    )

    vi.useRealTimers()
  })
})

describe('studyService.discardSession', () => {
  it('descarta sin dejar rastro en el día', async () => {
    await studyService.discardSession('en-curso')

    const [sessionId, deletedAt] = softDeleteSession.mock.calls[0] ?? []
    expect(sessionId).toBe('en-curso')
    expect(typeof deletedAt).toBe('string')
  })
})

describe('studyService.getWeekStudy', () => {
  it('acota la semana de lunes a domingo y mide el avance', async () => {
    listSubjects.mockResolvedValue([{ ...SAVED_SUBJECT, weekly_target_minutes: 600 }])
    listSessionsBetween.mockResolvedValue([session('a', 200), session('b', 100)])

    const week = await studyService.getWeekStudy(USER_ID, DATE)

    const [, fromIso, toIso] = listSessionsBetween.mock.calls[0] ?? []
    // El 30 de julio de 2026 es jueves: la semana arranca el lunes 27.
    expect(fromIso).toBe(new Date(2026, 6, 27).toISOString())
    expect(toIso).toBe(new Date(2026, 7, 3).toISOString())
    expect(week.totalMinutes).toBe(300)
    expect(week.progress?.percent).toBe(50)
  })

  it('una materia con objetivo sin tocar aparece a cero', async () => {
    listSubjects.mockResolvedValue([{ ...SAVED_SUBJECT, weekly_target_minutes: 300 }])
    listSessionsBetween.mockResolvedValue([])

    const week = await studyService.getWeekStudy(USER_ID, DATE)

    expect(week.bySubject).toHaveLength(1)
    expect(week.bySubject[0]?.minutes).toBe(0)
  })

  it('traduce un fallo del repositorio a un error con mensaje humano', async () => {
    listSubjects.mockRejectedValue(new Error('connection terminated unexpectedly'))

    const error: unknown = await studyService.getWeekStudy(USER_ID, DATE).catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('connection')
  })
})

describe('studyService.getDayStudy', () => {
  it('acota el día por hora local y suma lo estudiado', async () => {
    listSessionsBetween.mockResolvedValue([session('a', 50), session('b', 25)])

    const day = await studyService.getDayStudy(USER_ID, DATE)

    const [userId, fromIso, toIso] = listSessionsBetween.mock.calls[0] ?? []
    expect(userId).toBe(USER_ID)
    expect(fromIso).toBe(new Date(2026, 6, 30).toISOString())
    expect(toIso).toBe(new Date(2026, 6, 31).toISOString())
    expect(day.totalMinutes).toBe(75)
    expect(day.bySubject).toEqual([{ subject: CALCULO, minutes: 75 }])
  })

  it('un día sin sesiones no falla: devuelve el día a cero', async () => {
    const day = await studyService.getDayStudy(USER_ID, DATE)

    expect(day).toEqual({ sessions: [], totalMinutes: 0, bySubject: [] })
  })
})
