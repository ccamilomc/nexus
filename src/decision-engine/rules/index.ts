import type { Rule } from '../contracts/rule.types'
import { alternativeRoutineRule } from './alternative-routine'
import { habitsPendingRule } from './habits-pending'
import { mealSwapRule } from './meal-swap'
import { sleepShortRule } from './sleep-short'
import { studyBehindRule } from './study-behind'
import { waterPendingRule } from './water-pending'
import { workoutGapRule } from './workout-gap'
import { workoutOpenSessionRule } from './workout-open-session'

/**
 * Registro de reglas del motor. Cada regla vive en su propio archivo.
 *
 * Las primeras miran lo que **ya se registra** y responden «¿qué me falta hoy?».
 * Las **insignia** del Sprint 13 no recuerdan lo pendiente: proponen una
 * decisión mejor (`meal-swap`) o rebajan el listón a algo que todavía cabe
 * (`alternative-routine`). Falta `day_recalculation`, que se añadirá aquí sin
 * tocar nada más — el orden de la lista no importa, el motor ordena por
 * prioridad.
 */
export const rules: readonly Rule[] = [
  waterPendingRule,
  habitsPendingRule,
  workoutGapRule,
  workoutOpenSessionRule,
  studyBehindRule,
  sleepShortRule,
  mealSwapRule,
  alternativeRoutineRule,
]
