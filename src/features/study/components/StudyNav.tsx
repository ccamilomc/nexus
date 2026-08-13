import { ROUTES } from '@/app/router/routes'
import { type SectionTab, SectionTabs } from '@/shared/components/layout'

const TABS: readonly SectionTab[] = [
  { to: ROUTES.study, label: 'Hoy', end: true },
  { to: ROUTES.studySubjects, label: 'Materias' },
]

/** Secciones del módulo de estudio. */
export function StudyNav() {
  return <SectionTabs label="estudio" tabs={TABS} />
}
