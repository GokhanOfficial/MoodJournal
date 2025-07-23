-- Quick verification query to check if notification tables exist
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_notification_preferences', 
    'user_reminders', 
    'notification_logs'
)
ORDER BY table_name;

-- If tables exist, check the view
SELECT 
    table_name
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'reminders_due_for_sending';

-- Test query to see if the view works (run after migration)
-- SELECT COUNT(*) FROM reminders_due_for_sending;