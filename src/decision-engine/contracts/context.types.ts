/**
 * Contrato de ENTRADA del Decision Engine (ver docs/06-decision-engine-e-ia.md).
 *
 * El motor no conoce ninguna feature: define aquí la forma de los datos que
 * necesita, y son los services de cada dominio quienes rellenan este snapshot.
 * Por eso todos los tipos son locales al motor y no se importan de fuera.
 */

export type PlanItemDomain = 'workout' | 'nutrition' | 'study' | 'habit' | 'sleep' | 'health'

export type PlanItemStatus = 'pending' | 'in_progress' | 'done' | 'skipped' | 'rescheduled'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type EnergyLevel = 'low' | 'normal' | 'high'

export type Sex = 'male' | 'female' | 'other' | 'unspecified'

export type Equipment =
  'none' | 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'kettlebell' | 'band' | 'bodyweight'

export interface MacroTotals {
  readonly calories: number
  readonly proteinG: number
  readonly carbsG: number
  readonly fatG: number
}

export interface NutritionGoalSnapshot extends MacroTotals {
  readonly waterMl: number
  /** Presupuesto semanal de comida: base de la nutrición económica. */
  readonly weeklyFoodBudget?: number
}

export interface PlanItemSnapshot {
  readonly id: string
  readonly domain: PlanItemDomain
  readonly status: PlanItemStatus
  readonly priority: Priority
  readonly estimatedMinutes?: number
  /** ISO 8601 */
  readonly scheduledStart?: string
  /** ISO 8601 */
  readonly scheduledEnd?: string
}

export interface WorkoutSessionSnapshot {
  readonly id: string
  /** ISO 8601 (día) */
  readonly date: string
  readonly durationMinutes: number
  readonly perceivedEffort?: number
}

export interface DailyContext {
  /** Día evaluado, ISO 8601. */
  readonly date: string
  /** Momento de la evaluación, ISO 8601. Se inyecta para que el motor sea determinista. */
  readonly now: string
  readonly profile: {
    readonly sex: Sex
    readonly birthDate?: string
    readonly heightCm?: number
  }
  readonly goals: {
    readonly nutrition?: NutritionGoalSnapshot
    readonly sleepMinutes?: number
    readonly studyWeeklyMinutes?: number
    readonly weightKg?: number
  }
  readonly plan: readonly PlanItemSnapshot[]
  readonly workout: {
    readonly recentSessions: readonly WorkoutSessionSnapshot[]
    /** Inicio del entrenamiento en curso (ISO), si hay alguno sin terminar. */
    readonly activeSessionStartedAt?: string
  }
  readonly nutrition: {
    readonly todayIntake: MacroTotals
    readonly todaySpend: number
    /** Agua bebida hoy, en mililitros. */
    readonly todayWaterMl: number
  }
  readonly study: {
    readonly weekMinutes: number
  }
  readonly habits: {
    /** Hábitos activos hoy. */
    readonly total: number
    /** Cuántos de ellos ya están cumplidos. */
    readonly done: number
  }
  readonly sleep: {
    readonly lastNightMinutes?: number
    readonly quality?: number
  }
  /** Límites reales del día: tiempo, equipo y energía disponibles. */
  readonly constraints: {
    readonly availableMinutes?: number
    readonly availableEquipment?: readonly Equipment[]
    readonly energyLevel?: EnergyLevel
  }
}
