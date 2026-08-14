import { describe, expect, it } from 'vitest'

import { formatDayLabel } from './format'

const HOY = new Date(2026, 7, 14, 9, 30)

describe('formatDayLabel', () => {
  it('llama a los dos días recientes por su nombre', () => {
    // Es como se piensan: «no apunté la cena de ayer».
    expect(formatDayLabel(new Date(2026, 7, 14, 22), HOY)).toBe('Hoy')
    expect(formatDayLabel(new Date(2026, 7, 13, 8), HOY)).toBe('Ayer')
  })

  it('no depende de la hora, sino del día', () => {
    // Las 23:50 de ayer siguen siendo ayer aunque falten minutos para hoy.
    expect(formatDayLabel(new Date(2026, 7, 13, 23, 50), HOY)).toBe('Ayer')
  })

  it('más atrás da la fecha, que es lo que distingue un miércoles de otro', () => {
    const label = formatDayLabel(new Date(2026, 7, 10), HOY)

    expect(label).toMatch(/10/)
    expect(label).toMatch(/agosto/)
  })

  it('cruza el cambio de mes sin perderse', () => {
    expect(formatDayLabel(new Date(2026, 7, 1), new Date(2026, 7, 2, 10))).toBe('Ayer')
    expect(formatDayLabel(new Date(2026, 6, 31), new Date(2026, 7, 1, 10))).toBe('Ayer')
  })
})
