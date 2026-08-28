import type { DailyContext } from '@/decision-engine'

/**
 * Si la cuenta todavía no tiene nada puesto en marcha.
 *
 * **No es lo mismo «no te falta nada» que «no has empezado».** El motor
 * devuelve cero recomendaciones en los dos casos, porque no tiene nada contra
 * lo que comparar, y hasta ahora las dos pantallas lo contaban igual: «Vas al
 * día», con un visto verde, a quien acaba de crear la cuenta y no ha registrado
 * nada. Es felicitar a alguien por no haber hecho nada, justo el primer día,
 * que es cuando se decide si la aplicación se vuelve a abrir.
 *
 * Se mira lo que el usuario **configura**, no lo que registra: objetivos,
 * hábitos, rutinas y el plan del día. Quien tiene algo de eso y no le falta
 * nada sí va al día de verdad. Quien no tiene ninguno no puede ir al día
 * todavía, porque no hay día contra el que ir.
 *
 * Sale del mismo contexto que ya recibe el motor, así que no cuesta ni una
 * consulta más.
 */
export function hasNothingSetUp(context: DailyContext): boolean {
  const { goals, habits, plan, workout } = context

  const sinObjetivos =
    goals.nutrition === undefined &&
    goals.sleepMinutes === undefined &&
    goals.studyWeeklyMinutes === undefined

  return sinObjetivos && habits.total === 0 && plan.length === 0 && workout.routineDays.length === 0
}
