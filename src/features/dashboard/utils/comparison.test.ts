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

  it('un cambio enorme se dice sin cifra: «1267 % más» no informa', () => {
    // Salió con tres meses de historia sembrados: Analytics comparaba 90 días
    // llenos contra los pocos que había antes y anunciaba un 1267 %, que suena
    // a logro y sólo dice que se acaba de empezar.
    expect(compareValues(9820, 720)).toEqual({ direction: 'up', percent: null })
  })

  it('triplicar todavía se dice con cifra', () => {
    expect(compareValues(300, 100)).toEqual({ direction: 'up', percent: 200 })
  })

  it('bajar no puede pasar del 100 %, así que ahí el tope no estorba', () => {
    // Casi a cero desde 1000 son −99,9 %: por mucho que se caiga, no se puede
    // perder más de lo que había.
    expect(compareValues(1, 1000)).toEqual({ direction: 'down', percent: 100 })
  })

  it('con un periodo anterior negativo el tope sí actúa a la baja', () => {
    // El balance de finanzas puede venir en rojo, y ahí el salto sí se dispara.
    expect(compareValues(-5000, 100)).toEqual({ direction: 'down', percent: null })
  })
})
