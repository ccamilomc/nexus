import { Timer } from 'lucide-react'

import { useElapsedSeconds } from '../hooks/use-elapsed-seconds'
import { formatElapsed } from '../utils/format'

interface SessionTimerProps {
  readonly startedAt: string
}

/** Tiempo que lleva el entrenamiento en curso. */
export function SessionTimer({ startedAt }: SessionTimerProps) {
  const seconds = useElapsedSeconds(startedAt)

  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Timer className="h-4 w-4" aria-hidden />
      {/* role="timer" evita que el lector de pantalla anuncie cada segundo. */}
      <span role="timer" aria-label="Tiempo transcurrido" className="tabular-nums">
        {formatElapsed(seconds)}
      </span>
    </p>
  )
}
