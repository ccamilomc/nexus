/**
 * Claves de TanStack Query del módulo de estudio.
 *
 * Jerárquicas: invalidar `days()` refresca lo estudiado sin volver a pedir las
 * materias, que cambian mucho menos.
 */
export const studyKeys = {
  all: ['study'] as const,
  subjects: (userId: string | undefined) => [...studyKeys.all, 'subjects', userId] as const,
  // Cuelga de `subjects` para que retirar o recuperar una refresque las dos
  // listas: lo que sale de una entra en la otra.
  retiredSubjects: (userId: string | undefined) =>
    [...studyKeys.subjects(userId), 'retired'] as const,
  days: () => [...studyKeys.all, 'days'] as const,
  // Bajo `days`: lo normal en un tramo sale de las mismas sesiones, y apuntar
  // una lo mueve. Lleva el día porque la ventana es móvil.
  windowTypicals: (userId: string | undefined, todayKey: string) =>
    [...studyKeys.days(), 'window-typicals', userId, todayKey] as const,
  activeSession: (userId: string | undefined) => [...studyKeys.all, 'active', userId] as const,
  day: (userId: string | undefined, dayKey: string) =>
    [...studyKeys.days(), userId, dayKey] as const,
  week: (userId: string | undefined, dayKey: string) =>
    [...studyKeys.days(), 'week', userId, dayKey] as const,
  series: (userId: string | undefined, rangeKey: string, previousKey: string) =>
    [...studyKeys.days(), 'series', userId, rangeKey, previousKey] as const,
}
