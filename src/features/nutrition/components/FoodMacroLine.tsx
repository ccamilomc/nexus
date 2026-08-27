import type { FoodRef } from '../types/nutrition.types'
import { formatCop, formatGrams } from '../utils/format'

interface FoodMacroLineProps {
  readonly food: FoodRef
}

/**
 * Lo que aporta una porción: sus macros y, si se sabe, lo que cuesta.
 *
 * Las tres cifras van con su inicial —`P`, `C`, `G`— porque sin ella son tres
 * números en gramos idénticos y hay que acordarse del orden. Quien use un lector
 * de pantalla oiría «27,5 gramos, 61,8 gramos, 19,8 gramos» sin saber de qué.
 *
 * **El precio se enseña porque aquí se decide qué comer, no para llevar
 * cuentas**: las cuentas son de finanzas y se cuentan al pagar (ver la regla del
 * dinero en el PR #68). Un alimento sin precio no dice «gratis», dice «no se
 * sabe», así que en ese caso no se escribe nada.
 */
export function FoodMacroLine({ food }: FoodMacroLineProps) {
  return (
    <p className="text-xs text-muted-foreground">
      P {formatGrams(food.protein_g)} · C {formatGrams(food.carbs_g)} · G {formatGrams(food.fat_g)}
      {food.cost_per_serving === null ? '' : ` · ${formatCop(food.cost_per_serving)}`}
    </p>
  )
}
