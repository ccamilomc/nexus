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

  it('no redondea: eso lo decide quien la usa', () => {
    // Los minutos de sueño se quieren enteros y los kilos con decimales. Si
    // redondeara aquí, el peso perdería precisión sin que nadie lo pidiera.
    expect(baselineOf([420, 423], 2)?.typical).toBe(421.5)
  })

  it('no le importa el orden en que lleguen', () => {
    expect(baselineOf([440, 400, 420], 3)?.typical).toBe(420)
  })

  it('sin nada, nada', () => {
    expect(baselineOf([], 1)).toBeNull()
  })
})

describe('deviationFrom', () => {
  const normal = { typical: 420, spread: 20, days: 30 }

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
    const pocoDormidor = deviationFrom({ typical: 300, spread: 20, days: 30 }, 270)
    const muchoDormidor = deviationFrom({ typical: 540, spread: 20, days: 30 }, 510)

    expect(Math.abs(pocoDormidor)).toBeGreaterThan(Math.abs(muchoDormidor))
  })

  it('una base de cero no se convierte en infinito', () => {
    expect(deviationFrom({ typical: 0, spread: 0, days: 30 }, 100)).toBe(0)
  })
})

describe('el vaivén', () => {
  it('mide cuánto se mueve normalmente', () => {
    // La mediana de estas es 91,7 y los desvíos son 0 · 0,8 · 0,9 · 1,6 · 1,7,
    // así que el vaivén típico es 0,9. Sobre las 62 pesadas reales dio 0,8: eso
    // es lo que oscila una báscula entre el agua, la comida y la hora.
    expect(baselineOf([90, 90.8, 91.7, 92.5, 93.3], 5)?.spread).toBeCloseTo(0.9, 2)
  })

  it('un dato disparatado no lo agranda', () => {
    // Por lo mismo que la mediana: «lo normal» no lo decide el día raro.
    const sinRareza = baselineOf([90, 91, 92, 93, 94], 5)?.spread
    const conRareza = baselineOf([90, 91, 92, 93, 140], 5)?.spread

    expect(conRareza).toBe(sinRareza)
  })

  it('midiendo siempre lo mismo, el vaivén es cero', () => {
    expect(baselineOf([70, 70, 70, 70, 70], 5)?.spread).toBe(0)
  })

  it('se mide contra la mediana, no contra el dato anterior', () => {
    // Dos lecturas seguidas pueden coincidir por casualidad; eso no significa
    // que la medida no se mueva.
    expect(baselineOf([80, 80, 90, 100, 100], 5)?.spread).toBe(10)
  })
})
