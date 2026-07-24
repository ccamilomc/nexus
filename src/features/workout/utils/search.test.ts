import { describe, expect, it } from 'vitest'

import { matchesQuery } from './search'

describe('matchesQuery', () => {
  it('ignora mayúsculas y acentos', () => {
    expect(matchesQuery('Curl de bíceps', 'biceps')).toBe(true)
    expect(matchesQuery('Press militar', 'PRESS')).toBe(true)
  })

  it('busca en cualquier parte del texto', () => {
    expect(matchesQuery('Press de banca', 'banca')).toBe(true)
  })

  it('acepta todo cuando la búsqueda está vacía', () => {
    expect(matchesQuery('Sentadilla', '   ')).toBe(true)
  })

  it('descarta lo que no coincide', () => {
    expect(matchesQuery('Sentadilla', 'remo')).toBe(false)
  })
})
