import {
  MODULES_NEEDING_BODY,
  MODULES_WITH_GOALS,
  type TrackableId,
} from '../constants/onboarding.constants'

export type StepId = 'welcome' | 'modules' | 'body' | 'goals' | 'done'

/**
 * Qué pantallas se enseñan, según lo que la persona dijo que va a seguir.
 *
 * **Es lo que hace corta la bienvenida.** Preguntar la estatura a quien sólo
 * quiere apuntar gastos, o unas calorías objetivo a quien no va a usar
 * nutrición, es pedir datos que no se van a usar; y cada pregunta de más es una
 * oportunidad más de cerrar la aplicación y no volver.
 *
 * Las dos primeras y la última siempre están: sin saber qué sigues no hay nada
 * que ajustar, y sin la última nadie sabe por dónde empezar, que es justo el
 * problema que esta bienvenida existe para resolver.
 */
export function stepsFor(tracked: readonly TrackableId[]): readonly StepId[] {
  const steps: StepId[] = ['welcome', 'modules']

  if (tracked.some((id) => MODULES_NEEDING_BODY.includes(id))) steps.push('body')
  if (tracked.some((id) => MODULES_WITH_GOALS.includes(id))) steps.push('goals')

  steps.push('done')

  return steps
}
