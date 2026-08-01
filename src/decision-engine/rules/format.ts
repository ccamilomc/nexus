/**
 * Formato de las cifras que aparecen dentro de una recomendación.
 *
 * El motor es puro (ADR-0002): no puede tirar de `shared/utils`, así que tiene
 * su propia copia. **Una sola**, aquí: `formatMinutes` llegó a estar escrito dos
 * veces en dos reglas, y dos criterios para lo mismo se acaban notando cuando
 * un plan mezcla «2 h 15 min» con «135 min».
 */

const MINUTES_PER_HOUR = 60

/** Duración en lenguaje humano: «45 min», «2 h», «2 h 15 min». */
export function formatMinutes(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min`

  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = minutes % MINUTES_PER_HOUR

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Precio en pesos colombianos, sin centavos: «$ 12.500». */
export function formatCop(amount: number): string {
  return copFormatter.format(Math.round(amount))
}

/**
 * Dos decimales, no uno.
 *
 * Las porciones se calculan en cuartos, así que con un solo decimal 3,25 se
 * mostraba como «3,3» mientras las calorías y el precio del motivo seguían
 * siendo los de 3,25. Quien se moleste en comprobar la cuenta merece que cuadre.
 */
const decimalFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

/** Cantidad con coma decimal: «2,25», «1,5», «3». */
export function formatAmount(value: number): string {
  return decimalFormatter.format(value)
}
