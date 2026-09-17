// ============================================================================
// Tipos generados a partir del esquema real de Supabase (proyecto "pulsefit").
// Regenerar con: npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assigned_routines: {
        Row: {
          athlete_id: string
          coach_id: string
          coach_notes: string | null
          created_at: string
          duration_weeks: number
          id: string
          push_notification: boolean
          start_date: string
          status: string
          target_rpe: number
          template_id: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          coach_notes?: string | null
          created_at?: string
          duration_weeks?: number
          id?: string
          push_notification?: boolean
          start_date: string
          status?: string
          target_rpe?: number
          template_id: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          coach_notes?: string | null
          created_at?: string
          duration_weeks?: number
          id?: string
          push_notification?: boolean
          start_date?: string
          status?: string
          target_rpe?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_routines_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_routines_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_routines_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "routine_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          actual_reps: number | null
          actual_weight_kg: number | null
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          session_id: string
          template_exercise_id: string
        }
        Insert: {
          actual_reps?: number | null
          actual_weight_kg?: number | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          session_id: string
          template_exercise_id: string
        }
        Update: {
          actual_reps?: number | null
          actual_weight_kg?: number | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          session_id?: string
          template_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "routine_template_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          coach_id: string | null
          created_at: string
          full_name: string
          goal: string | null
          id: string
          level: string | null
          role: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          full_name: string
          goal?: string | null
          id: string
          level?: string | null
          role: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          full_name?: string
          goal?: string | null
          id?: string
          level?: string | null
          role?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_template_days: {
        Row: {
          created_at: string
          day_of_week: number | null
          id: string
          label: string
          order_index: number
          template_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          label: string
          order_index?: number
          template_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          label?: string
          order_index?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_template_days_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "routine_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_template_exercises: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          order_index: number
          reps_max: number
          reps_min: number
          rest_seconds: number
          sets: number
          suggested_weight_kg: number | null
          template_day_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          order_index?: number
          reps_max?: number
          reps_min?: number
          rest_seconds?: number
          sets?: number
          suggested_weight_kg?: number | null
          template_day_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          order_index?: number
          reps_max?: number
          reps_min?: number
          rest_seconds?: number
          sets?: number
          suggested_weight_kg?: number | null
          template_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_template_exercises_template_day_id_fkey"
            columns: ["template_day_id"]
            isOneToOne: false
            referencedRelation: "routine_template_days"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_templates: {
        Row: {
          coach_id: string
          created_at: string
          days_per_week: number
          description: string | null
          id: string
          level: string | null
          name: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          days_per_week?: number
          description?: string | null
          id?: string
          level?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          days_per_week?: number
          description?: string | null
          id?: string
          level?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          assigned_routine_id: string
          athlete_id: string
          completed_at: string | null
          created_at: string
          id: string
          session_date: string
          template_day_id: string
          total_volume_kg: number
        }
        Insert: {
          assigned_routine_id: string
          athlete_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          session_date?: string
          template_day_id: string
          total_volume_kg?: number
        }
        Update: {
          assigned_routine_id?: string
          athlete_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          session_date?: string
          template_day_id?: string
          total_volume_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_assigned_routine_id_fkey"
            columns: ["assigned_routine_id"]
            isOneToOne: false
            referencedRelation: "assigned_routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_template_day_id_fkey"
            columns: ["template_day_id"]
            isOneToOne: false
            referencedRelation: "routine_template_days"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
