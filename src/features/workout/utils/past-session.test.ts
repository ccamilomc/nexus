import { describe, expect, it } from 'vitest'

import { toPastSessionRange } from './past-session'

describe('toPastSessionRange', () => {
  it('el fin sale de la duración, no se pide', () => {
    const range = toPastSessionRange({
      date: '2026-08-12',
      startTime: '19:30',
      durationMinutes: 75,
    })

    const started = new Date(range?.startedAt ?? '')
    const ended = new Date(range?.endedAt ?? '')

    expect((ended.getTime() - started.getTime()) / 60_000).toBe(75)
  })

  it('la hora que se teclea es la del reloj de quien la escribe', () => {
    // Se construye con la fecha local a propósito: juntando cadenas, «19:30»
    // acabaría siendo las 19:30 de un huso que la aplicación eligió sola.
    const range = toPastSessionRange({
      date: '2026-08-12',
      startTime: '19:30',
      durationMinutes: 60,
    })

    const started = new Date(range?.startedAt ?? '')

    expect(started.getHours()).toBe(19)
    expect(started.getMinutes()).toBe(30)
    expect(started.getDate()).toBe(12)
  })

  it('un entrenamiento nocturno cruza a la madrugada sin liarse', () => {
    const range = toPastSessionRange({
      date: '2026-08-12',
      startTime: '23:30',
      durationMinutes: 60,
    })

    const ended = new Date(range?.endedAt ?? '')

    expect(ended.getDate()).toBe(13)
    expect(ended.getHours()).toBe(0)
  })

  it('con una fecha que no se entiende devuelve nada, en vez de inventarla', () => {
    // Apuntar un entrenamiento en 1970 sería peor que no apuntarlo.
    expect(toPastSessionRange({ date: '', startTime: '19:30', durationMinutes: 60 })).toBeNull()
    expect(
      toPastSessionRange({ date: '2026-08-12', startTime: 'luego', durationMinutes: 60 }),
    ).toBeNull()
  })
})
