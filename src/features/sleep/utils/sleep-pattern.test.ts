import { describe, expect, it } from 'vitest'

import type { SleepLog } from '../types/sleep.types'
import { sleepPattern } from './sleep-pattern'

/**
 * Una noche, con las horas en local.
 *
 * Se construyen con `new Date(...)` y no con literales ISO a propósito: la
 * columna es `timestamptz` y el patrón se lee en la hora del usuario, así que
 * el test tiene que hablar en la misma zona que la aplicación.
 */
function night(bedtime: string, wakeTime: string, day = 7): SleepLog {
  const at = (time: string, offset: number) => {
    const [hours = 0, minutes = 0] = time.split(':').map(Number)
    return new Date(2026, 7, day + offset, hours, minutes).toISOString()
  }

  return {
    id: `log-${day}-${bedtime}`,
    user_id: 'u-1',
    date: `2026-08-${String(day).padStart(2, '0')}`,
    // Acostarse pasada la medianoche pertenece ya al día del despertar.
    bedtime: at(bedtime, Number(bedtime.split(':')[0]) < 12 ? 0 : -1),
    wake_time: at(wakeTime, 0),
    duration_minutes: 420,
    quality_rating: null,
    interruptions: 0,
    notes: null,
    created_at: '2026-08-07T10:00:00.000Z',
    updated_at: '2026-08-07T10:00:00.000Z',
    deleted_at: null,
  }
}

describe('sleepPattern', () => {
  it('saca el horario habitual de varias noches', () => {
    const pattern = sleepPattern([
      night('23:00', '06:30', 5),
      night('23:30', '07:00', 6),
      night('23:15', '06:45', 7),
    ])

    expect(pattern).toEqual({ bedtime: '23:15', wakeTime: '06:45' })
  })

  it('una noche de fiesta no arrastra el horario', () => {
    // Con media, acostarse a las 4:00 una vez movería la propuesta casi una
    // hora y dejaría de parecerse a ninguna noche real.
    const pattern = sleepPattern([
      night('23:00', '07:00', 4),
      night('23:00', '07:00', 5),
      night('23:00', '07:00', 6),
      night('04:00', '11:00', 7),
    ])

    expect(pattern?.bedtime).toBe('23:00')
  })

  it('funciona acostándose después de medianoche', () => {
    // El caso que rompe la media de minutos del día: 23:40 y 00:20 están a
    // cuarenta minutos, pero como cifras (1420 y 20) parecen opuestas.
    const pattern = sleepPattern([
      night('23:40', '07:00', 5),
      night('00:20', '07:30', 6),
      night('00:00', '07:15', 7),
    ])

    expect(pattern?.bedtime).toBe('00:00')
  })

  it('con menos de tres noches no hay patrón que proponer', () => {
    // «Lo de siempre» con dos noches es lo de anteayer.
    expect(sleepPattern([night('23:00', '07:00', 6), night('23:30', '07:30', 7)])).toBeNull()
    expect(sleepPattern([])).toBeNull()
  })

  it('las noches a medias no cuentan', () => {
    const incompleta = { ...night('23:00', '07:00', 5), wake_time: null }

    expect(sleepPattern([incompleta, night('23:00', '07:00', 6), night('23:00', '07:00', 7)])).toBe(
      null,
    )
  })

  it('con un número par de noches toma el centro', () => {
    const pattern = sleepPattern([
      night('22:00', '06:00', 4),
      night('23:00', '07:00', 5),
      night('23:30', '07:30', 6),
      night('00:30', '08:30', 7),
    ])

    expect(pattern).toEqual({ bedtime: '23:15', wakeTime: '07:15' })
  })
})
