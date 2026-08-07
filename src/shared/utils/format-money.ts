/**
 * Dinero en pesos colombianos.
 *
 * **Sin decimales a propósito:** el peso no tiene centavos en circulación, así
 * que «$ 12.500,00» sería ruido.
 *
 * Vive en `shared` y no en un dominio porque el dinero ya no es de nadie en
 * particular: nutrición lo usa para el coste por porción y el presupuesto de
 * mercado, y finanzas para todo lo demás. Antes estaba dentro de nutrición, que
 * era su único usuario.
 */
const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatCop(amount: number): string {
  return copFormatter.format(amount)
}
