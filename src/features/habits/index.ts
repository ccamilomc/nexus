export type { HabitsContext } from './hooks/use-habits-context'
export { useHabitsContext } from './hooks/use-habits-context'
export type { HabitsSeries } from './hooks/use-habits-series'
export { useHabitsSeries } from './hooks/use-habits-series'
export type { HabitsSummary } from './hooks/use-habits-summary'
export { useHabitsSummary } from './hooks/use-habits-summary'
// Marcar los habitos del dia desde el panel, como el agua: de un toque y
// registrando de verdad.
export type { QuickHabits } from './hooks/use-quick-habits'
export { useQuickHabits } from './hooks/use-quick-habits'
// Lo que hábitos deja pendiente sin red; lo registra `app/` (ADR-0011).
export { registerHabitsOfflineMutations } from './offline'
export { HabitsPage } from './pages/HabitsPage'
