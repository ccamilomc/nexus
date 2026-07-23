/**
 * Tipos de la base de datos.
 *
 * ⚠️ Este archivo es un punto de partida. La FUENTE DE VERDAD son las migraciones
 * de `supabase/migrations/`. Tras desplegar el esquema, regenera este archivo con:
 *
 *     npm run db:types
 *
 * Eso rellena `Tables`, `Views` y `Functions` a partir del esquema real. Hasta
 * entonces, sólo los `Enums` están disponibles (coinciden con la migración 1).
 */

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      unit_system: 'metric' | 'imperial'
      theme_preference: 'system' | 'light' | 'dark'
      sex: 'male' | 'female' | 'other' | 'unspecified'
      plan_status: 'draft' | 'active' | 'completed'
      plan_item_domain: 'workout' | 'nutrition' | 'study' | 'habit' | 'sleep' | 'health'
      plan_item_status: 'pending' | 'in_progress' | 'done' | 'skipped' | 'rescheduled'
      priority: 'low' | 'medium' | 'high' | 'critical'
      workout_session_status: 'planned' | 'in_progress' | 'completed' | 'skipped'
      muscle_group:
        | 'chest'
        | 'back'
        | 'shoulders'
        | 'biceps'
        | 'triceps'
        | 'legs'
        | 'glutes'
        | 'core'
        | 'full_body'
        | 'cardio'
      equipment:
        'none' | 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'kettlebell' | 'band' | 'bodyweight'
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
      habit_frequency: 'daily' | 'weekly' | 'custom'
      body_metric_type: 'weight' | 'body_fat' | 'waist' | 'hip' | 'chest' | 'arm' | 'thigh' | 'neck'
      recommendation_type:
        'day_recalculation' | 'meal_swap' | 'alternative_routine' | 'alert' | 'insight'
      recommendation_status: 'pending' | 'accepted' | 'dismissed' | 'expired'
      notification_channel: 'in_app' | 'push'
    }
    CompositeTypes: Record<string, never>
  }
}

/** Atajo para acceder a un enum del esquema: `DbEnum<'priority'>`. */
export type DbEnum<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
