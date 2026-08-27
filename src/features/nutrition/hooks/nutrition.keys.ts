/**
 * Claves de TanStack Query del módulo de nutrición.
 *
 * Jerárquicas: invalidar `days()` refresca lo consumido sin tocar el catálogo
 * de alimentos, que rara vez cambia.
 */
export const nutritionKeys = {
  all: ['nutrition'] as const,
  foods: () => [...nutritionKeys.all, 'foods'] as const,
  days: () => [...nutritionKeys.all, 'days'] as const,
  day: (userId: string | undefined, isoDate: string) =>
    [...nutritionKeys.days(), userId, isoDate] as const,
  water: (userId: string | undefined, isoDate: string) =>
    [...nutritionKeys.days(), 'water', userId, isoDate] as const,
  repeatable: (userId: string | undefined, isoDate: string) =>
    [...nutritionKeys.days(), 'repeatable', userId, isoDate] as const,
  // Cuelga de `days()` para que apuntar una comida la refresque: la media de la
  // semana cambia con cada registro.
  week: (userId: string | undefined, isoDate: string) =>
    [...nutritionKeys.days(), 'week', userId, isoDate] as const,
  goal: (userId: string | undefined) => [...nutritionKeys.all, 'goal', userId] as const,
  // Cuelga de `goal` para que guardar unos objetivos nuevos refresque también
  // el histórico: los de antes acaban de pasar a serlo.
  retiredGoals: (userId: string | undefined) => [...nutritionKeys.goal(userId), 'retired'] as const,
  series: (userId: string | undefined, rangeKey: string, previousKey: string) =>
    [...nutritionKeys.days(), 'series', userId, rangeKey, previousKey] as const,
}
