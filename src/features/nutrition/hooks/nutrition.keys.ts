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
}
