import type {
  ExerciseRef,
  LogSetInput,
  SessionDetail,
  SessionExercise,
  WorkoutSet,
} from '../types/workout.types'
import { calculateSessionStats } from './session-stats'

/**
 * Qué número le toca a la siguiente serie de un ejercicio.
 *
 * Sale de lo que ya está en pantalla, no de una consulta. **Hace falta para
 * poder enseñar la serie antes de que salga**: sin red no hay a quién
 * preguntarle, y la pantalla la pinta como «Serie 3». De paso se ahorra el
 * viaje que antes se hacía con red para algo que la sesión abierta ya sabe.
 *
 * Cuenta **las series ya apuntadas**, incluidas las que todavía esperan a que
 * vuelva la red: dos series seguidas sin conexión son la 1 y la 2, no dos veces
 * la 1.
 */
export function nextSetNumber(session: SessionDetail | null, exerciseId: string): number {
  const sets = session?.exercises.find(({ exercise }) => exercise.id === exerciseId)?.sets ?? []

  return sets.reduce((highest, set) => Math.max(highest, set.set_number), 0) + 1
}

/**
 * De dónde sale el ejercicio para poder pintar la serie sin preguntar al servidor.
 *
 * Se mira en tres sitios y en este orden, porque cada uno cubre un caso:
 *
 * 1. **Las series ya apuntadas**, si no es la primera del ejercicio.
 * 2. **El plan del día**, que es de donde salen los ejercicios al entrenar con
 *    rutina — el caso normal, y el que se escapaba: la primera serie de cada
 *    ejercicio no llegaba a pintarse, y las tres siguientes salían numeradas 1.
 * 3. **El catálogo**, para lo que se añade a mano fuera de la rutina.
 *
 * Sin ninguno de los tres devuelve `null` y no se pinta nada por adelantado, que
 * es preferible a inventarse un nombre.
 */
export function findExerciseRef(
  session: SessionDetail | null,
  catalogue: readonly ExerciseRef[] | undefined,
  exerciseId: string,
): ExerciseRef | null {
  const inSession = session?.exercises.find(({ exercise }) => exercise.id === exerciseId)?.exercise
  if (inSession) return inSession

  const inPlan = session?.plan?.exercises.find(
    ({ exercise }) => exercise.id === exerciseId,
  )?.exercise
  if (inPlan) return inPlan

  return catalogue?.find((exercise) => exercise.id === exerciseId) ?? null
}

/**
 * La sesión con la serie recién apuntada, para enseñarla antes de que salga.
 *
 * Si es la primera serie del ejercicio, éste entra al final: es el orden del
 * entrenamiento real, donde cada ejercicio aparece donde se registró su primera
 * serie. Las cifras se recalculan con la misma función que las calcula al
 * leerlas del servidor, para que no puedan discrepar.
 */
export function addSetToSession(
  session: SessionDetail,
  input: LogSetInput,
  exercise: ExerciseRef,
): SessionDetail {
  const set: WorkoutSet = {
    id: input.id,
    session_id: input.sessionId,
    exercise_id: input.exerciseId,
    set_number: input.setNumber,
    reps: input.reps,
    weight: input.weightKg,
    is_warmup: input.isWarmup ?? false,
    completed: true,
    rpe: input.rpe ?? null,
    deleted_at: null,
    created_at: new Date(input.loggedAt).toISOString(),
    updated_at: new Date(input.loggedAt).toISOString(),
  }

  const exercises = appendSet(session.exercises, set, exercise)

  return {
    ...session,
    exercises,
    stats: calculateSessionStats(session.session, exercises),
  }
}

/** Añade la serie a su ejercicio, o abre el ejercicio si es la primera. */
function appendSet(
  exercises: readonly SessionExercise[],
  set: WorkoutSet,
  exercise: ExerciseRef,
): readonly SessionExercise[] {
  const isKnown = exercises.some((entry) => entry.exercise.id === exercise.id)

  if (!isKnown) return [...exercises, { exercise, sets: [set] }]

  return exercises.map((entry) =>
    entry.exercise.id === exercise.id ? { ...entry, sets: [...entry.sets, set] } : entry,
  )
}
