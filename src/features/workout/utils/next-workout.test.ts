import { describe, expect, it } from 'vitest'

import type { RoutineDaySnapshot } from '@/decision-engine'

import type { SessionDetail } from '../types/workout.types'
import { buildNextWorkout } from './next-workout'

const AHORA = new Date(2026, 7, 14, 10, 0, 0)

function dia(id: string, dayName: string): RoutineDaySnapshot {
  return { id, routineName: 'Push Pull Legs', dayName, exercises: [] }
}

const DIAS = [dia('d1', 'Empuje'), dia('d2', 'Tirón'), dia('d3', 'Pierna')]

/** Una sesión del historial, con lo justo para situarla y saber su rutina. */
function sesion(day: number, routineDayId: string | null): SessionDetail {
  const fecha = new Date(2026, 7, day, 19, 0, 0).toISOString()

  return {
    session: {
      id: `s-${day}`,
      user_id: 'quien-sea',
      routine_day_id: routineDayId,
      started_at: fecha,
      ended_at: fecha,
      status: 'completed',
      notes: null,
      perceived_effort: null,
      created_at: '',
      updated_at: '',
      deleted_at: null,
    },
    exercises: [],
    stats: { exerciseCount: 0, setCount: 0, totalVolumeKg: 0, durationMinutes: null },
    plan: null,
  }
}

describe('buildNextWorkout', () => {
  it('propone el día siguiente al último que se hizo', () => {
    const { suggestedDay } = buildNextWorkout([sesion(11, 'd1')], DIAS, AHORA)

    expect(suggestedDay?.dayName).toBe('Tirón')
  })

  it('después del último día vuelve al primero', () => {
    const { suggestedDay } = buildNextWorkout([sesion(11, 'd3')], DIAS, AHORA)

    expect(suggestedDay?.dayName).toBe('Empuje')
  })

  it('se salta los entrenamientos libres para saber por dónde iba la rutina', () => {
    // Entre medias puede haber sesiones sueltas: no cambian el turno.
    const historial = [sesion(13, null), sesion(11, 'd2')]

    expect(buildNextWorkout(historial, DIAS, AHORA).suggestedDay?.dayName).toBe('Pierna')
  })

  it('sin haber usado nunca la rutina, propone empezar por el principio', () => {
    const { suggestedDay } = buildNextWorkout([sesion(11, null)], DIAS, AHORA)

    expect(suggestedDay?.dayName).toBe('Empuje')
  })

  it('si el día que se usó ya no existe, también empieza por el principio', () => {
    // La rutina pudo cambiar: proponer nada sería peor que proponer el primero.
    const { suggestedDay } = buildNextWorkout([sesion(11, 'borrado')], DIAS, AHORA)

    expect(suggestedDay?.dayName).toBe('Empuje')
  })

  it('sin rutinas no se inventa un plan', () => {
    // Nexus recuerda; no decide por su cuenta lo que el usuario no ha escrito.
    const { suggestedDay, daysSince } = buildNextWorkout([sesion(11, null)], [], AHORA)

    expect(suggestedDay).toBeNull()
    expect(daysSince).toBe(3)
  })

  it('cuenta los días por fecha, no por horas', () => {
    // Entrenar ayer a las 19:00 y mirar hoy a las 10:00 son 15 horas, y es
    // «ayer»: contando por horas saldría cero días.
    const { daysSince } = buildNextWorkout([sesion(13, 'd1')], DIAS, AHORA)

    expect(daysSince).toBe(1)
  })

  it('sin historial no hay ni fecha ni cuenta', () => {
    const { lastTrainedAt, daysSince, suggestedDay } = buildNextWorkout([], DIAS, AHORA)

    expect(lastTrainedAt).toBeNull()
    expect(daysSince).toBeNull()
    // Pero sí hay por dónde empezar.
    expect(suggestedDay?.dayName).toBe('Empuje')
  })
})
