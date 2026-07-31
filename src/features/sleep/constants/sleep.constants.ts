/**
 * Cómo se describe la calidad del sueño.
 *
 * Cinco niveles con nombre, no estrellas: «regular» dice algo, tres estrellas
 * no. El texto también es lo que oye quien usa un lector de pantalla.
 */
export const QUALITY_LABELS: Readonly<Record<number, string>> = {
  1: 'Muy mala',
  2: 'Mala',
  3: 'Regular',
  4: 'Buena',
  5: 'Muy buena',
}

export const QUALITY_VALUES = [1, 2, 3, 4, 5] as const

/** Horas típicas, para no teclear en el móvil recién despierto. */
export const COMMON_BEDTIMES = ['22:00', '23:00', '00:00'] as const
export const COMMON_WAKE_TIMES = ['06:00', '07:00', '08:00'] as const
