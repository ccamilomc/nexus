import {
  BookOpen,
  Dumbbell,
  HeartPulse,
  type LucideIcon,
  Moon,
  Repeat,
  UtensilsCrossed,
} from 'lucide-react'

import { ROUTES } from '@/app/router/routes'

export interface DashboardItem {
  readonly to: string
  readonly label: string
  readonly Icon: LucideIcon
}

/**
 * Registros frecuentes que **llevan a su pantalla**, porque hay algo que elegir
 * (qué comiste, qué entrenaste).
 *
 * El agua no está aquí: se registra de un toque desde el propio panel, así que
 * la coloca `QuickActions` con su acción.
 */
export const QUICK_ACTIONS: readonly DashboardItem[] = [
  { to: ROUTES.workout, label: 'Entreno', Icon: Dumbbell },
  { to: ROUTES.nutrition, label: 'Comida', Icon: UtensilsCrossed },
  { to: ROUTES.habits, label: 'Hábito', Icon: Repeat },
  { to: ROUTES.study, label: 'Estudio', Icon: BookOpen },
  { to: ROUTES.sleep, label: 'Sueño', Icon: Moon },
]

export interface SummaryItem extends DashboardItem {
  readonly emptyLabel: string
}

/** Resumen por dominio. Hoy muestran estado vacío; se llenan al llegar cada feature. */
export const SUMMARY_ITEMS: readonly SummaryItem[] = [
  {
    to: ROUTES.workout,
    label: 'Entrenamiento',
    Icon: Dumbbell,
    emptyLabel: 'Sin entrenamientos registrados hoy.',
  },
  {
    to: ROUTES.nutrition,
    label: 'Nutrición',
    Icon: UtensilsCrossed,
    emptyLabel: 'Aún no registras comidas ni agua.',
  },
  {
    to: ROUTES.habits,
    label: 'Hábitos',
    Icon: Repeat,
    emptyLabel: 'Todavía no tienes hábitos activos.',
  },
  {
    to: ROUTES.study,
    label: 'Estudio',
    Icon: BookOpen,
    emptyLabel: 'Sin sesiones de estudio hoy.',
  },
  {
    to: ROUTES.sleep,
    label: 'Sueño',
    Icon: Moon,
    emptyLabel: 'Sin registro de sueño anoche.',
  },
  {
    to: ROUTES.health,
    label: 'Salud',
    Icon: HeartPulse,
    emptyLabel: 'Aún no tienes mediciones.',
  },
]
