# Database Migration Instructions

## The notifications are failing because the database migration hasn't been applied yet.

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy the entire contents of `supabase/migrations/009_reminders_notifications.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

### Option 2: Apply via Supabase CLI (if linked)

If your project is linked to Supabase CLI:

```bash
# Link your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push
```

### Option 3: Manual Table Creation

If you prefer to create tables manually, here are the essential commands:

```sql
-- Run this in your Supabase SQL Editor
-- Copy from supabase/migrations/009_reminders_notifications.sql
```

### Verification

After applying the migration, you can verify it worked by running this query in the SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_notification_preferences', 'user_reminders', 'notification_logs');
```

You should see all three tables listed.

### Test the Notifications

Once the migration is applied:

1. Visit `/notifications` in your app
2. Enable browser notifications
3. Create a test reminder
4. The notifications API should work without errors

Let me know once you've applied the migration and I can help test the functionality!