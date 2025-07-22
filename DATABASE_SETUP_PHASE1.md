# Phase 1 Database Setup Guide

## 🗄️ **Database Migration Instructions**

### **Step 1: Apply the Migration**

Run the Phase 1 migration to add goals, streaks, and analytics support:

```sql
-- Execute the migration file: supabase/migrations/003_phase1_analytics.sql
-- This can be done through:
-- 1. Supabase Dashboard > SQL Editor
-- 2. Supabase CLI: supabase db push
-- 3. Direct SQL execution
```

### **Step 2: Verify Tables Created**

After running the migration, verify these tables exist:

- ✅ `goals` - User goal tracking
- ✅ `user_streaks` - Writing streak management  
- ✅ `mood_summaries` - Pre-computed analytics
- ✅ `goal_progress_view` - Enhanced goal view with progress

### **Step 3: Test Database Functions**

The migration includes automatic triggers that will:

1. **Auto-update goal progress** when journal entries are created/updated
2. **Track writing streaks** automatically on new entries
3. **Initialize user streaks** when profiles are created
4. **Maintain data integrity** with proper constraints

### **Step 4: Verify RLS Policies**

All new tables have Row Level Security enabled with policies ensuring:

- Users can only access their own data
- Proper CRUD permissions for authenticated users
- Secure data isolation between users

## 🔧 **New Database Features**

### **Goals Table Structure**
```sql
goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT CHECK (goal_type IN ('mood_average', 'entry_count', 'streak', 'custom')),
  target_value DECIMAL(5,2) NOT NULL,
  current_value DECIMAL(5,2) DEFAULT 0,
  target_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### **User Streaks Table Structure**
```sql
user_streaks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_entry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### **Automatic Goal Progress Updates**

Goals are automatically updated when:
- **Mood Average Goals**: Recalculated when entries with mood scores are added
- **Entry Count Goals**: Incremented when new entries are created
- **Streak Goals**: Updated based on current writing streak
- **Custom Goals**: Manual updates only

### **Streak Tracking Logic**

Writing streaks are maintained automatically:
- **Consecutive Days**: Increment streak counter
- **Same Day**: Multiple entries don't affect streak
- **Missed Days**: Reset streak to 1 for new entry
- **Longest Streak**: Always preserved as personal best

## 🎯 **Application Integration**

### **Updated Components**

1. **GoalsTracker** - Now uses real database operations
2. **Dashboard** - Displays actual streak data
3. **Analytics** - Can leverage mood_summaries for performance

### **New Database Types**

TypeScript types have been updated to include:
- `Goal` - Goals table row type
- `UserStreak` - User streaks table row type  
- `MoodSummary` - Mood summaries table row type
- `GoalProgressView` - Enhanced goal view with progress

## 🚀 **Ready for Production**

After applying this migration:

✅ **Goals system** fully functional with database persistence  
✅ **Streak tracking** automated and accurate  
✅ **Analytics foundation** ready for enhanced reporting  
✅ **Data security** enforced with RLS policies  
✅ **Performance optimized** with proper indexes  

The application now has complete Phase 1 database support for all analytics and insights features!