import { describe, expect, it } from 'vitest'

import {
  createExerciseSchema,
  createRoutineSchema,
  logSetSchema,
  routineExerciseTargetsSchema,
} from './workout.schema'

describe('logSetSchema', () => {
  it('acepta una serie válida', () => {
    expect(logSetSchema.safeParse({ reps: 10, weightKg: 60 }).success).toBe(true)
  })

  it('acepta peso cero (peso corporal)', () => {
    expect(logSetSchema.safeParse({ reps: 12, weightKg: 0 }).success).toBe(true)
  })

  it('rechaza repeticiones con decimales o por debajo de una', () => {
    expect(logSetSchema.safeParse({ reps: 10.5, weightKg: 60 }).success).toBe(false)
    expect(logSetSchema.safeParse({ reps: 0, weightKg: 60 }).success).toBe(false)
  })

  it('rechaza peso negativo', () => {
    expect(logSetSchema.safeParse({ reps: 10, weightKg: -1 }).success).toBe(false)
  })
})

describe('createExerciseSchema', () => {
  const valid = { name: 'Press inclinado', muscleGroup: 'chest', equipment: 'dumbbell' }

  it('acepta un ejercicio válido sin notas', () => {
    expect(createExerciseSchema.safeParse(valid).success).toBe(true)
  })

  it('recorta los espacios del nombre', () => {
    const result = createExerciseSchema.safeParse({ ...valid, name: '  Sentadilla  ' })

    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Sentadilla')
  })

  it('rechaza un nombre vacío o de sólo espacios', () => {
    expect(createExerciseSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false)
  })

  it('rechaza un grupo muscular o equipo fuera del catálogo de enums', () => {
    expect(createExerciseSchema.safeParse({ ...valid, muscleGroup: 'brazos' }).success).toBe(false)
    expect(createExerciseSchema.safeParse({ ...valid, equipment: 'trx' }).success).toBe(false)
  })
})

describe('createRoutineSchema', () => {
  it('acepta una rutina con nombre y sin objetivo', () => {
    expect(createRoutineSchema.safeParse({ name: 'Full body' }).success).toBe(true)
  })

  it('recorta el nombre y rechaza el vacío', () => {
    expect(createRoutineSchema.safeParse({ name: '  Push  ' }).data?.name).toBe('Push')
    expect(createRoutineSchema.safeParse({ name: '  ' }).success).toBe(false)
  })
})

describe('routineExerciseTargetsSchema', () => {
  it('acepta objetivos vacíos (todos opcionales)', () => {
    expect(routineExerciseTargetsSchema.safeParse({}).success).toBe(true)
  })

  it('acepta cifras válidas, incluido peso cero', () => {
    const result = routineExerciseTargetsSchema.safeParse({
      targetSets: 3,
      targetReps: 10,
      targetWeightKg: 0,
    })

    expect(result.success).toBe(true)
  })

  it('rechaza series con decimales o peso negativo', () => {
    expect(routineExerciseTargetsSchema.safeParse({ targetSets: 3.5 }).success).toBe(false)
    expect(routineExerciseTargetsSchema.safeParse({ targetWeightKg: -5 }).success).toBe(false)
  })
})
