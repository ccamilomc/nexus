import { Progress } from '@/shared/components/ui/progress'
import type { GoalProgress } from '@/shared/utils'

interface GoalProgressRowProps {
  readonly label: string
  readonly progress: GoalProgress
  /** Cómo se escribe cada cifra (kcal, gramos, mililitros…). */
  readonly format: (value: number) => string
}

/** Una fila de avance: cuánto llevas, cuánto es la meta y cuánto falta. */
export function GoalProgressRow({ label, progress, format }: GoalProgressRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {format(progress.consumed)} / {format(progress.target)}
        </span>
      </div>

      <Progress
        value={progress.percent}
        label={`${label}: ${progress.percent}% del objetivo`}
        isExceeded={progress.isExceeded}
      />

      <p className="text-xs text-muted-foreground">
        {progress.isExceeded
          ? `Te pasaste por ${format(progress.consumed - progress.target)}.`
          : progress.remaining === 0
            ? '¡Objetivo cumplido!'
            : `Te faltan ${format(progress.remaining)}.`}
      </p>
    </div>
  )
}
