import type { WorkoutSet } from '../types/workout.types'
import { formatEffort } from './effort'

export interface DescribedSet {
  readonly set: WorkoutSet
  /** «Serie 3» o «Calentamiento». */
  readonly label: string
  /** «quedaban 2», o `null` si no se anotó el esfuerzo. */
  readonly effort: string | null
}

/**
 * Cómo se lee cada serie en la lista del ejercicio.
 *
 * **Los calentamientos no gastan número.** Si contaran, tres de calentamiento
 * harían que la primera de verdad se llamara «Serie 4», y el resto de la
 * aplicación —el volumen, el progreso, la última vez— no las cuenta. Que la
 * lista dijera una cosa y las cifras otra es justo el desajuste que hace
 * desconfiar de los números.
 *
 * Se calcula aquí y no en el componente porque la regla del numerado es una
 * decisión, no una forma de pintar: en cuanto vive en el JSX deja de poder
 * probarse.
 */
export function describeSets(sets: readonly WorkoutSet[]): readonly DescribedSet[] {
  let numbered = 0

  return sets.map((set) => {
    if (set.is_warmup) {
      // Un calentamiento no se juzga por lo que costó: la pantalla ni siquiera
      // ofrece anotarlo. Si viniera un RPE de otra parte, no se enseña.
      return { set, label: 'Calentamiento', effort: null }
    }

    numbered += 1

    return { set, label: `Serie ${numbered}`, effort: formatEffort(set.rpe) }
  })
}
