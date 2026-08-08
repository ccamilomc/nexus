import { ChevronDown, ShoppingBasket } from 'lucide-react'
import { useState } from 'react'

import { type FoodPurchase, FoodPurchaseFields } from '@/features/nutrition'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

interface FoodPricingSectionProps {
  readonly onChange: (purchases: readonly FoodPurchase[]) => void
  /**
   * Cambia tras guardar un gasto para vaciar los campos.
   *
   * Remontar el bloque es lo que lo limpia: así no hay que mantener una API
   * imperativa para algo que ocurre una vez por compra.
   */
  readonly resetKey: number
}

/**
 * «¿Compraste alimentos?», dentro del formulario de un gasto.
 *
 * **Va plegado, y eso es deliberado.** Apuntar un gasto tiene que seguir
 * costando dos toques: es el único dominio donde un hueco invalida el resultado,
 * y un formulario que crece invita a dejarlo para luego. Quien viene del
 * supermercado lo despliega; quien apunta un taxi ni lo ve.
 *
 * **Se ofrece en cualquier gasto y no sólo en los de «Mercado».** Distinguirlo
 * exigiría marcar qué categorías son de comida, y adivinarlo por el nombre
 * fallaría con la primera categoría propia que el usuario llame de otra forma.
 * Un enlace de una línea cuesta menos que una regla que se equivoca.
 */
export function FoodPricingSection({ onChange, resetKey }: FoodPricingSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-md border border-dashed border-border">
      {/* `whitespace-normal` y `h-auto` porque `Button` viene con `nowrap` y una
          altura fija: a 320 px la frase medía 347 px dentro de una caja de 244 y
          se salía por la derecha. No se ve sin medir el `scrollWidth`. */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={isOpen}
        className="h-auto w-full justify-start whitespace-normal py-2 text-left text-muted-foreground"
        onClick={() => {
          // Plegar es cancelar. Sin esto, lo escrito seguía vivo en el estado
          // del formulario y el gasto habría repreciado algo que el usuario ya
          // no tenía delante.
          if (isOpen) onChange([])
          setIsOpen(!isOpen)
        }}
      >
        <ShoppingBasket aria-hidden className="shrink-0" />
        ¿Compraste alimentos? Pon sus precios al día
        <ChevronDown
          aria-hidden
          className={cn(
            'ml-auto shrink-0 transition-transform duration-fast',
            isOpen && 'rotate-180',
          )}
        />
      </Button>

      {isOpen ? (
        <div className="border-t border-dashed border-border p-3">
          <FoodPurchaseFields key={resetKey} onChange={onChange} />
        </div>
      ) : null}
    </div>
  )
}
