export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          mood_score: number | null
          sentiment: string | null
          emotion_data: Json | null
          emotions: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          mood_score?: number | null
          sentiment?: string | null
          emotion_data?: Json | null
          emotions?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          mood_score?: number | null
          sentiment?: string | null
          emotion_data?: Json | null
          emotions?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      emotion_analysis: {
        Row: {
          id: string
          entry_id: string
          user_id: string
          sentiment_score: number
          sentiment_label: string
          emotions: Json
          keywords: string[] | null
          confidence: number
          created_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          user_id: string
          sentiment_score: number
          sentiment_label: string
          emotions: Json
          keywords?: string[] | null
          confidence: number
          created_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          user_id?: string
          sentiment_score?: number
          sentiment_label?: string
          emotions?: Json
          keywords?: string[] | null
          confidence?: number
          created_at?: string
        }
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
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type JournalEntry = Tables<'journal_entries'>
export type EmotionAnalysis = Tables<'emotion_analysis'>