import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'

import type { CreateSubjectValues, LogStudyValues } from '../schemas/study.schema'
import { studyService } from '../services/study.service'
import type { DayStudy, Subject } from '../types/study.types'
import { studyKeys } from './study.keys'

/** Las escrituras necesitan usuario; sin él, la sesión caducó. */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
}

/** Clave estable del día (local), para no depender de la hora. */
function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
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
    queryKey: studyKeys.day(userId, toDayKey(date)),
    queryFn: () => (userId ? studyService.getDayStudy(userId, date) : null),
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
