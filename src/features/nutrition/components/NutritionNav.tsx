import { ROUTES } from '@/app/router/routes'
import { type SectionTab, SectionTabs } from '@/shared/components/layout'

const TABS: readonly SectionTab[] = [
  { to: ROUTES.nutrition, label: 'Hoy', end: true },
  { to: ROUTES.nutritionFoods, label: 'Alimentos' },
  { to: ROUTES.nutritionGoals, label: 'Objetivos' },
]

/** Secciones del módulo de nutrición. */
export function NutritionNav() {
  return <SectionTabs label="nutrición" tabs={TABS} />
}
