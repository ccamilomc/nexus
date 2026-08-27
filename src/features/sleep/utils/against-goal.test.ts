import { describe, expect, it } from 'vitest'

import { compareWithGoal } from './against-goal'

const OCHO_HORAS = 480

describe('compareWithGoal', () => {
  it('sin objetivo no hay contra qué medir', () => {
    expect(compareWithGoal(426, null)).toBeNull()
  })

  it('sin noches registradas no hay media', () => {
    expect(compareWithGoal(null, OCHO_HORAS)).toBeNull()
  })

  it('dice cuánto falta cuando se duerme menos', () => {
    // Los datos de prueba: 7 h 6 min de media contra las 8 h que se quieren.
    const result = compareWithGoal(426, OCHO_HORAS)

    expect(result?.meetsGoal).toBe(false)
    expect(result?.missingMinutes).toBe(54)
  })

  it('un cuarto de hora de margen cuenta como cumplido', () => {
    // Nadie duerme clavado a su objetivo; «te faltaron 4 minutos» es un suspenso
    // por ruido de acostarse antes o después.
    expect(compareWithGoal(470, OCHO_HORAS)?.meetsGoal).toBe(true)
    expect(compareWithGoal(470, OCHO_HORAS)?.missingMinutes).toBe(0)
  })

  it('pasado el margen ya se cuenta lo que falta', () => {
    expect(compareWithGoal(464, OCHO_HORAS)?.meetsGoal).toBe(false)
    expect(compareWithGoal(464, OCHO_HORAS)?.missingMinutes).toBe(16)
  })

  it('dormir de más también es cumplir', () => {
    expect(compareWithGoal(510, OCHO_HORAS)?.meetsGoal).toBe(true)
    expect(compareWithGoal(510, OCHO_HORAS)?.missingMinutes).toBe(0)
  })

  it('un objetivo sin fijar no se interpreta como cero', () => {
    expect(compareWithGoal(426, 0)).toBeNull()
  })
})
