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
          content_html: string | null
          mood_score: number | null
          sentiment: string | null
          emotion_data: Json | null
          emotions: string[] | null
          audio_url: string | null
          audio_path: string | null
          audio_duration: number | null
          transcription_text: string | null
          transcription_model: string | null
          location_latitude: number | null
          location_longitude: number | null
          location_address: string | null
          location_city: string | null
          location_country: string | null
          location_timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          content_html?: string | null
          mood_score?: number | null
          sentiment?: string | null
          emotion_data?: Json | null
          emotions?: string[] | null
          audio_url?: string | null
          audio_path?: string | null
          audio_duration?: number | null
          transcription_text?: string | null
          transcription_model?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          content_html?: string | null
          mood_score?: number | null
          sentiment?: string | null
          emotion_data?: Json | null
          emotions?: string[] | null
          audio_url?: string | null
          audio_path?: string | null
          audio_duration?: number | null
          transcription_text?: string | null
          transcription_model?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_timezone?: string | null
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
      audio_recordings: {
        Row: {
          id: string
          entry_id: string
          user_id: string
          file_name: string
          file_size: number
          mime_type: string
          duration: number | null
          storage_path: string
          public_url: string
          transcription_text: string | null
          transcription_model: string | null
          transcription_confidence: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          user_id: string
          file_name: string
          file_size: number
          mime_type: string
          duration?: number | null
          storage_path: string
          public_url: string
          transcription_text?: string | null
          transcription_model?: string | null
          transcription_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          user_id?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          duration?: number | null
          storage_path?: string
          public_url?: string
          transcription_text?: string | null
          transcription_model?: string | null
          transcription_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          goal_type: 'mood_average' | 'entry_count' | 'streak' | 'custom'
          target_value: number
          current_value: number
          target_date: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          goal_type: 'mood_average' | 'entry_count' | 'streak' | 'custom'
          target_value: number
          current_value?: number
          target_date: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          goal_type?: 'mood_average' | 'entry_count' | 'streak' | 'custom'
          target_value?: number
          current_value?: number
          target_date?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_entry_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_entry_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_entry_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weather_data: {
        Row: {
          id: string
          location_latitude: number
          location_longitude: number
          weather_date: string
          temperature: number | null
          temperature_feels_like: number | null
          humidity: number | null
          pressure: number | null
          weather_main: string | null
          weather_description: string | null
          weather_icon: string | null
          wind_speed: number | null
          wind_direction: number | null
          visibility: number | null
          uv_index: number | null
          clouds: number | null
          api_source: string | null
          api_response: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_latitude: number
          location_longitude: number
          weather_date: string
          temperature?: number | null
          temperature_feels_like?: number | null
          humidity?: number | null
          pressure?: number | null
          weather_main?: string | null
          weather_description?: string | null
          weather_icon?: string | null
          wind_speed?: number | null
          wind_direction?: number | null
          visibility?: number | null
          uv_index?: number | null
          clouds?: number | null
          api_source?: string | null
          api_response?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_latitude?: number
          location_longitude?: number
          weather_date?: string
          temperature?: number | null
          temperature_feels_like?: number | null
          humidity?: number | null
          pressure?: number | null
          weather_main?: string | null
          weather_description?: string | null
          weather_icon?: string | null
          wind_speed?: number | null
          wind_direction?: number | null
          visibility?: number | null
          uv_index?: number | null
          clouds?: number | null
          api_source?: string | null
          api_response?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      mood_summaries: {
        Row: {
          id: string
          user_id: string
          summary_date: string
          summary_type: 'daily' | 'weekly' | 'monthly'
          entry_count: number
          average_mood: number | null
          dominant_emotions: string[] | null
          total_words: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          summary_date: string
          summary_type: 'daily' | 'weekly' | 'monthly'
          entry_count?: number
          average_mood?: number | null
          dominant_emotions?: string[] | null
          total_words?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          summary_date?: string
          summary_type?: 'daily' | 'weekly' | 'monthly'
          entry_count?: number
          average_mood?: number | null
          dominant_emotions?: string[] | null
          total_words?: number
          created_at?: string
        }
      }
    }
    Views: {
      goal_progress_view: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          goal_type: 'mood_average' | 'entry_count' | 'streak' | 'custom'
          target_value: number
          current_value: number
          target_date: string
          completed: boolean
          created_at: string
          updated_at: string
          status: 'overdue' | 'completed' | 'due_soon' | 'on_track'
          progress_percentage: number
          days_remaining: number
        }
      }
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
export type AudioRecording = Tables<'audio_recordings'>
export type Goal = Tables<'goals'>
export type UserStreak = Tables<'user_streaks'>
export type WeatherData = Tables<'weather_data'>
export type MoodSummary = Tables<'mood_summaries'>
export type GoalProgressView = Database['public']['Views']['goal_progress_view']['Row']