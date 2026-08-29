import { useEffect, useState } from 'react'

import { Button } from '@/shared/components/ui/button'

import { barcodeService } from '../services/barcode.service'
import type { LocalFood } from '../utils/local-catalog'

interface CatalogSuggestionsProps {
  readonly query: string
  readonly onPick: (food: LocalFood) => void
}

/**
 * Lo que hay en el catálogo colombiano y todavía no está en el tuyo.
 *
 * Aparece **debajo de tus alimentos, nunca encima**: lo tuyo es lo que buscabas
 * y esto es una ayuda para no teclear siete cifras. Por eso tampoco entra nada
 * solo — al elegir uno se abre el formulario de siempre, con los datos puestos y
 * el aviso de revisarlos contra el paquete.
 *
 * El catálogo son 65 KB comprimidos y **se baja al escribir la primera
 * búsqueda**, no al abrir la pantalla.
 */
export function CatalogSuggestions({ query, onPick }: CatalogSuggestionsProps) {
  const [resultados, setResultados] = useState<readonly LocalFood[]>([])

  useEffect(() => {
    // Una búsqueda tardía no puede pisar a una más nueva: se teclea más rápido
    // de lo que carga el catálogo la primera vez.
    let vigente = true

    void barcodeService
      .search(query)
      .then((encontrados) => {
        if (vigente) setResultados(encontrados)
      })
      .catch(() => {
        // Que no salgan sugerencias no es un error que contar: la pantalla
        // sigue funcionando y siempre se puede crear el alimento a mano.
        if (vigente) setResultados([])
      })

    return () => {
      vigente = false
    }
  }, [query])

  if (resultados.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        En el catálogo colombiano
      </h2>

      <ul className="divide-y divide-border rounded-xl border border-border">
        {resultados.map((food) => (
          <li key={food.codigo} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{food.nombre}</p>
              <p className="truncate text-xs tabular-nums text-muted-foreground">
                {food.marca ? `${food.marca} · ` : ''}
                {food.kcal} kcal · {food.prot} P · {food.carb} C · {food.gras} G — por 100 g
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => onPick(food)}
            >
              Usar
            </Button>
          </li>
        ))}
      </ul>

      {/* La licencia obliga a decir de dónde salen, y además es honesto: son
          cifras que llenó gente, no una fuente oficial. */}
      <p className="text-xs text-muted-foreground">
        Datos de{' '}
        <a
          href="https://world.openfoodfacts.org"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Open Food Facts
        </a>
        , con licencia{' '}
        <a
          href="https://opendatacommons.org/licenses/odbl/1-0/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          ODbL
        </a>
        . Compáralas con el paquete antes de guardar.
      </p>
    </section>
  )
}
