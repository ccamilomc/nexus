import type { Rule } from '../contracts/rule.types'
import { habitsPendingRule } from './habits-pending'
import { studyBehindRule } from './study-behind'
import { waterPendingRule } from './water-pending'
import { workoutGapRule } from './workout-gap'
import { workoutOpenSessionRule } from './workout-open-session'

/**
 * Registro de reglas del motor. Cada regla vive en su propio archivo.
 *
 * Estas primeras miran lo que **ya se registra** y responden «¿qué me falta
 * hoy?». Las reglas insignia del Sprint 13 (`day_recalculation`, `meal_swap`,
 * `alternative_routine`) se añaden aquí sin tocar nada más: el orden de la lista
 * no importa, el motor ordena por prioridad.
 */
export const rules: readonly Rule[] = [
  waterPendingRule,
  habitsPendingRule,
  workoutGapRule,
  workoutOpenSessionRule,
  studyBehindRule,
]
