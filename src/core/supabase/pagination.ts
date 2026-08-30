/**
 * Filas que devuelve Supabase como mucho en una consulta.
 *
 * **Es un tope del servidor, no del cliente.** Pedir `.limit(5000)` o
 * `.range(0, 4999)` no lo levanta: se comprobó contra la base real y devolvió
 * mil de las mil cincuenta y cuatro que había.
 */
const PAGE_SIZE = 1000

/** Una página de resultados, tal como la devuelve el cliente de Supabase. */
interface Page<TRow> {
  readonly data: TRow[] | null
  readonly error: { readonly message: string } | null
}

/**
 * Trae **todas** las filas de una consulta, no las primeras mil.
 *
 * **Supabase corta en mil filas y no lo dice.** No hay error, no hay aviso: la
 * consulta parece haber ido bien y faltan datos. Sobre la base real, las comidas
 * de ciento ochenta días eran 1.048 y llegaban 1.000 — cuarenta y ocho porciones
 * que no contaban en las calorías del panel, sin que nada lo delatara.
 *
 * Por eso esto no es una optimización ni una comodidad: **es la diferencia entre
 * un número correcto y uno que miente**. Toda consulta que pueda crecer con el
 * uso —las porciones de las comidas, las series de los entrenamientos, los vasos
 * de agua— tiene que pasar por aquí. Las que están acotadas por algo pequeño
 * —las rutinas de alguien, sus cuentas— no lo necesitan.
 *
 * Pide páginas hasta que una vuelve incompleta, que es la señal de que era la
 * última. Con menos de mil filas es **una sola consulta**, igual que antes.
 *
 * @param page Construye la consulta para un tramo de filas. Recibe los índices
 *   inclusivos que espera `.range()`.
 */
export async function fetchAllRows<TRow>(
  page: (from: number, to: number) => PromiseLike<Page<TRow>>,
): Promise<TRow[]> {
  const rows: TRow[] = []

  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await page(start, start + PAGE_SIZE - 1)

    if (error) throw error

    const batch = data ?? []
    rows.push(...batch)

    // Una página incompleta es la última. Una completa puede serlo también, y
    // entonces la siguiente vuelve vacía: una consulta de más y ningún dato
    // perdido, que es el lado correcto por el que equivocarse.
    if (batch.length < PAGE_SIZE) return rows
  }
}
