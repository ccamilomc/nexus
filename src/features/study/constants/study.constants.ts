/**
 * Colores con los que se distinguen las materias.
 *
 * El punto de color aparece en la lista, en el avance semanal, en el cronómetro
 * y en el historial del día: es lo que deja saber de qué materia habla una fila
 * sin leerla. Para eso tiene que haber **más de uno**, y hasta ahora no lo había
 * — la columna traía un valor por defecto y nadie lo cambiaba, así que todas las
 * materias salían del mismo color y el punto no distinguía nada.
 *
 * Seis, y no más: pasando de esa cifra los tonos se parecen entre sí y volvería
 * a no distinguirse nada, que es el problema que esto viene a resolver. Quien
 * lleve siete materias tendrá dos del mismo color, y es preferible a siete
 * colores que no se diferencian.
 *
 * Elegidos para que se vean sobre el fondo claro y sobre el oscuro, y para que
 * ninguno se confunda con el índigo de la marca ni con el ámbar de los avisos.
 */
export const SUBJECT_COLORS = [
  '#8b5cf6', // violeta
  '#2563eb', // azul
  '#0d9488', // verde azulado
  '#d97706', // ámbar oscuro
  '#db2777', // rosa
  '#65a30d', // lima oscuro
] as const

/**
 * El color que le toca a una materia nueva.
 *
 * El **menos usado**, y a igualdad el primero de la paleta. Con pocas materias
 * eso equivale a «uno que no esté cogido»; con muchas, reparte en vez de repetir
 * siempre el mismo.
 */
export function nextSubjectColor(usedColors: readonly string[]): string {
  const timesUsed = new Map<string, number>(SUBJECT_COLORS.map((color) => [color, 0]))

  for (const color of usedColors) {
    const current = timesUsed.get(color)
    // Un color de fuera de la paleta no cuenta: las materias de antes de que
    // esto existiera llevan colores sueltos y no deben desviar el reparto.
    if (current !== undefined) timesUsed.set(color, current + 1)
  }

  let chosen: string = SUBJECT_COLORS[0]
  for (const color of SUBJECT_COLORS) {
    if ((timesUsed.get(color) ?? 0) < (timesUsed.get(chosen) ?? 0)) chosen = color
  }

  return chosen
}
