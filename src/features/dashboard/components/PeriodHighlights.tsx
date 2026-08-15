import { ArrowDown, ArrowUp } from 'lucide-react'

import { useFinanceSeries } from '@/features/finance'
import { useHabitsSeries } from '@/features/habits'
import { formatCalories, formatCop, useNutritionSeries } from '@/features/nutrition'
import { useSleepSeries } from '@/features/sleep'
import { useStudySeries } from '@/features/study'
import { useWorkoutSeries } from '@/features/workout'
import { Card, CardContent } from '@/shared/components/ui/card'
import { formatMinutes } from '@/shared/utils'

import type { PeriodWindow } from '../types/dashboard.types'
import { formatVolumeKg } from '../utils/format'
import { type HighlightCandidate, pickHighlights } from '../utils/highlights'

/** Cuántos titulares caben sin volver a ser una lista que hay que leer entera. */
const MAX_HIGHLIGHTS = 3

const DIRECTION_ICONS = { up: ArrowUp, down: ArrowDown }

/**
 * Un candidato a titular a partir de dos cifras.
 *
 * `describe` recibe **la diferencia ya en positivo** y hacia dónde fue, para
 * que cada dominio sólo tenga que poner su unidad y su verbo. Los números se
 * capturan aquí, así que la frase no depende de que la consulta siga cargada.
 */
function change(
  domain: string,
  current: number | null,
  previous: number | null,
  describe: (delta: number, word: 'más' | 'menos') => string,
): HighlightCandidate {
  const delta = Math.abs((current ?? 0) - (previous ?? 0))

  return {
    domain,
    current,
    previous,
    text: (direction) => describe(delta, direction === 'up' ? 'más' : 'menos'),
  }
}

/**
 * Lo que más se movió en el periodo, arriba del todo.
 *
 * El dashboard son veintiocho cifras repartidas en siete secciones: todas
 * ciertas, y ninguna dice por dónde empezar a mirar. Esto lo dice, y sólo eso.
 *
 * **Cada frase la escribe su dominio**, no esta pantalla: sólo nutrición sabe
 * que las calorías se dicen «kcal» y sólo finanzas que los pesos van sin
 * decimales.
 *
 * **Salud no entra a propósito.** Es el único dominio que no compara ni opina
 * —el peso se acompaña, no se juzga— y meterlo aquí sería lo contrario.
 *
 * No cuesta consultas: son las mismas claves que ya piden las secciones de
 * abajo, así que TanStack las sirve de su caché.
 */
export function PeriodHighlights({ window }: { readonly window: PeriodWindow }) {
  const finance = useFinanceSeries(window.days, window.previousDays)
  const workout = useWorkoutSeries(
    window.range,
    window.previousRange,
    window.days,
    window.previousDays,
  )
  const nutrition = useNutritionSeries(
    window.range,
    window.previousRange,
    window.days,
    window.previousDays,
  )
  const habits = useHabitsSeries(window.days, window.previousDays)
  const study = useStudySeries(window.range, window.previousRange, window.days, window.previousDays)
  const sleep = useSleepSeries(window.days, window.previousDays)

  const candidates: HighlightCandidate[] = []

  if (finance.data) {
    const { totalExpense, previousTotalExpense } = finance.data
    candidates.push(
      change(
        'finance',
        totalExpense,
        previousTotalExpense,
        (delta, word) => `Gastaste ${formatCop(delta)} ${word}`,
      ),
    )
  }

  if (workout.data) {
    const { totalVolumeKg, previousTotalVolumeKg } = workout.data
    candidates.push(
      change(
        'workout',
        totalVolumeKg,
        previousTotalVolumeKg,
        (delta, word) => `Levantaste ${formatVolumeKg(delta)} ${word}`,
      ),
    )
  }

  if (nutrition.data) {
    const { averageCalories, previousAverageCalories } = nutrition.data
    candidates.push(
      change(
        'nutrition',
        averageCalories,
        previousAverageCalories,
        (delta, word) => `Comiste ${formatCalories(delta)} ${word} al día`,
      ),
    )
  }

  if (habits.data) {
    const { completionPercent, previousCompletionPercent } = habits.data
    candidates.push(
      change(
        'habits',
        completionPercent,
        previousCompletionPercent,
        (delta, word) => `Cumpliste un ${Math.round(delta)} % ${word} de tus hábitos`,
      ),
    )
  }

  if (study.data) {
    const { totalMinutes, previousTotalMinutes } = study.data
    candidates.push(
      change(
        'study',
        totalMinutes,
        previousTotalMinutes,
        (delta, word) => `Estudiaste ${formatMinutes(delta)} ${word}`,
      ),
    )
  }

  if (sleep.data) {
    const { averageMinutes, previousAverageMinutes } = sleep.data
    candidates.push(
      change(
        'sleep',
        averageMinutes,
        previousAverageMinutes,
        (delta, word) => `Dormiste ${formatMinutes(delta)} ${word} por noche`,
      ),
    )
  }

  const highlights = pickHighlights(candidates, MAX_HIGHLIGHTS)

  // Sin nada que destacar no se dibuja: una sección vacía sería una más que
  // leer, y este bloque existe justo para no tener que leerlas todas.
  if (highlights.length === 0) return null

  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
          Lo que más cambió
        </h2>
        <ul className="space-y-1.5">
          {highlights.map((highlight) => {
            const Icon = DIRECTION_ICONS[highlight.direction]

            return (
              <li key={highlight.domain} className="flex items-start gap-2 text-sm">
                {/* Gris, como en las tarjetas: la flecha dice hacia dónde se
                    movió, no si es una buena noticia. */}
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>{highlight.text}</span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
