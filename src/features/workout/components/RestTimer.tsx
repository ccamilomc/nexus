import { Hourglass } from 'lucide-react'

import { useElapsedSeconds } from '@/shared/hooks'
import { formatElapsed } from '@/shared/utils'

interface RestTimerProps {
  /** Cuándo se registró la última serie de la sesión. */
  readonly lastSetAt: string
}

/**
 * A partir de aquí ya no se está descansando.
 *
 * Diez minutos entre series no es un descanso, es que se dejó la aplicación
 * abierta o se está haciendo otra cosa. Pasado ese punto el contador se calla en
 * vez de decir «descansando 47:12», que sería ruido y además falso.
 */
const MAX_REST_SECONDS = 10 * 60

/**
 * Cuánto se lleva desde la última serie.
 *
 * Es lo que uno mira entre series y no estaba en ningún sitio: había que
 * acordarse de mirar el reloj al terminar. **Una sola cifra para toda la sesión**
 * —el descanso no se reinicia por cambiar de ejercicio— y en la cabecera, que es
 * donde ya se mira el tiempo total.
 *
 * **Cuenta, no avisa.** Un aviso que llegue con el móvil en el bolsillo sería
 * Web Push, que es un sprint de servidor entero
 * ([ADR-0008](../../../../docs/adr/0008-notificaciones-aplazadas.md)); y un sonido
 * con la pantalla apagada no suena. Prometer un aviso que no llega sería peor que
 * no tenerlo, así que esto es un reloj a la vista, no una alarma.
 */
export function RestTimer({ lastSetAt }: RestTimerProps) {
  const seconds = useElapsedSeconds(lastSetAt)

  if (seconds > MAX_REST_SECONDS) return null

  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Hourglass className="h-4 w-4" aria-hidden />
      Descansando
      {/* role="timer" evita que el lector de pantalla lo cante cada segundo. */}
      <span role="timer" aria-label="Tiempo desde la última serie" className="tabular-nums">
        {formatElapsed(seconds)}
      </span>
    </p>
  )
}
