// Apuntar la noche desde el panel. Sueño decide qué proponer y cuándo; el
// dashboard sólo lo coloca, igual que con los `useXSummary`.
export { SleepQuickLog } from './components/SleepQuickLog'
export type { SleepContext } from './hooks/use-sleep-context'
export { useSleepContext } from './hooks/use-sleep-context'
export type { SleepSeries } from './hooks/use-sleep-series'
export { useSleepSeries } from './hooks/use-sleep-series'
export type { SleepSummary } from './hooks/use-sleep-summary'
export { useSleepSummary } from './hooks/use-sleep-summary'
export { registerSleepOfflineMutations } from './offline'
export { SleepPage } from './pages/SleepPage'
// El objetivo de sueño también se fija desde la bienvenida.
export { useSaveSleepGoal } from './hooks/use-sleep'
