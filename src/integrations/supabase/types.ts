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
      mentorship_paths: {
        Row: {
          id: string
          mentor_id: string
          mentee_id: string
          goal: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mentor_id: string
          mentee_id: string
          goal: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mentor_id?: string
          mentee_id?: string
          goal?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_paths_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_paths_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      mentorship_milestones: {
        Row: {
          id: string
          path_id: string
          title: string
          description: string | null
          is_completed: boolean
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          path_id: string
          title: string
          description?: string | null
          is_completed?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          path_id?: string
          title?: string
          description?: string | null
          is_completed?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_milestones_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "mentorship_paths"
            referencedColumns: ["id"]
          }
        ]
      }
      peer_submissions: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          content_url: string | null
          content: string | null
          is_anonymous: boolean
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          content_url?: string | null
          content?: string | null
          is_anonymous?: boolean
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          content_url?: string | null
          content?: string | null
          is_anonymous?: boolean
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      peer_reviews: {
        Row: {
          id: string
          submission_id: string
          reviewer_id: string
          feedback: string
          rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          reviewer_id: string
          feedback: string
          rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          reviewer_id?: string
          feedback?: string
          rating?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "peer_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      chat_messages: {
        Row: {
          id: string
          user_id: string | null
          role: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          role: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          role?: string
          text?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string | null
          conversation_id: string | null
          content: string | null
          text: string | null
          message: string | null
          session_id: string | null
          user_id: string | null
          username: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id?: string | null
          conversation_id?: string | null
          content?: string | null
          text?: string | null
          message?: string | null
          session_id?: string | null
          user_id?: string | null
          username?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string | null
          conversation_id?: string | null
          content?: string | null
          text?: string | null
          message?: string | null
          session_id?: string | null
          user_id?: string | null
          username?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      leaderboard: {
        Row: {
          id: string
          user_id: string
          username: string
          avatar_url: string | null
          xp: number
          streak: number
          sessions_joined: number
          badges: string[]
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          avatar_url?: string | null
          xp?: number
          streak?: number
          sessions_joined?: number
          badges?: string[]
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          avatar_url?: string | null
          xp?: number
          streak?: number
          sessions_joined?: number
          badges?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
          is_in_focus_mode: boolean | null
          focus_time_this_week: number | null
          learning_style: string | null
          availability: string | null
          preferred_language: string | null
          timezone: string | null
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
          learning_style?: string | null
          availability?: string | null
          preferred_language?: string | null
          timezone?: string | null
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
          learning_style?: string | null
          availability?: string | null
          preferred_language?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          file_url: string
          tags: string[] | null
          file_type: string
          file_size: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          file_url: string
          tags?: string[] | null
          file_type: string
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          file_url?: string
          tags?: string[] | null
          file_type?: string
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      resource_votes: {
        Row: {
          id: string
          resource_id: string
          user_id: string
          vote_type: number
          created_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          user_id: string
          vote_type: number
          created_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          user_id?: string
          vote_type?: number
          created_at?: string
        }
        Relationships: []
      }
      saved_resources: {
        Row: {
          id: string
          resource_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      portfolio_profiles: {
        Row: {
          id: string
          profile_id: string
          slug: string
          headline: string
          github_url: string
          linkedin_url: string
          skills: string[]
          achievements: Json
          projects: Json
          learning_progress: Json
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          slug: string
          headline?: string
          github_url?: string
          linkedin_url?: string
          skills?: string[]
          achievements?: Json
          projects?: Json
          learning_progress?: Json
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          slug?: string
          headline?: string
          github_url?: string
          linkedin_url?: string
          skills?: string[]
          achievements?: Json
          projects?: Json
          learning_progress?: Json
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      study_rooms: {
        Row: {
          id: string
          topic: string
          created_by: string | null
          created_at: string
          is_private: boolean
          timer_state: string | null
          timer_end_time: string | null
          timer_work_duration: number | null
          timer_break_duration: number | null
        }
        Insert: {
          id?: string
          topic: string
          created_by?: string | null
          created_at?: string
          is_private?: boolean
          timer_state?: string | null
          timer_end_time?: string | null
          timer_work_duration?: number | null
          timer_break_duration?: number | null
        }
        Update: {
          id?: string
          topic?: string
          created_by?: string | null
          created_at?: string
          is_private?: boolean
          timer_state?: string | null
          timer_end_time?: string | null
          timer_work_duration?: number | null
          timer_break_duration?: number | null
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
      award_activity_xp: {
        Args: { _activity_type: string }
        Returns: undefined
      }
      get_user_rank: {
        Args: { 
          p_user_id: string
          p_filter?: string 
        }
        Returns: number
      }
      invite_to_study_room: {
        Args: {
          p_room_id: string
          p_user_email: string
        }
        Returns: undefined
      }
      join_leaderboard: {
        Args: {
          _username: string
          _avatar_url: string | null
        }
        Returns: undefined
      }
      join_public_study_room: {
        Args: { p_room_id: string }
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
