/**
 * Claves de TanStack Query del módulo de estudio.
 *
 * Jerárquicas: invalidar `days()` refresca lo estudiado sin volver a pedir las
 * materias, que cambian mucho menos.
 */
export const studyKeys = {
  all: ['study'] as const,
  subjects: (userId: string | undefined) => [...studyKeys.all, 'subjects', userId] as const,
  days: () => [...studyKeys.all, 'days'] as const,
  activeSession: (userId: string | undefined) => [...studyKeys.all, 'active', userId] as const,
  day: (userId: string | undefined, dayKey: string) =>
    [...studyKeys.days(), userId, dayKey] as const,
  week: (userId: string | undefined, dayKey: string) =>
    [...studyKeys.days(), 'week', userId, dayKey] as const,
}
