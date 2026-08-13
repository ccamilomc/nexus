import { useNow } from '@/core/time'
import { LoadFailure, Skeleton } from '@/shared/components/feedback'

import { useExerciseProgress } from '../hooks/use-exercises'
import type { ExerciseProgress } from '../types/workout.types'
import { formatSessionDate, formatWeight } from '../utils/format'

interface ExerciseProgressPanelProps {
  readonly exerciseId: string
  readonly name: string
}

/** Cuántos entrenamientos entran en la línea de progresión. */
const BARS = 12

/**
 * Cómo ha ido subiendo el peso, sin librería de gráficas.
 *
 * Recharts pesa 384 KB y vive aislado en la ruta de Analíticas a propósito;
 * traerlo aquí para doce barras cargaría ese peso en la ruta de entrenamiento.
 * Son divs con una altura proporcional, y **el dato sigue estando en texto**
 * justo encima, así que la barra adorna pero no es la única forma de leerlo.
 */
function ProgressBars({ progress, label }: { progress: ExerciseProgress; label: string }) {
  const points = progress.topWeightBySession.slice(-BARS)
  if (points.length < 2) return null

  const weights = points.map(({ weightKg }) => weightKg)
  const max = Math.max(...weights)
  const min = Math.min(...weights)
  // Con todos los pesos iguales, la resta sería cero: se dibujan todas llenas,
  // que es exactamente lo que cuenta —no se ha movido.
  const span = max - min || 1

  return (
    <div
      className="flex h-12 items-end gap-1"
      role="img"
      aria-label={`Mejor peso en los últimos ${points.length} entrenamientos de ${label}: de ${formatWeight(weights[0] ?? null)} a ${formatWeight(weights[weights.length - 1] ?? null)}`}
    >
      {points.map(({ performedAt, weightKg }) => (
        <span
          key={performedAt}
          className="flex-1 rounded-sm bg-primary/70"
          // La barra más baja se queda al 15 % para que se vea que existe.
          style={{ height: `${15 + ((weightKg - min) / span) * 85}%` }}
        />
      ))}
    </div>
  )
}

/**
 * Las marcas de un ejercicio: lo mejor que se ha hecho y cómo se llegó.
 *
 * **Dos récords y no uno.** La serie más pesada responde «¿cuánto llegué a
 * levantar?»; la de más volumen, «¿cuál fue mi mejor serie?». Un día de 100 × 1
 * y otro de 80 × 8 son logros distintos y ninguno tapa al otro.
 */
export function ExerciseProgressPanel({ exerciseId, name }: ExerciseProgressPanelProps) {
  const { data, isPending, isError, error, refetch } = useExerciseProgress(exerciseId)
  const now = useNow()

  if (isPending) {
    return (
      <div role="status" aria-label={`Cargando tus marcas de ${name}`}>
        <Skeleton className="h-20" />
      </div>
    )
  }

  if (isError) {
    return (
      <LoadFailure
        message={error.message ?? 'Vuelve a intentarlo en un momento.'}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!data || !data.heaviest) {
    return (
      <p className="text-xs text-muted-foreground">
        Todavía no lo has entrenado. Cuando registres series, aquí verás tus marcas.
      </p>
    )
  }

  const { heaviest, bestVolume } = data
  // Cuando la serie más pesada es también la de más volumen, decirlo dos veces
  // sería llenar la tarjeta para no aportar nada.
  const showBestVolume =
    bestVolume &&
    (bestVolume.set.weightKg !== heaviest.set.weightKg || bestVolume.set.reps !== heaviest.set.reps)

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <p>
          <span className="text-muted-foreground">Lo más pesado: </span>
          <span className="font-medium tabular-nums">
            {formatWeight(heaviest.set.weightKg)} × {heaviest.set.reps}
          </span>
          <span className="text-muted-foreground">
            {' '}
            · {formatSessionDate(heaviest.performedAt, now)}
          </span>
        </p>

        {showBestVolume ? (
          <p>
            <span className="text-muted-foreground">Mejor serie: </span>
            <span className="font-medium tabular-nums">
              {formatWeight(bestVolume.set.weightKg)} × {bestVolume.set.reps}
            </span>
            <span className="text-muted-foreground">
              {' '}
              · {formatSessionDate(bestVolume.performedAt, now)}
            </span>
          </p>
        ) : null}
      </div>

      <p className="text-muted-foreground">
        {data.sessionCount} {data.sessionCount === 1 ? 'entrenamiento' : 'entrenamientos'} ·{' '}
        {data.setCount} {data.setCount === 1 ? 'serie' : 'series'}
      </p>

      <ProgressBars progress={data} label={name} />
    </div>
  )
}
