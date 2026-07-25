import { describe, expect, it } from 'vitest'

import type { FoodRef } from '../types/nutrition.types'
import { formatCalories, formatGrams, formatQuantity, formatServing } from './format'

const EGG: FoodRef = {
  id: 'egg',
  name: 'Huevo',
  brand: null,
  serving_size: 50,
  serving_unit: 'g',
  calories: 72,
  protein_g: 6.3,
  carbs_g: 0.4,
  fat_g: 5,
}

describe('formatCalories', () => {
  it('redondea a entero', () => {
    expect(formatCalories(1850.4)).toBe('1850 kcal')
    expect(formatCalories(0)).toBe('0 kcal')
  })

  it('separa los miles a partir de cinco cifras, como manda el español', () => {
    expect(formatCalories(12450)).toBe('12.450 kcal')
  })
})

describe('formatGrams', () => {
  it('deja un decimal como mucho', () => {
    expect(formatGrams(31)).toBe('31 g')
    expect(formatGrams(6.3)).toBe('6,3 g')
  })
})

describe('formatServing', () => {
  it('describe la porción del alimento', () => {
    expect(formatServing(EGG)).toBe('50 g')
  })
})

describe('formatQuantity', () => {
  it('muestra las porciones y su equivalencia total', () => {
    expect(formatQuantity(EGG, 2)).toBe('2 × 50 g · 100 g')
  })

  it('admite porciones fraccionadas', () => {
    expect(formatQuantity(EGG, 0.5)).toBe('0,5 × 50 g · 25 g')
  })
})
