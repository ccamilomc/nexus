import { describe, expect, it } from 'vitest'

import { toDateKey } from '@/shared/utils'

import type { HabitLog } from '../types/habits.types'
import { calculateStreak, hasCompletedOn } from './streak'

/** Conjunto de fechas cumplidas a partir de desplazamientos desde `today`. */
function completed(today: Date, ...offsets: readonly number[]): Set<string> {
  return new Set(
    offsets.map((offset) => {
      const day = new Date(today)
      day.setDate(day.getDate() - offset)
      return toDateKey(day)
    }),
  )
}

const TODAY = new Date(2026, 6, 29)

describe('calculateStreak', () => {
  it('cuenta los días consecutivos incluyendo hoy', () => {
    expect(calculateStreak(completed(TODAY, 0, 1, 2), TODAY)).toBe(3)
  })

  it('no rompe la racha si hoy aún no está marcado', () => {
    // Ayer y anteayer hechos, hoy todavía no: el día no ha terminado.
    expect(calculateStreak(completed(TODAY, 1, 2), TODAY)).toBe(2)
  })

  it('se rompe en cuanto falta un día anterior', () => {
    // Hoy y ayer sí, pero anteayer no: la racha son 2.
    expect(calculateStreak(completed(TODAY, 0, 1, 3, 4), TODAY)).toBe(2)
  })

  it('sin registros la racha es cero', () => {
    expect(calculateStreak(new Set(), TODAY)).toBe(0)
  })

  it('marcar sólo hoy empieza una racha de uno', () => {
    expect(calculateStreak(completed(TODAY, 0), TODAY)).toBe(1)
  })

  it('un hueco de dos días no cuenta como racha aunque haya registros viejos', () => {
    expect(calculateStreak(completed(TODAY, 5, 6, 7), TODAY)).toBe(0)
  })

  it('atraviesa el cambio de mes', () => {
    // 1 de agosto: la racha viene del 31 y 30 de julio.
    const firstOfAugust = new Date(2026, 7, 1)

    expect(calculateStreak(completed(firstOfAugust, 0, 1, 2), firstOfAugust)).toBe(3)
  })
})

/** Registro de un hábito en una fecha, cumplido o intentado. */
function log(dateKey: string, isCompleted: boolean): HabitLog {
  return {
    id: `log-${dateKey}`,
    user_id: 'user-1',
    habit_id: 'h1',
    date: dateKey,
    count: 1,
    completed: isCompleted,
    notes: null,
    created_at: `${dateKey}T10:00:00.000Z`,
    updated_at: `${dateKey}T10:00:00.000Z`,
    deleted_at: null,
  }
}

describe('hasCompletedOn', () => {
  it('reconoce el día cumplido', () => {
    expect(hasCompletedOn([log('2026-07-01', true)], '2026-07-01')).toBe(true)
  })

  it('un día registrado pero no cumplido no cuenta', () => {
    // Si contara, se pediría un tramo más de historial para nada: la racha ya
    // está rota en ese día.
    expect(hasCompletedOn([log('2026-07-01', false)], '2026-07-01')).toBe(false)
  })

  it('no confunde días vecinos', () => {
    expect(hasCompletedOn([log('2026-07-02', true)], '2026-07-01')).toBe(false)
  })

  it('sin registros es falso', () => {
    expect(hasCompletedOn([], '2026-07-01')).toBe(false)
  })
})

describe('calculateStreak con días marcados', () => {
  const LUNES = new Date(2026, 7, 24)
  const MARTES = new Date(2026, 7, 25)
  const MIERCOLES = new Date(2026, 7, 26)
  const JUEVES = new Date(2026, 7, 27)

  /** Toca lunes, miércoles y viernes. */
  const lmv = (date: Date) => [1, 3, 5].includes(((date.getDay() + 6) % 7) + 1)

  it('un día que no toca no rompe la racha', () => {
    // Es el fallo que tenía: el martes salía como día fallado y la racha de
    // cualquier hábito que no fuera diario se rompía sola cada dos días.
    const hechos = new Set(['2026-08-21', '2026-08-24', '2026-08-26'])

    expect(calculateStreak(hechos, MIERCOLES, lmv)).toBe(3)
  })

  it('mirando desde un día que no toca, la racha sigue viva', () => {
    // El martes, un hábito de lunes-miércoles-viernes no ha fallado nada.
    const hechos = new Set(['2026-08-21', '2026-08-24'])

    expect(calculateStreak(hechos, MARTES, lmv)).toBe(2)
  })

  it('faltar un día que sí tocaba sí la rompe', () => {
    // Sin el lunes, la racha se corta ahí aunque el miércoles esté hecho.
    const hechos = new Set(['2026-08-21', '2026-08-26'])

    expect(calculateStreak(hechos, MIERCOLES, lmv)).toBe(1)
  })

  it('el jueves tampoco toca: la racha del miércoles se conserva', () => {
    const hechos = new Set(['2026-08-24', '2026-08-26'])

    expect(calculateStreak(hechos, JUEVES, lmv)).toBe(2)
  })

  it('sin días marcados se comporta como siempre', () => {
    // La firma cambió con un valor por defecto: lo que ya funcionaba no puede
    // cambiar de resultado.
    const hechos = new Set(['2026-08-23', '2026-08-24'])

    expect(calculateStreak(hechos, LUNES)).toBe(2)
  })

  it('no da vueltas para siempre cuando la racha se acaba', () => {
    // Un hábito de un solo día a la semana salta seis por cada uno que cuenta:
    // sin tope, buscar el anterior no terminaría nunca.
    const soloLunes = (date: Date) => date.getDay() === 1

    expect(calculateStreak(new Set(), LUNES, soloLunes)).toBe(0)
  })
})
