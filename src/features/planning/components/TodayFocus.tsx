import { ArrowRight, CalendarCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { useToday } from '@/core/time'
import { SkeletonList } from '@/shared/components/feedback'
import { WIDE_TAP_AREA } from '@/shared/constants'
import { cn } from '@/shared/lib/utils'

import { useDailyPlan } from '../hooks/use-daily-plan'
import { useDismissRecommendation } from '../hooks/use-dismissed'
import { RecommendationCard } from './RecommendationCard'

/**
 * Cuántas sugerencias caben antes de que dejen de ser un foco.
 *
 * Dos. Con cinco delante, elegir cuesta más que hacer cualquiera de ellas, y el
 * panel volvería a ser una lista que hay que leer entera. El resto sigue en
 * Plan, que es donde se gestionan.
 */
const MAX_ON_DASHBOARD = 2

/**
 * Lo que falta hoy, en la pantalla de entrada.
 *
 * **El panel tenía que responder «¿qué hago hoy?» y no lo hacía.** El motor ya
 * calculaba la respuesta, pero vivía en Plan: había que ir hasta allí para
 * descubrir que no había nada, o peor, no ir y perderse lo que sí había. Siete
 * tarjetas de resumen dicen cómo va el día; ninguna dice qué hacer con él.
 *
 * **Resume, no gestiona.** Enseña las dos más urgentes y manda el resto a Plan.
 * Traer la lista entera habría hecho de esta pantalla otra copia de aquella, y
 * entonces sobraría una de las dos.
 */
export function TodayFocus() {
  const today = useToday()
  const { isPending, recommendations, isClear } = useDailyPlan()
  const dismiss = useDismissRecommendation(today)

  if (isPending) {
    return <SkeletonList label="Mirando qué te falta hoy" rows={1} rowClassName="h-20" />
  }

  const visible = recommendations.slice(0, MAX_ON_DASHBOARD)
  const rest = recommendations.length - visible.length

  return (
    <section aria-labelledby="focus-title" className="space-y-3">
      <h2 id="focus-title" className="text-sm font-medium text-muted-foreground">
        Lo que te falta
      </h2>

      {/* Sin nada pendiente se dice en una línea, no con una tarjeta grande:
          ocupar media pantalla para anunciar que no hay nada que hacer sería
          justo el ruido que este panel tiene de más. */}
      {isClear ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
          Vas al día: nada pendiente con lo que llevas registrado.
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {visible.map((recommendation) => (
              <li key={recommendation.key}>
                <RecommendationCard
                  recommendation={recommendation}
                  onDismiss={() => dismiss.mutateAsync(recommendation)}
                  isDismissing={dismiss.isPending}
                />
              </li>
            ))}
          </ul>

          {rest > 0 ? (
            <Link
              to={ROUTES.planning}
              className={cn(
                WIDE_TAP_AREA,
                'inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline',
              )}
            >
              {rest === 1 ? 'Y una más en Plan' : `Y ${rest} más en Plan`}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : null}
        </>
      )}
    </section>
  )
}
