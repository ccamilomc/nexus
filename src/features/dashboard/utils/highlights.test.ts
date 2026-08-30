import { describe, expect, it } from 'vitest'

import type { Baseline } from '@/shared/utils'

import { type HighlightCandidate, pickHighlights } from './highlights'

const candidate = (
  domain: string,
  current: number | null,
  previous: number | null,
  typical: Baseline | null = null,
): HighlightCandidate => ({
  domain,
  // La frase lleva la referencia: es lo que separa «cambiaste» de «es raro».
  text: (delta, word, reference) => `${domain} ${delta} ${word} que ${reference}`,
  current,
  previous,
  typical,
})

/** Lo normal de alguien que gasta 650.000 a la semana y se mueve 180.000. */
const NORMAL = { typical: 650_000, spread: 180_000, days: 15 }

describe('pickHighlights', () => {
  it('ordena de mayor a menor cambio', () => {
    const actual = pickHighlights([candidate('sueño', 120, 100), candidate('estudio', 150, 100)], 5)

    expect(actual.map(({ domain }) => domain)).toEqual(['estudio', 'sueño'])
  })

  it('dice hacia dónde se movió, sin juzgar si es bueno', () => {
    const actual = pickHighlights([candidate('gasto', 80, 100)], 5)

    expect(actual[0]).toMatchObject({ direction: 'down', text: 'gasto 20 menos que previous' })
  })

  it('deja fuera lo que apenas se movió: no es noticia', () => {
    expect(pickHighlights([candidate('sueño', 105, 100)], 5)).toEqual([])
  })

  it('un salto enorme sigue siendo noticia, y antes se silenciaba', () => {
    // Había un techo del 200 % con el argumento de que un salto así sólo dice
    // que se empezó. Sobre datos reales silenciaba la semana más cara del
    // historial —1.808.300 pesos contra 651.850 de costumbre— porque la anterior
    // había sido floja. El tramo anterior no estaba vacío: tenía 253.100.
    const actual = pickHighlights([candidate('gasto', 1_808_300, 253_100)], 5)

    expect(actual).toHaveLength(1)
    expect(actual[0]?.direction).toBe('up')
  })

  it('y se pone el primero, porque es por donde hay que empezar a mirar', () => {
    const actual = pickHighlights(
      [candidate('sueño', 120, 100), candidate('gasto', 1_808_300, 253_100)],
      5,
    )

    expect(actual.map(({ domain }) => domain)).toEqual(['gasto', 'sueño'])
  })

  it('no compara contra la nada', () => {
    expect(pickHighlights([candidate('a', 100, null), candidate('b', 100, 0)], 5)).toEqual([])
  })

  it('sin dato actual tampoco', () => {
    expect(pickHighlights([candidate('a', null, 100)], 5)).toEqual([])
  })

  it('se queda con los que caben', () => {
    const actual = pickHighlights(
      [candidate('a', 200, 100), candidate('b', 190, 100), candidate('c', 180, 100)],
      2,
    )

    expect(actual).toHaveLength(2)
  })

  it('con costumbre compara contra lo tuyo, y lo dice', () => {
    // Dos vaivenes sobre 650.000 son 360.000: 1.808.300 se pasa de largo.
    const actual = pickHighlights([candidate('gasto', 1_808_300, 253_100, NORMAL)], 5)

    expect(actual[0]?.text).toContain('que typical')
    expect(actual[0]?.direction).toBe('up')
  })

  it('la cifra es la de la comparación que se usó, no la otra', () => {
    // Contra lo normal se aparta 1.158.300; contra el tramo anterior, 1.555.200.
    // Decir una con el nombre de la otra sería mentir con dos datos ciertos.
    const actual = pickHighlights([candidate('gasto', 1_808_300, 253_100, NORMAL)], 5)

    expect(actual[0]?.text).toBe('gasto 1158300 más que typical')
  })

  it('una semana muy floja también es noticia, y ahí se ve el umbral', () => {
    // 253.100 es una semana real suya: se aparta 396.900 de lo normal, que pasa
    // los dos vaivenes (360.000) sin llegar a cuatro (720.000). Subir el umbral
    // la silenciaría, y gastar la mitad de lo de siempre es justo lo que uno
    // querría ver.
    const actual = pickHighlights([candidate('gasto', 253_100, 763_100, NORMAL)], 5)

    expect(actual).toHaveLength(1)
    expect(actual[0]?.direction).toBe('down')
  })

  it('una semana corriente no es noticia, aunque la anterior fuera rara', () => {
    // Esto es lo que arregla comparar contra lo tuyo. 433.700 está dentro de tu
    // vaivén, pero contra los 854.100 de la semana anterior es un 49 % y se
    // anunciaba. Sobre 15 semanas reales pasaba siete veces.
    expect(pickHighlights([candidate('gasto', 433_700, 854_100, NORMAL)], 5)).toEqual([])
  })

  it('sabiendo lo tuyo no se cae al tramo anterior', () => {
    // Es el mismo caso mirado por dentro: si al no ser raro se comparara con el
    // tramo anterior, volveríamos justo a la muestra de uno de la que se huye.
    const actual = pickHighlights(
      [candidate('gasto', 433_700, 854_100, NORMAL), candidate('sueño', 120, 100)],
      5,
    )

    expect(actual.map(({ domain }) => domain)).toEqual(['sueño'])
  })

  it('sin costumbre sigue valiendo el tramo anterior', () => {
    const actual = pickHighlights([candidate('gasto', 433_700, 854_100, null)], 5)

    expect(actual[0]?.text).toContain('que previous')
  })

  it('midiendo siempre lo mismo no se compara contra la costumbre', () => {
    // Un vaivén de cero haría raro cualquier movimiento. Ahi manda el tramo
    // anterior, que al menos tiene escala.
    const sinVaiven = { typical: 650_000, spread: 0, days: 15 }
    const actual = pickHighlights([candidate('gasto', 433_700, 854_100, sinVaiven)], 5)

    expect(actual[0]?.text).toContain('que previous')
  })

  it('prefiere callar antes que rellenar', () => {
    // Sin nada que destacar, la fila no se dibuja: el dashboard ya tiene
    // veintiocho cifras y una sección vacía sería una más.
    expect(pickHighlights([], 3)).toEqual([])
  })
})
