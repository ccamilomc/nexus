import { LogOut } from 'lucide-react'

import { useAuth } from '@/core/auth'
import { ThemeToggle } from '@/core/theme'
import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'
import { Button } from '@/shared/components/ui/button'

export function SettingsPage() {
  const { user, signOut } = useAuth()

  return (
    <>
      <PageHeader title="Ajustes" description="Preferencias, objetivos y notificaciones." />

      <div className="space-y-4">
        <section
          aria-labelledby="ajustes-cuenta"
          className="rounded-xl border border-border bg-card p-4"
        >
          <h2 id="ajustes-cuenta" className="text-sm font-medium">
            Cuenta
          </h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
          <div className="mt-3">
            <Button
              variant="outline"
              onClick={() => {
                void signOut()
              }}
            >
              <LogOut aria-hidden />
              Cerrar sesión
            </Button>
          </div>
        </section>

        <section
          aria-labelledby="ajustes-apariencia"
          className="rounded-xl border border-border bg-card p-4"
        >
          <h2 id="ajustes-apariencia" className="text-sm font-medium">
            Apariencia
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Elige el tema de la interfaz. «Según el sistema» sigue la configuración de tu
            dispositivo.
          </p>
          <div className="mt-3">
            <ThemeToggle />
          </div>
        </section>

        <EmptyState
          title="Más ajustes en camino"
          description="Perfil y objetivos llegan pronto; las notificaciones, con el Sprint 15."
        />
      </div>
    </>
  )
}
