import { LogOut } from 'lucide-react'

import { InstallCard } from '@/app/layout/InstallCard'
import { useAuth } from '@/core/auth'
import { PageHeader } from '@/shared/components/layout'
import { Button } from '@/shared/components/ui/button'

export function SettingsPage() {
  const { user, signOut } = useAuth()

  return (
    <>
      <PageHeader title="Ajustes" description="Tu cuenta y la instalación." />

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

        <InstallCard />

        {/*
          Aquí había una tarjeta que anunciaba «Perfil y objetivos llegan
          pronto». Los objetivos ya están, cada uno donde se usa —las calorías en
          nutrición, las horas en sueño, los minutos por materia en estudio—, y
          traerlos aquí sería una segunda copia de algo que ya tiene su sitio.
          Del perfil, lo único que Nexus necesita es la altura, y se pide en
          salud, que es donde sirve para algo.

          Así que no anunciaba nada: ocupaba media pantalla para prometer lo que
          ya existe. Es lo mismo que pasó con la pantalla de la IA en el Sprint
          16 (ver docs/09), y se resuelve igual: se quita. Cuando haya un ajuste
          de verdad, se pone el ajuste.
        */}
      </div>
    </>
  )
}
