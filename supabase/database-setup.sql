-- MoodJournal Complete Database Setup
-- Run this entire file in your Supabase SQL Editor to set up the complete database
-- This replaces all individual migration files (001-010)

-- =====================================================
-- 001: MVP SCHEMA - Core Tables and Authentication
-- =====================================================

-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  emotion_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the emotion_analysis table
CREATE TABLE IF NOT EXISTS emotion_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
  emotions JSONB NOT NULL,
  keywords TEXT[],
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_analysis_entry_id ON emotion_analysis(entry_id);
CREATE INDEX IF NOT EXISTS idx_emotion_analysis_user_id ON emotion_analysis(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at 
    BEFORE UPDATE ON journal_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for journal_entries
CREATE POLICY "Users can view own journal entries" ON journal_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON journal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON journal_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON journal_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for emotion_analysis
CREATE POLICY "Users can view own emotion analysis" ON emotion_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emotion analysis" ON emotion_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 002: EMOTIONS COLUMN - Enhanced Emotion Support
-- =====================================================

-- Add emotions column to journal_entries table for storing emotional themes
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS emotions TEXT[];

-- Create index for emotions array for better search performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_emotions ON journal_entries USING GIN(emotions);

-- Add comment for documentation
COMMENT ON COLUMN journal_entries.emotions IS 'Array of emotional themes identified by AI analysis';

-- =====================================================
-- 003: PHASE1 ANALYTICS - Goals and Streak Tracking
-- =====================================================

-- Create goals table for user goal setting and tracking
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('mood_average', 'entry_count', 'streak', 'custom')),
  target_value DECIMAL(5,2) NOT NULL CHECK (target_value > 0),
  current_value DECIMAL(5,2) DEFAULT 0 CHECK (current_value >= 0),
  target_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_streaks table for tracking writing streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_entry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mood_summaries table for pre-computed analytics
CREATE TABLE IF NOT EXISTS mood_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary_date DATE NOT NULL,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('daily', 'weekly', 'monthly')),
  entry_count INTEGER DEFAULT 0,
  average_mood DECIMAL(3,2),
  dominant_emotions TEXT[],
  total_words INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, summary_date, summary_type)
);

-- Create indexes for analytics tables
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(completed);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_entry_date ON user_streaks(last_entry_date);

CREATE INDEX IF NOT EXISTS idx_mood_summaries_user_id ON mood_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_summaries_date_type ON mood_summaries(summary_date, summary_type);

-- Add updated_at triggers for analytics tables
CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at 
    BEFORE UPDATE ON user_streaks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for analytics tables
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goals
CREATE POLICY "Users can view own goals" ON goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_streaks
CREATE POLICY "Users can view own streaks" ON user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for mood_summaries
CREATE POLICY "Users can view own mood summaries" ON mood_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood summaries" ON mood_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood summaries" ON mood_summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- Analytics automation functions
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
    goal_record RECORD;
    calculated_value DECIMAL(5,2);
    entry_count INTEGER;
    avg_mood DECIMAL(5,2);
    streak_count INTEGER;
BEGIN
    FOR goal_record IN 
        SELECT * FROM goals 
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
        AND completed = FALSE
    LOOP
        CASE goal_record.goal_type
            WHEN 'mood_average' THEN
                SELECT AVG(mood_score) INTO avg_mood
                FROM journal_entries 
                WHERE user_id = goal_record.user_id 
                AND mood_score IS NOT NULL;
                calculated_value := COALESCE(avg_mood, 0);
                
            WHEN 'entry_count' THEN
                SELECT COUNT(*) INTO entry_count
                FROM journal_entries 
                WHERE user_id = goal_record.user_id 
                AND created_at >= goal_record.created_at;
                calculated_value := entry_count;
                
            WHEN 'streak' THEN
                SELECT current_streak INTO streak_count
                FROM user_streaks 
                WHERE user_id = goal_record.user_id;
                calculated_value := COALESCE(streak_count, 0);
                
            ELSE
                CONTINUE;
        END CASE;
        
        UPDATE goals 
        SET current_value = calculated_value,
            completed = (calculated_value >= goal_record.target_value),
            updated_at = NOW()
        WHERE id = goal_record.id;
    END LOOP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    user_streak_record user_streaks%ROWTYPE;
    entry_date DATE;
    yesterday DATE;
BEGIN
    entry_date := DATE(NEW.created_at);
    yesterday := entry_date - INTERVAL '1 day';
    
    SELECT * INTO user_streak_record 
    FROM user_streaks 
    WHERE user_id = NEW.user_id;
    
    IF NOT FOUND THEN
        INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_entry_date)
        VALUES (NEW.user_id, 1, 1, entry_date);
    ELSE
        IF user_streak_record.last_entry_date = yesterday THEN
            UPDATE user_streaks 
            SET current_streak = current_streak + 1,
                longest_streak = GREATEST(longest_streak, current_streak + 1),
                last_entry_date = entry_date,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        ELSIF user_streak_record.last_entry_date = entry_date THEN
            NULL;
        ELSE
            UPDATE user_streaks 
            SET current_streak = 1,
                last_entry_date = entry_date,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION initialize_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak)
    VALUES (NEW.id, 0, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create analytics triggers
CREATE TRIGGER update_goal_progress_on_entry_insert
    AFTER INSERT ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_goal_progress();

CREATE TRIGGER update_goal_progress_on_entry_update
    AFTER UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_goal_progress();

CREATE TRIGGER update_user_streak_on_entry
    AFTER INSERT ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_user_streak();

CREATE TRIGGER initialize_user_streak_on_profile_create
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION initialize_user_streak();

-- Create analytics view
CREATE OR REPLACE VIEW goal_progress_view AS
SELECT 
    g.*,
    CASE 
        WHEN g.target_date < CURRENT_DATE AND NOT g.completed THEN 'overdue'
        WHEN g.completed THEN 'completed'
        WHEN g.target_date - CURRENT_DATE <= 7 THEN 'due_soon'
        ELSE 'on_track'
    END as status,
    ROUND((g.current_value / g.target_value * 100)::numeric, 1) as progress_percentage,
    g.target_date - CURRENT_DATE as days_remaining
FROM goals g;

GRANT SELECT ON goal_progress_view TO authenticated;

-- =====================================================
-- 004: VOICE JOURNALING - Audio Recording Support
-- =====================================================

-- Add audio-related columns to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_path TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS transcription_text TEXT,
ADD COLUMN IF NOT EXISTS transcription_model TEXT;

-- Add indexes for audio-related queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_audio_url ON journal_entries(audio_url) WHERE audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_transcription ON journal_entries USING gin(to_tsvector('english', transcription_text)) WHERE transcription_text IS NOT NULL;

-- Create audio_recordings table for detailed audio metadata
CREATE TABLE IF NOT EXISTS audio_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  duration INTEGER,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  transcription_text TEXT,
  transcription_model TEXT,
  transcription_confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audio_recordings table
CREATE INDEX IF NOT EXISTS idx_audio_recordings_entry_id ON audio_recordings(entry_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_user_id ON audio_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_created_at ON audio_recordings(created_at DESC);

-- Enable Row Level Security for audio_recordings
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audio_recordings
CREATE POLICY "Users can view own audio recordings" ON audio_recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audio recordings" ON audio_recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio recordings" ON audio_recordings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio recordings" ON audio_recordings
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for audio_recordings
CREATE TRIGGER update_audio_recordings_updated_at 
    BEFORE UPDATE ON audio_recordings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for journal entries with audio information
CREATE OR REPLACE VIEW journal_entries_with_audio AS
SELECT 
    je.*,
    ar.id as audio_id,
    ar.file_name as audio_file_name,
    ar.file_size as audio_file_size,
    ar.mime_type as audio_mime_type,
    ar.duration as audio_duration_seconds,
    ar.transcription_confidence
FROM journal_entries je
LEFT JOIN audio_recordings ar ON je.id = ar.entry_id;

GRANT SELECT ON journal_entries_with_audio TO authenticated;

-- =====================================================
-- 005: STORAGE POLICIES - Audio File Storage
-- =====================================================

-- Create the audio-recordings storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings', 
  false,
  10485760, -- 10MB limit
  ARRAY['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies for audio files
CREATE POLICY "Users can upload own audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audio-recordings' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio-recordings' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own audio files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'audio-recordings' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audio-recordings' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Grant storage permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;

-- =====================================================
-- 006: RICH TEXT SUPPORT - Enhanced Content Formatting
-- =====================================================

-- Add rich text formatting support to journal entries
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS content_format TEXT DEFAULT 'plaintext' CHECK (content_format IN ('plaintext', 'markdown', 'html'));

-- Add index for content format
CREATE INDEX IF NOT EXISTS idx_journal_entries_content_format ON journal_entries(content_format);

-- Add comment for documentation
COMMENT ON COLUMN journal_entries.content_format IS 'Format of the content: plaintext, markdown, or html';

-- =====================================================
-- 007: LOCATION SUPPORT - Geographic Context
-- =====================================================

-- Add location support to journal entries
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create indexes for location queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_location ON journal_entries(location_latitude, location_longitude) WHERE location_latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_location_name ON journal_entries(location_name) WHERE location_name IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN journal_entries.location_name IS 'Human-readable location name';
COMMENT ON COLUMN journal_entries.location_latitude IS 'Latitude coordinate for the location';
COMMENT ON COLUMN journal_entries.location_longitude IS 'Longitude coordinate for the location';
COMMENT ON COLUMN journal_entries.location_address IS 'Full address of the location';

-- =====================================================
-- 008: WEATHER SUPPORT - Environmental Context
-- =====================================================

-- Create weather_data table for caching weather information
CREATE TABLE IF NOT EXISTS weather_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_latitude DECIMAL(10, 8) NOT NULL,
  location_longitude DECIMAL(11, 8) NOT NULL,
  weather_date DATE NOT NULL,
  temperature DECIMAL(5, 2),
  temperature_feels_like DECIMAL(5, 2),
  humidity INTEGER,
  pressure INTEGER,
  wind_speed DECIMAL(5, 2),
  wind_direction INTEGER,
  weather_main TEXT,
  weather_description TEXT,
  weather_icon TEXT,
  visibility INTEGER,
  uv_index DECIMAL(3, 1),
  clouds INTEGER,
  api_source TEXT DEFAULT 'openweathermap',
  api_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_latitude, location_longitude, weather_date)
);

-- Create indexes for weather data
CREATE INDEX IF NOT EXISTS idx_weather_data_location_date ON weather_data(location_latitude, location_longitude, weather_date);
CREATE INDEX IF NOT EXISTS idx_weather_data_date ON weather_data(weather_date);

-- Add weather reference to journal entries
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS weather_id UUID REFERENCES weather_data(id);

-- Create index for weather reference
CREATE INDEX IF NOT EXISTS idx_journal_entries_weather_id ON journal_entries(weather_id);

-- Function to find nearby weather data (within 5km radius)
CREATE OR REPLACE FUNCTION find_nearby_weather(
  target_lat DECIMAL(10, 8),
  target_lon DECIMAL(11, 8),
  target_date DATE,
  radius_km DECIMAL DEFAULT 5.0
)
RETURNS UUID AS $$
DECLARE
  weather_record_id UUID;
BEGIN
  SELECT id INTO weather_record_id
  FROM weather_data
  WHERE weather_date = target_date
  AND (
    6371 * acos(
      cos(radians(target_lat)) * 
      cos(radians(location_latitude)) * 
      cos(radians(location_longitude) - radians(target_lon)) + 
      sin(radians(target_lat)) * 
      sin(radians(location_latitude))
    )
  ) <= radius_km
  ORDER BY (
    6371 * acos(
      cos(radians(target_lat)) * 
      cos(radians(location_latitude)) * 
      cos(radians(location_longitude) - radians(target_lon)) + 
      sin(radians(target_lat)) * 
      sin(radians(location_latitude))
    )
  )
  LIMIT 1;
  
  RETURN weather_record_id;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for weather_data
CREATE TRIGGER update_weather_data_updated_at 
    BEFORE UPDATE ON weather_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE weather_data IS 'Cached weather information for locations and dates';
COMMENT ON FUNCTION find_nearby_weather IS 'Find cached weather data within specified radius';

-- =====================================================
-- 009: NOTIFICATIONS & REMINDERS - User Engagement
-- =====================================================

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_reminder_enabled BOOLEAN DEFAULT false,
  daily_reminder_time TIME DEFAULT '20:00:00',
  weekly_summary_enabled BOOLEAN DEFAULT false,
  goal_reminders_enabled BOOLEAN DEFAULT true,
  streak_notifications_enabled BOOLEAN DEFAULT true,
  browser_notifications_enabled BOOLEAN DEFAULT false,
  email_notifications_enabled BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user reminders table
CREATE TABLE IF NOT EXISTS user_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('daily_journal', 'goal_check', 'streak_motivation', 'weekly_summary')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_id UUID REFERENCES user_reminders(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('browser', 'email', 'push')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'clicked')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notification tables
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reminders_user_id ON user_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reminders_scheduled_for ON user_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_user_reminders_status ON user_reminders(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- Enable Row Level Security for notification tables
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification preferences
CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON user_notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user reminders
CREATE POLICY "Users can view own reminders" ON user_reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON user_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON user_reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON user_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notification logs
CREATE POLICY "Users can view own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Add updated_at triggers for notification tables
CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_reminders_updated_at 
    BEFORE UPDATE ON user_reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize notification preferences on profile creation
CREATE OR REPLACE FUNCTION initialize_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification preferences when profile is created
CREATE TRIGGER initialize_notification_preferences_on_profile_create
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION initialize_notification_preferences();

-- =====================================================
-- 010: THEME PREFERENCES - UI Customization
-- =====================================================

-- Add theme preference column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Add index for theme preference
CREATE INDEX IF NOT EXISTS idx_profiles_theme_preference ON profiles(theme_preference);

-- Update existing profiles to have default theme preference
UPDATE profiles SET theme_preference = 'system' WHERE theme_preference IS NULL;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Add final comments
COMMENT ON DATABASE postgres IS 'MoodJournal - AI-Powered Personal Journal Database';

-- Final success message (this will appear in the SQL editor output)
DO $$
BEGIN
    RAISE NOTICE '🎉 MoodJournal database setup completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '- profiles (user accounts)';
    RAISE NOTICE '- journal_entries (journal content)';
    RAISE NOTICE '- emotion_analysis (AI analysis results)';
    RAISE NOTICE '- goals (user wellness goals)';
    RAISE NOTICE '- user_streaks (writing streaks)';
    RAISE NOTICE '- mood_summaries (analytics cache)';
    RAISE NOTICE '- audio_recordings (voice recordings)';
    RAISE NOTICE '- weather_data (weather cache)';
    RAISE NOTICE '- user_notification_preferences (notification settings)';
    RAISE NOTICE '- user_reminders (scheduled reminders)';
    RAISE NOTICE '- notification_logs (notification history)';
    RAISE NOTICE '';
    RAISE NOTICE 'Created storage bucket: audio-recordings';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Configure your environment variables in .env.local';
    RAISE NOTICE '2. Start your development server: npm run dev';
    RAISE NOTICE '3. Create an account and start journaling!';
    RAISE NOTICE '';
    RAISE NOTICE 'For help, see docs/USER_GUIDE.md';
END $$;