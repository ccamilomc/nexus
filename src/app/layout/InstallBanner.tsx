import { Download } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
// Directo al módulo y no al barrel de `shared/hooks`: por él asoma
// `useSeriesQuery`, que arrastra el cliente de Supabase y hace fallar los tests
// en CI, donde no hay variables de entorno (ver PR #46).
import { useInstallPrompt } from '@/shared/hooks/use-install-prompt'

/** Que se pueda instalar no se descubre solo: casi nadie entra en Ajustes. */
const DISMISSED_KEY = 'nexus.install-dismissed'

/**
 * El ofrecimiento de instalar, una vez, en el Dashboard.
 *
 * **Sólo cuando hay un botón que de verdad instala.** En iOS haría falta
 * explicar dos toques que el usuario tendría que recordar mientras cierra el
 * aviso; eso es un estorbo, no una ayuda, y su sitio es Ajustes, donde puede
 * leerse con calma.
 *
 * Y **una sola vez**: al descartarlo no vuelve. El navegador ya insiste por su
 * cuenta cuando le parece; la aplicación no tiene por qué sumarse.
 */
export function InstallBanner() {
  const { availability, install } = useInstallPrompt()
  const [isDismissed, setIsDismissed] = useState(
    () => window.localStorage.getItem(DISMISSED_KEY) === 'true',
  )

  if (availability !== 'ready' || isDismissed) return null

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, 'true')
    setIsDismissed(true)
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-4 py-3">
      <Download className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      {/* `basis-48` y no `flex-1`: con `flex-1` la frase se encoge hasta caber
          al lado de los botones y en un móvil estrecho queda en una tira de una
          palabra por línea. Reservándole un ancho mínimo, lo que se va abajo
          son los botones. */}
      <p className="grow basis-48 text-sm">
        Instálala y ábrela desde la pantalla de inicio, incluso sin conexión.
      </p>
      <span className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            void install()
          }}
        >
          Instalar
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Ahora no
        </Button>
      </span>
    </div>
  )
}
