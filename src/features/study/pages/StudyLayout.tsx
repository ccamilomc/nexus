import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

import { StudyNav } from '../components/StudyNav'

/**
 * Cascarón del módulo: cabecera y pestañas fijas, contenido intercambiable.
 *
 * El `Suspense` propio evita que al cambiar de pestaña desaparezca toda la
 * pantalla mientras llega el código de la sección.
 */
export function StudyLayout() {
  return (
    <>
      <PageHeader title="Estudio" description="Cuánto estudias y en qué." />
      <StudyNav />
      <Suspense fallback={<SkeletonList label="Cargando la sección" rows={3} />}>
        <Outlet />
      </Suspense>
    </>
  )
}
