import { describe, expect, it } from 'vitest'

import { toLoggedAt } from './logged-at'

describe('toLoggedAt', () => {
  it('si es hoy, guarda la hora de ahora', () => {
    const ahora = new Date(2026, 7, 15, 21, 47, 33)

    expect(toLoggedAt(new Date(2026, 7, 15), ahora)).toBe(ahora.toISOString())
  })

  it('un día pasado se guarda a su mediodía, no a la hora en que se apunta', () => {
    // Uno recuerda que cenó «el domingo», no que fueron las 21:47: inventar la
    // hora exacta sería fingir una precisión que no se tiene.
    const guardado = new Date(toLoggedAt(new Date(2026, 7, 12), new Date(2026, 7, 15, 21, 47)))

    expect(guardado.getFullYear()).toBe(2026)
    expect(guardado.getMonth()).toBe(7)
    expect(guardado.getDate()).toBe(12)
    expect(guardado.getHours()).toBe(12)
  })

  it('el mediodía deja el registro dentro del día elegido, no en el de al lado', () => {
    // Es el motivo de elegir las 12:00 y no las 00:00: con husos por delante o
    // por detrás, la medianoche se desplaza al día anterior o al siguiente.
    const guardado = new Date(toLoggedAt(new Date(2026, 0, 1), new Date(2026, 7, 15, 3, 0)))

    expect(guardado.getDate()).toBe(1)
    expect(guardado.getMonth()).toBe(0)
  })

  it('el mismo día con otra hora sigue siendo hoy', () => {
    // La comparación es por día, no por instante: a las 00:05 también es hoy.
    const ahora = new Date(2026, 7, 15, 0, 5)

    expect(toLoggedAt(new Date(2026, 7, 15, 23, 59), ahora)).toBe(ahora.toISOString())
  })

  it('un día futuro tampoco es hoy: se guarda a su mediodía', () => {
    const guardado = new Date(toLoggedAt(new Date(2026, 7, 16), new Date(2026, 7, 15, 10, 0)))

    expect(guardado.getDate()).toBe(16)
    expect(guardado.getHours()).toBe(12)
  })
})
