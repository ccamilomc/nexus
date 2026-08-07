export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assistant_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          token_count: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          token_count?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      body_metrics: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          measured_at: string
          metric_type: Database["public"]["Enums"]["body_metric_type"]
          unit: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          measured_at?: string
          metric_type: Database["public"]["Enums"]["body_metric_type"]
          unit: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          measured_at?: string
          metric_type?: Database["public"]["Enums"]["body_metric_type"]
          unit?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      daily_plans: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          generated_at: string | null
          id: string
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          deleted_at?: string | null
          generated_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          generated_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          equipment: Database["public"]["Enums"]["equipment"]
          id: string
          instructions: string | null
          is_custom: boolean | null
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name: string
          secondary_muscles: Database["public"]["Enums"]["muscle_group"][]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          equipment?: Database["public"]["Enums"]["equipment"]
          id?: string
          instructions?: string | null
          is_custom?: boolean | null
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name: string
          secondary_muscles?: Database["public"]["Enums"]["muscle_group"][]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          equipment?: Database["public"]["Enums"]["equipment"]
          id?: string
          instructions?: string | null
          is_custom?: boolean | null
          muscle_group?: Database["public"]["Enums"]["muscle_group"]
          name?: string
          secondary_muscles?: Database["public"]["Enums"]["muscle_group"][]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      finance_accounts: {
        Row: {
          archived_at: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          initial_balance: number
          kind: Database["public"]["Enums"]["finance_account_kind"]
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          initial_balance?: number
          kind?: Database["public"]["Enums"]["finance_account_kind"]
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          initial_balance?: number
          kind?: Database["public"]["Enums"]["finance_account_kind"]
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["finance_entry_kind"]
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["finance_entry_kind"]
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["finance_entry_kind"]
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      finance_debts: {
        Row: {
          counterpart: string
          created_at: string
          deleted_at: string | null
          direction: Database["public"]["Enums"]["finance_debt_direction"]
          due_on: string | null
          id: string
          instalments: number | null
          interest_kind: Database["public"]["Enums"]["finance_interest_kind"]
          interest_rate: number | null
          note: string | null
          principal: number
          settled_at: string | null
          started_on: string
          updated_at: string
          user_id: string
        }
        Insert: {
          counterpart: string
          created_at?: string
          deleted_at?: string | null
          direction: Database["public"]["Enums"]["finance_debt_direction"]
          due_on?: string | null
          id?: string
          instalments?: number | null
          interest_kind?: Database["public"]["Enums"]["finance_interest_kind"]
          interest_rate?: number | null
          note?: string | null
          principal: number
          settled_at?: string | null
          started_on: string
          updated_at?: string
          user_id: string
        }
        Update: {
          counterpart?: string
          created_at?: string
          deleted_at?: string | null
          direction?: Database["public"]["Enums"]["finance_debt_direction"]
          due_on?: string | null
          id?: string
          instalments?: number | null
          interest_kind?: Database["public"]["Enums"]["finance_interest_kind"]
          interest_rate?: number | null
          note?: string | null
          principal?: number
          settled_at?: string | null
          started_on?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          counterpart_account_id: string | null
          created_at: string
          debt_id: string | null
          deleted_at: string | null
          id: string
          kind: Database["public"]["Enums"]["finance_transaction_kind"]
          note: string | null
          occurred_on: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          counterpart_account_id?: string | null
          created_at?: string
          debt_id?: string | null
          deleted_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["finance_transaction_kind"]
          note?: string | null
          occurred_on: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          counterpart_account_id?: string | null
          created_at?: string
          debt_id?: string | null
          deleted_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["finance_transaction_kind"]
          note?: string | null
          occurred_on?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_counterpart_account_id_fkey"
            columns: ["counterpart_account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "finance_debts"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          brand: string | null
          calories: number
          carbs_g: number
          cost_per_serving: number | null
          created_at: string
          currency: string | null
          fat_g: number
          fiber_g: number | null
          id: string
          is_custom: boolean | null
          name: string
          protein_g: number
          serving_size: number
          serving_unit: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          calories?: number
          carbs_g?: number
          cost_per_serving?: number | null
          created_at?: string
          currency?: string | null
          fat_g?: number
          fiber_g?: number | null
          id?: string
          is_custom?: boolean | null
          name: string
          protein_g?: number
          serving_size?: number
          serving_unit?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          calories?: number
          carbs_g?: number
          cost_per_serving?: number | null
          created_at?: string
          currency?: string | null
          fat_g?: number
          fiber_g?: number | null
          id?: string
          is_custom?: boolean | null
          name?: string
          protein_g?: number
          serving_size?: number
          serving_unit?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed: boolean
          count: number
          created_at: string
          date: string
          deleted_at: string | null
          habit_id: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          count?: number
          created_at?: string
          date?: string
          deleted_at?: string | null
          habit_id: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          count?: number
          created_at?: string
          date?: string
          deleted_at?: string | null
          habit_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          deleted_at: string | null
          description: string | null
          frequency: Database["public"]["Enums"]["habit_frequency"]
          icon: string
          id: string
          is_active: boolean
          name: string
          target_count: number
          target_weekdays: number[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["habit_frequency"]
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          target_count?: number
          target_weekdays?: number[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          frequency?: Database["public"]["Enums"]["habit_frequency"]
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          target_count?: number
          target_weekdays?: number[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_goals: {
        Row: {
          created_at: string
          deleted_at: string | null
          effective_from: string
          id: string
          is_active: boolean
          target_body_fat_pct: number | null
          target_weight_kg: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          effective_from?: string
          id?: string
          is_active?: boolean
          target_body_fat_pct?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          effective_from?: string
          id?: string
          is_active?: boolean
          target_body_fat_pct?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_log_items: {
        Row: {
          created_at: string
          food_id: string
          id: string
          meal_log_id: string
          servings: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          food_id: string
          id?: string
          meal_log_id: string
          servings?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          food_id?: string
          id?: string
          meal_log_id?: string
          servings?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_log_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_log_items_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          logged_at: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logged_at?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logged_at?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plan_items: {
        Row: {
          created_at: string
          food_id: string
          id: string
          meal_plan_id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          servings: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          food_id: string
          id?: string
          meal_plan_id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          servings?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          food_id?: string
          id?: string
          meal_plan_id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          servings?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          deleted_at: string | null
          id: string
          read_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          deleted_at?: string | null
          id?: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          deleted_at?: string | null
          id?: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          calories_target: number
          carbs_g_target: number
          created_at: string
          deleted_at: string | null
          effective_from: string
          fat_g_target: number
          id: string
          is_active: boolean
          protein_g_target: number
          updated_at: string
          user_id: string
          water_ml_target: number
          weekly_food_budget: number | null
        }
        Insert: {
          calories_target: number
          carbs_g_target: number
          created_at?: string
          deleted_at?: string | null
          effective_from?: string
          fat_g_target: number
          id?: string
          is_active?: boolean
          protein_g_target: number
          updated_at?: string
          user_id: string
          water_ml_target?: number
          weekly_food_budget?: number | null
        }
        Update: {
          calories_target?: number
          carbs_g_target?: number
          created_at?: string
          deleted_at?: string | null
          effective_from?: string
          fat_g_target?: number
          id?: string
          is_active?: boolean
          protein_g_target?: number
          updated_at?: string
          user_id?: string
          water_ml_target?: number
          weekly_food_budget?: number | null
        }
        Relationships: []
      }
      plan_items: {
        Row: {
          created_at: string
          daily_plan_id: string
          deleted_at: string | null
          domain: Database["public"]["Enums"]["plan_item_domain"]
          id: string
          order_index: number
          priority: Database["public"]["Enums"]["priority"]
          reference_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["plan_item_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_plan_id: string
          deleted_at?: string | null
          domain: Database["public"]["Enums"]["plan_item_domain"]
          id?: string
          order_index?: number
          priority?: Database["public"]["Enums"]["priority"]
          reference_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["plan_item_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_plan_id?: string
          deleted_at?: string | null
          domain?: Database["public"]["Enums"]["plan_item_domain"]
          id?: string
          order_index?: number
          priority?: Database["public"]["Enums"]["priority"]
          reference_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["plan_item_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_daily_plan_id_fkey"
            columns: ["daily_plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          display_name: string | null
          height_cm: number | null
          id: string
          locale: string
          onboarding_completed: boolean
          sex: Database["public"]["Enums"]["sex"]
          timezone: string
          unit_system: Database["public"]["Enums"]["unit_system"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id: string
          locale?: string
          onboarding_completed?: boolean
          sex?: Database["public"]["Enums"]["sex"]
          timezone?: string
          unit_system?: Database["public"]["Enums"]["unit_system"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          height_cm?: number | null
          id?: string
          locale?: string
          onboarding_completed?: boolean
          sex?: Database["public"]["Enums"]["sex"]
          timezone?: string
          unit_system?: Database["public"]["Enums"]["unit_system"]
          updated_at?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          angle: string | null
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          storage_path: string
          taken_at: string
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          angle?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          storage_path: string
          taken_at?: string
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          angle?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          storage_path?: string
          taken_at?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          data: Json
          deleted_at: string | null
          domain: Database["public"]["Enums"]["plan_item_domain"] | null
          id: string
          message: string
          priority: Database["public"]["Enums"]["priority"]
          reason: string
          status: Database["public"]["Enums"]["recommendation_status"]
          title: string
          type: Database["public"]["Enums"]["recommendation_type"]
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          deleted_at?: string | null
          domain?: Database["public"]["Enums"]["plan_item_domain"] | null
          id?: string
          message: string
          priority?: Database["public"]["Enums"]["priority"]
          reason: string
          status?: Database["public"]["Enums"]["recommendation_status"]
          title: string
          type: Database["public"]["Enums"]["recommendation_type"]
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          deleted_at?: string | null
          domain?: Database["public"]["Enums"]["plan_item_domain"] | null
          id?: string
          message?: string
          priority?: Database["public"]["Enums"]["priority"]
          reason?: string
          status?: Database["public"]["Enums"]["recommendation_status"]
          title?: string
          type?: Database["public"]["Enums"]["recommendation_type"]
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      routine_days: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          routine_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number
          routine_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          routine_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_days_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          rest_seconds: number | null
          routine_day_id: string
          target_reps: number | null
          target_sets: number | null
          target_weight: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number
          rest_seconds?: number | null
          routine_day_id: string
          target_reps?: number | null
          target_sets?: number | null
          target_weight?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          rest_seconds?: number | null
          routine_day_id?: string
          target_reps?: number | null
          target_sets?: number | null
          target_weight?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          days_per_week: number | null
          deleted_at: string | null
          goal: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_per_week?: number | null
          deleted_at?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_per_week?: number | null
          deleted_at?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_goals: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          target_bedtime: string | null
          target_minutes: number
          target_wake_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          target_bedtime?: string | null
          target_minutes?: number
          target_wake_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          target_bedtime?: string | null
          target_minutes?: number
          target_wake_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          bedtime: string | null
          created_at: string
          date: string
          deleted_at: string | null
          duration_minutes: number
          id: string
          interruptions: number
          notes: string | null
          quality_rating: number | null
          updated_at: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string
          date: string
          deleted_at?: string | null
          duration_minutes: number
          id?: string
          interruptions?: number
          notes?: string | null
          quality_rating?: number | null
          updated_at?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string
          date?: string
          deleted_at?: string | null
          duration_minutes?: number
          id?: string
          interruptions?: number
          notes?: string | null
          quality_rating?: number | null
          updated_at?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          deleted_at: string | null
          duration_minutes: number
          ended_at: string | null
          focus_rating: number | null
          id: string
          notes: string | null
          started_at: string
          subject_id: string | null
          technique: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          ended_at?: string | null
          focus_rating?: number | null
          id?: string
          notes?: string | null
          started_at?: string
          subject_id?: string | null
          technique?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          ended_at?: string | null
          focus_rating?: number | null
          id?: string
          notes?: string | null
          started_at?: string
          subject_id?: string | null
          technique?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
          weekly_target_minutes: number | null
        }
        Insert: {
          color?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
          weekly_target_minutes?: number | null
        }
        Update: {
          color?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          weekly_target_minutes?: number | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          notifications_enabled: boolean
          reminder_times: Json
          theme: Database["public"]["Enums"]["theme_preference"]
          updated_at: string
          user_id: string
          week_starts_on: number
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          reminder_times?: Json
          theme?: Database["public"]["Enums"]["theme_preference"]
          updated_at?: string
          user_id: string
          week_starts_on?: number
        }
        Update: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          reminder_times?: Json
          theme?: Database["public"]["Enums"]["theme_preference"]
          updated_at?: string
          user_id?: string
          week_starts_on?: number
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          deleted_at: string | null
          id: string
          logged_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          logged_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          logged_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string
          deleted_at: string | null
          ended_at: string | null
          id: string
          notes: string | null
          perceived_effort: number | null
          routine_day_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["workout_session_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          routine_day_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["workout_session_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          routine_day_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["workout_session_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed: boolean
          created_at: string
          deleted_at: string | null
          exercise_id: string
          id: string
          is_warmup: boolean
          reps: number | null
          rpe: number | null
          session_id: string
          set_number: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          deleted_at?: string | null
          exercise_id: string
          id?: string
          is_warmup?: boolean
          reps?: number | null
          rpe?: number | null
          session_id: string
          set_number: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          deleted_at?: string | null
          exercise_id?: string
          id?: string
          is_warmup?: boolean
          reps?: number | null
          rpe?: number | null
          session_id?: string
          set_number?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      body_metric_type:
        | "weight"
        | "body_fat"
        | "waist"
        | "hip"
        | "chest"
        | "arm"
        | "thigh"
        | "neck"
      equipment:
        | "none"
        | "barbell"
        | "dumbbell"
        | "machine"
        | "cable"
        | "kettlebell"
        | "band"
        | "bodyweight"
        | "suspension"
        | "medicine_ball"
        | "plate"
        | "cardio_machine"
      finance_account_kind:
        | "cash"
        | "bank"
        | "wallet"
        | "credit_card"
        | "savings"
      finance_debt_direction: "i_owe" | "owed_to_me"
      finance_entry_kind: "income" | "expense"
      finance_interest_kind:
        | "none"
        | "monthly_on_principal"
        | "monthly_on_balance"
      finance_transaction_kind: "income" | "expense" | "transfer"
      habit_frequency: "daily" | "weekly" | "custom"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      muscle_group:
        | "chest"
        | "back"
        | "shoulders"
        | "biceps"
        | "triceps"
        | "legs"
        | "glutes"
        | "core"
        | "full_body"
        | "cardio"
      notification_channel: "in_app" | "push"
      plan_item_domain:
        | "workout"
        | "nutrition"
        | "study"
        | "habit"
        | "sleep"
        | "health"
      plan_item_status:
        | "pending"
        | "in_progress"
        | "done"
        | "skipped"
        | "rescheduled"
      plan_status: "draft" | "active" | "completed"
      priority: "low" | "medium" | "high" | "critical"
      recommendation_status: "pending" | "accepted" | "dismissed" | "expired"
      recommendation_type:
        | "day_recalculation"
        | "meal_swap"
        | "alternative_routine"
        | "alert"
        | "insight"
      sex: "male" | "female" | "other" | "unspecified"
      theme_preference: "system" | "light" | "dark"
      unit_system: "metric" | "imperial"
      workout_session_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "skipped"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      body_metric_type: [
        "weight",
        "body_fat",
        "waist",
        "hip",
        "chest",
        "arm",
        "thigh",
        "neck",
      ],
      equipment: [
        "none",
        "barbell",
        "dumbbell",
        "machine",
        "cable",
        "kettlebell",
        "band",
        "bodyweight",
        "suspension",
        "medicine_ball",
        "plate",
        "cardio_machine",
      ],
      finance_account_kind: [
        "cash",
        "bank",
        "wallet",
        "credit_card",
        "savings",
      ],
      finance_debt_direction: ["i_owe", "owed_to_me"],
      finance_entry_kind: ["income", "expense"],
      finance_interest_kind: [
        "none",
        "monthly_on_principal",
        "monthly_on_balance",
      ],
      finance_transaction_kind: ["income", "expense", "transfer"],
      habit_frequency: ["daily", "weekly", "custom"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      muscle_group: [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "legs",
        "glutes",
        "core",
        "full_body",
        "cardio",
      ],
      notification_channel: ["in_app", "push"],
      plan_item_domain: [
        "workout",
        "nutrition",
        "study",
        "habit",
        "sleep",
        "health",
      ],
      plan_item_status: [
        "pending",
        "in_progress",
        "done",
        "skipped",
        "rescheduled",
      ],
      plan_status: ["draft", "active", "completed"],
      priority: ["low", "medium", "high", "critical"],
      recommendation_status: ["pending", "accepted", "dismissed", "expired"],
      recommendation_type: [
        "day_recalculation",
        "meal_swap",
        "alternative_routine",
        "alert",
        "insight",
      ],
      sex: ["male", "female", "other", "unspecified"],
      theme_preference: ["system", "light", "dark"],
      unit_system: ["metric", "imperial"],
      workout_session_status: [
        "planned",
        "in_progress",
        "completed",
        "skipped",
      ],
    },
  },
} as const
