/**
 * El separador de miles mientras se escribe una cifra.
 *
 * Es el mismo de `formatCop`, y a propósito: si el campo agrupara distinto de
 * como se lee después, teclear «1.000» y ver «$ 1,000» haría dudar de si se
 * guardó lo que se escribió.
 */
const groupFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

/**
 * Lo tecleado reducido a lo que significa: dígitos, y el signo si se admite.
 *
 * Un signo solo —mientras se escribe «-50.000»— se conserva: quitarlo haría
 * imposible teclear un saldo negativo, que es como empieza una tarjeta de
 * crédito.
 */
function digitsOf(text: string, allowNegative: boolean): string {
  const isNegative = allowNegative && text.trimStart().startsWith('-')
  const digits = text.replace(/\D/g, '')

  if (digits === '') return isNegative ? '-' : ''
  return isNegative ? `-${digits}` : digits
}

/** Lo tecleado, agrupado de tres en tres. Lo que se ve en el campo. */
export function formatMoneyInput(text: string, allowNegative = false): string {
  const value = digitsOf(text, allowNegative)
  if (value === '' || value === '-') return value

  const isNegative = value.startsWith('-')
  // Sin ceros a la izquierda: «007» son siete pesos, y verlos despista.
  const amount = Number(isNegative ? value.slice(1) : value)

  return isNegative ? `-${groupFormatter.format(amount)}` : groupFormatter.format(amount)
}

/**
 * El número que hay escrito.
 *
 * Devuelve `NaN` cuando no hay ninguno, que es lo que el esquema espera para
 * decir «escribe un monto». Un cero sería mentira: nadie escribió cero.
 */
export function parseMoneyInput(text: string): number {
  const value = digitsOf(text, true)
  return value === '' || value === '-' ? Number.NaN : Number(value)
}

/** Cuántos dígitos hay antes de esta posición del texto. */
export function digitsBefore(text: string, caret: number): number {
  return (text.slice(0, caret).match(/\d/g) ?? []).length
}

/**
 * Dónde dejar el cursor después de reagrupar.
 *
 * **Se cuenta por dígitos, no por caracteres.** Al teclear el cuarto dígito
 * aparece un punto delante y todo se corre un sitio: contando caracteres el
 * cursor se quedaría atrasado, y corregir un cero en medio de una cifra sería
 * imposible.
 */
export function caretAfterFormat(formatted: string, digitsToKeep: number): number {
  // Sin dígitos por delante, el cursor va al principio —o detrás del signo, que
  // no es un sitio donde se pueda escribir.
  if (digitsToKeep <= 0) return formatted.startsWith('-') ? 1 : 0

  let seen = 0
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index] ?? '')) {
      seen += 1
      if (seen === digitsToKeep) return index + 1
    }
  }

  return formatted.length
}
