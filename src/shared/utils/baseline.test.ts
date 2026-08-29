import { describe, expect, it } from 'vitest'

import { baselineOf, deviationFrom } from './baseline'

describe('baselineOf', () => {
  it('con pocos días no dice nada', () => {
    // Es mejor callarse que decir «lo normal en ti» apoyándose en tres días.
    expect(baselineOf([420, 430, 440], 7)).toBeNull()
  })

  it('con los días justos ya habla', () => {
    expect(baselineOf([420, 430, 440], 3)?.days).toBe(3)
  })

  it('es la mediana, no la media', () => {
    // La media de esto es 402; la mediana, 420. La noche de tres horas no debe
    // mover «lo normal».
    const normal = baselineOf([180, 420, 420, 420, 420, 420, 430], 7)

    expect(normal?.typical).toBe(420)
  })

  it('una noche rarísima no la mueve', () => {
    const sinRareza = baselineOf([400, 410, 420, 430, 440], 5)
    const conRareza = baselineOf([400, 410, 420, 430, 1440], 5)

    expect(conRareza?.typical).toBe(sinRareza?.typical)
  })

  it('con días pares parte por el medio', () => {
    expect(baselineOf([400, 420, 440, 460], 4)?.typical).toBe(430)
  })

  it('redondea a la unidad', () => {
    // Son minutos: «lo normal son 421,5 minutos» no lo dice nadie.
    expect(baselineOf([420, 423], 2)?.typical).toBe(422)
  })

  it('no le importa el orden en que lleguen', () => {
    expect(baselineOf([440, 400, 420], 3)?.typical).toBe(420)
  })

  it('sin nada, nada', () => {
    expect(baselineOf([], 1)).toBeNull()
  })
})

describe('deviationFrom', () => {
  const normal = { typical: 420, days: 30 }

  it('por debajo es negativo', () => {
    // 380 sobre 420 es un 9,5 % menos.
    expect(deviationFrom(normal, 380)).toBeCloseTo(-0.095, 3)
  })

  it('por encima es positivo', () => {
    expect(deviationFrom(normal, 462)).toBeCloseTo(0.1, 3)
  })

  it('clavado en lo normal es cero', () => {
    expect(deviationFrom(normal, 420)).toBe(0)
  })

  it('en proporción y no en unidades', () => {
    // Media hora menos no significa lo mismo para quien duerme cinco que para
    // quien duerme nueve.
    const pocoDormidor = deviationFrom({ typical: 300, days: 30 }, 270)
    const muchoDormidor = deviationFrom({ typical: 540, days: 30 }, 510)

    expect(Math.abs(pocoDormidor)).toBeGreaterThan(Math.abs(muchoDormidor))
  })

  it('una base de cero no se convierte en infinito', () => {
    expect(deviationFrom({ typical: 0, days: 30 }, 100)).toBe(0)
  })
})
