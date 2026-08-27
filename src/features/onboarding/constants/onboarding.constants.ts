import {
  BookOpen,
  Dumbbell,
  HeartPulse,
  type LucideIcon,
  Moon,
  Repeat,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'

import { ROUTES } from '@/app/router/routes'

export type TrackableId =
  'workout' | 'nutrition' | 'sleep' | 'health' | 'habits' | 'study' | 'finance'

export interface TrackableModule {
  readonly id: TrackableId
  readonly label: string
  readonly Icon: LucideIcon
  /** Qué se lleva de aquí, en una frase corta y sin jerga. */
  readonly promise: string
  /** La primera acción concreta, para la pantalla final. */
  readonly firstStep: string
  readonly to: string
}

/**
 * Lo que Nexus puede seguir, tal como se le ofrece a alguien que entra.
 *
 * **Marcar aquí no esconde nada.** Sirve para una sola cosa: saltarse las
 * preguntas de objetivos de lo que no vas a usar. Todos los módulos siguen en el
 * menú, porque cerrar puertas el primer día a alguien que todavía no conoce la
 * aplicación es decidir por él con la peor información posible.
 *
 * El orden es el de la navegación, para que lo que se marca aquí se encuentre
 * después donde uno espera.
 */
export const TRACKABLE_MODULES: readonly TrackableModule[] = [
  {
    id: 'finance',
    label: 'Finanzas',
    Icon: Wallet,
    promise: 'En qué se te va el mes.',
    firstStep: 'Apunta un gasto de hoy',
    to: ROUTES.finance,
  },
  {
    id: 'workout',
    label: 'Entreno',
    Icon: Dumbbell,
    promise: 'Rutinas y progreso de fuerza.',
    firstStep: 'Arma tu primera rutina',
    to: ROUTES.workout,
  },
  {
    id: 'nutrition',
    label: 'Nutrición',
    Icon: UtensilsCrossed,
    promise: 'Comidas, macros y agua.',
    firstStep: 'Apunta lo que comiste hoy',
    to: ROUTES.nutrition,
  },
  {
    id: 'sleep',
    label: 'Sueño',
    Icon: Moon,
    promise: 'Cuánto y qué tan bien duermes.',
    firstStep: 'Apunta cómo dormiste anoche',
    to: ROUTES.sleep,
  },
  {
    id: 'health',
    label: 'Salud',
    Icon: HeartPulse,
    promise: 'Peso y medidas, con su tendencia.',
    firstStep: 'Apunta tu peso de hoy',
    to: ROUTES.health,
  },
  {
    id: 'habits',
    label: 'Hábitos',
    Icon: Repeat,
    promise: 'Constancia y rachas.',
    firstStep: 'Crea tu primer hábito',
    to: ROUTES.habits,
  },
  {
    id: 'study',
    label: 'Estudio',
    Icon: BookOpen,
    promise: 'Materias y horas de foco.',
    firstStep: 'Crea una materia',
    to: ROUTES.study,
  },
]

/** Módulos cuyos objetivos se pueden fijar en la bienvenida. */
export const MODULES_WITH_GOALS: readonly TrackableId[] = ['nutrition', 'sleep']

/** Módulos para los que los datos del cuerpo sirven de algo. */
export const MODULES_NEEDING_BODY: readonly TrackableId[] = ['nutrition', 'health']
