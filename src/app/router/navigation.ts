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
  UtensilsCrossed,
  Wallet,
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

export interface NavGroup {
  /** Encabezado de la sección, o `null` cuando sólo separa. */
  readonly title: string | null
  readonly items: readonly NavItem[]
}

/**
 * La navegación, agrupada por áreas.
 *
 * **Los grupos son encabezados, no carpetas que se abren.** Un menú plegable
 * ordenaría igual de bien, pero metería un toque más entre el usuario y cada
 * dominio, y esta aplicación se usa con prisa y el móvil en la mano: pagar un
 * toque en «Entreno», que es de lo más visitado, para ganar orden en un menú que
 * se mira de reojo es un mal cambio. Así se gana lo que se buscaba —dejar de
 * leer once entradas seguidas— sin pagar nada.
 *
 * Los grupos sin título separan sin nombrar: lo diario arriba, lo transversal
 * abajo. Cuando llegue **Dinero** entra como grupo propio entre «Mente» y el
 * último, sin tocar nada de lo demás.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: null,
    items: [
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
        to: ROUTES.finance,
        label: 'Finanzas',
        description: 'Gastos, ingresos y en qué se va el mes.',
        Icon: Wallet,
        isPrimary: false,
      },
    ],
  },
  {
    title: 'Cuerpo',
    items: [
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
    ],
  },
  {
    title: 'Mente',
    items: [
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
    ],
  },
  {
    title: null,
    items: [
      {
        to: ROUTES.analytics,
        label: 'Analíticas',
        description: 'Tendencias y comparativas de tus módulos.',
        Icon: ChartColumn,
        isPrimary: false,
      },
      {
        to: ROUTES.settings,
        label: 'Ajustes',
        description: 'Tu cuenta, la apariencia y la instalación.',
        Icon: Settings,
        isPrimary: false,
      },
    ],
  },
]

/** Todo junto y en orden, para quien no necesita los grupos. */
export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((group) => group.items)

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter((item) => item.isPrimary)
