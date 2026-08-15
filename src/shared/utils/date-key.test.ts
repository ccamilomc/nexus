import { describe, expect, it } from 'vitest'

import { lastDays, parseDateKey, previousDay, toDateKey, toDateKeyFromIso } from './date-key'

describe('parseDateKey', () => {
  it('interpreta la clave en hora local, no en UTC', () => {
    // `new Date('2026-07-29')` daría el 28 en Colombia: por eso se parte a mano.
    const date = parseDateKey('2026-07-29')

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(6)
    expect(date.getDate()).toBe(29)
  })

  it('deshace lo que hace `toDateKey`', () => {
    const original = new Date(2026, 7, 14, 23, 30)

    expect(toDateKey(parseDateKey(toDateKey(original)))).toBe(toDateKey(original))
  })
})

describe('toDateKey', () => {
  it('usa el formato que entiende Postgres', () => {
    expect(toDateKey(new Date(2026, 6, 29))).toBe('2026-07-29')
  })

  it('rellena con ceros los meses y días de una cifra', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 8, 9))).toBe('2026-09-09')
  })

  it('usa el día LOCAL, no el UTC', () => {
    // 23:50 en Colombia (UTC-5) ya es el día siguiente en UTC. La clave debe
    // seguir siendo el día que el usuario está viviendo.
    const lateNight = new Date(2026, 6, 29, 23, 50)

    expect(toDateKey(lateNight)).toBe('2026-07-29')
  })

  it('la hora no altera la clave', () => {
    expect(toDateKey(new Date(2026, 6, 29, 0, 1))).toBe(toDateKey(new Date(2026, 6, 29, 23, 59)))
  })
})

describe('previousDay', () => {
  it('retrocede un día', () => {
    expect(toDateKey(previousDay(new Date(2026, 6, 29)))).toBe('2026-07-28')
  })

  it('cruza el cambio de mes', () => {
    expect(toDateKey(previousDay(new Date(2026, 7, 1)))).toBe('2026-07-31')
  })

  it('cruza el cambio de año', () => {
    expect(toDateKey(previousDay(new Date(2026, 0, 1)))).toBe('2025-12-31')
  })

  it('no modifica la fecha original', () => {
    const original = new Date(2026, 6, 29)
    previousDay(original)

    expect(toDateKey(original)).toBe('2026-07-29')
  })
})

describe('toDateKeyFromIso', () => {
  it('agrupa por el día local del instante', () => {
    const morning = new Date(2026, 6, 29, 9, 15)

    expect(toDateKeyFromIso(morning.toISOString())).toBe('2026-07-29')
  })

  it('un entrenamiento de la noche pertenece a su día, no al siguiente', () => {
    // En Colombia (UTC-5) las 22:30 del 29 son las 03:30 UTC del 30. Agrupar
    // por UTC movería ese entrenamiento al día siguiente.
    const lateSession = new Date(2026, 6, 29, 22, 30)

    expect(toDateKeyFromIso(lateSession.toISOString())).toBe('2026-07-29')
  })
})

describe('lastDays', () => {
  it('va del más antiguo al más reciente y acaba en hoy', () => {
    const days = lastDays(new Date(2026, 6, 29), 3).map(toDateKey)

    expect(days).toEqual(['2026-07-27', '2026-07-28', '2026-07-29'])
  })

  it('pedir un solo día devuelve hoy', () => {
    expect(lastDays(new Date(2026, 6, 29), 1).map(toDateKey)).toEqual(['2026-07-29'])
  })

  it('atraviesa el cambio de mes', () => {
    const days = lastDays(new Date(2026, 7, 1), 2).map(toDateKey)

    expect(days).toEqual(['2026-07-31', '2026-08-01'])
  })
})
