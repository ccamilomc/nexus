import {
  BookOpen,
  CalendarCheck,
  ChartColumn,
  Dumbbell,
  HeartPulse,
  LayoutDashboard,
  type LucideIcon,
  Moon,
  Repeat,
  Settings,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'

import { ROUTES } from '@/app/router/routes'

export interface NavItem {
  readonly to: string
  readonly label: string
  readonly description: string
  readonly Icon: LucideIcon
  /** Los primarios ocupan la barra inferior en móvil; el resto vive en «Más». */
  readonly isPrimary: boolean
}

/** Navegación derivada de las rutas. Se consume en Sidebar, BottomNav y «Más». */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    to: ROUTES.dashboard,
    label: 'Hoy',
    description: 'Tu resumen del día y las acciones rápidas.',
    Icon: LayoutDashboard,
    isPrimary: true,
  },
  {
    to: ROUTES.planning,
    label: 'Plan',
    description: 'Tu plan del día, recalculado cuando algo cambia.',
    Icon: CalendarCheck,
    isPrimary: true,
  },
  {
    to: ROUTES.workout,
    label: 'Entreno',
    description: 'Rutinas, sesiones y progreso de fuerza.',
    Icon: Dumbbell,
    isPrimary: true,
  },
  {
    to: ROUTES.nutrition,
    label: 'Nutrición',
    description: 'Comidas, macros, agua y presupuesto.',
    Icon: UtensilsCrossed,
    isPrimary: true,
  },
  {
    to: ROUTES.habits,
    label: 'Hábitos',
    description: 'Constancia, rachas y calendario.',
    Icon: Repeat,
    isPrimary: false,
  },
  {
    to: ROUTES.study,
    label: 'Estudio',
    description: 'Materias y sesiones de foco.',
    Icon: BookOpen,
    isPrimary: false,
  },
  {
    to: ROUTES.sleep,
    label: 'Sueño',
    description: 'Descanso, calidad y regularidad.',
    Icon: Moon,
    isPrimary: false,
  },
  {
    to: ROUTES.health,
    label: 'Salud',
    description: 'Peso, medidas y progreso físico.',
    Icon: HeartPulse,
    isPrimary: false,
  },
  {
    to: ROUTES.analytics,
    label: 'Analíticas',
    description: 'Tendencias y comparativas de tus módulos.',
    Icon: ChartColumn,
    isPrimary: false,
  },
  {
    to: ROUTES.assistant,
    label: 'Asistente',
    description: 'Explica tus recomendaciones y responde dudas.',
    Icon: Sparkles,
    isPrimary: false,
  },
  {
    to: ROUTES.settings,
    label: 'Ajustes',
    description: 'Preferencias, objetivos y notificaciones.',
    Icon: Settings,
    isPrimary: false,
  },
]

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter((item) => item.isPrimary)
