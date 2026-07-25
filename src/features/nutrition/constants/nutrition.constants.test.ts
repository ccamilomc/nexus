import { describe, expect, it } from 'vitest'

import { ALL_MEAL_TYPES, MEAL_TYPE_LABELS, MEAL_TYPES_IN_ORDER } from './nutrition.constants'

describe('tipos de comida', () => {
  it('la pantalla muestra todos los tipos que existen en la base', () => {
    expect([...MEAL_TYPES_IN_ORDER].sort()).toEqual([...ALL_MEAL_TYPES].sort())
  })

  it('todos tienen etiqueta en español', () => {
    expect(MEAL_TYPES_IN_ORDER.every((type) => MEAL_TYPE_LABELS[type].length > 0)).toBe(true)
  })
})
