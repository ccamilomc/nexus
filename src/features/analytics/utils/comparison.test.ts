import { describe, expect, it } from 'vitest'

import { compareValues } from './comparison'

describe('compareValues', () => {
  it('detecta una subida con su porcentaje', () => {
    expect(compareValues(120, 100)).toEqual({ direction: 'up', percent: 20 })
  })

  it('detecta una bajada y da el porcentaje en positivo', () => {
    // El signo lo lleva `direction`; la tarjeta ya pinta la flecha.
    expect(compareValues(75, 100)).toEqual({ direction: 'down', percent: 25 })
  })

  it('un cambio mínimo se considera estable', () => {
    expect(compareValues(100.5, 100)).toEqual({ direction: 'flat', percent: 0 })
  })

  it('sin dato actual no compara', () => {
    expect(compareValues(null, 100)).toBeNull()
  })

  it('sin periodo anterior no compara', () => {
    expect(compareValues(100, null)).toBeNull()
  })

  it('empezar de cero no es «un 100 % más»', () => {
    // Dividir entre cero daría infinito. Que antes no hubiera nada se cuenta
    // con palabras, no con un porcentaje inventado.
    expect(compareValues(500, 0)).toBeNull()
  })

  it('bajar a cero sí es comparable', () => {
    expect(compareValues(0, 400)).toEqual({ direction: 'down', percent: 100 })
  })
})
