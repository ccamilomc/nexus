import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { OFFLINE_MUTATIONS } from '@/core/offline'
import { useNow } from '@/core/time'
import { toDateKey } from '@/shared/utils'

import type { CreateSubjectValues, LogStudyValues } from '../schemas/study.schema'
import { studyService } from '../services/study.service'
import type {
  DayStudy,
  LogStudyInput,
  StudySessionWithSubject,
  Subject,
  WeekStudy,
} from '../types/study.types'
import { addMinutesToWeek, addSessionToDay } from '../utils/add-study-session'
import { buildLogStudyInput } from '../utils/study-input'
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

/**
 * Las materias retiradas. **Sólo se piden al abrirlas.**
 *
 * Es algo que se mira de vez en cuando, así que traerlas al cargar la pantalla
 * sería pagar una consulta por una lista que casi nunca se despliega.
 */
export function useRetiredSubjects(enabled: boolean) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<readonly Subject[], AppError>({
    queryKey: studyKeys.retiredSubjects(userId),
    queryFn: () => (userId ? studyService.getRetiredSubjects(userId) : []),
    enabled,
  })
}

/** Devuelve una materia retirada a la lista. */
export function useRestoreSubject() {
  const refresh = useRefreshStudy()

  return useMutation<void, AppError, string>({
    mutationFn: (subjectId) => studyService.restoreSubject(subjectId),
    onSuccess: refresh,
  })
}

/** Borra del todo una materia que nunca se llegó a usar. */
export function useDeleteSubjectForever() {
  const refresh = useRefreshStudy()

  return useMutation<void, AppError, string>({
    mutationFn: (subjectId) => studyService.deleteSubjectForever(subjectId),
    onSuccess: refresh,
  })
}

/** Registra una sesión de estudio ya terminada; el día va en los valores. */
export function useLogStudy(date: Date): LogStudyMutation {
  const { user } = useAuth()
  const now = useNow()
  const queryClient = useQueryClient()
  const refresh = useRefreshDays()
  const dayKey = studyKeys.day(user?.id, toDateKey(date))
  const weekKey = studyKeys.week(user?.id, toDateKey(date))

  const mutation = useMutation<void, AppError, LogStudyInput>({
    mutationKey: OFFLINE_MUTATIONS.logStudy,
    mutationFn: (input) => studyService.logStudy(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: dayKey })
      const previousDay = queryClient.getQueryData<DayStudy | null>(dayKey)
      const previousWeek = queryClient.getQueryData<WeekStudy | null>(weekKey)

      const subjects = queryClient.getQueryData<Subject[]>(studyKeys.subjects(user?.id)) ?? []
      const subject = subjects.find(({ id }) => id === input.subjectId)

      if (subject) {
        const { id, name, color } = subject
        queryClient.setQueryData<DayStudy | null>(dayKey, (current) =>
          addSessionToDay(current ?? null, input, { id, name, color }),
        )
        queryClient.setQueryData<WeekStudy | null>(weekKey, (current) =>
          addMinutesToWeek(current ?? null, input.subjectId, input.minutes),
        )
      }

      return { previousDay, previousWeek }
    },

    // Si falla de verdad (sin red se pausa, no falla) se deshace: unas horas de
    // estudio que no existen inflan el avance de la semana.
    onError: (_error, _input, context) => {
      const previous = context as
        { previousDay?: DayStudy | null; previousWeek?: WeekStudy | null } | undefined
      if (previous?.previousDay !== undefined)
        queryClient.setQueryData(dayKey, previous.previousDay)
      if (previous?.previousWeek !== undefined) {
        queryClient.setQueryData(weekKey, previous.previousWeek)
      }
    },

    onSettled: refresh,
  })

  const { mutate } = mutation

  return {
    // Pausada no es «en marcha»: sin red la sesión ya está guardada, y bloquear
    // impediría apuntar la siguiente materia de la misma tarde.
    isPending: mutation.isPending && !mutation.isPaused,
    error: mutation.error,

    mutate: useCallback(
      (values, options) => {
        mutate(
          buildLogStudyInput({
            id: crypto.randomUUID(),
            userId: requireUserId(user?.id),
            values,
            now,
          }),
        )
        options?.onApuntado?.()
      },
      [mutate, user?.id, now],
    ),
  }
}

/** Lo que el formulario necesita, sin las variables internas de la mutación. */
interface LogStudyMutation {
  readonly isPending: boolean
  readonly error: AppError | null
  /**
   * `onApuntado` corre **en cuanto la sesión queda a salvo**, esté enviada o
   * esperando red. No es `onSuccess`: una mutación pausada nunca lo llamaría, y
   * el formulario se quedaría con los minutos puestos como si no hubiera
   * guardado.
   */
  readonly mutate: (values: LogStudyValues, options?: { readonly onApuntado?: () => void }) => void
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
