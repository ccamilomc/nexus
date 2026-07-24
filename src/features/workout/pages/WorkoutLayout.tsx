import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { SkeletonList } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

import { WorkoutNav } from '../components/WorkoutNav'

/**
 * Cascarón del módulo: cabecera y pestañas fijas, contenido intercambiable.
 *
 * El `Suspense` propio evita que al cambiar de pestaña desaparezca toda la
 * pantalla mientras llega el código de la sección.
 */
export function WorkoutLayout() {
  return (
    <>
      <PageHeader
        title="Entrenamiento"
        description="Registra tus sesiones de gimnasio y consulta tu historial."
      />
      <WorkoutNav />
      <Suspense fallback={<SkeletonList label="Cargando la sección" rows={3} />}>
        <Outlet />
      </Suspense>
    </>
  )
}
