import { toAppError } from '@/core/error'
import type { Recommendation } from '@/decision-engine'
import { toDateKey } from '@/shared/utils'

import { planningRepository } from '../repositories/planning.repository'
import type { PlanItemValues } from '../schemas/planning.schema'
import type { DismissedRow, PlanItem, TodayPlan } from '../types/planning.types'

/** Dónde se guarda la clave dentro de `data`, para poder reconocerla al leer. */
const RULE_KEY_FIELD = 'ruleKey'

/**
 * Reglas de negocio del plan del día.
 *
 * El plan **no persiste las recomendaciones**: se recalculan en cada visita a
 * partir de lo registrado, que es lo que las mantiene ciertas. Lo que sí se
 * guarda es el descarte, porque es una decisión del usuario y el motor no
 * puede deducirla de ningún dato.
 */
export const planningService = {
  /** Las claves que el usuario ya descartó y siguen vigentes. */
  async getDismissedKeys(userId: string, now: Date): Promise<readonly string[]> {
    try {
      const rows = await planningRepository.listDismissed(userId, now.toISOString())

      return rows.map(readRuleKey).filter((key): key is string => key !== null)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Descarta una recomendación durante el resto del día.
   *
   * Caduca a medianoche a propósito: el descarte dice «hoy no», no «nunca
   * más». Mañana el contexto es otro y la sugerencia merece volver a hacerse.
   * Silenciarla para siempre exigiría preguntarlo, y no se ha preguntado.
   */
  async dismiss(userId: string, recommendation: Recommendation, now: Date): Promise<void> {
    try {
      await planningRepository.insertDismissed({
        user_id: userId,
        type: recommendation.type,
        ...(recommendation.domain ? { domain: recommendation.domain } : {}),
        priority: recommendation.priority,
        title: recommendation.title,
        message: recommendation.message,
        reason: recommendation.reason,
        status: 'dismissed',
        data: { ...recommendation.data, [RULE_KEY_FIELD]: recommendation.key },
        valid_until: endOfDay(now).toISOString(),
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  // ─── El plan que se pone el usuario ─────────────────────────────────────
  /**
   * El plan de hoy; `null` si aún no hay nada planeado.
   *
   * No se crea la fila al abrir la pantalla: un día sin nada planeado no
   * necesita una. Nace con el primer elemento (ver `addPlanItem`).
   */
  async getTodayPlan(userId: string, today: Date): Promise<TodayPlan | null> {
    try {
      const plan = await planningRepository.findPlan(userId, toDateKey(today))
      if (!plan) return null

      return { id: plan.id, items: await planningRepository.listItems(plan.id) }
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Añade algo al plan de hoy, creando el plan si es lo primero. */
  async addPlanItem(userId: string, today: Date, values: PlanItemValues): Promise<void> {
    try {
      const dateKey = toDateKey(today)
      const plan =
        (await planningRepository.findPlan(userId, dateKey)) ??
        (await planningRepository.insertPlan(userId, dateKey))

      const existing = await planningRepository.listItems(plan.id)
      const schedule = scheduleOf(today, values)

      await planningRepository.insertItem({
        daily_plan_id: plan.id,
        title: values.title.trim(),
        domain: values.domain,
        status: 'pending',
        priority: 'medium',
        // Al final de la lista: el orden lo decide quien planifica, no nosotros.
        order_index: existing.length,
        ...schedule,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Marca un elemento del plan como hecho, saltado o de vuelta a pendiente. */
  async setPlanItemStatus(itemId: string, status: PlanItem['status']): Promise<void> {
    try {
      await planningRepository.updateItem(itemId, { status })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Quita algo del plan. */
  async removePlanItem(itemId: string): Promise<void> {
    try {
      await planningRepository.softDeleteItem(itemId, new Date().toISOString())
    } catch (error) {
      throw toAppError(error)
    }
  },
}

/**
 * Convierte la hora del formulario en instantes del día.
 *
 * Sin hora no se inventa ninguna: un elemento puede ser «hoy» sin ser «hoy a
 * las». Poner una hora falsa haría que el motor la tomara por buena y avisara
 * de retrasos que nadie ha sufrido.
 */
function scheduleOf(today: Date, values: PlanItemValues) {
  if (!values.startTime) return {}

  const [hours, minutes] = values.startTime.split(':').map(Number)
  if (hours === undefined || minutes === undefined) return {}

  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)
  const duration = values.durationMinutes

  return {
    scheduled_start: start.toISOString(),
    ...(duration === undefined
      ? {}
      : { scheduled_end: new Date(start.getTime() + duration * 60_000).toISOString() }),
  }
}

/** La clave guardada en `data`; `null` si la fila no la trae. */
function readRuleKey({ data }: DismissedRow): string | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null

  const key = data[RULE_KEY_FIELD]
  return typeof key === 'string' ? key : null
}

/** Medianoche local del día siguiente: hasta ahí dura el descarte. */
function endOfDay(now: Date): Date {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  end.setDate(end.getDate() + 1)

  return end
}
