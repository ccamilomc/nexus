import { useToday } from '@/core/time'

import { WATER_QUICK_AMOUNTS } from '../constants/nutrition.constants'
import { formatVolumeMl } from '../utils/format'
import { useAddWater, useDayWater } from './use-nutrition'

/**
 * El atajo que se ofrece fuera de nutrición: el vaso.
 *
 * Es el registro más repetido del día y el que menos tolera fricción; la
 * botella y las cantidades a medida siguen estando en la pantalla de nutrición.
 */
const QUICK_AMOUNT = WATER_QUICK_AMOUNTS[0] ?? { ml: 250, label: 'Vaso' }

/**
 * Registrar agua desde otras pantallas (el dashboard).
 *
 * Devuelve etiquetas ya formadas y una acción sin argumentos: quien lo use no
 * necesita saber de mililitros ni de unidades, igual que con el resumen. El
 * total de hoy es a la vez el **acuse de recibo** del toque: sube en cuanto se
 * registra, sin necesidad de avisos que aparezcan y desaparezcan.
 */
export interface QuickWater {
  /** Cuánto añade un toque, ya formateado: «250 ml». */
  readonly amountLabel: string
  /** Total de hoy, ya formateado; `null` mientras se carga. */
  readonly totalLabel: string | null
  readonly isPending: boolean
  /** Mensaje humano si el registro falla; `null` si todo va bien. */
  readonly errorMessage: string | null
  readonly add: () => void
}

export function useQuickWater(): QuickWater {
  const today = useToday()
  // Misma consulta que el resumen de nutrición: TanStack Query la comparte, así
  // que la acción no cuesta ningún viaje extra.
  const { data, isPending } = useDayWater(today)
  const addWater = useAddWater()

  return {
    amountLabel: formatVolumeMl(QUICK_AMOUNT.ml),
    totalLabel: isPending ? null : formatVolumeMl(data?.totalMl ?? 0),
    isPending: addWater.isPending,
    errorMessage: addWater.isError ? addWater.error.message : null,
    add: () => addWater.mutate(QUICK_AMOUNT.ml),
  }
}
