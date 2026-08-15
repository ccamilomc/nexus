export type { HabitsContext } from './hooks/use-habits-context'
export { useHabitsContext } from './hooks/use-habits-context'
export type { HabitsSeries } from './hooks/use-habits-series'
export { useHabitsSeries } from './hooks/use-habits-series'
export type { HabitsSummary } from './hooks/use-habits-summary'
export { useHabitsSummary } from './hooks/use-habits-summary'
// Lo que hábitos deja pendiente sin red; lo registra `app/` (ADR-0011).
export { registerHabitsOfflineMutations } from './offline'
export { HabitsPage } from './pages/HabitsPage'
