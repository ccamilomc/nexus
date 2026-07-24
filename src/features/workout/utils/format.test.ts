import { describe, expect, it } from 'vitest'

import {
  formatElapsed,
  formatMinutes,
  formatSessionDate,
  formatVolume,
  formatWeight,
} from './format'

describe('formatMinutes', () => {
  it('muestra sólo minutos por debajo de una hora', () => {
    expect(formatMinutes(45)).toBe('45 min')
  })

  it('separa horas y minutos a partir de una hora', () => {
    expect(formatMinutes(65)).toBe('1 h 05 min')
    expect(formatMinutes(120)).toBe('2 h 00 min')
  })

  it('usa un guion cuando no hay duración', () => {
    expect(formatMinutes(null)).toBe('—')
  })
})

describe('formatElapsed', () => {
  it('muestra minutos y segundos', () => {
    expect(formatElapsed(0)).toBe('00:00')
    expect(formatElapsed(462)).toBe('07:42')
  })

  it('añade las horas cuando corresponde', () => {
    expect(formatElapsed(3909)).toBe('1:05:09')
  })

  it('nunca muestra tiempos negativos', () => {
    expect(formatElapsed(-10)).toBe('00:00')
  })
})

describe('formatWeight', () => {
  it('omite los decimales innecesarios', () => {
    expect(formatWeight(60)).toBe('60 kg')
    expect(formatWeight(62.5)).toBe('62,5 kg')
  })

  it('interpreta el peso cero como peso corporal', () => {
    expect(formatWeight(0)).toBe('peso corporal')
  })

  it('usa un guion cuando no hay peso registrado', () => {
    expect(formatWeight(null)).toBe('—')
  })
})

describe('formatVolume', () => {
  it('separa los miles como manda el español (a partir de cinco cifras)', () => {
    expect(formatVolume(2450)).toBe('2450 kg')
    expect(formatVolume(12450)).toBe('12.450 kg')
  })
})

describe('formatSessionDate', () => {
  const now = new Date(2026, 6, 24, 20, 0)

  it('nombra el día de hoy y muestra la hora en formato 24 h', () => {
    expect(formatSessionDate(new Date(2026, 6, 24, 18, 30).toISOString(), now)).toBe('Hoy · 18:30')
  })

  it('nombra el día de ayer', () => {
    expect(formatSessionDate(new Date(2026, 6, 23, 7, 15).toISOString(), now)).toBe('Ayer · 07:15')
  })

  it('fecha los días anteriores', () => {
    const label = formatSessionDate(new Date(2026, 6, 20, 19, 0).toISOString(), now)

    expect(label).toContain('20')
    expect(label).toContain('19:00')
  })

  it('no rompe con una fecha inválida', () => {
    expect(formatSessionDate('no es una fecha', now)).toBe('—')
  })
})
