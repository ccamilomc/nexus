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
