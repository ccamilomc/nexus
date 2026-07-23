import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { BottomNav } from '@/app/layout/BottomNav'
import { RouteFallback } from '@/app/layout/RouteFallback'
import { Sidebar } from '@/app/layout/Sidebar'

/**
 * Cascarón de la aplicación: navegación lateral en escritorio, barra inferior
 * en móvil (mobile-first) y un único `Suspense` para las rutas perezosas.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <Sidebar />

      <div className="lg:pl-64">
        <main id="contenido" className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8 lg:pb-12">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
