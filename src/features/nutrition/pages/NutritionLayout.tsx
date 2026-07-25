import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

import { NutritionNav } from '../components/NutritionNav'

/**
 * Cascarón del módulo: cabecera y pestañas fijas, contenido intercambiable.
 *
 * El `Suspense` propio evita que al cambiar de pestaña desaparezca toda la
 * pantalla mientras llega el código de la sección.
 */
export function NutritionLayout() {
  return (
    <>
      <PageHeader title="Nutrición" description="Lo que comes, sus macros y su coste." />
      <NutritionNav />
      <Suspense fallback={<SkeletonList label="Cargando la sección" rows={3} />}>
        <Outlet />
      </Suspense>
    </>
  )
}
