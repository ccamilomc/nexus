import type { WeightTrend } from '../types/health.types'
import type { AgainstTypical } from '../utils/against-typical'
import { formatAverage, formatTrend } from '../utils/format'

interface WeightTrendNoteProps {
  readonly trend: WeightTrend | null
  /** Dónde cae la última pesada respecto a lo normal. `null` si no se sabe. */
  readonly reading: AgainstTypical | null
}

/**
 * Hacia dónde va el peso, en lugar de la resta entre las dos últimas pesadas.
 *
 * Esa resta mide sobre todo agua: entre una pesada y otra el peso se mueve más
 * de un kilo por lo que se ha comido y bebido, así que puede decir «+1,1 kg» en
 * mitad de un mes a la baja. Aquí se comparan medias de dos semanas, que es lo
 * que cancela ese ruido.
 *
 * **Se enseña con qué se calculó.** Una tendencia hecha con dos pesadas contra
 * dos no merece la misma confianza que una con seis, y quien la lee no puede
 * saberlo si sólo ve el resultado.
 *
 * Debajo, **dónde cae la pesada de hoy**. Es otra pregunta: la tendencia dice
 * hacia dónde vas y esto dice si el número de esta mañana es raro o es martes.
 * Ver 93,5 después de 91,8 asusta, y saber que tu peso se mueve ±0,8 kg de una
 * vez a otra es lo que separa el susto del dato.
 *
 * Va en gris y sin flechas ni colores: dice hacia dónde va el peso, no si eso
 * está bien (ver docs/11-ux-ui-y-diseno.md).
 */
export function WeightTrendNote({ trend, reading }: WeightTrendNoteProps) {
  if (!trend)
    return (
      <div className="text-xs text-muted-foreground">
        <p>Con un par de pesadas más se puede saber hacia dónde va.</p>
        <ReadingLine reading={reading} />
      </div>
    )

  const weeks = trend.windowDays / 7

  return (
    <div className="text-xs text-muted-foreground">
      <p className="font-medium text-foreground">{formatTrend(trend.direction, trend.kgPerWeek)}</p>
      <p>
        {formatAverage(trend.recentAverage)} de media estas {weeks} semanas (
        {countLabel(trend.recentCount)}) · {formatAverage(trend.previousAverage)} las {weeks}{' '}
        anteriores ({countLabel(trend.previousCount)})
      </p>
      <ReadingLine reading={reading} />
    </div>
  )
}

/**
 * Dónde cae la última pesada respecto a lo normal.
 *
 * **Se calla cuando la pesada es corriente.** Decir «estás en lo tuyo» cada
 * mañana convierte el dato en ruido; la línea aparece cuando hay algo que
 * mirar, que es cuando el número se sale del vaivén de siempre.
 */
function ReadingLine({ reading }: { readonly reading: AgainstTypical | null }) {
  if (!reading?.isUnusual) return null

  const direccion = reading.difference > 0 ? 'por encima' : 'por debajo'

  return (
    <p className="mt-1">
      Esta pesada está {formatAverage(Math.abs(reading.difference))} {direccion} de tus{' '}
      {formatAverage(reading.typical)} habituales, y sueles moverte {formatAverage(reading.spread)}{' '}
      arriba o abajo.
    </p>
  )
}

function countLabel(count: number): string {
  return count === 1 ? '1 pesada' : `${count} pesadas`
}
