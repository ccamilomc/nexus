import type { DailyContext, Priority } from './contracts/context.types'
import type { Recommendation } from './contracts/recommendation.types'
import type { Rule } from './contracts/rule.types'
import { rules as defaultRules } from './rules'

const PRIORITY_WEIGHT: Readonly<Record<Priority, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/**
 * Orquestador del motor: aplica las reglas pertinentes al contexto y devuelve
 * las recomendaciones ordenadas por prioridad.
 *
 * Es **puro y determinista**: no lee el reloj (lo recibe en `context.now`), no
 * accede a la red ni a la base de datos y no persiste nada. Persistir es
 * responsabilidad del service que lo invoca.
 *
 * @param rules Registro de reglas. Se inyecta para poder probarlo en aislamiento.
 */
export function evaluate(
  context: DailyContext,
  rules: readonly Rule[] = defaultRules,
): readonly Recommendation[] {
  return rules
    .filter((rule) => rule.appliesTo(context))
    .flatMap((rule) => rule.evaluate(context))
    .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])
}
