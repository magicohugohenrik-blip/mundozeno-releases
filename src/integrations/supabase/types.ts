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
      activities: {
        Row: {
          active: boolean
          base_slug: string
          color: string
          config: Json
          created_at: string
          description: string | null
          emoji: string
          id: string
          level: number
          organization_id: string
          owner_id: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          active?: boolean
          base_slug: string
          color?: string
          config?: Json
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          level?: number
          organization_id: string
          owner_id: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          active?: boolean
          base_slug?: string
          color?: string
          config?: Json
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          level?: number
          organization_id?: string
          owner_id?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          attention_points: string
          author_id: string | null
          created_at: string
          id: string
          metrics: Json
          organization_id: string
          period_days: number
          recommendations: string
          strengths: string
          student_id: string
          summary: string
          updated_at: string
        }
        Insert: {
          attention_points?: string
          author_id?: string | null
          created_at?: string
          id?: string
          metrics?: Json
          organization_id: string
          period_days?: number
          recommendations?: string
          strengths?: string
          student_id: string
          summary?: string
          updated_at?: string
        }
        Update: {
          attention_points?: string
          author_id?: string | null
          created_at?: string
          id?: string
          metrics?: Json
          organization_id?: string
          period_days?: number
          recommendations?: string
          strengths?: string
          student_id?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          age_range: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          age_range?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          age_range?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_app_access: {
        Row: {
          app_id: string
          created_at: string
          device_id: string
          enabled: boolean
          expires_at: string | null
          id: string
          updated_at: string
        }
        Insert: {
          app_id: string
          created_at?: string
          device_id: string
          enabled?: boolean
          expires_at?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          created_at?: string
          device_id?: string
          enabled?: boolean
          expires_at?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_app_access_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_managers: {
        Row: {
          created_at: string
          device_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_managers_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          activated_at: string | null
          app_version: string | null
          auth_user_id: string | null
          code: string
          created_at: string
          id: string
          label: string | null
          last_seen_at: string | null
          last_sync_at: string | null
          location: string | null
          login_username: string | null
          organization_id: string | null
          status: string
          virtual_keyboard: boolean
        }
        Insert: {
          activated_at?: string | null
          app_version?: string | null
          auth_user_id?: string | null
          code: string
          created_at?: string
          id?: string
          label?: string | null
          last_seen_at?: string | null
          last_sync_at?: string | null
          location?: string | null
          login_username?: string | null
          organization_id?: string | null
          status?: string
          virtual_keyboard?: boolean
        }
        Update: {
          activated_at?: string | null
          app_version?: string | null
          auth_user_id?: string | null
          code?: string
          created_at?: string
          id?: string
          label?: string | null
          last_seen_at?: string | null
          last_sync_at?: string | null
          location?: string | null
          login_username?: string | null
          organization_id?: string | null
          status?: string
          virtual_keyboard?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      game_events: {
        Row: {
          client_uuid: string | null
          created_at: string
          event_type: string
          game_slug: string
          id: string
          organization_id: string
          payload: Json
          response_time_ms: number | null
          session_id: string | null
          student_id: string
        }
        Insert: {
          client_uuid?: string | null
          created_at?: string
          event_type: string
          game_slug: string
          id?: string
          organization_id: string
          payload?: Json
          response_time_ms?: number | null
          session_id?: string | null
          student_id: string
        }
        Update: {
          client_uuid?: string | null
          created_at?: string
          event_type?: string
          game_slug?: string
          id?: string
          organization_id?: string
          payload?: Json
          response_time_ms?: number | null
          session_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          client_uuid: string | null
          completed: boolean
          device_code: string | null
          duration_seconds: number
          game_slug: string
          hits: number
          id: string
          level: number
          misses: number
          organization_id: string
          played_at: string
          score: number
          skill: string | null
          student_id: string
        }
        Insert: {
          client_uuid?: string | null
          completed?: boolean
          device_code?: string | null
          duration_seconds?: number
          game_slug: string
          hits?: number
          id?: string
          level?: number
          misses?: number
          organization_id: string
          played_at?: string
          score?: number
          skill?: string | null
          student_id: string
        }
        Update: {
          client_uuid?: string | null
          completed?: boolean
          device_code?: string | null
          duration_seconds?: number
          game_slug?: string
          hits?: number
          id?: string
          level?: number
          misses?: number
          organization_id?: string
          played_at?: string
          score?: number
          skill?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          available: boolean
          character_id: string | null
          description: string | null
          id: string
          main_skill: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          available?: boolean
          character_id?: string | null
          description?: string | null
          id?: string
          main_skill: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          available?: boolean
          character_id?: string | null
          description?: string | null
          id?: string
          main_skill?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      login_aliases: {
        Row: {
          created_at: string
          email: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          username?: string
        }
        Relationships: []
      }
      municipalities: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          state: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          city: string | null
          created_at: string
          id: string
          join_code: string
          municipality_id: string | null
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["org_type"]
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          join_code?: string
          municipality_id?: string | null
          name: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["org_type"]
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          join_code?: string
          municipality_id?: string | null
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["org_type"]
        }
        Relationships: [
          {
            foreignKeyName: "organizations_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          municipality_id: string | null
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          municipality_id?: string | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          municipality_id?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      report_shares: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          organization_id: string
          revoked: boolean
          student_id: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          organization_id: string
          revoked?: boolean
          student_id: string
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          organization_id?: string
          revoked?: boolean
          student_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_shares_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_shares_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          active: boolean
          anamnesis: Json
          avatar: Json
          birth_date: string | null
          cid_codes: string[]
          class_id: string | null
          created_at: string
          full_name: string
          id: string
          internal_code: string | null
          nickname: string | null
          organization_id: string
        }
        Insert: {
          active?: boolean
          anamnesis?: Json
          avatar?: Json
          birth_date?: string | null
          cid_codes?: string[]
          class_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          internal_code?: string | null
          nickname?: string | null
          organization_id: string
        }
        Update: {
          active?: boolean
          anamnesis?: Json
          avatar?: Json
          birth_date?: string | null
          cid_codes?: string[]
          class_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          internal_code?: string | null
          nickname?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zeno_chat_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          municipality_id: string | null
          organization_id: string | null
          prompt: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          municipality_id?: string | null
          organization_id?: string | null
          prompt?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          municipality_id?: string | null
          organization_id?: string | null
          prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zeno_chat_settings_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zeno_chat_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      city_owns_org: { Args: { _organization_id: string }; Returns: boolean }
      city_scope: { Args: { _municipality_id: string }; Returns: boolean }
      current_municipality: { Args: never; Returns: string }
      current_org: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_city_admin: { Args: never; Returns: boolean }
      is_super: { Args: never; Returns: boolean }
      manages_device: { Args: { _device_id: string }; Returns: boolean }
      resolve_login_email: { Args: { _username: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "org_admin"
        | "professional"
        | "city_admin"
        | "table_manager"
      org_type: "escola" | "clinica" | "outro" | "rede"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "super_admin",
        "org_admin",
        "professional",
        "city_admin",
        "table_manager",
      ],
      org_type: ["escola", "clinica", "outro", "rede"],
    },
  },
} as const
