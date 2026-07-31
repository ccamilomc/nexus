import type { Bmi } from '../types/health.types'

const CM_PER_METER = 100

/** Cortes de la OMS para población adulta. */
const CATEGORIES: readonly { readonly max: number; readonly label: string }[] = [
  { max: 18.5, label: 'Bajo peso' },
  { max: 25, label: 'Peso normal' },
  { max: 30, label: 'Sobrepeso' },
  { max: Number.POSITIVE_INFINITY, label: 'Obesidad' },
]

/**
 * Índice de masa corporal a partir del peso y la altura.
 *
 * Devuelve `null` si falta la altura o los datos son imposibles: sin altura no
 * hay IMC, y **inventar uno sería peor que no mostrarlo**.
 *
 * Es una referencia general, no un diagnóstico: no distingue músculo de grasa
 * ni sirve igual para todas las complexiones. La interfaz lo dice claramente.
 */
export function calculateBmi(weightKg: number, heightCm: number | null): Bmi | null {
  if (heightCm === null || heightCm <= 0 || weightKg <= 0) return null

  const meters = heightCm / CM_PER_METER
  const value = Math.round((weightKg / (meters * meters)) * 10) / 10

  if (!Number.isFinite(value)) return null

  const category = CATEGORIES.find(({ max }) => value < max)?.label ?? 'Obesidad'

  return { value, category }
}
