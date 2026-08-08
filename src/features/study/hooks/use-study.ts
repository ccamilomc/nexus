import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import type { CreateSubjectValues, LogStudyValues } from '../schemas/study.schema'
import { studyService } from '../services/study.service'
import type { DayStudy, StudySessionWithSubject, Subject, WeekStudy } from '../types/study.types'
import { studyKeys } from './study.keys'

/** Las escrituras necesitan usuario; sin él, la sesión caducó. */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
}

/** Materias del usuario. */
export function useSubjects() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<Subject[], AppError>({
    queryKey: studyKeys.subjects(userId),
    queryFn: () => (userId ? studyService.getSubjects(userId) : []),
  })
}

/** Lo estudiado en un día, con su reparto por materia. */
export function useDayStudy(date: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<DayStudy | null, AppError>({
    queryKey: studyKeys.day(userId, toDateKey(date)),
    queryFn: () => (userId ? studyService.getDayStudy(userId, date) : null),
  })
}

/** La semana de estudio, con el avance hacia los objetivos. */
export function useWeekStudy(date: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<WeekStudy | null, AppError>({
    queryKey: studyKeys.week(userId, toDateKey(date)),
    queryFn: () => (userId ? studyService.getWeekStudy(userId, date) : null),
  })
}

/** Refresca todo el módulo tras cualquier cambio. */
function useRefreshStudy() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: studyKeys.all }),
    [queryClient],
  )
}

/** Refresca sólo lo estudiado; las materias no cambian al registrar. */
function useRefreshDays() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: studyKeys.days() }),
    [queryClient],
  )
}

export function useCreateSubject() {
  const { user } = useAuth()
  const refresh = useRefreshStudy()

  return useMutation<Subject, AppError, CreateSubjectValues>({
    mutationFn: (values) => studyService.createSubject(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

interface UpdateSubjectVariables {
  readonly subjectId: string
  readonly values: CreateSubjectValues
}

export function useUpdateSubject() {
  const refresh = useRefreshStudy()

  return useMutation<Subject, AppError, UpdateSubjectVariables>({
    mutationFn: ({ subjectId, values }) => studyService.updateSubject(subjectId, values),
    onSuccess: refresh,
  })
}

export function useDeleteSubject() {
  const refresh = useRefreshStudy()

  return useMutation<void, AppError, string>({
    mutationFn: (subjectId) => studyService.deleteSubject(subjectId),
    onSuccess: refresh,
  })
}

/** Registra una sesión de estudio ya terminada. */
export function useLogStudy() {
  const { user } = useAuth()
  const refresh = useRefreshDays()

  return useMutation<void, AppError, LogStudyValues>({
    mutationFn: (values) => studyService.logStudy(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

/** Quita una sesión registrada por error. */
export function useRemoveSession() {
  const refresh = useRefreshDays()

  return useMutation<void, AppError, string>({
    mutationFn: (sessionId) => studyService.removeSession(sessionId),
    onSuccess: refresh,
  })
}

/** La sesión que sigue corriendo, si la hay. */
export function useActiveStudySession() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<StudySessionWithSubject | null, AppError>({
    queryKey: studyKeys.activeSession(userId),
    queryFn: () => (userId ? studyService.getActiveSession(userId) : null),
  })
}

/** Refresca la sesión en curso y lo estudiado: al parar, una pasa a la otra. */
function useRefreshSessions() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: studyKeys.days() })
    return queryClient.invalidateQueries({ queryKey: studyKeys.all })
  }, [queryClient])
}

interface StartSessionVariables {
  readonly subjectId: string
  /** Duración propuesta para el bloque; `null` es un rato abierto. */
  readonly targetMinutes: number | null
}

/** Pone el cronómetro en marcha para una materia. */
export function useStartStudySession() {
  const { user } = useAuth()
  const refresh = useRefreshSessions()

  return useMutation<StudySessionWithSubject, AppError, StartSessionVariables>({
    mutationFn: ({ subjectId, targetMinutes }) =>
      studyService.startSession(requireUserId(user?.id), subjectId, targetMinutes),
    onSuccess: refresh,
  })
}

interface FinishSessionVariables {
  readonly sessionId: string
  /** Inicio guardado en el servidor: de ahí sale la duración, no del reloj local. */
  readonly startedAt: string
}

/** Para el cronómetro y guarda lo estudiado. */
export function useFinishStudySession() {
  const refresh = useRefreshSessions()

  return useMutation<void, AppError, FinishSessionVariables>({
    mutationFn: ({ sessionId, startedAt }) => studyService.finishSession(sessionId, startedAt),
    onSuccess: refresh,
  })
}

/** Descarta la sesión en curso sin registrarla. */
export function useDiscardStudySession() {
  const refresh = useRefreshSessions()

  return useMutation<void, AppError, string>({
    mutationFn: (sessionId) => studyService.discardSession(sessionId),
    onSuccess: refresh,
  })
}
