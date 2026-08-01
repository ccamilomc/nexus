import type { Rule } from '../contracts/rule.types'
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
 * `meal-swap` es la primera **insignia** del Sprint 13: no recuerda algo
 * pendiente, propone una decisión mejor. Faltan `day_recalculation` y
 * `alternative_routine`, que se añaden aquí sin tocar nada más — el orden de la
 * lista no importa, el motor ordena por prioridad.
 */
export const rules: readonly Rule[] = [
  waterPendingRule,
  habitsPendingRule,
  workoutGapRule,
  workoutOpenSessionRule,
  studyBehindRule,
  sleepShortRule,
  mealSwapRule,
]
