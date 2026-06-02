<<<<<<< HEAD
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type, no-unsafe-finally, @typescript-eslint/no-unused-expressions, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-require-imports */
=======
>>>>>>> 215963a (fix: resolve git merge conflict in supabase types.ts)
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
      chat_messages: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          receiver_id: string | null
          sender_id: string | null
          text: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          receiver_id?: string | null
          sender_id?: string | null
          text?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          receiver_id?: string | null
          sender_id?: string | null
          text?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          last_seen: string | null
          name: string | null
          skills: string[] | null
          is_mentor: boolean
          is_learner: boolean
          points: number | null
          sessions_completed: number | null
          rating: number | null
          badges: string[] | null
          interests: string[] | null
          teach_subjects: string[] | null
          learn_subjects: string[] | null
          updated_at: string | null
          streak: number
          last_active: string | null
          restoration_used_today: boolean
          restoration_date: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          last_seen?: string | null
          name?: string | null
          skills?: string[] | null
          is_mentor?: boolean
          is_learner?: boolean
          points?: number | null
          sessions_completed?: number | null
          rating?: number | null
          badges?: string[] | null
          interests?: string[] | null
          teach_subjects?: string[] | null
          learn_subjects?: string[] | null
          updated_at?: string | null
          streak?: number
          last_active?: string | null
          restoration_used_today?: boolean
          restoration_date?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_seen?: string | null
          name?: string | null
          skills?: string[] | null
          is_mentor?: boolean
          is_learner?: boolean
          points?: number | null
          sessions_completed?: number | null
          rating?: number | null
          badges?: string[] | null
          interests?: string[] | null
          teach_subjects?: string[] | null
          learn_subjects?: string[] | null
          updated_at?: string | null
          streak?: number
          last_active?: string | null
          restoration_used_today?: boolean
          restoration_date?: string | null
        }
        Relationships: []
      }
      portfolio_profiles: {
        Row: {
          achievements: Json
          created_at: string
          github_url: string
          headline: string
          id: string
          is_published: boolean
          learning_progress: Json
          linkedin_url: string
          profile_id: string
          projects: Json
          skills: string[]
          slug: string
          updated_at: string
        }
        Insert: {
          achievements?: Json
          created_at?: string
          github_url?: string
          headline?: string
          id?: string
          is_published?: boolean
          learning_progress?: Json
          linkedin_url?: string
          profile_id: string
          projects?: Json
          skills?: string[]
          slug: string
          updated_at?: string
        }
        Update: {
          achievements?: Json
          created_at?: string
          github_url?: string
          headline?: string
          id?: string
          is_published?: boolean
          learning_progress?: Json
          linkedin_url?: string
          profile_id?: string
          projects?: Json
          skills?: string[]
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          description: string | null
          id: number
          scheduled_at: string | null
          status: string | null
          student_id: string | null
          teacher_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          scheduled_at?: string | null
          status?: string | null
          student_id?: string | null
          teacher_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          scheduled_at?: string | null
          status?: string | null
          student_id?: string | null
          teacher_id?: string | null
          title?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          learning_goals: string | null
          name: string | null
          skills: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          learning_goals?: string | null
          name?: string | null
          skills?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          learning_goals?: string | null
          name?: string | null
          skills?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
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
      chat_messages: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          receiver_id: string | null
          sender_id: string | null
          text: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          receiver_id?: string | null
          sender_id?: string | null
          text?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          receiver_id?: string | null
          sender_id?: string | null
          text?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          last_seen: string | null
          name: string | null
          skills: string[] | null
          is_mentor: boolean
          is_learner: boolean
          points: number | null
          sessions_completed: number | null
          rating: number | null
          badges: string[] | null
          interests: string[] | null
          teach_subjects: string[] | null
          learn_subjects: string[] | null
          updated_at: string | null
          streak: number
          last_active: string | null
          restoration_used_today: boolean
          restoration_date: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          last_seen?: string | null
          name?: string | null
          skills?: string[] | null
          is_mentor?: boolean
          is_learner?: boolean
          points?: number | null
          sessions_completed?: number | null
          rating?: number | null
          badges?: string[] | null
          interests?: string[] | null
          teach_subjects?: string[] | null
          learn_subjects?: string[] | null
          updated_at?: string | null
          streak?: number
          last_active?: string | null
          restoration_used_today?: boolean
          restoration_date?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_seen?: string | null
          name?: string | null
          skills?: string[] | null
          is_mentor?: boolean
          is_learner?: boolean
          points?: number | null
          sessions_completed?: number | null
          rating?: number | null
          badges?: string[] | null
          interests?: string[] | null
          teach_subjects?: string[] | null
          learn_subjects?: string[] | null
          updated_at?: string | null
          streak?: number
          last_active?: string | null
          restoration_used_today?: boolean
          restoration_date?: string | null
        }
        Relationships: []
      }
      study_rooms: {
        Row: {
          id: string
          topic: string
          created_by: string | null
          created_at: string
          is_private: boolean
        }
        Insert: {
          id?: string
          topic: string
          created_by?: string | null
          created_at?: string
          is_private?: boolean
        }
        Update: {
          id?: string
          topic?: string
          created_by?: string | null
          created_at?: string
          is_private?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "study_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      study_room_messages: {
        Row: {
          id: string
          room_id: string | null
          profile_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id?: string | null
          profile_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string | null
          profile_id?: string | null
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      study_room_participants: {
        Row: {
          room_id: string
          profile_id: string
          joined_at: string
        }
        Insert: {
          room_id: string
          profile_id: string
          joined_at?: string
        }
        Update: {
          room_id?: string
          profile_id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_room_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          created_at: string
          description: string | null
          id: number
          scheduled_at: string | null
          /** duration_minutes – NEW column added by session scheduling migration */
          duration_minutes: number
          /** status values: 'scheduled' | 'live' | 'ended' */
          status: string
          student_id: string | null
          mentor_id: string | null
          seat_limit: number | null
          participants: number
          title: string | null
          tags: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          scheduled_at?: string | null
          duration_minutes?: number
          status?: string
          student_id?: string | null
          mentor_id?: string | null
          seat_limit?: number | null
          participants?: number
          title?: string | null
          tags?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          scheduled_at?: string | null
          duration_minutes?: number
          status?: string
          student_id?: string | null
          mentor_id?: string | null
          seat_limit?: number | null
          participants?: number
          title?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          learning_goals: string | null
          name: string | null
          skills: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          learning_goals?: string | null
          name?: string | null
          skills?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          learning_goals?: string | null
          name?: string | null
          skills?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      invite_to_study_room: {
        Args: {
          p_room_id: string
          p_user_email: string
        }
        Returns: undefined
      }
      join_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      tick_session_statuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
<<<<<<< HEAD
 main



=======
>>>>>>> 215963a (fix: resolve git merge conflict in supabase types.ts)
