import { describe, expect, it } from 'vitest'

import { formatTime } from './format-time'

describe('formatTime', () => {
  it('muestra la hora local en formato 24 h', () => {
    expect(formatTime(new Date(2026, 6, 25, 14, 30).toISOString())).toBe('14:30')
  })

  it('la noche no se convierte en «11 p. m.»', () => {
    expect(formatTime(new Date(2026, 6, 25, 23, 5).toISOString())).toBe('23:05')
  })

  it('no rompe con una fecha inválida', () => {
    expect(formatTime('no es una fecha')).toBe('—')
  })
})
