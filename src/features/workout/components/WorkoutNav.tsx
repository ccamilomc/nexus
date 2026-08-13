import { ROUTES } from '@/app/router/routes'
import { type SectionTab, SectionTabs } from '@/shared/components/layout'

const TABS: readonly SectionTab[] = [
  { to: ROUTES.workout, label: 'Entrenar', end: true },
  { to: ROUTES.workoutRoutines, label: 'Rutinas' },
  { to: ROUTES.workoutHistory, label: 'Historial' },
  { to: ROUTES.workoutExercises, label: 'Ejercicios' },
]

/** Secciones del módulo de entrenamiento. */
export function WorkoutNav() {
  return <SectionTabs label="entrenamiento" tabs={TABS} />
}
