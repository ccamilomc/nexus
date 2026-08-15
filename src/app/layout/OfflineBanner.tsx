import { WifiOff } from 'lucide-react'

import { usePendingWrites } from '@/core/offline'
// Directo al módulo y no al barrel de `shared/hooks`: por él asoma
// `useSeriesQuery`, que arrastra el cliente de Supabase y hace fallar los tests
// en CI, donde no hay variables de entorno (ver PR #46).
import { useIsOnline } from '@/shared/hooks/use-is-online'

/**
 * Un aviso, una vez, cuando no hay señal.
 *
 * Las pantallas que esperan datos enteros ya lo dicen por su cuenta
 * (`SkeletonList`), pero dentro de una tarjeta ya pintada quedan marcadores en
 * línea —el agua del día, las dos frases de un resumen— que sin red laten sin
 * explicar nada. Convertir cada uno en su propio «Sin conexión» llenaría el
 * dashboard de seis avisos repetidos; basta con decirlo arriba y que se entienda
 * todo lo de abajo.
 *
 * El texto no promete: con la caché persistida se suele ver lo último guardado,
 * pero puede faltar lo de hoy, y eso es exactamente lo que dice.
 *
 * **Y en cuanto hay algo apuntado, lo que importa es lo otro:** que lo suyo no
 * se ha perdido. Es la única pregunta que se hace quien acaba de registrar algo
 * sin señal, y contestarla aquí evita tener que decirlo en cada tarjeta.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline()
  const pending = usePendingWrites()

  if (isOnline) return null

  return (
    <div
      role="status"
      className="mb-4 flex items-center justify-center gap-2 rounded-md bg-muted px-3 py-2 text-center text-xs font-medium text-muted-foreground"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {pendingText(pending)}
    </div>
  )
}

/** Sin nada apuntado se avisa de lo que falta; con algo, de que está a salvo. */
function pendingText(pending: number): string {
  if (pending === 0) return 'Sin conexión. Puede que no veas lo más reciente.'
  if (pending === 1) return 'Sin conexión. 1 registro guardado, se envía al volver.'

  return `Sin conexión. ${pending} registros guardados, se envían al volver.`
}
