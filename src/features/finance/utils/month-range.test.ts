import { describe, expect, it } from 'vitest'

import { monthRange } from './month-range'

describe('monthRange', () => {
  it('va del día 1 al último del mes', () => {
    expect(monthRange(new Date(2026, 7, 15))).toEqual({
      fromKey: '2026-08-01',
      toKey: '2026-08-31',
    })
  })

  it('acierta en los meses de 30 días', () => {
    expect(monthRange(new Date(2026, 3, 10)).toKey).toBe('2026-04-30')
  })

  it('acierta en febrero, y también en los bisiestos', () => {
    // El truco del «día 0 del mes siguiente» está justamente para no tener que
    // saberse cuántos días trae cada mes.
    expect(monthRange(new Date(2026, 1, 5)).toKey).toBe('2026-02-28')
    expect(monthRange(new Date(2028, 1, 5)).toKey).toBe('2028-02-29')
  })

  it('en diciembre no se sale de año', () => {
    expect(monthRange(new Date(2026, 11, 31))).toEqual({
      fromKey: '2026-12-01',
      toKey: '2026-12-31',
    })
  })

  it('el primero y el último día del mes caen dentro de su propio tramo', () => {
    // Quien apunta un gasto el día 1 o el 31 tiene que verlo en ese mes.
    const primero = monthRange(new Date(2026, 7, 1))
    const ultimo = monthRange(new Date(2026, 7, 31))

    expect(primero).toEqual(ultimo)
  })
})
