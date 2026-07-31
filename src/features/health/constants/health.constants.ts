import { Constants } from '@/core/supabase/database.types'

import type { BodyMetricType } from '../types/health.types'

/** Nombre de cada medida, como lo diría el usuario. */
export const METRIC_LABELS: Readonly<Record<BodyMetricType, string>> = {
  weight: 'Peso',
  body_fat: 'Grasa corporal',
  waist: 'Cintura',
  hip: 'Cadera',
  chest: 'Pecho',
  arm: 'Brazo',
  thigh: 'Muslo',
  neck: 'Cuello',
}

/**
 * Unidad de cada medida.
 *
 * Se guarda en la fila (`unit`) además de aquí: una medición vieja conserva la
 * unidad con la que se tomó aunque mañana cambie la convención.
 */
export const METRIC_UNITS: Readonly<Record<BodyMetricType, string>> = {
  weight: 'kg',
  body_fat: '%',
  waist: 'cm',
  hip: 'cm',
  chest: 'cm',
  arm: 'cm',
  thigh: 'cm',
  neck: 'cm',
}

/**
 * Orden en que se ofrecen: el peso primero porque es el que más se mide.
 *
 * Se valida contra `Constants` para que añadir un tipo en la base obligue a
 * decidir su sitio y su unidad, en vez de que desaparezca en silencio.
 */
export const METRIC_TYPES_IN_ORDER: readonly BodyMetricType[] = [
  'weight',
  'body_fat',
  'waist',
  'hip',
  'chest',
  'arm',
  'thigh',
  'neck',
]

export const ALL_METRIC_TYPES: readonly BodyMetricType[] = Constants.public.Enums.body_metric_type
