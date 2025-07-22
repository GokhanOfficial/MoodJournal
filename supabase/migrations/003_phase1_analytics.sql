-- Phase 1 Analytics & Insights Database Migration
-- This migration adds support for goals tracking and enhanced analytics

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goals_goal_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(completed);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_entry_date ON user_streaks(last_entry_date);

CREATE INDEX IF NOT EXISTS idx_mood_summaries_user_id ON mood_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_summaries_date_type ON mood_summaries(summary_date, summary_type);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at 
    BEFORE UPDATE ON user_streaks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for new tables
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

-- Function to update goal progress automatically
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
    goal_record RECORD;
    calculated_value DECIMAL(5,2);
    entry_count INTEGER;
    avg_mood DECIMAL(5,2);
    streak_count INTEGER;
BEGIN
    -- Update goals for the user when a journal entry is created/updated
    FOR goal_record IN 
        SELECT * FROM goals 
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
        AND completed = FALSE
    LOOP
        CASE goal_record.goal_type
            WHEN 'mood_average' THEN
                -- Calculate average mood score
                SELECT AVG(mood_score) INTO avg_mood
                FROM journal_entries 
                WHERE user_id = goal_record.user_id 
                AND mood_score IS NOT NULL;
                
                calculated_value := COALESCE(avg_mood, 0);
                
            WHEN 'entry_count' THEN
                -- Count total entries since goal creation
                SELECT COUNT(*) INTO entry_count
                FROM journal_entries 
                WHERE user_id = goal_record.user_id 
                AND created_at >= goal_record.created_at;
                
                calculated_value := entry_count;
                
            WHEN 'streak' THEN
                -- Get current streak
                SELECT current_streak INTO streak_count
                FROM user_streaks 
                WHERE user_id = goal_record.user_id;
                
                calculated_value := COALESCE(streak_count, 0);
                
            ELSE
                -- For custom goals, don't auto-update
                CONTINUE;
        END CASE;
        
        -- Update the goal's current value
        UPDATE goals 
        SET current_value = calculated_value,
            completed = (calculated_value >= goal_record.target_value),
            updated_at = NOW()
        WHERE id = goal_record.id;
    END LOOP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user streaks
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    user_streak_record user_streaks%ROWTYPE;
    entry_date DATE;
    yesterday DATE;
BEGIN
    entry_date := DATE(NEW.created_at);
    yesterday := entry_date - INTERVAL '1 day';
    
    -- Get or create user streak record
    SELECT * INTO user_streak_record 
    FROM user_streaks 
    WHERE user_id = NEW.user_id;
    
    IF NOT FOUND THEN
        -- Create new streak record
        INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_entry_date)
        VALUES (NEW.user_id, 1, 1, entry_date);
    ELSE
        -- Update existing streak
        IF user_streak_record.last_entry_date = yesterday THEN
            -- Consecutive day - increment streak
            UPDATE user_streaks 
            SET current_streak = current_streak + 1,
                longest_streak = GREATEST(longest_streak, current_streak + 1),
                last_entry_date = entry_date,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        ELSIF user_streak_record.last_entry_date = entry_date THEN
            -- Same day - no change needed
            NULL;
        ELSE
            -- Streak broken - reset to 1
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

-- Create triggers for automatic updates
CREATE TRIGGER update_goal_progress_on_entry_insert
    AFTER INSERT ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_goal_progress();

CREATE TRIGGER update_goal_progress_on_entry_update
    AFTER UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_goal_progress();

CREATE TRIGGER update_user_streak_on_entry
    AFTER INSERT ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_user_streak();

-- Function to initialize user streak on profile creation
CREATE OR REPLACE FUNCTION initialize_user_streak()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak)
    VALUES (NEW.id, 0, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create streak record when profile is created
CREATE TRIGGER initialize_user_streak_on_profile_create
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION initialize_user_streak();

-- Add comments for documentation
COMMENT ON TABLE goals IS 'User-defined goals for emotional wellness tracking';
COMMENT ON TABLE user_streaks IS 'Tracks writing streaks for each user';
COMMENT ON TABLE mood_summaries IS 'Pre-computed mood analytics for performance';

COMMENT ON COLUMN goals.goal_type IS 'Type of goal: mood_average, entry_count, streak, or custom';
COMMENT ON COLUMN goals.target_value IS 'Target value to achieve (mood score, count, days, etc.)';
COMMENT ON COLUMN goals.current_value IS 'Current progress toward the goal';

-- Create view for goal progress with additional context
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

-- Grant access to the view
GRANT SELECT ON goal_progress_view TO authenticated;