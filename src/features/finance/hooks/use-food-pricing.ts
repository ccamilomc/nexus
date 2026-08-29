import { useState } from 'react'

import { type FoodPurchase, useRepriceFoods } from '@/features/nutrition'

/**
 * Los precios del supermercado que viajan con un gasto.
 *
 * **Vive aparte del formulario porque no es suyo.** Apuntar cuánto costó el
 * mercado es cosa de Nutrición; que se pregunte al apuntar el gasto es sólo el
 * momento en que la persona tiene el recibo en la mano. Mezclarlo con el resto
 * del formulario hacía que el mismo componente llevara dos dominios.
 *
 * **El gasto primero y los precios después, siempre.** Sin transacciones desde
 * el cliente, si falla lo segundo el dinero ya quedó apuntado —que es lo que no
 * se puede perder— y los precios se reintentan sin coste, con los campos
 * todavía llenos. Al revés se perdería el gasto por no haber podido actualizar
 * un precio. Por eso `enviar()` se llama cuando el movimiento ya está a salvo, y
 * no dentro del mismo `submit`.
 */
export function useFoodPricing() {
  const [purchases, setPurchases] = useState<readonly FoodPurchase[]>([])
  // Sube tras guardar para vaciar los campos de la compra remontándolos.
  const [resetKey, setResetKey] = useState(0)
  const reprice = useRepriceFoods()

  /** Olvida lo escrito. Al dejar de ser un gasto, la compra ya no aplica. */
  const clear = () => {
    setPurchases([])
    setResetKey((key) => key + 1)
  }

  /** Manda los precios, si hay alguno. Se llama con el gasto ya apuntado. */
  const submit = () => {
    if (purchases.length === 0) return

    reprice.mutate(purchases, { onSuccess: clear })
  }

  return {
    purchases,
    setPurchases,
    resetKey,
    clear,
    submit,
    isPending: reprice.isPending,
    error: reprice.error,
    /** Los alimentos que quedaron con el precio al día. */
    repriced: reprice.data ?? [],
  }
}
