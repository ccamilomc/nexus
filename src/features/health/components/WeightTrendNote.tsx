import type { WeightTrend } from '../types/health.types'
import { formatAverage, formatTrend } from '../utils/format'

interface WeightTrendNoteProps {
  readonly trend: WeightTrend | null
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
 * Va en gris y sin flechas ni colores: dice hacia dónde va el peso, no si eso
 * está bien (ver docs/11-ux-ui-y-diseno.md).
 */
export function WeightTrendNote({ trend }: WeightTrendNoteProps) {
  if (!trend)
    return (
      <p className="text-xs text-muted-foreground">
        Con un par de pesadas más se puede saber hacia dónde va.
      </p>
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
    </div>
  )
}

function countLabel(count: number): string {
  return count === 1 ? '1 pesada' : `${count} pesadas`
}
