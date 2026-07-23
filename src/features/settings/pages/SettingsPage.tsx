import { ThemeToggle } from '@/core/theme'
import { EmptyState } from '@/shared/components/feedback'
import { PageHeader } from '@/shared/components/layout'

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Ajustes" description="Preferencias, objetivos y notificaciones." />

      <section
        aria-labelledby="ajustes-apariencia"
        className="rounded-xl border border-border bg-card p-4"
      >
        <h2 id="ajustes-apariencia" className="text-sm font-medium">
          Apariencia
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige el tema de la interfaz. «Según el sistema» sigue la configuración de tu dispositivo.
        </p>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </section>

      <EmptyState
        className="mt-4"
        title="Más ajustes en camino"
        description="Perfil y objetivos llegan con el Sprint 4; las notificaciones, con el Sprint 15."
      />
    </>
  )
}
