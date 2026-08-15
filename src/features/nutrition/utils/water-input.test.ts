import { describe, expect, it } from 'vitest'

import { buildAddWaterInput } from './water-input'

const AHORA = new Date(2026, 6, 29, 15, 30, 0)
const BASE = { id: 'w1', userId: 'u1', amountMl: 250, now: AHORA }

describe('buildAddWaterInput', () => {
  it('apunta el agua en el día que se está mirando, no en el de hoy', () => {
    // Fechaba siempre en el momento de apuntarlo: desde que se puede retroceder
    // de día, el vaso de ayer caía en hoy y la tarjeta ni se movía.
    const loggedAt = new Date(buildAddWaterInput({ ...BASE, date: new Date(2026, 6, 27) }).loggedAt)

    expect(loggedAt.getDate()).toBe(27)
    expect(loggedAt.getHours()).toBe(12)
  })

  it('si el día es hoy conserva la hora real, que es cuando se bebió', () => {
    expect(buildAddWaterInput({ ...BASE, date: AHORA }).loggedAt).toBe(AHORA.toISOString())
  })

  it('lleva el id y el dueño puestos: los necesita para esperar sin red', () => {
    expect(buildAddWaterInput({ ...BASE, date: AHORA })).toMatchObject({
      id: 'w1',
      userId: 'u1',
      amountMl: 250,
    })
  })
})
