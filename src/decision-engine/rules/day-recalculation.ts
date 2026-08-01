import type { DailyContext, PlanItemSnapshot } from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'
import { formatMinutes } from './format'

/**
 * Margen antes de dar algo por atrasado.
 *
 * Empezar diez minutos tarde no es un plan roto, es la vida. Avisar por eso
 * convertiría el plan en un capataz.
 */
const LATE_MINUTES = 30

/** Hora a la que se da el día por cerrado para calcular lo que aún cabe. */
const END_OF_DAY_HOUR = 23

/** Duración que se supone a un elemento sin hora de fin. */
const DEFAULT_ITEM_MINUTES = 30

/**
 * Recalcula el día cuando lo planeado se ha ido de las manos.
 *
 * Es la tercera regla insignia, y la única que mira **el plan que el usuario se
 * puso**, no lo que registró. Compara lo que queda por hacer con las horas que
 * quedan de día y dice la verdad: si no cabe, no cabe.
 *
 * Que lo diga en vez de callar es el punto. Un plan que se acumula sin avisar
 * termina abandonado entero; uno que reconoce a tiempo que sobra una cosa se
 * puede salvar. Pero **no reprograma nada por su cuenta**: propone qué mover, y
 * mover es decisión del usuario (ver docs/06).
 */
export const dayRecalculationRule: Rule = {
  id: 'day-recalculation@1',

  appliesTo(context: DailyContext): boolean {
    return pending(context).length > 0 && minutesLeft(context) >= 0
  },

  evaluate(context: DailyContext): readonly Recommendation[] {
    const items = pending(context)
    const needed = items.reduce((total, item) => total + estimate(item), 0)
    const available = minutesLeft(context)

    // Si cabe, el plan no necesita ayuda: callar es la respuesta correcta.
    if (needed <= available) return []

    const late = items.filter((item) => isLate(item, context.now))
    const excess = needed - available

    return [
      {
        key: 'day-recalculation@1',
        type: 'day_recalculation',
        priority: 'high',
        title: 'El día ya no da para todo lo que queda',
        message: `Te sobran ${formatMinutes(excess)} de plan. Mueve algo a mañana antes de que lo decida el reloj.`,
        reason:
          late.length > 0
            ? `Quedan ${describeItems(items.length)} por hacer (${formatMinutes(needed)}) y ${formatMinutes(available)} de día. ${describeLate(late)}`
            : `Quedan ${describeItems(items.length)} por hacer (${formatMinutes(needed)}) y sólo ${formatMinutes(available)} de día.`,
        data: {
          pendingItems: items.length,
          neededMinutes: needed,
          availableMinutes: available,
          excessMinutes: excess,
          lateItemIds: late.map(({ id }) => id),
        },
      },
    ]
  },
}

/** Lo que sigue sin hacerse: ni terminado, ni descartado, ni movido. */
function pending(context: DailyContext): readonly PlanItemSnapshot[] {
  return context.plan.filter(({ status }) => status === 'pending' || status === 'in_progress')
}

/**
 * Minutos que quedan de día útil.
 *
 * Se cuenta hasta las 23:00, no hasta medianoche: la última hora no es tiempo
 * de plan, y prometerla haría que el aviso llegara siempre demasiado tarde.
 */
function minutesLeft(context: DailyContext): number {
  const now = new Date(context.now)
  if (Number.isNaN(now.getTime())) return 0

  const end = new Date(now)
  end.setHours(END_OF_DAY_HOUR, 0, 0, 0)

  return Math.max(0, Math.round((end.getTime() - now.getTime()) / 60_000))
}

/** Cuánto se supone que cuesta un elemento del plan. */
function estimate(item: PlanItemSnapshot): number {
  if (item.estimatedMinutes !== undefined) return item.estimatedMinutes
  if (item.scheduledStart === undefined || item.scheduledEnd === undefined) {
    return DEFAULT_ITEM_MINUTES
  }

  const minutes = Math.round(
    (new Date(item.scheduledEnd).getTime() - new Date(item.scheduledStart).getTime()) / 60_000,
  )

  return Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_ITEM_MINUTES
}

/** Su hora ya pasó con holgura y sigue sin hacerse. */
function isLate(item: PlanItemSnapshot, nowIso: string): boolean {
  if (item.scheduledStart === undefined) return false

  const start = new Date(item.scheduledStart).getTime()
  const now = new Date(nowIso).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(now)) return false

  return now - start > LATE_MINUTES * 60_000
}

function describeItems(count: number): string {
  return count === 1 ? '1 cosa' : `${count} cosas`
}

function describeLate(late: readonly PlanItemSnapshot[]): string {
  return late.length === 1
    ? 'Una de ellas ya pasó de su hora.'
    : `${late.length} de ellas ya pasaron de su hora.`
}
