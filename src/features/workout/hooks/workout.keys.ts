/**
 * Claves de TanStack Query del módulo de entrenamiento.
 *
 * Jerárquicas a propósito: invalidar `sessions()` alcanza a la sesión en curso
 * y al historial sin tocar el catálogo de ejercicios, que rara vez cambia.
 */
export const workoutKeys = {
  all: ['workout'] as const,
  exercises: () => [...workoutKeys.all, 'exercises'] as const,
  sessions: () => [...workoutKeys.all, 'sessions'] as const,
  activeSession: (userId: string | undefined) =>
    [...workoutKeys.sessions(), 'active', userId] as const,
  history: (userId: string | undefined) => [...workoutKeys.sessions(), 'history', userId] as const,
  series: (userId: string | undefined, rangeKey: string, previousKey: string) =>
    [...workoutKeys.sessions(), 'series', userId, rangeKey, previousKey] as const,
  routines: (userId: string | undefined) => [...workoutKeys.all, 'routines', userId] as const,
  routine: (routineId: string) => [...workoutKeys.all, 'routines', 'detail', routineId] as const,
}
