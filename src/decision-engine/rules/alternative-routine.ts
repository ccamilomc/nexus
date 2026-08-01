import type {
  DailyContext,
  PrescribedExerciseSnapshot,
  RoutineDaySnapshot,
} from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'
import { formatMinutes } from './format'
import { hourOf } from './time'

/**
 * Hora a partir de la cual el día ya no da para una sesión entera.
 *
 * La dispara **el reloj y no el sueño** a propósito: `sleep-short@1` ya habla de
 * bajar el volumen cuando se ha dormido mal, y dos reglas contando lo mismo con
 * distintas palabras es ruido. Ésta responde a otra pregunta —«se me acaba el
 * día»— y por eso puede convivir con aquélla.
 */
const LATE_HOUR = 19

/** Minutos que se le calculan a una serie, descanso incluido. */
const MINUTES_PER_SET = 3.5

/** Por debajo de dos ejercicios ya no es una sesión, es un gesto. */
const MIN_EXERCISES = 2

/** Y por encima de cuatro deja de ser una versión corta. */
const MAX_EXERCISES = 4

/**
 * Ejercicios mínimos para que acortar signifique algo.
 *
 * Un día de tres se queda en dos: no es una alternativa, es quitar uno. Con
 * cuatro ya se recorta de verdad y la propuesta se sostiene.
 */
const MIN_SHORTENABLE = 4

/**
 * Propone una versión corta de la rutina cuando el día se acaba.
 *
 * Es la segunda regla insignia: no recuerda algo pendiente, **rebaja el listón
 * a algo que todavía cabe**. Media sesión hecha vale más que una completa que se
 * queda sin hacer, y ese es exactamente el momento en que la gente lo deja.
 *
 * Elige el día de rutina que lleva **más tiempo sin tocarse**, que es el que
 * toca por rotación, y se queda con la cabeza de su lista: por convención los
 * primeros ejercicios de un día son los básicos.
 *
 * Como el resto del motor, **sugiere**: no reprograma nada ni toca la rutina.
 */
export const alternativeRoutineRule: Rule = {
  id: 'alternative-routine@1',

  appliesTo(context: DailyContext): boolean {
    if (hourOf(context.now) < LATE_HOUR) return false
    if (context.workout.activeSessionStartedAt !== undefined) return false
    if (trainedToday(context)) return false

    return context.workout.routineDays.some(({ exercises }) => exercises.length >= MIN_SHORTENABLE)
  },

  evaluate(context: DailyContext): readonly Recommendation[] {
    const day = dayDue(context)
    if (day === null) return []

    const short = day.exercises.slice(0, shortLength(day.exercises.length))
    if (short.length >= day.exercises.length) return []

    const fullMinutes = estimateMinutes(day.exercises)
    const shortMinutes = estimateMinutes(short)

    return [
      {
        type: 'alternative_routine',
        domain: 'workout',
        priority: 'medium',
        title: 'Aún cabe media sesión',
        // Se nombra el día sin adjetivarlo: «Pierna entero» no concuerda, y el
        // nombre lo pone el usuario, así que puede ser de cualquier género.
        message: `En lugar de los ${day.exercises.length} ejercicios de ${day.dayName} (${formatMinutes(fullMinutes)}), haz ${listNames(short)}: unos ${formatMinutes(shortMinutes)}.`,
        // «Pasadas las 20:00» y no «son las 20:00»: a las 20:30 lo segundo es
        // falso, y una cifra inventada resta credibilidad a todo lo demás.
        reason: `Pasadas las ${hourOf(context.now)}:00 y aún no has entrenado. Media sesión hecha cuenta más que una completa que se queda sin hacer.`,
        data: {
          routineDayId: day.id,
          routineName: day.routineName,
          dayName: day.dayName,
          exercises: short.map(({ name }) => name),
          estimatedMinutes: shortMinutes,
        },
      },
    ]
  },
}

/** Si ya se entrenó hoy no hay nada que proponer. */
function trainedToday(context: DailyContext): boolean {
  return context.workout.recentSessions.some(({ date }) => date === context.date)
}

/**
 * El día de rutina que toca: el que lleva más sin entrenarse.
 *
 * Los que no aparecen en el historial reciente van primero — nunca entrenados,
 * o hace tanto que ya no se recuerdan.
 */
function dayDue(context: DailyContext): RoutineDaySnapshot | null {
  const candidates = context.workout.routineDays.filter(
    ({ exercises }) => exercises.length >= MIN_SHORTENABLE,
  )
  if (candidates.length === 0) return null

  const lastUsed = new Map<string, string>()
  for (const session of context.workout.recentSessions) {
    if (session.routineDayId === undefined) continue

    const previous = lastUsed.get(session.routineDayId)
    if (previous === undefined || session.date > previous) {
      lastUsed.set(session.routineDayId, session.date)
    }
  }

  // Las fechas `YYYY-MM-DD` se ordenan como texto igual que como fechas, y la
  // cadena vacía queda por delante de cualquiera: los nunca usados van primero.
  return [...candidates].sort((a, b) =>
    (lastUsed.get(a.id) ?? '').localeCompare(lastUsed.get(b.id) ?? ''),
  )[0] as RoutineDaySnapshot
}

/** Cuántos ejercicios entran en la versión corta: la mitad, hacia arriba. */
function shortLength(total: number): number {
  return Math.min(MAX_EXERCISES, Math.max(MIN_EXERCISES, Math.ceil(total / 2)))
}

function estimateMinutes(exercises: readonly PrescribedExerciseSnapshot[]): number {
  const sets = exercises.reduce((total, { sets: count }) => total + count, 0)

  // Redondeado a cinco minutos: dar «37 min» finge una precisión que no existe.
  return Math.max(5, Math.round((sets * MINUTES_PER_SET) / 5) * 5)
}

/** «Sentadilla, Peso muerto y Zancadas» — con «y», no con coma final. */
function listNames(exercises: readonly PrescribedExerciseSnapshot[]): string {
  const names = exercises.map(({ name }) => name)
  if (names.length <= 1) return names[0] ?? ''

  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}
