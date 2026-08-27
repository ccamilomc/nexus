import { describe, expect, it } from 'vitest'

import type { Exercise } from '../types/workout.types'
import { filterExercises, NO_FILTERS } from './filter-exercises'

function exercise(
  name: string,
  muscleGroup: Exercise['muscle_group'],
  equipment: Exercise['equipment'],
): Exercise {
  return {
    id: name,
    user_id: null,
    name,
    muscle_group: muscleGroup,
    secondary_muscles: [],
    equipment,
    instructions: null,
    is_custom: false,
    created_at: '',
    updated_at: '',
  }
}

const CATALOGO = [
  exercise('Press de banca', 'chest', 'barbell'),
  exercise('Press de hombro en máquina', 'shoulders', 'machine'),
  exercise('Elevaciones laterales', 'shoulders', 'dumbbell'),
  exercise('Prensa de piernas', 'legs', 'machine'),
]

describe('filterExercises', () => {
  it('sin filtros devuelve el catálogo entero', () => {
    expect(filterExercises(CATALOGO, NO_FILTERS)).toHaveLength(4)
  })

  it('busca por nombre sin distinguir mayúsculas ni acentos', () => {
    const encontrados = filterExercises(CATALOGO, { ...NO_FILTERS, query: 'maquina' })

    expect(encontrados.map(({ name }) => name)).toEqual(['Press de hombro en máquina'])
  })

  it('acota por músculo', () => {
    const encontrados = filterExercises(CATALOGO, { ...NO_FILTERS, muscleGroup: 'shoulders' })

    expect(encontrados).toHaveLength(2)
  })

  it('acota por equipo, que es la pregunta de quien entrena en un sitio concreto', () => {
    const encontrados = filterExercises(CATALOGO, { ...NO_FILTERS, equipment: 'machine' })

    expect(encontrados.map(({ name }) => name)).toEqual([
      'Press de hombro en máquina',
      'Prensa de piernas',
    ])
  })

  it('los filtros se suman', () => {
    const encontrados = filterExercises(CATALOGO, {
      query: '',
      muscleGroup: 'shoulders',
      equipment: 'machine',
    })

    expect(encontrados.map(({ name }) => name)).toEqual(['Press de hombro en máquina'])
  })

  it('sin coincidencias devuelve una lista vacía, no el catálogo', () => {
    expect(filterExercises(CATALOGO, { ...NO_FILTERS, query: 'natación' })).toEqual([])
  })
})
