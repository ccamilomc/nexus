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
      {/* Ya no promete «su coste»: el dinero se cuenta en Finanzas. Aquí el
          precio por porción sólo sirve para comparar dos alimentos. */}
      <PageHeader title="Nutrición" description="Lo que comes, con sus macros y su agua." />
      <NutritionNav />
      <Suspense fallback={<SkeletonList label="Cargando la sección" rows={3} />}>
        <Outlet />
      </Suspense>
    </>
  )
}
