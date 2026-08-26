import { describe, expect, it } from 'vitest'

import type { DayStudy, LogStudyInput, SubjectRef, WeekStudy } from '../types/study.types'
import { addMinutesToWeek, addSessionToDay } from './add-study-session'

const FISICA: SubjectRef = { id: 's1', name: 'Física', color: '#2563eb' }
const CALCULO: SubjectRef = { id: 's2', name: 'Cálculo', color: '#16a34a' }

function input(minutes: number, subjectId = FISICA.id): LogStudyInput {
  return {
    id: `sesion-${minutes}`,
    userId: 'u1',
    subjectId,
    minutes,
    startedAt: '2026-08-15T18:00:00.000Z',
    endedAt: '2026-08-15T18:50:00.000Z',
  }
}

function week(overrides: Partial<WeekStudy> = {}): WeekStudy {
  return {
    totalMinutes: 300,
    targetMinutes: 600,
    progress: null,
    bySubject: [
      { subject: FISICA, minutes: 200, targetMinutes: 400, progress: null },
      { subject: CALCULO, minutes: 100, targetMinutes: null, progress: null },
    ],
    ...overrides,
  }
}

describe('addSessionToDay', () => {
  it('con el día vacío arranca uno con la sesión dentro', () => {
    const day = addSessionToDay(null, input(50), FISICA)

    expect(day.sessions).toHaveLength(1)
    expect(day.totalMinutes).toBe(50)
    expect(day.bySubject).toEqual([{ subject: FISICA, minutes: 50 }])
  })

  it('la recién apuntada va primera, como llegan del servidor', () => {
    const primera = addSessionToDay(null, input(30), FISICA)
    const segunda = addSessionToDay(primera, input(50), FISICA)

    expect(segunda.sessions.map(({ id }) => id)).toEqual(['sesion-50', 'sesion-30'])
  })

  it('suma a la materia que ya tenía tiempo en vez de abrirle otra fila', () => {
    const day = addSessionToDay(
      { sessions: [], totalMinutes: 40, bySubject: [{ subject: FISICA, minutes: 40 }] },
      input(20),
      FISICA,
    )

    expect(day.bySubject).toEqual([{ subject: FISICA, minutes: 60 }])
    expect(day.totalMinutes).toBe(60)
  })

  it('el reparto queda de más a menos estudiada, aunque la nueva adelante', () => {
    const conCalculo: DayStudy = {
      sessions: [],
      totalMinutes: 30,
      bySubject: [{ subject: CALCULO, minutes: 30 }],
    }

    const day = addSessionToDay(conCalculo, input(90), FISICA)

    expect(day.bySubject.map(({ subject }) => subject.name)).toEqual(['Física', 'Cálculo'])
  })

  it('usa el id que trae la sesión: es el que ya pintó la pantalla', () => {
    // Se genera al tocar el botón para poder enseñarla antes de que salga, y
    // reenviarla luego choca con la clave primaria en vez de duplicar.
    const day = addSessionToDay(null, input(50), FISICA)

    expect(day.sessions[0]?.id).toBe('sesion-50')
  })
})

describe('addMinutesToWeek', () => {
  it('sin semana cargada no se inventa una', () => {
    // Sin ella no hay objetivos que medir, y un total suelto no dice nada.
    expect(addMinutesToWeek(null, FISICA.id, 50)).toBeNull()
  })

  it('suma los minutos al total y a su materia, sin tocar las demás', () => {
    const actualizada = addMinutesToWeek(week(), FISICA.id, 50)

    expect(actualizada?.totalMinutes).toBe(350)
    expect(actualizada?.bySubject[0]?.minutes).toBe(250)
    expect(actualizada?.bySubject[1]?.minutes).toBe(100)
  })

  it('rehace el avance, que si no la barra no se movería al apuntar', () => {
    const actualizada = addMinutesToWeek(week(), FISICA.id, 100)

    expect(actualizada?.progress?.percent).toBe(67)
    expect(actualizada?.bySubject[0]?.progress?.percent).toBe(75)
  })

  it('sin objetivo no hay avance que medir', () => {
    const actualizada = addMinutesToWeek(week({ targetMinutes: null }), CALCULO.id, 30)

    expect(actualizada?.progress).toBeNull()
    expect(actualizada?.bySubject[1]?.progress).toBeNull()
  })

  it('los minutos de una materia que no está en la semana no se pierden del total', () => {
    // El total sube igual: es lo que se estudió, aunque el reparto aún no la
    // conozca porque la semana se cargó antes de que existiera.
    const actualizada = addMinutesToWeek(week(), 'materia-nueva', 40)

    expect(actualizada?.totalMinutes).toBe(340)
    expect(actualizada?.bySubject).toHaveLength(2)
  })
})
