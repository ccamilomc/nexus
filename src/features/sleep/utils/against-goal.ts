/**
 * Diferencia por debajo de la cual se considera cumplido.
 *
 * Nadie duerme clavado a su objetivo, y decir «te faltaron 4 minutos» convierte
 * un cuarto de hora de margen en un suspenso. Un cuarto de hora es ruido de
 * acostarse antes o después, no un patrón.
 */
const TOLERANCE_MINUTES = 15

/** Cómo va la media frente a lo que uno se propuso dormir. */
export interface SleepAgainstGoal {
  readonly meetsGoal: boolean
  /** Minutos que faltan para el objetivo; `0` si se cumple. */
  readonly missingMinutes: number
  readonly targetMinutes: number
}

/**
 * Compara lo que se duerme de media con lo que se quiere dormir.
 *
 * Los dos números estaban en la pantalla y **no se cruzaban nunca**: la media
 * arriba de la lista y el objetivo al final de la página, con siete noches en
 * medio. Para saber si uno duerme lo que se propone había que recordar una cifra
 * mientras se hacía scroll.
 *
 * No es una opinión sobre cuánto hay que dormir —esa cifra la pone el usuario en
 * su objetivo—, sino la resta que él mismo pidió al fijarla.
 *
 * `null` cuando falta cualquiera de los dos: sin objetivo no hay contra qué
 * medir, y sin noches registradas no hay media.
 */
export function compareWithGoal(
  averageMinutes: number | null,
  targetMinutes: number | null,
): SleepAgainstGoal | null {
  if (averageMinutes === null || targetMinutes === null || targetMinutes <= 0) return null

  const missing = targetMinutes - averageMinutes

  return {
    meetsGoal: missing <= TOLERANCE_MINUTES,
    missingMinutes: missing <= TOLERANCE_MINUTES ? 0 : Math.round(missing),
    targetMinutes,
  }
}
