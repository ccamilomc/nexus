import { ROUTES } from '@/app/router/routes'
import { type SectionTab, SectionTabs } from '@/shared/components/layout'

const TABS: readonly SectionTab[] = [
  // «Diario» y no «Hoy»: desde que la pantalla deja retroceder de día, la
  // pestaña se quedaba diciendo «Hoy» con «Ayer» debajo. Distingue además del
  // catálogo: aquí está lo que comiste, en «Alimentos» con qué se apunta.
  { to: ROUTES.nutrition, label: 'Diario', end: true },
  { to: ROUTES.nutritionFoods, label: 'Alimentos' },
  { to: ROUTES.nutritionGoals, label: 'Objetivos' },
]

/** Secciones del módulo de nutrición. */
export function NutritionNav() {
  return <SectionTabs label="nutrición" tabs={TABS} />
}
