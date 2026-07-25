import { describe, expect, it } from 'vitest'

import type { FoodRef } from '../types/nutrition.types'
import {
  formatCalories,
  formatCop,
  formatGrams,
  formatQuantity,
  formatServing,
  formatTime,
  formatVolumeMl,
} from './format'

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

describe('formatVolumeMl', () => {
  it('usa mililitros por debajo del litro', () => {
    expect(formatVolumeMl(250)).toBe('250 ml')
    expect(formatVolumeMl(999)).toBe('999 ml')
  })

  it('cambia a litros a partir de un litro, como se habla', () => {
    expect(formatVolumeMl(1000)).toBe('1 L')
    expect(formatVolumeMl(1750)).toBe('1,8 L')
  })

  it('un día sin agua muestra cero', () => {
    expect(formatVolumeMl(0)).toBe('0 ml')
  })
})

describe('formatTime', () => {
  it('muestra la hora local en formato 24 h', () => {
    expect(formatTime(new Date(2026, 6, 25, 14, 30).toISOString())).toBe('14:30')
  })

  it('no rompe con una fecha inválida', () => {
    expect(formatTime('no es una fecha')).toBe('—')
  })
})

describe('formatCop', () => {
  it('muestra pesos colombianos sin centavos', () => {
    const precio = formatCop(12500)

    expect(precio).toContain('12.500')
    expect(precio).not.toContain(',')
  })

  it('redondea en lugar de inventar decimales', () => {
    expect(formatCop(18000.4)).toContain('18.000')
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
