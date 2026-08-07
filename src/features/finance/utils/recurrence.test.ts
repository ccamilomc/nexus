import { describe, expect, it } from 'vitest'

import { daysUntil, nextDueDate } from './recurrence'

describe('daysUntil', () => {
  it('cuenta lo que falta y lo que ya pasó', () => {
    expect(daysUntil('2026-08-10', '2026-08-07')).toBe(3)
    expect(daysUntil('2026-08-07', '2026-08-07')).toBe(0)
    expect(daysUntil('2026-08-01', '2026-08-07')).toBe(-6)
  })

  it('cruza el cambio de mes y el de año', () => {
    expect(daysUntil('2026-09-01', '2026-08-30')).toBe(2)
    expect(daysUntil('2027-01-01', '2026-12-30')).toBe(2)
  })
})

describe('nextDueDate · mensual', () => {
  it('avanza un mes conservando el día', () => {
    expect(nextDueDate('2026-08-05', 'monthly', 5)).toBe('2026-09-05')
  })

  it('cruza el fin de año', () => {
    expect(nextDueDate('2026-12-15', 'monthly', 15)).toBe('2027-01-15')
  })

  it('recorta al último día del mes cuando no cabe', () => {
    // Enero 31 → febrero no tiene 31, así que el 28.
    expect(nextDueDate('2026-01-31', 'monthly', 31)).toBe('2026-02-28')
  })

  it('vuelve al día acordado en cuanto el mes lo permite', () => {
    // **Éste es el que importa.** Avanzando desde la fecha ya recortada, el
    // arriendo del 31 se quedaba en el 28 para siempre. Con el día acordado
    // aparte, marzo lo recupera.
    expect(nextDueDate('2026-02-28', 'monthly', 31)).toBe('2026-03-31')
  })

  it('respeta los años bisiestos', () => {
    // 2028 sí es bisiesto: el 29 existe.
    expect(nextDueDate('2028-01-31', 'monthly', 31)).toBe('2028-02-29')
  })
})

describe('nextDueDate · semanal y anual', () => {
  it('la semanal suma siete días, sin más', () => {
    expect(nextDueDate('2026-08-28', 'weekly', 28)).toBe('2026-09-04')
  })

  it('la anual salta al año siguiente', () => {
    expect(nextDueDate('2026-03-10', 'yearly', 10)).toBe('2027-03-10')
  })

  it('la anual del 29 de febrero cae en el 28 los años normales', () => {
    expect(nextDueDate('2028-02-29', 'yearly', 29)).toBe('2029-02-28')
  })
})
