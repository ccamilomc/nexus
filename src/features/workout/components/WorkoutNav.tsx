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
  { to: ROUTES.workoutRoutines, label: 'Rutinas', end: false },
  { to: ROUTES.workoutHistory, label: 'Historial', end: false },
  { to: ROUTES.workoutExercises, label: 'Ejercicios', end: false },
]

function tabClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    // Compacto en móvil para que las cuatro pestañas quepan sin desbordar;
    // holgado a partir de sm. `truncate` es una red de seguridad.
    'block truncate rounded-md px-2 py-2 text-center text-xs font-medium transition-colors sm:px-3 sm:text-sm',
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
          <li key={to} className="min-w-0 flex-1">
            <NavLink to={to} end={end} className={tabClassName}>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
