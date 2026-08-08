/**
 * Lo que cuesta una porción, a partir de lo que pagaste por una cantidad.
 *
 * **Es la cuenta que el usuario hacía de cabeza, y por eso los precios
 * envejecían.** Nadie vuelve a Alimentos a dividir $18.000 entre diez porciones
 * cada vez que sube el pollo; en cambio, sí sabe lo que acaba de pagar en la
 * caja. Pidiendo el recibo tal cual —tanto por tanta cantidad— el precio por
 * porción sale solo y se mantiene vivo.
 *
 * Devuelve `null` en vez de un número inventado cuando falta algo o no tiene
 * sentido: sin cantidad no hay porciones que repartir, y un precio de cero
 * significaría «gratis», que es distinto de «no lo sé».
 */
export function pricePerServing(
  paidCop: number,
  quantity: number,
  servingSize: number,
): number | null {
  if (!Number.isFinite(paidCop) || paidCop <= 0) return null
  if (!Number.isFinite(quantity) || quantity <= 0) return null
  if (!Number.isFinite(servingSize) || servingSize <= 0) return null

  // Los pesos colombianos no llevan centavos: se redondea al peso.
  return Math.round((paidCop * servingSize) / quantity)
}

/**
 * Cuánto ha subido o bajado un precio, en porcentaje.
 *
 * Se enseña al lado del precio nuevo porque **es lo que convierte el dato en
 * noticia**: «$1.800 por porción» no dice nada; «$1.800, un 20 % más que la
 * última vez» explica por qué el mercado del mes salió más caro.
 *
 * `null` cuando no hay con qué comparar: sin precio anterior no hay cambio, y
 * partir de cero daría un porcentaje infinito.
 */
export function priceChangePercent(previous: number | null, next: number): number | null {
  if (previous === null || previous <= 0) return null

  return Math.round(((next - previous) / previous) * 100)
}
