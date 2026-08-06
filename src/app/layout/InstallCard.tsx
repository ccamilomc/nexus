import { Download, Share } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
// Directo al módulo y no al barrel de `shared/hooks`: por él asoma
// `useSeriesQuery`, que arrastra el cliente de Supabase y hace fallar los tests
// en CI, donde no hay variables de entorno (ver PR #46).
import { useInstallPrompt } from '@/shared/hooks/use-install-prompt'

/**
 * Instalar la aplicación, desde Ajustes.
 *
 * Aquí se contestan **los cuatro casos**, incluido el de quien ya la tiene
 * instalada: a Ajustes se entra con una pregunta, y una sección que desaparece
 * cuando la respuesta es «ya está» deja al usuario sin saber si lo consiguió.
 *
 * En iOS no hay botón que valga —Safari no ofrece instalar por código— así que
 * lo único honesto es explicar los dos toques que hay que dar.
 */
export function InstallCard() {
  const { availability, install } = useInstallPrompt()

  return (
    <section
      aria-labelledby="ajustes-instalacion"
      className="rounded-xl border border-border bg-card p-4"
    >
      <h2 id="ajustes-instalacion" className="text-sm font-medium">
        Instalación
      </h2>

      {availability === 'ready' ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            Instala Nexus para abrirla desde la pantalla de inicio, a pantalla completa y sin
            conexión.
          </p>
          <div className="mt-3">
            <Button
              onClick={() => {
                void install()
              }}
            >
              <Download aria-hidden />
              Instalar
            </Button>
          </div>
        </>
      ) : null}

      {availability === 'manual' ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
          <span>Para instalarla, toca</span>
          <Share className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>Compartir y luego «Añadir a inicio».</span>
        </p>
      ) : null}

      {availability === 'installed' ? (
        <p className="mt-1 text-sm text-muted-foreground">Ya está instalada en este dispositivo.</p>
      ) : null}

      {availability === 'unavailable' ? (
        // «Ahora mismo» no es un relleno: el navegador puede ofrecerlo más tarde,
        // y también se llega aquí al cerrar el diálogo sin instalar.
        <p className="mt-1 text-sm text-muted-foreground">
          Ahora mismo tu navegador no ofrece instalarla.
        </p>
      ) : null}
    </section>
  )
}
