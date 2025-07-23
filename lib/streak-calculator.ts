import { createClient } from '@/lib/supabase'
import type { JournalEntry } from '@/types/database'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastEntryDate: string | null
}

/**
 * Calculate writing streak based on journal entries
 * A streak is consecutive days with at least one journal entry
 */
export async function calculateUserStreak(userId: string): Promise<StreakData> {
  const supabase = createClient()
  
  try {
    // Get all journal entries for the user, ordered by date
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching journal entries for streak calculation:', error)
      return { currentStreak: 0, longestStreak: 0, lastEntryDate: null }
    }

    if (!entries || entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastEntryDate: null }
    }

    // Get unique dates (ignore time, only consider dates)
    const uniqueDateSet = new Set(entries.map(entry => {
      return new Date(entry.created_at).toDateString()
    }))
    const uniqueDates = Array.from(uniqueDateSet).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    if (uniqueDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastEntryDate: null }
    }

    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // Calculate current streak
    const mostRecentDate = uniqueDates[0]
    
    // Current streak only counts if the most recent entry is today or yesterday
    if (mostRecentDate === today || mostRecentDate === yesterday) {
      let streakDate = new Date(mostRecentDate)
      let dateIndex = 0
      
      while (dateIndex < uniqueDates.length) {
        const currentDateStr = streakDate.toDateString()
        
        if (uniqueDates[dateIndex] === currentDateStr) {
          currentStreak++
          dateIndex++
        } else {
          // Gap in streak
          break
        }
        
        // Move to previous day
        streakDate.setDate(streakDate.getDate() - 1)
      }
    }
    
    // Calculate longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const currentDate = new Date(uniqueDates[i])
        const previousDate = new Date(uniqueDates[i - 1])
        const dayDifference = (previousDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000)
        
        if (dayDifference === 1) {
          // Consecutive day
          tempStreak++
        } else {
          // Streak broken
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
    }
    
    // Don't forget the last streak
    longestStreak = Math.max(longestStreak, tempStreak)
    
    return {
      currentStreak,
      longestStreak,
      lastEntryDate: entries[0].created_at
    }
    
  } catch (error) {
    console.error('Error calculating user streak:', error)
    return { currentStreak: 0, longestStreak: 0, lastEntryDate: null }
  }
}

/**
 * Update the user_streaks table with calculated values
 */
export async function updateUserStreakInDatabase(userId: string, streakData: StreakData): Promise<void> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('user_streaks')
      .upsert({
        user_id: userId,
        current_streak: streakData.currentStreak,
        longest_streak: streakData.longestStreak,
        last_entry_date: streakData.lastEntryDate ? new Date(streakData.lastEntryDate).toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error updating user streak in database:', error)
    }
  } catch (error) {
    console.error('Error updating user streak in database:', error)
  }
}

/**
 * Get streak data for a user, calculating it fresh and updating the database
 */
export async function getUserStreak(userId: string): Promise<StreakData> {
  const streakData = await calculateUserStreak(userId)
  await updateUserStreakInDatabase(userId, streakData)
  return streakData
}