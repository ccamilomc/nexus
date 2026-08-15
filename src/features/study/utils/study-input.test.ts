import { describe, expect, it } from 'vitest'

import { isAppError } from '@/core/error'

import { buildLogStudyInput } from './study-input'

/** Jueves 30 de julio de 2026, a las seis de la tarde. */
const AHORA = new Date(2026, 6, 30, 18, 0)
const BASE = { id: 's1', userId: 'u1', now: AHORA }

describe('buildLogStudyInput', () => {
  it('coloca la sesión hacia atrás desde ahora, con su duración', () => {
    const actual = buildLogStudyInput({
      ...BASE,
      values: { date: '2026-07-30', subjectId: 'm1', minutes: 90 },
    })

    expect(actual.endedAt).toBe(AHORA.toISOString())
    // 90 minutos antes de las 18:00 son las 16:30.
    expect(actual.startedAt).toBe(new Date(2026, 6, 30, 16, 30).toISOString())
  })

  it('un día pasado se coloca en ese día, no en el de hoy', () => {
    // Una tarde de estudio sin registrar se sumaba al día equivocado al
    // apuntarla al día siguiente.
    const actual = buildLogStudyInput({
      ...BASE,
      values: { date: '2026-07-27', subjectId: 'm1', minutes: 60 },
    })

    // Termina al mediodía de aquel día y empieza una hora antes.
    expect(actual.endedAt).toBe(new Date(2026, 6, 27, 12, 0).toISOString())
    expect(actual.startedAt).toBe(new Date(2026, 6, 27, 11, 0).toISOString())
  })

  it('sin valoración de foco la deja sin poner', () => {
    const actual = buildLogStudyInput({
      ...BASE,
      values: { date: '2026-07-30', subjectId: 'm1', minutes: 25 },
    })

    expect(actual.focusRating).toBeUndefined()
  })

  it('lleva el id y el dueño puestos: los necesita para esperar sin red', () => {
    const actual = buildLogStudyInput({
      ...BASE,
      values: { date: '2026-07-30', subjectId: 'm1', minutes: 25 },
    })

    expect(actual).toMatchObject({ id: 's1', userId: 'u1', subjectId: 'm1', minutes: 25 })
  })

  it('un día que no se entiende se rechaza antes de encolar nada', () => {
    const error: unknown = (() => {
      try {
        buildLogStudyInput({
          ...BASE,
          values: { date: 'no-es-fecha', subjectId: 'm1', minutes: 25 },
        })
        return null
      } catch (e) {
        return e
      }
    })()

    expect(isAppError(error)).toBe(true)
  })
})
