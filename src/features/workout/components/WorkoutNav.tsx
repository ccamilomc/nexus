import { NavLink } from 'react-router-dom'

import { ROUTES } from '@/app/router/routes'
import { cn } from '@/shared/lib/utils'

interface WorkoutTab {
  readonly to: string
  readonly label: string
  /** La pestaña de entrenar es el índice: sólo se activa con la ruta exacta. */
  readonly end: boolean
}

const TABS: readonly WorkoutTab[] = [
  { to: ROUTES.workout, label: 'Entrenar', end: true },
  { to: ROUTES.workoutHistory, label: 'Historial', end: false },
  { to: ROUTES.workoutExercises, label: 'Ejercicios', end: false },
]

function tabClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'block rounded-md px-3 py-2 text-center text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground',
  )
}

/** Secciones del módulo de entrenamiento. */
export function WorkoutNav() {
  return (
    <nav aria-label="Secciones de entrenamiento" className="mb-6">
      <ul className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map(({ to, label, end }) => (
          <li key={to} className="flex-1">
            <NavLink to={to} end={end} className={tabClassName}>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
