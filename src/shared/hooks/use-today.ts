import { useEffect, useState } from 'react'

/** Un segundo de margen para no despertar justo en el filo del cambio de día. */
const MIDNIGHT_MARGIN_MS = 1_000

/** Medianoche local del día al que pertenece `at`. */
function startOfDay(at: Date): Date {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate())
}

/** Milisegundos que faltan hasta la próxima medianoche local. */
function msUntilTomorrow(now: Date): number {
  const tomorrow = startOfDay(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return tomorrow.getTime() - now.getTime() + MIDNIGHT_MARGIN_MS
}

/**
 * El día de hoy, **vivo**.
 *
 * Devuelve la medianoche local: representa *el día*, no el instante. Se
 * actualiza al cruzar la medianoche y al volver a la aplicación, porque en el
 * móvil los temporizadores no corren con la pantalla apagada. Sin esto, una
 * pantalla que quedó abierta anoche seguiría registrando en el día de ayer.
 *
 * La referencia sólo cambia cuando cambia el día, así que puede usarse como
 * dependencia (o como clave de consulta) sin provocar trabajo de más.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => startOfDay(new Date()))

  useEffect(() => {
    function sync() {
      const current = startOfDay(new Date())
      setToday((previous) => (previous.getTime() === current.getTime() ? previous : current))
    }

    const timer = window.setTimeout(sync, msUntilTomorrow(new Date()))
    document.addEventListener('visibilitychange', sync)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [today])

  return today
}
