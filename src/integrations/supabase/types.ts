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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          id: string
          internship_id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          internship_id: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          internship_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          city: string
          created_at: string
          description: string
          id: string
          logo_url: string
          name: string
          owner_id: string | null
          verified: boolean
          website: string
        }
        Insert: {
          city?: string
          created_at?: string
          description?: string
          id?: string
          logo_url?: string
          name: string
          owner_id?: string | null
          verified?: boolean
          website?: string
        }
        Update: {
          city?: string
          created_at?: string
          description?: string
          id?: string
          logo_url?: string
          name?: string
          owner_id?: string | null
          verified?: boolean
          website?: string
        }
        Relationships: []
      }
      internships: {
        Row: {
          benefits: string
          company_id: string
          contact: string
          contact_email: string
          created_at: string
          deadline: string | null
          department: string
          description: string
          duration: string
          format: string | null
          id: string
          is_open: boolean
          location: string
          paperwork: boolean
          pay: string
          requirements: string
          slots: number | null
          stack: string
          tasks: string
          title: string
        }
        Insert: {
          benefits?: string
          company_id: string
          contact?: string
          contact_email?: string
          created_at?: string
          deadline?: string | null
          department?: string
          description?: string
          duration?: string
          format?: string | null
          id?: string
          is_open?: boolean
          location?: string
          paperwork?: boolean
          pay?: string
          requirements?: string
          slots?: number | null
          stack?: string
          tasks?: string
          title: string
        }
        Update: {
          benefits?: string
          company_id?: string
          contact?: string
          contact_email?: string
          created_at?: string
          deadline?: string | null
          department?: string
          description?: string
          duration?: string
          format?: string | null
          id?: string
          is_open?: boolean
          location?: string
          paperwork?: boolean
          pay?: string
          requirements?: string
          slots?: number | null
          stack?: string
          tasks?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "internships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_events: {
        Row: {
          created_at: string
          event: string
          id: string
          properties: Json
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          properties?: Json
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          properties?: Json
        }
        Relationships: []
      }
      pilot_submissions: {
        Row: {
          audience: string
          created_at: string
          details: Json
          email: string
          id: string
          kind: string
        }
        Insert: {
          audience: string
          created_at?: string
          details?: Json
          email: string
          id?: string
          kind: string
        }
        Update: {
          audience?: string
          created_at?: string
          details?: Json
          email?: string
          id?: string
          kind?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_pilot: boolean
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          is_pilot?: boolean
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_pilot?: boolean
          role?: string
        }
        Relationships: []
      }
      student_cvs: {
        Row: {
          education: string
          experience: string
          full_name: string
          gpa: number | null
          headline: string
          languages: string
          links: string
          phone: string
          program: string
          projects: string
          skills: string
          summary: string
          telegram: string
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          education?: string
          experience?: string
          full_name?: string
          gpa?: number | null
          headline?: string
          languages?: string
          links?: string
          phone?: string
          program?: string
          projects?: string
          skills?: string
          summary?: string
          telegram?: string
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          education?: string
          experience?: string
          full_name?: string
          gpa?: number | null
          headline?: string
          languages?: string
          links?: string
          phone?: string
          program?: string
          projects?: string
          skills?: string
          summary?: string
          telegram?: string
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_company_member: { Args: { cid: string }; Returns: boolean }
      my_company_id: { Args: never; Returns: string | null }
      my_role: { Args: never; Returns: string | null }
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
    Enums: {},
  },
} as const
