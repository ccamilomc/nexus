// El puente con finanzas: apuntar el mercado deja los precios al día. Finanzas
// pone el «cuándo» y nutrición el «cómo», que es lo único que cruza la frontera.
export { FoodPurchaseFields } from './components/FoodPurchaseFields'
export { useRepriceFoods } from './hooks/use-nutrition'
export type { NutritionContext } from './hooks/use-nutrition-context'
export { useNutritionContext } from './hooks/use-nutrition-context'
export type { NutritionSeries } from './hooks/use-nutrition-series'
export { useNutritionSeries } from './hooks/use-nutrition-series'
export type { NutritionSummary } from './hooks/use-nutrition-summary'
export { useNutritionSummary } from './hooks/use-nutrition-summary'
export type { QuickWater } from './hooks/use-quick-water'
export { useQuickWater } from './hooks/use-quick-water'
// Lo que nutrición deja pendiente cuando no hay red. Lo registra `app/`, que es
// quien compone el cliente de Query (ADR-0011).
export { registerNutritionOfflineMutations } from './offline'
export { FoodsPage } from './pages/FoodsPage'
export { GoalsPage } from './pages/GoalsPage'
export { NutritionLayout } from './pages/NutritionLayout'
export { TodayPage } from './pages/TodayPage'
export type { FoodPurchase, RepricedFood } from './types/nutrition.types'
// Las cifras de nutrición las formatea nutrición, aquí y en Analytics: dos
// criterios distintos para los mismos pesos o calorías se notarían en pantalla.
export { formatCalories, formatCop, formatVolumeMl } from './utils/format'
