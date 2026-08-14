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
  // Cuelga de `sessions()` porque terminar un entrenamiento la deja vieja: lo
  // que se acaba de hacer pasa a ser «la última vez».
  lastPerformances: (userId: string | undefined) =>
    [...workoutKeys.sessions(), 'last-performances', userId] as const,
  series: (userId: string | undefined, rangeKey: string, previousKey: string) =>
    [...workoutKeys.sessions(), 'series', userId, rangeKey, previousKey] as const,
  // Bajo `sessions()` y no bajo `exercises()`: lo que la deja vieja es terminar
  // un entrenamiento, no editar el catálogo.
  exerciseProgress: (userId: string | undefined, exerciseId: string) =>
    [...workoutKeys.sessions(), 'exercise-progress', userId, exerciseId] as const,
  trainedExercises: (userId: string | undefined) =>
    [...workoutKeys.sessions(), 'trained-exercises', userId] as const,
  routines: (userId: string | undefined) => [...workoutKeys.all, 'routines', userId] as const,
  routineDays: (userId: string | undefined) =>
    [...workoutKeys.all, 'routines', 'days', userId] as const,
  routine: (routineId: string) => [...workoutKeys.all, 'routines', 'detail', routineId] as const,
}
