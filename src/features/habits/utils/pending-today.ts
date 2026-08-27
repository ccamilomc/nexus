import type { HabitToday } from '../types/habits.types'

/** Un hábito que falta por hacer hoy. */
export interface PendingHabit {
  readonly id: string
  readonly name: string
}

/** Lo que falta hoy, recortado a lo que cabe en una tarjeta del panel. */
export interface PendingToday {
  readonly pending: readonly PendingHabit[]
  /** Cuántos pendientes quedan fuera de la lista. */
  readonly hiddenCount: number
  /** Si están todos hechos, para poder decirlo en vez de callar. */
  readonly isAllDone: boolean
}

/**
 * Los hábitos que faltan hoy, para poder marcarlos desde el panel.
 *
 * Se recorta porque el panel es un resumen: con quince hábitos, la tarjeta
 * pasaría a ser la pantalla de hábitos metida dentro de una tarjeta. Los que no
 * caben se cuentan y quedan a un toque en su pantalla.
 *
 * **Sólo entra lo que toca hoy.** Un hábito de lunes, miércoles y viernes no es
 * algo que falte un martes: recordarlo sería pedir que se haga algo que no
 * estaba previsto, y de paso ensuciaría el «vas al día».
 *
 * **«Todos hechos» y «no tienes hábitos» no son lo mismo**, y por eso
 * `isAllDone` exige que haya alguno **de los de hoy**: felicitar a quien no ha
 * creado ninguno, o a quien hoy no tenía nada, sería celebrar el vacío.
 */
export function pendingToday(habits: readonly HabitToday[], max: number): PendingToday {
  const deHoy = habits.filter((entry) => entry.appliesToday)
  const pending = deHoy.filter((entry) => !entry.isDoneToday)

  return {
    pending: pending.slice(0, max).map(({ habit }) => ({ id: habit.id, name: habit.name })),
    hiddenCount: Math.max(0, pending.length - max),
    isAllDone: deHoy.length > 0 && pending.length === 0,
  }
}
