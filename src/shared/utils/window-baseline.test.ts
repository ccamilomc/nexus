import { describe, expect, it } from 'vitest'

import { toDateKey } from './date-key'
import { type DatedValue, windowBaselineOf, windowBaselines } from './window-baseline'

const HOY = new Date(2026, 7, 29)

/**
 * Un valor en un día concreto, contando hacia atrás desde hoy.
 *
 * Con `toDateKey`, que es la misma que usa el código, y no con `toISOString`:
 * en una zona por delante de UTC la medianoche local cae en el día anterior en
 * UTC, y estas fechas irían un día por detrás de los tramos.
 *
 * **No es que la prueba fallara sin esto** — se comprobó corriéndola en
 * Europe/Madrid y pasa igual, porque un desplazamiento uniforme de todas las
 * muestras no cambia las sumas de datos uniformes. Que dependiera de esa
 * casualidad era lo que no valía.
 */
function haceDias(dias: number, value: number): DatedValue {
  const d = new Date(HOY)
  d.setDate(d.getDate() - dias)

  return { date: toDateKey(d), value }
}

/** Medio año de 10.000 al día: 70.000 a la semana y 300.000 al mes. */
const MEDIO_ANO = Array.from({ length: 179 }, (_, i) => haceDias(i + 1, 10_000))

describe('windowBaselines', () => {
  it('con cinco tramos enteros ya dice lo normal', () => {
    const cinco = Array.from({ length: 36 }, (_, i) => haceDias(i + 1, 10_000))

    const [semana] = windowBaselines(cinco, HOY, [7])

    expect(semana?.days).toBe(7)
    expect(semana?.typical.typical).toBe(70_000)
  })

  it('con cuatro tramos de historia todavía no', () => {
    // Cuatro semanas no son una costumbre. Y no se rellena con ceros: los
    // tramos anteriores al primer registro no son semanas sin hacer nada, son
    // semanas sin usar la aplicación. Esto lo encontró una prueba: rellenando,
    // la mediana de 25 semanas con 21 vacías es cero, y con «lo normal» en cero
    // cualquier semana sale rara.
    const cuatro = Array.from({ length: 28 }, (_, i) => haceDias(i + 1, 10_000))

    expect(windowBaselines(cuatro, HOY, [7])).toEqual([])
  })

  it('el tramo de hoy no entra, que está a medias', () => {
    const conHoy = [...MEDIO_ANO, haceDias(0, 5_000_000)]

    expect(windowBaselineOf(windowBaselines(conHoy, HOY, [7]), 7)?.typical).toBe(70_000)
  })

  it('con la historia justa, contar desde hoy haría hablar de más', () => {
    // 34 días de historia. Contando los tramos desde ayer caben cuatro enteros
    // y no cinco, así que se calla. Contando desde hoy saldrían cinco y hablaría
    // con historia que no tiene.
    //
    // Esta prueba existe porque la de arriba no bastaba: la mediana es tan
    // robusta que meter el tramo de hoy, con cinco millones dentro, no la movía
    // ni un peso. Lo que cambia no es el valor, es si hay respuesta.
    const treintaYCuatro = Array.from({ length: 34 }, (_, i) => haceDias(i + 1, 10_000))

    expect(windowBaselines(treintaYCuatro, HOY, [7])).toEqual([])
  })

  it('cada tamaño por su lado', () => {
    const tramos = windowBaselines(MEDIO_ANO, HOY, [7, 30])

    expect(windowBaselineOf(tramos, 7)?.typical).toBe(70_000)
    expect(windowBaselineOf(tramos, 30)?.typical).toBe(300_000)
  })

  it('de un tamaño que no cabe cinco veces no se sabe', () => {
    // En 180 días caben dos tramos de 90. Con dos no hay costumbre, y por eso
    // el panel a 90 días sigue comparando contra el tramo anterior.
    expect(windowBaselineOf(windowBaselines(MEDIO_ANO, HOY, [90]), 90)).toBeNull()
  })

  it('lleva el vaivén, que es lo que separa la semana rara de la normal', () => {
    const irregular = [...MEDIO_ANO, haceDias(3, 70_000)]

    expect(windowBaselineOf(windowBaselines(irregular, HOY, [7]), 7)?.spread).toBe(0)
  })

  it('sin nada apuntado no se inventa', () => {
    expect(windowBaselines([], HOY, [7])).toEqual([])
  })

  it('una semana vacía dentro de la historia sí cuenta como cero', () => {
    // Es lo contrario del caso de arriba, y la diferencia es real: una semana en
    // la que no se hizo nada es un dato; una anterior a usar la aplicación, no.
    // Aquí hay cinco semanas de historia con la tercera vacía. Si las vacías se
    // saltaran quedarían cuatro y no diría nada; contandola, son cinco.
    const dias = [
      ...Array.from({ length: 14 }, (_, i) => i + 1),
      ...Array.from({ length: 14 }, (_, i) => i + 22),
    ]
    const conHueco = dias.map((d) => haceDias(d, 10_000))

    const [semana] = windowBaselines(conHueco, HOY, [7])

    expect(semana?.typical.typical).toBe(70_000)
    // Cuatro semanas de 70.000 y una de cero: los desvíos son 0 · 0 · 0 · 0 ·
    // 70.000, y su mediana es cero. La semana vacía no agranda «lo normal».
    expect(semana?.typical.spread).toBe(0)
    expect(semana?.typical.days).toBe(5)
  })
})
