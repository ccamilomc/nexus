import { run } from 'axe-core'

/**
 * Pasa el examen de accesibilidad de axe a un trozo de interfaz ya pintado.
 *
 * **Comprueba lo que una máquina puede comprobar**, que no es todo: etiquetas
 * que faltan, contraste insuficiente, roles mal puestos, ids repetidos. No sabe
 * si el texto se entiende ni si el orden del teclado tiene sentido, así que no
 * sustituye a mirar la pantalla — cierra el paso a la clase de fallo que se
 * cuela sin que nadie lo note.
 *
 * Se usa `axe-core` a secas y no un envoltorio: la comprobación es una línea, y
 * una dependencia menos que mantener.
 */
export async function expectNoAccessibilityIssues(container: HTMLElement): Promise<void> {
  const { violations } = await run(container, {
    // El color no se puede medir en jsdom, que no calcula estilos de verdad:
    // dejarlo activo daría verde siempre y haría creer que está comprobado.
    rules: { 'color-contrast': { enabled: false } },
  })

  if (violations.length === 0) return

  const detalle = violations
    .map((v) => `${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`)
    .join('\n  ')

  throw new Error(`axe encontró ${violations.length} problema(s) de accesibilidad:\n  ${detalle}`)
}
