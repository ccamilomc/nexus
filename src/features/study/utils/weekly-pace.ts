/** Lo que hace falta al día para llegar al objetivo antes de que acabe la semana. */
export interface WeeklyPace {
  /** Días que quedan de semana, contando hoy. */
  readonly daysLeft: number
  /** Minutos por día que salen si se reparte lo que falta. */
  readonly perDayMinutes: number
}

/**
 * El ritmo que hace falta para llegar al objetivo semanal.
 *
 * «Te faltan 4 h 50 min» no dice lo mismo un lunes que un domingo, y es el
 * mismo texto en los dos casos. Repartir lo que queda entre los días que
 * quedan convierte esa cifra en algo que se puede hacer hoy.
 *
 * Devuelve `null` cuando no hay ritmo que calcular: sin objetivo, o ya cumplido.
 * El domingo sale `daysLeft: 1`, así que el ritmo es lo que falta entero — la
 * pantalla lo dice con otras palabras en vez de repetir la misma cifra dos veces.
 *
 * La semana es de lunes a domingo, como en el resto de la aplicación.
 */
export function weeklyPace(remainingMinutes: number, today: Date): WeeklyPace | null {
  if (remainingMinutes <= 0) return null

  const weekday = today.getDay()
  const daysLeft = weekday === 0 ? 1 : 8 - weekday

  return {
    daysLeft,
    perDayMinutes: Math.ceil(remainingMinutes / daysLeft),
  }
}
