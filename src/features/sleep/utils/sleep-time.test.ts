import { describe, expect, it } from 'vitest'

import { minutesOfDay, sleepInstants, sleepMinutes } from './sleep-time'

describe('minutesOfDay', () => {
  it('cuenta los minutos desde medianoche', () => {
    expect(minutesOfDay('00:00')).toBe(0)
    expect(minutesOfDay('07:30')).toBe(450)
    expect(minutesOfDay('23:59')).toBe(1439)
  })

  it('acepta la hora con segundos, como la devuelve Postgres', () => {
    expect(minutesOfDay('23:30:00')).toBe(1410)
  })

  it('rechaza lo que no es una hora', () => {
    expect(minutesOfDay('')).toBeNull()
    expect(minutesOfDay('25:00')).toBeNull()
    expect(minutesOfDay('12:70')).toBeNull()
    expect(minutesOfDay('anoche')).toBeNull()
  })
})

describe('sleepMinutes', () => {
  it('cruza la medianoche, que es el caso normal', () => {
    // De 23:30 a 07:00 son siete horas y media, no menos dieciséis.
    expect(sleepMinutes('23:30', '07:00')).toBe(450)
  })

  it('funciona también acostándose de madrugada', () => {
    expect(sleepMinutes('02:00', '09:00')).toBe(420)
  })

  it('una siesta dentro del mismo día', () => {
    expect(sleepMinutes('14:00', '15:30')).toBe(90)
  })

  it('justo a medianoche', () => {
    expect(sleepMinutes('00:00', '08:00')).toBe(480)
    expect(sleepMinutes('22:00', '00:00')).toBe(120)
  })

  it('acostarse y despertar a la misma hora son 24 h, no cero', () => {
    // Caso absurdo pero posible al teclear; mejor un dato raro que uno vacío.
    expect(sleepMinutes('23:00', '23:00')).toBe(1440)
  })

  it('con una hora inválida no inventa una duración', () => {
    expect(sleepMinutes('anoche', '07:00')).toBeNull()
    expect(sleepMinutes('23:30', '')).toBeNull()
  })
})

describe('sleepInstants', () => {
  /** Viernes 31 de julio de 2026: el día en que uno se despierta. */
  const WAKE_DATE = new Date(2026, 6, 31)

  it('sitúa la acostada el día anterior cuando la noche cruza la medianoche', () => {
    // `bedtime` y `wake_time` son `timestamptz`: el esquema quiere saber cuándo
    // se durmió, no sólo qué marcaba el reloj.
    const instants = sleepInstants(WAKE_DATE, '23:30', '06:45')

    expect(instants?.bedtimeIso).toBe(new Date(2026, 6, 30, 23, 30).toISOString())
    expect(instants?.wakeTimeIso).toBe(new Date(2026, 6, 31, 6, 45).toISOString())
  })

  it('deja ambos el mismo día si se acostó de madrugada', () => {
    const instants = sleepInstants(WAKE_DATE, '02:00', '09:00')

    expect(instants?.bedtimeIso).toBe(new Date(2026, 6, 31, 2, 0).toISOString())
    expect(instants?.wakeTimeIso).toBe(new Date(2026, 6, 31, 9, 0).toISOString())
  })

  it('una siesta del mismo día no retrocede', () => {
    const instants = sleepInstants(WAKE_DATE, '14:00', '15:30')

    expect(instants?.bedtimeIso).toBe(new Date(2026, 6, 31, 14, 0).toISOString())
  })

  it('cruza también el cambio de mes', () => {
    const firstOfAugust = new Date(2026, 7, 1)
    const instants = sleepInstants(firstOfAugust, '23:00', '07:00')

    expect(instants?.bedtimeIso).toBe(new Date(2026, 6, 31, 23, 0).toISOString())
  })

  it('con una hora inválida no inventa instantes', () => {
    expect(sleepInstants(WAKE_DATE, '99:99', '07:00')).toBeNull()
  })
})
