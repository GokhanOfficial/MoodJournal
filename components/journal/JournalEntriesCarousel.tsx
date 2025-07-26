'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, BookOpen, Calendar, Heart } from 'lucide-react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'
import { getMoodColor, getMoodLevel } from '@/types/emotions'
import type { JournalEntry } from '@/types/database'

interface JournalEntriesCarouselProps {
  userId: string
}

export default function JournalEntriesCarousel({ userId }: JournalEntriesCarouselProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRecentEntries()
  }, [userId])

  const loadRecentEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10) // Load last 10 entries

      if (error) throw error
      if (data) {
        setEntries(data)
      }
    } catch (error) {
      console.error('Error loading entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(entries.length - 5, prev + 1))
  }

  const visibleEntries = entries.slice(currentIndex, currentIndex + 5)
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < entries.length - 5

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <h4 className="text-lg font-medium mb-2">No journal entries yet</h4>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Start your journaling journey by creating your first entry.
        </p>
        <Link href="/journal/new" className="btn-primary">
          Create Your First Entry
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className={`flex-shrink-0 p-2 rounded-lg border transition-all ${
            canGoPrevious
              ? 'border-border bg-background hover:bg-muted hover:border-primary/50 cursor-pointer'
              : 'border-border/50 bg-muted/30 cursor-not-allowed opacity-50'
          }`}
          aria-label="Previous entries"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Journal Entries */}
        <div className="flex-1 grid grid-cols-5 gap-4">
          {visibleEntries.map((entry) => (
            <Link
              key={entry.id}
              href={`/journal/${entry.id}`}
              className="group relative"
            >
              <div className="relative h-48 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Cover Image or Default Background */}
                {entry.cover_image_url ? (
                  <img
                    src={entry.cover_image_url}
                    alt={entry.title || 'Journal cover'}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="absolute inset-0 bg-gradient-to-br"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${getDefaultCoverGradient(entry.id)})`
                    }}
                  />
                )}

                {/* Overlay with Entry Info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {entry.title || 'Untitled Entry'}
                    </h3>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(entry.created_at), 'MMM d')}</span>
                      </div>
                      {entry.mood_score && (
                        <div className="flex items-center gap-1">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: getMoodColor(getMoodLevel(entry.mood_score)) }}
                          />
                          <span>{entry.mood_score}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notebook Spine Effect */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20"></div>
                <div className="absolute left-1 top-0 bottom-0 w-px bg-white/30"></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`flex-shrink-0 p-2 rounded-lg border transition-all ${
            canGoNext
              ? 'border-border bg-background hover:bg-muted hover:border-primary/50 cursor-pointer'
              : 'border-border/50 bg-muted/30 cursor-not-allowed opacity-50'
          }`}
          aria-label="Next entries"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Entry Count Indicator */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Showing {currentIndex + 1}-{Math.min(currentIndex + 5, entries.length)} of {entries.length} entries
      </div>
    </div>
  )
}

// Generate consistent gradient colors based on entry ID
function getDefaultCoverGradient(id: string): string {
  const gradients = [
    '#667eea 0%, #764ba2 100%',
    '#f093fb 0%, #f5576c 100%',
    '#4facfe 0%, #00f2fe 100%',
    '#43e97b 0%, #38f9d7 100%',
    '#fa709a 0%, #fee140 100%',
    '#30cfd0 0%, #330867 100%',
    '#a8edea 0%, #fed6e3 100%',
    '#ff9a9e 0%, #fecfef 100%',
    '#fbc2eb 0%, #a6c1ee 100%',
    '#fdcbf1 0%, #e6dee9 100%'
  ]
  
  // Use the ID to consistently select a gradient
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length
  return gradients[index]
}