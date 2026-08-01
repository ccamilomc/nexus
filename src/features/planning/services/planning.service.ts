import { toAppError } from '@/core/error'
import type { Recommendation } from '@/decision-engine'

import { planningRepository } from '../repositories/planning.repository'
import type { DismissedRow } from '../types/planning.types'

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
