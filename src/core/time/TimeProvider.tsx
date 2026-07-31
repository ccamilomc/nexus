import { type PropsWithChildren, useEffect, useMemo, useState } from 'react'

import { TimeContext } from './time.context'
import { msUntilNextTick, startOfDay } from './time.utils'

/**
 * Mantiene el reloj de la aplicación al día.
 *
 * Despierta en cada hora en punto —cuando puede cambiar el día o el saludo— y
 * también al volver a la aplicación, porque en el móvil los temporizadores no
 * corren con la pantalla apagada.
 *
 * El valor cambia como mucho una vez por hora. Eso re-renderiza a quien lo
 * consume, pero `today` conserva su referencia mientras no cambie el día: las
 * consultas no se repiten y no hay nada que repintar. Separar el instante y el
 * día en dos contextos ahorraría esos renders, y no se hace porque no hay
 * evidencia de que cuesten nada (ver la regla de optimización en CLAUDE.md).
 */
export function TimeProvider({ children }: PropsWithChildren) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    function sync() {
      setNow(new Date())
    }

    const timer = window.setTimeout(sync, msUntilNextTick(now))
    document.addEventListener('visibilitychange', sync)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [now])

  // `today` se memoriza aparte de `now`: así conserva su referencia entre horas
  // y sólo cambia cuando cambia el día de verdad.
  const dayTime = startOfDay(now).getTime()
  const today = useMemo(() => new Date(dayTime), [dayTime])
  const value = useMemo(() => ({ now, today }), [now, today])

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>
}
