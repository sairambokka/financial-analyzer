export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      category_rules: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          pattern: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          pattern: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          pattern?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      statements: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_type: string | null;
          storage_path: string | null;
          upload_date: string;
          period_start: string | null;
          period_end: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_type?: string | null;
          storage_path?: string | null;
          upload_date?: string;
          period_start?: string | null;
          period_end?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_type?: string | null;
          storage_path?: string | null;
          upload_date?: string;
          period_start?: string | null;
          period_end?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          statement_id: string | null;
          date: string;
          description: string;
          amount: number;
          type: "credit" | "debit";
          category_id: string | null;
          raw_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          statement_id?: string | null;
          date: string;
          description: string;
          amount: number;
          type: "credit" | "debit";
          category_id?: string | null;
          raw_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          statement_id?: string | null;
          date?: string;
          description?: string;
          amount?: number;
          type?: "credit" | "debit";
          category_id?: string | null;
          raw_text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
