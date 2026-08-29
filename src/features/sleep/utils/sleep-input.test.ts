import { describe, expect, it } from 'vitest'

import { isAppError } from '@/core/error'

import { buildLogSleepInput } from './sleep-input'

const BASE = { id: 'n1', userId: 'u1' }
const build = (values: Parameters<typeof buildLogSleepInput>[0]['values']) =>
  buildLogSleepInput({ ...BASE, values })

describe('buildLogSleepInput', () => {
  it('calcula la duración cruzando la medianoche', () => {
    expect(
      build({ date: '2026-07-31', kind: 'night', bedtime: '23:30', wakeTime: '07:00' }).minutes,
    ).toBe(450)
  })

  it('resuelve instantes, no horas sueltas: la acostada fue el día anterior', () => {
    // Las columnas son `timestamptz`; enviar «23:30» reventaba contra la base.
    const actual = build({ date: '2026-07-31', kind: 'night', bedtime: '23:30', wakeTime: '07:00' })

    expect(actual.bedtimeIso).toBe(new Date(2026, 6, 30, 23, 30).toISOString())
    expect(actual.wakeTimeIso).toBe(new Date(2026, 6, 31, 7, 0).toISOString())
  })

  it('conserva la fecha del día en que se despierta', () => {
    // Al abrir la aplicación por la mañana, «anoche» es el registro de hoy.
    expect(
      build({ date: '2026-07-31', kind: 'night', bedtime: '23:00', wakeTime: '07:00' }).dateKey,
    ).toBe('2026-07-31')
  })

  it('una noche pasada lleva su propia víspera, no la de anoche', () => {
    // El sueño se registra al levantarse y olvidarse un par de días es normal.
    const actual = build({ date: '2026-07-28', kind: 'night', bedtime: '23:00', wakeTime: '07:00' })

    expect(actual.bedtimeIso).toBe(new Date(2026, 6, 27, 23, 0).toISOString())
    expect(actual.wakeTimeIso).toBe(new Date(2026, 6, 28, 7, 0).toISOString())
  })

  it('sin valoración deja ausencia de dato, no un cero', () => {
    expect(
      build({ date: '2026-07-31', kind: 'night', bedtime: '23:00', wakeTime: '07:00' })
        .qualityRating,
    ).toBe(null)
  })

  it('guarda la valoración cuando se da', () => {
    const actual = build({
      date: '2026-07-31',
      kind: 'night',
      bedtime: '23:00',
      wakeTime: '07:00',
      qualityRating: 4,
    })

    expect(actual.qualityRating).toBe(4)
  })

  it('con horas imposibles avisa en cristiano, antes de encolar nada', () => {
    const error: unknown = (() => {
      try {
        return build({ date: '2026-07-31', kind: 'night', bedtime: '99:99', wakeTime: '07:00' })
      } catch (e) {
        return e
      }
    })()

    expect(error).toEqual({ code: 'validation', message: 'Revisa las horas: no son válidas.' })
  })

  it('con un día que no se entiende, tampoco', () => {
    const error: unknown = (() => {
      try {
        return build({ date: 'no-es-fecha', kind: 'night', bedtime: '23:00', wakeTime: '07:00' })
      } catch (e) {
        return e
      }
    })()

    expect(isAppError(error)).toBe(true)
  })
})
