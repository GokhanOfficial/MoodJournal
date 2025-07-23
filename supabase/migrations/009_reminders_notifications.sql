-- Migration to add reminders and notifications system
-- This adds comprehensive reminder and notification functionality

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Daily reminder settings
  daily_reminder_enabled BOOLEAN DEFAULT true,
  daily_reminder_time TIME DEFAULT '20:00:00', -- 8 PM default
  daily_reminder_timezone TEXT DEFAULT 'UTC',
  
  -- Goal-related notifications
  goal_deadline_notifications BOOLEAN DEFAULT true,
  goal_deadline_days_before INTEGER DEFAULT 3, -- Notify 3 days before deadline
  goal_progress_notifications BOOLEAN DEFAULT true,
  
  -- Streak notifications
  streak_protection_enabled BOOLEAN DEFAULT true,
  streak_protection_hours INTEGER DEFAULT 2, -- Notify 2 hours before streak breaks
  
  -- Smart notifications based on patterns
  mood_pattern_notifications BOOLEAN DEFAULT true,
  weekly_insights_enabled BOOLEAN DEFAULT true,
  
  -- Notification channels
  browser_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  
  -- Push subscription data
  push_subscription JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_reminders table for custom reminders
CREATE TABLE IF NOT EXISTS user_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('daily', 'weekly', 'custom', 'goal_deadline', 'streak_protection', 'mood_check')),
  
  -- Scheduling
  is_active BOOLEAN DEFAULT true,
  reminder_time TIME NOT NULL,
  reminder_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- Days of week (1=Monday, 7=Sunday)
  timezone TEXT DEFAULT 'UTC',
  
  -- Custom reminder specific fields
  custom_date DATE, -- For one-time reminders
  repeat_interval TEXT CHECK (repeat_interval IN ('none', 'daily', 'weekly', 'monthly')),
  
  -- Associated data
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  
  -- Notification tracking
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_id UUID REFERENCES user_reminders(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL CHECK (notification_type IN ('daily_reminder', 'goal_deadline', 'streak_protection', 'mood_pattern', 'weekly_insight', 'custom')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Delivery details
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('browser_push', 'email', 'in_app')),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'clicked')),
  
  -- Metadata
  metadata JSONB,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reminders_user_id ON user_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reminders_next_send ON user_reminders(next_send_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_reminders_type ON user_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_user_reminders_goal_id ON user_reminders(goal_id) WHERE goal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);

-- Enable Row Level Security
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_notification_preferences
CREATE POLICY "Users can view own notification preferences" ON user_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON user_notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON user_notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_reminders
CREATE POLICY "Users can view own reminders" ON user_reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON user_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON user_reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON user_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notification_logs
CREATE POLICY "Users can view own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notification logs" ON notification_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at triggers
CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_reminders_updated_at 
    BEFORE UPDATE ON user_reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when user signs up
CREATE OR REPLACE TRIGGER on_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Function to calculate next reminder time
CREATE OR REPLACE FUNCTION calculate_next_reminder_time(
    reminder_time TIME,
    reminder_days INTEGER[],
    timezone_name TEXT DEFAULT 'UTC',
    current_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_time TIMESTAMP WITH TIME ZONE;
    current_day INTEGER;
    target_day INTEGER;
    days_ahead INTEGER;
    i INTEGER;
BEGIN
    -- Convert current time to user's timezone
    current_time := current_time AT TIME ZONE timezone_name;
    current_day := EXTRACT(DOW FROM current_time); -- 0=Sunday, 6=Saturday
    
    -- Convert to our format (1=Monday, 7=Sunday)
    current_day := CASE WHEN current_day = 0 THEN 7 ELSE current_day END;
    
    -- Find the next valid day
    FOR i IN 0..6 LOOP
        target_day := ((current_day - 1 + i) % 7) + 1;
        
        IF target_day = ANY(reminder_days) THEN
            days_ahead := i;
            
            -- If it's today, check if the time hasn't passed yet
            IF days_ahead = 0 THEN
                next_time := DATE_TRUNC('day', current_time) + reminder_time;
                IF next_time > current_time THEN
                    RETURN next_time AT TIME ZONE timezone_name;
                END IF;
                -- Time has passed today, look for next occurrence
                days_ahead := 7;
                FOR j IN 1..6 LOOP
                    target_day := ((current_day - 1 + j) % 7) + 1;
                    IF target_day = ANY(reminder_days) THEN
                        days_ahead := j;
                        EXIT;
                    END IF;
                END LOOP;
            END IF;
            
            next_time := DATE_TRUNC('day', current_time) + INTERVAL '1 day' * days_ahead + reminder_time;
            RETURN next_time AT TIME ZONE timezone_name;
        END IF;
    END LOOP;
    
    -- Fallback: next occurrence of first day in array
    target_day := reminder_days[1];
    days_ahead := (target_day - current_day + 7) % 7;
    IF days_ahead = 0 THEN days_ahead := 7; END IF;
    
    next_time := DATE_TRUNC('day', current_time) + INTERVAL '1 day' * days_ahead + reminder_time;
    RETURN next_time AT TIME ZONE timezone_name;
END;
$$ LANGUAGE plpgsql;

-- Function to update next_send_at when reminder is modified
CREATE OR REPLACE FUNCTION update_reminder_next_send()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active AND NEW.reminder_type IN ('daily', 'weekly', 'custom') THEN
        NEW.next_send_at := calculate_next_reminder_time(
            NEW.reminder_time,
            NEW.reminder_days,
            NEW.timezone
        );
    ELSE
        NEW.next_send_at := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update next_send_at
CREATE TRIGGER update_reminder_next_send_trigger
    BEFORE INSERT OR UPDATE ON user_reminders
    FOR EACH ROW EXECUTE FUNCTION update_reminder_next_send();

-- View for active reminders due for sending
CREATE OR REPLACE VIEW reminders_due_for_sending AS
SELECT 
    r.*,
    p.browser_notifications,
    p.email_notifications,
    p.push_subscription
FROM user_reminders r
JOIN user_notification_preferences p ON r.user_id = p.user_id
WHERE r.is_active = true
  AND r.next_send_at IS NOT NULL
  AND r.next_send_at <= NOW()
  AND (p.browser_notifications = true OR p.email_notifications = true);

-- Grant access to the view
GRANT SELECT ON reminders_due_for_sending TO authenticated;
GRANT SELECT ON reminders_due_for_sending TO service_role;

-- Function to get user's streak status for notifications
CREATE OR REPLACE FUNCTION get_user_streak_status(target_user_id UUID)
RETURNS TABLE(
    current_streak INTEGER,
    last_entry_date DATE,
    hours_since_last_entry INTEGER,
    streak_at_risk BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(us.current_streak, 0) as current_streak,
        (
            SELECT DATE(created_at) 
            FROM journal_entries 
            WHERE user_id = target_user_id 
            ORDER BY created_at DESC 
            LIMIT 1
        ) as last_entry_date,
        COALESCE(
            EXTRACT(EPOCH FROM (NOW() - (
                SELECT created_at 
                FROM journal_entries 
                WHERE user_id = target_user_id 
                ORDER BY created_at DESC 
                LIMIT 1
            )))::INTEGER / 3600,
            999
        ) as hours_since_last_entry,
        CASE 
            WHEN COALESCE(us.current_streak, 0) > 0 
                 AND COALESCE(
                     EXTRACT(EPOCH FROM (NOW() - (
                         SELECT created_at 
                         FROM journal_entries 
                         WHERE user_id = target_user_id 
                         ORDER BY created_at DESC 
                         LIMIT 1
                     )))::INTEGER / 3600,
                     999
                 ) >= 22 -- 22 hours since last entry
            THEN true
            ELSE false
        END as streak_at_risk
    FROM user_streaks us
    WHERE us.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant access to functions
GRANT EXECUTE ON FUNCTION calculate_next_reminder_time(TIME, INTEGER[], TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_reminder_time(TIME, INTEGER[], TEXT, TIMESTAMP WITH TIME ZONE) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_streak_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_streak_status(UUID) TO service_role;

-- Add comments for documentation
COMMENT ON TABLE user_notification_preferences IS 'User preferences for notifications and reminders';
COMMENT ON TABLE user_reminders IS 'Custom reminders and scheduled notifications for users';
COMMENT ON TABLE notification_logs IS 'Log of all sent notifications for tracking and analytics';
COMMENT ON FUNCTION calculate_next_reminder_time IS 'Calculate the next time a reminder should be sent based on schedule';
COMMENT ON FUNCTION get_user_streak_status IS 'Get current streak status and risk assessment for a user';