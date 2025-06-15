export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assignment_display_count: {
        Row: {
          display_count: number
          id: string
          initial_assignments_value: number
          initial_date: string
          initial_students_value: number
          updated_at: string
          updated_by: string | null
          use_actual_count: boolean
        }
        Insert: {
          display_count?: number
          id?: string
          initial_assignments_value?: number
          initial_date?: string
          initial_students_value?: number
          updated_at?: string
          updated_by?: string | null
          use_actual_count?: boolean
        }
        Update: {
          display_count?: number
          id?: string
          initial_assignments_value?: number
          initial_date?: string
          initial_students_value?: number
          updated_at?: string
          updated_by?: string | null
          use_actual_count?: boolean
        }
        Relationships: []
      }
      assignments: {
        Row: {
          assignment_type: string | null
          completed_date: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          file_urls: string[] | null
          grade: string | null
          id: string
          is_verified_account: boolean | null
          paid: boolean | null
          payment_date: string | null
          price: number | null
          progress: number | null
          status: string
          student_email: string | null
          student_name: string | null
          student_phone: string | null
          subject: string
          title: string
          updated_at: string | null
          user_id: string | null
          writer_id: string | null
        }
        Insert: {
          assignment_type?: string | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          file_urls?: string[] | null
          grade?: string | null
          id?: string
          is_verified_account?: boolean | null
          paid?: boolean | null
          payment_date?: string | null
          price?: number | null
          progress?: number | null
          status?: string
          student_email?: string | null
          student_name?: string | null
          student_phone?: string | null
          subject: string
          title: string
          updated_at?: string | null
          user_id?: string | null
          writer_id?: string | null
        }
        Update: {
          assignment_type?: string | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          file_urls?: string[] | null
          grade?: string | null
          id?: string
          is_verified_account?: boolean | null
          paid?: boolean | null
          payment_date?: string | null
          price?: number | null
          progress?: number | null
          status?: string
          student_email?: string | null
          student_name?: string | null
          student_phone?: string | null
          subject?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
          writer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          status: string
          subject: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          status?: string
          subject: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          assignment_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          payment_method: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          student_id: string | null
          updated_at: string | null
          writer_id: string | null
        }
        Insert: {
          amount: number
          assignment_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          updated_at?: string | null
          writer_id?: string | null
        }
        Update: {
          amount?: number
          assignment_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string | null
          updated_at?: string | null
          writer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          gender: string | null
          id: string
          institution: string | null
          institution_type: string | null
          phone_number: string | null
          role: string
          updated_at: string | null
          writer_bio: string | null
          writer_skills: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          id: string
          institution?: string | null
          institution_type?: string | null
          phone_number?: string | null
          role?: string
          updated_at?: string | null
          writer_bio?: string | null
          writer_skills?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          institution?: string | null
          institution_type?: string | null
          phone_number?: string | null
          role?: string
          updated_at?: string | null
          writer_bio?: string | null
          writer_skills?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_writer_fields: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_assignment_policies: {
        Args: Record<PropertyKey, never>
        Returns: {
          tablename: string
          policyname: string
          policy_info: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role_secure: {
        Args: { user_uuid: string }
        Returns: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
