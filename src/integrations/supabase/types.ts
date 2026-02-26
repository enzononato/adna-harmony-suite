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
      agendamentos: {
        Row: {
          created_at: string
          data: string
          duracao_minutos: number | null
          horario: string
          id: string
          observacoes: string | null
          paciente_nome: string
          procedimento_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          duracao_minutos?: number | null
          horario: string
          id?: string
          observacoes?: string | null
          paciente_nome: string
          procedimento_id: string
        }
        Update: {
          created_at?: string
          data?: string
          duracao_minutos?: number | null
          horario?: string
          id?: string
          observacoes?: string | null
          paciente_nome?: string
          procedimento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          concluido: boolean
          created_at: string
          data: string
          id: string
          texto: string
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          data?: string
          id?: string
          texto: string
        }
        Update: {
          concluido?: boolean
          created_at?: string
          data?: string
          id?: string
          texto?: string
        }
        Relationships: []
      }
      entradas: {
        Row: {
          created_at: string
          data: string
          forma_pagamento: string
          id: string
          observacoes: string | null
          paciente_nome: string
          procedimento_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          paciente_nome: string
          procedimento_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          paciente_nome?: string
          procedimento_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "entradas_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      paciente_arquivos: {
        Row: {
          created_at: string
          id: string
          nome_arquivo: string
          paciente_id: string
          storage_path: string
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_arquivo: string
          paciente_id: string
          storage_path: string
          tipo?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_arquivo?: string
          paciente_id?: string
          storage_path?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "paciente_arquivos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          anamnese: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          id: string
          nome: string
          telefone: string
          updated_at: string
        }
        Insert: {
          anamnese?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string
          updated_at?: string
        }
        Update: {
          anamnese?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      procedimentos: {
        Row: {
          created_at: string
          duracao_minutos: number | null
          id: string
          nome: string
          preco: number | null
        }
        Insert: {
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          nome: string
          preco?: number | null
        }
        Update: {
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          nome?: string
          preco?: number | null
        }
        Relationships: []
      }
      saidas: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string
          id: string
          observacoes: string | null
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data?: string
          descricao: string
          id?: string
          observacoes?: string | null
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          valor?: number
        }
        Relationships: []
      }
      tratamentos: {
        Row: {
          created_at: string
          data: string
          id: string
          notas: string | null
          paciente_id: string
          procedimento: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          notas?: string | null
          paciente_id: string
          procedimento: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          notas?: string | null
          paciente_id?: string
          procedimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "tratamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "receptionist"
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
      app_role: ["admin", "receptionist"],
    },
  },
} as const
