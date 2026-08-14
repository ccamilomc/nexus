import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { FoodRef } from '../types/nutrition.types'
import { FoodMacroLine } from './FoodMacroLine'

function food(overrides: Partial<FoodRef> = {}): FoodRef {
  return {
    id: 'food-1',
    name: 'Aguacate',
    brand: null,
    serving_size: 100,
    serving_unit: 'g',
    calories: 160,
    protein_g: 2,
    carbs_g: 8.5,
    fat_g: 14.7,
    cost_per_serving: 1600,
    ...overrides,
  }
}

describe('FoodMacroLine', () => {
  it('acompaña cada cifra de su inicial', () => {
    // Sin ellas son tres números en gramos y hay que saberse el orden.
    render(<FoodMacroLine food={food()} />)

    expect(screen.getByText(/P 2 g · C 8,5 g · G 14,7 g/)).toBeInTheDocument()
  })

  it('enseña lo que cuesta la porción, que es lo que ayuda a elegir', () => {
    render(<FoodMacroLine food={food()} />)

    expect(screen.getByText(/\$\s?1\.600/)).toBeInTheDocument()
  })

  it('sin precio no escribe nada, porque no saberlo no es que sea gratis', () => {
    render(<FoodMacroLine food={food({ cost_per_serving: null })} />)

    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
    expect(screen.getByText(/P 2 g/)).toBeInTheDocument()
  })
})
