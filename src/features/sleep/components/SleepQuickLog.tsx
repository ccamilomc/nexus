import { Moon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useNow, useToday } from '@/core/time'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { formatMinutes, toDateKey } from '@/shared/utils'

import { useLastNight, useLogSleep, useSleepHistory } from '../hooks/use-sleep'
import { sleepPattern } from '../utils/sleep-pattern'
import { sleepMinutes } from '../utils/sleep-time'

/**
 * Hasta qué hora se ofrece apuntar la noche.
 *
 * **Sólo por la mañana.** Quien no la ha apuntado a las siete de la tarde ya no
 * se acuerda de a qué hora se durmió, y confirmar un horario de memoria a esas
 * horas es inventar un dato. Pasado mediodía, la tarjeta desaparece y queda el
 * formulario de siempre.
 */
const MORNING_ENDS_AT_HOUR = 12

/**
 * Apuntar la noche de un toque, desde el panel.
 *
 * Registrar el sueño pedía entrar en su pantalla y teclear dos horas que casi
 * siempre son las mismas. Aquí se propone **tu horario habitual** —la mediana de
 * las últimas noches, no un 23:00 de fábrica— y basta con confirmarlo.
 *
 * **Se propone, no se apunta solo.** Nexus no inventa registros: una noche que
 * el usuario no confirmó no ocurrió, igual que un pago fijo no se da por pagado
 * hasta que se dice.
 */
export function SleepQuickLog() {
  const today = useToday()
  const now = useNow()
  const lastNight = useLastNight(today)
  const history = useSleepHistory()
  const logSleep = useLogSleep(today)

  // Nada que ofrecer si ya está apuntada, si no es por la mañana o si aún no hay
  // costumbre de la que hablar.
  if (lastNight.isPending || history.isPending) return null
  if (lastNight.data) return null
  if (now.getHours() >= MORNING_ENDS_AT_HOUR) return null

  const pattern = sleepPattern(history.data?.logs ?? [])
  if (!pattern) return null

  const minutes = sleepMinutes(pattern.bedtime, pattern.wakeTime)

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
            <Moon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              ¿Dormiste de {pattern.bedtime} a {pattern.wakeTime}?
            </p>
            <p className="text-sm text-muted-foreground">
              {minutes === null
                ? 'Es tu horario de siempre.'
                : `${formatMinutes(minutes)}, como sueles.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={logSleep.isPending}
            onClick={() =>
              // Desde el panel siempre es la noche de hoy: es el trago de la
              // mañana, no una corrección.
              logSleep.mutate({
                date: toDateKey(today),
                bedtime: pattern.bedtime,
                wakeTime: pattern.wakeTime,
              })
            }
          >
            {logSleep.isPending ? 'Apuntando…' : 'Sí, apúntalo'}
          </Button>

          {/* La calidad no se pregunta aquí: convertiría el toque en dos pasos y
              es opcional a propósito (ver el esquema de sueño). Quien quiera
              afinar entra, que para eso está el enlace. */}
          <Button asChild variant="ghost">
            <Link to={ROUTES.sleep}>Fue otra hora</Link>
          </Button>
        </div>

        {logSleep.error ? (
          <p role="alert" className="text-xs text-destructive">
            {logSleep.error.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
