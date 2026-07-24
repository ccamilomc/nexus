import { useEffect, useState } from 'react'

const TICK_MS = 1_000

function secondsSince(startedAt: string): number {
  const elapsed = Date.now() - new Date(startedAt).getTime()
  return Number.isFinite(elapsed) ? Math.max(0, Math.floor(elapsed / TICK_MS)) : 0
}

/**
 * Segundos transcurridos desde `startedAt`, actualizados cada segundo.
 *
 * Se recalcula siempre desde la hora de inicio (no acumulando ticks), de modo
 * que el cronómetro sigue siendo correcto si el móvil suspende la pestaña.
 */
export function useElapsedSeconds(startedAt: string): number {
  const [seconds, setSeconds] = useState(() => secondsSince(startedAt))

  useEffect(() => {
    setSeconds(secondsSince(startedAt))
    const interval = setInterval(() => setSeconds(secondsSince(startedAt)), TICK_MS)
    return () => clearInterval(interval)
  }, [startedAt])

  return seconds
}
