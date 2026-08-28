import { describe, expect, it } from 'vitest'

import { formatEffort, RIR_OPTIONS, rirFromRpe, rpeFromRir } from './effort'

describe('rpeFromRir', () => {
  it('al fallo es RPE 10', () => {
    expect(rpeFromRir(0)).toBe(10)
  })

  it('cuatro en reserva es RPE 6', () => {
    expect(rpeFromRir(4)).toBe(6)
  })

  it('todas las opciones de la pantalla caben en el rango que admite la columna', () => {
    // `rpe numeric(3,1) check (rpe between 0 and 10)`: una opción fuera de ahí
    // la rechazaría la base al sincronizar, ya guardada en la cola offline.
    for (const rir of RIR_OPTIONS) {
      const rpe = rpeFromRir(rir)
      expect(rpe).toBeGreaterThanOrEqual(0)
      expect(rpe).toBeLessThanOrEqual(10)
    }
  })
})

describe('rirFromRpe', () => {
  it('sin esfuerzo anotado no hay nada que deshacer', () => {
    expect(rirFromRpe(null)).toBeNull()
  })

  it('deshace la conversión de ida', () => {
    for (const rir of RIR_OPTIONS) {
      expect(rirFromRpe(rpeFromRir(rir))).toBe(rir)
    }
  })

  it('no recorta un RPE que venga de fuera de la pantalla', () => {
    expect(rirFromRpe(3)).toBe(7)
  })
})

describe('formatEffort', () => {
  it('sin esfuerzo anotado no escribe nada', () => {
    expect(formatEffort(null)).toBeNull()
  })

  it('llegar al fallo se dice con palabras, no con un cero', () => {
    expect(formatEffort(10)).toBe('al fallo')
  })

  it('una sola repetición va en singular', () => {
    expect(formatEffort(9)).toBe('quedaba 1')
  })

  it('a partir de dos, en plural', () => {
    expect(formatEffort(8)).toBe('quedaban 2')
    expect(formatEffort(6)).toBe('quedaban 4')
  })

  it('un RPE por encima de 10 no inventa un negativo', () => {
    // La base admite hasta 10, pero si algo escribiera 11 «quedaban -1» sería
    // peor que decir que llegó al fallo.
    expect(formatEffort(11)).toBe('al fallo')
  })

  it('un decimal se escribe con coma', () => {
    expect(formatEffort(8.5)).toBe('quedaban 1,5')
  })
})
