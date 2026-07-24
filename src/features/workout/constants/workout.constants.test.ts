import { describe, expect, it } from 'vitest'

import { Constants } from '@/core/supabase/database.types'

import { EQUIPMENT_OPTIONS, MUSCLE_GROUP_OPTIONS } from './workout.constants'

describe('opciones de enum', () => {
  it('cubren todos los grupos musculares del esquema, con etiqueta', () => {
    expect(MUSCLE_GROUP_OPTIONS.map((option) => option.value)).toEqual([
      ...Constants.public.Enums.muscle_group,
    ])
    expect(MUSCLE_GROUP_OPTIONS.every((option) => option.label.length > 0)).toBe(true)
  })

  it('cubren todos los tipos de equipo del esquema, con etiqueta', () => {
    expect(EQUIPMENT_OPTIONS.map((option) => option.value)).toEqual([
      ...Constants.public.Enums.equipment,
    ])
    expect(EQUIPMENT_OPTIONS.every((option) => option.label.length > 0)).toBe(true)
  })
})
