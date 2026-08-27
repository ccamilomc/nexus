import { describe, expect, it } from 'vitest'

import { type HighlightCandidate, pickHighlights } from './highlights'

const candidate = (
  domain: string,
  current: number | null,
  previous: number | null,
): HighlightCandidate => ({
  domain,
  text: (direction) => `${domain} ${direction === 'up' ? 'más' : 'menos'}`,
  current,
  previous,
})

describe('pickHighlights', () => {
  it('ordena de mayor a menor cambio', () => {
    const actual = pickHighlights([candidate('sueño', 120, 100), candidate('estudio', 150, 100)], 5)

    expect(actual.map(({ domain }) => domain)).toEqual(['estudio', 'sueño'])
  })

  it('dice hacia dónde se movió, sin juzgar si es bueno', () => {
    const actual = pickHighlights([candidate('gasto', 80, 100)], 5)

    expect(actual[0]).toMatchObject({ direction: 'down', text: 'gasto menos' })
  })

  it('deja fuera lo que apenas se movió: no es noticia', () => {
    expect(pickHighlights([candidate('sueño', 105, 100)], 5)).toEqual([])
  })

  it('deja fuera los saltos enormes, que son arranque y no cambio', () => {
    // Pasar de casi nada a mucho suena a logro y sólo dice que se empezó.
    expect(pickHighlights([candidate('estudio', 9820, 720)], 5)).toEqual([])
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

  it('prefiere callar antes que rellenar', () => {
    // Sin nada que destacar, la fila no se dibuja: el dashboard ya tiene
    // veintiocho cifras y una sección vacía sería una más.
    expect(pickHighlights([], 3)).toEqual([])
  })
})
