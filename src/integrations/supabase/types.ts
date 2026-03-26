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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      absence_justifications: {
        Row: {
          cargo: string
          created_at: string | null
          event_id: string
          id: string
          localidade: string
          motivo: string
          musician_id: string
        }
        Insert: {
          cargo: string
          created_at?: string | null
          event_id: string
          id?: string
          localidade: string
          motivo: string
          musician_id: string
        }
        Update: {
          cargo?: string
          created_at?: string | null
          event_id?: string
          id?: string
          localidade?: string
          motivo?: string
          musician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "absence_justifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "justification_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_justifications_musician_id_fkey"
            columns: ["musician_id"]
            isOneToOne: false
            referencedRelation: "musicians"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          checked_in_at: string | null
          id: string
          instrument: string | null
          meeting_session_id: string
          musician_id: string | null
          present: boolean
        }
        Insert: {
          checked_in_at?: string | null
          id?: string
          instrument?: string | null
          meeting_session_id: string
          musician_id?: string | null
          present?: boolean
        }
        Update: {
          checked_in_at?: string | null
          id?: string
          instrument?: string | null
          meeting_session_id?: string
          musician_id?: string | null
          present?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "attendances_meeting_session_id_fkey"
            columns: ["meeting_session_id"]
            isOneToOne: false
            referencedRelation: "meeting_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_musician_id_fkey"
            columns: ["musician_id"]
            isOneToOne: false
            referencedRelation: "musicians"
            referencedColumns: ["id"]
          },
        ]
      }
      justification_events: {
        Row: {
          closes_at: string
          created_at: string | null
          created_by: string | null
          id: string
          meeting_date: string
          meeting_time: string | null
          opens_at: string
          status: string | null
          title: string
        }
        Insert: {
          closes_at: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_date: string
          meeting_time?: string | null
          opens_at: string
          status?: string | null
          title?: string
        }
        Update: {
          closes_at?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_date?: string
          meeting_time?: string | null
          opens_at?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      meeting_sessions: {
        Row: {
          anciao: string | null
          ancioes_presentes: string | null
          cidade: string | null
          created_at: string | null
          demais_irmaos: string | null
          examinadora: string | null
          hinos_cantados: string | null
          hinos_ensaiados: string | null
          id: string
          meeting_date: string
          meeting_name: string | null
          meeting_time: string | null
          ministerio_administracao: number | null
          ministerio_anciaes: number | null
          ministerio_coop_jovens: number | null
          ministerio_cooperadores: number | null
          ministerio_diaconos: number | null
          ministerio_enc_locais: number | null
          ministerio_enc_regionais: number | null
          ministerio_examinadoras: number | null
          observacao: string | null
          palavra: string | null
          quantidade_organistas: number | null
          regencia_enc_regional_1: string | null
          regencia_enc_regional_2: string | null
          status: string | null
          tipo_contagem: string | null
          tipo_presenca: string | null
        }
        Insert: {
          anciao?: string | null
          ancioes_presentes?: string | null
          cidade?: string | null
          created_at?: string | null
          demais_irmaos?: string | null
          examinadora?: string | null
          hinos_cantados?: string | null
          hinos_ensaiados?: string | null
          id?: string
          meeting_date?: string
          meeting_name?: string | null
          meeting_time?: string | null
          ministerio_administracao?: number | null
          ministerio_anciaes?: number | null
          ministerio_coop_jovens?: number | null
          ministerio_cooperadores?: number | null
          ministerio_diaconos?: number | null
          ministerio_enc_locais?: number | null
          ministerio_enc_regionais?: number | null
          ministerio_examinadoras?: number | null
          observacao?: string | null
          palavra?: string | null
          quantidade_organistas?: number | null
          regencia_enc_regional_1?: string | null
          regencia_enc_regional_2?: string | null
          status?: string | null
          tipo_contagem?: string | null
          tipo_presenca?: string | null
        }
        Update: {
          anciao?: string | null
          ancioes_presentes?: string | null
          cidade?: string | null
          created_at?: string | null
          demais_irmaos?: string | null
          examinadora?: string | null
          hinos_cantados?: string | null
          hinos_ensaiados?: string | null
          id?: string
          meeting_date?: string
          meeting_name?: string | null
          meeting_time?: string | null
          ministerio_administracao?: number | null
          ministerio_anciaes?: number | null
          ministerio_coop_jovens?: number | null
          ministerio_cooperadores?: number | null
          ministerio_diaconos?: number | null
          ministerio_enc_locais?: number | null
          ministerio_enc_regionais?: number | null
          ministerio_examinadoras?: number | null
          observacao?: string | null
          palavra?: string | null
          quantidade_organistas?: number | null
          regencia_enc_regional_1?: string | null
          regencia_enc_regional_2?: string | null
          status?: string | null
          tipo_contagem?: string | null
          tipo_presenca?: string | null
        }
        Relationships: []
      }
      musicians: {
        Row: {
          cargo_ministerio: string | null
          created_at: string | null
          id: string
          instrument: string
          localidade: string | null
          name: string
          nivel: string | null
        }
        Insert: {
          cargo_ministerio?: string | null
          created_at?: string | null
          id?: string
          instrument: string
          localidade?: string | null
          name: string
          nivel?: string | null
        }
        Update: {
          cargo_ministerio?: string | null
          created_at?: string | null
          id?: string
          instrument?: string
          localidade?: string | null
          name?: string
          nivel?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      search_musicians_by_name: {
        Args: { search_term: string }
        Returns: {
          cargo_ministerio: string | null
          created_at: string | null
          id: string
          instrument: string
          localidade: string | null
          name: string
          nivel: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "musicians"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
