import type { WaterLog } from '../types/nutrition.types'

/** Suma de mililitros registrados. Base del total del día. */
export function sumWaterMl(logs: readonly WaterLog[]): number {
  return logs.reduce((total, log) => total + log.amount_ml, 0)
}
