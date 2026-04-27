export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "user";
export type UserStatus = "pending" | "active" | "suspended";
export type GenderType = "Nam" | "Nữ" | "Khác";
export type SessionStatus = "draft" | "completed" | "archived";
export type RespondentType =
  | "learner"
  | "teacher"
  | "parent"
  | "counselor"
  | "cultural_official";
export type SentimentHint = "positive" | "negative" | "neutral" | "uncertain";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          status: UserStatus;
          avatar_url: string | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          status?: UserStatus;
          avatar_url?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          status?: UserStatus;
          avatar_url?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interview_sessions: {
        Row: {
          id: string;
          created_by: string;
          respondent_type: string;
          respondent_full_name: string;
          respondent_birth_year: number;
          respondent_gender: GenderType;
          respondent_location: string;
          respondent_occupation: string | null;
          respondent_phone: string | null;
          session_status: SessionStatus;
          session_note: string | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          respondent_type?: string;
          respondent_full_name: string;
          respondent_birth_year: number;
          respondent_gender: GenderType;
          respondent_location: string;
          respondent_occupation?: string | null;
          respondent_phone?: string | null;
          session_status?: SessionStatus;
          session_note?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          respondent_type?: string;
          respondent_full_name?: string;
          respondent_birth_year?: number;
          respondent_gender?: GenderType;
          respondent_location?: string;
          respondent_occupation?: string | null;
          respondent_phone?: string | null;
          session_status?: SessionStatus;
          session_note?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interview_sessions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      responses: {
        Row: {
          id: string;
          session_id: string;
          question_key: string;
          answer_value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_key: string;
          answer_value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          question_key?: string;
          answer_value?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "responses_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "interview_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      session_notes: {
        Row: {
          id: string;
          session_id: string;
          section_key: string;
          note_text: string;
          tagged_questions: string[] | null;
          sentiment_hint: string | null;
          is_notable: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          section_key: string;
          note_text: string;
          tagged_questions?: string[] | null;
          sentiment_hint?: string | null;
          is_notable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          section_key?: string;
          note_text?: string;
          tagged_questions?: string[] | null;
          sentiment_hint?: string | null;
          is_notable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_notes_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "interview_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_insights: {
        Row: {
          id: string;
          section_key: string;
          content: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_key: string;
          content?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_key?: string;
          content?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_insights_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      aggregate_radio_answers: {
        Args: { p_question_key: string };
        Returns: { answer_value: string; count: number }[];
      };
      aggregate_checkbox_answers: {
        Args: { p_question_key: string };
        Returns: { answer_value: string; count: number }[];
      };
      aggregate_numeric_answers: {
        Args: { p_question_key: string };
        Returns: {
          avg_value: number;
          min_value: number;
          max_value: number;
          count: number;
          p25: number;
          p50: number;
          p75: number;
        }[];
      };
      cross_tab_by_segment: {
        Args: { p_question_key: string };
        Returns: {
          respondent_type: string;
          answer_value: string;
          count: number;
        }[];
      };
      cross_tab_checkbox_by_segment: {
        Args: { p_question_key: string };
        Returns: {
          respondent_type: string;
          answer_value: string;
          count: number;
        }[];
      };
      calculate_nps: {
        Args: Record<string, never>;
        Returns: {
          promoters: number;
          passives: number;
          detractors: number;
          total: number;
          nps_score: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      gender_type: GenderType;
      session_status: SessionStatus;
    };
  };
}

// Convenience type aliases
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type InterviewSession =
  Database["public"]["Tables"]["interview_sessions"]["Row"];
export type InterviewSessionInsert =
  Database["public"]["Tables"]["interview_sessions"]["Insert"];
export type InterviewSessionUpdate =
  Database["public"]["Tables"]["interview_sessions"]["Update"];

export type Response = Database["public"]["Tables"]["responses"]["Row"];
export type ResponseInsert =
  Database["public"]["Tables"]["responses"]["Insert"];
export type ResponseUpdate =
  Database["public"]["Tables"]["responses"]["Update"];

export type SessionNote =
  Database["public"]["Tables"]["session_notes"]["Row"];
export type SessionNoteInsert =
  Database["public"]["Tables"]["session_notes"]["Insert"];
export type SessionNoteUpdate =
  Database["public"]["Tables"]["session_notes"]["Update"];

export type AdminInsight =
  Database["public"]["Tables"]["admin_insights"]["Row"];
export type AdminInsightInsert =
  Database["public"]["Tables"]["admin_insights"]["Insert"];
export type AdminInsightUpdate =
  Database["public"]["Tables"]["admin_insights"]["Update"];
