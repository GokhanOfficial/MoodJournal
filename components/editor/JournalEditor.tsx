'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { analyzeEmotionAPI, calculateMoodScore, getEmotionalInsights } from '@/services/emotion-analysis-client'
import { Save, Loader2, ArrowLeft, Heart, Sparkles, Brain, TrendingUp, Eye, EyeOff, Zap, Calendar, Volume2 } from 'lucide-react'
import { format } from 'date-fns'
import RichTextEditor from '@/components/editor/RichTextEditor'
import VoiceRecorder from '@/components/voice/VoiceRecorder'
import LocationSelector, { type LocationData } from '@/components/location/LocationSelector'
import CoverImageSelector from '@/components/journal/CoverImageSelector'
import { WeatherCard } from '@/components/weather/WeatherDisplay'
import { useWeather } from '@/hooks/useWeather'
import type { JournalEntry } from '@/types/database'
import type { SentimentAnalysis } from '@/types/emotions'
import Link from 'next/link'

interface JournalEditorProps {
  entry?: JournalEntry
  onSave?: (entry: JournalEntry) => void
}

export default function JournalEditor({ entry, onSave }: JournalEditorProps) {
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.content_html || entry?.content || '')
  const [entryDate, setEntryDate] = useState(() => {
    if (entry?.created_at) {
      return format(new Date(entry.created_at), 'yyyy-MM-dd')
    }
    return format(new Date(), 'yyyy-MM-dd')
  })
  const [isLoading, setIsLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<SentimentAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [voiceTranscription, setVoiceTranscription] = useState('')
  const [audioUrl, setAudioUrl] = useState(entry?.audio_url || '')
  const [audioPath, setAudioPath] = useState(entry?.audio_path || '')
  const [coverImageUrl, setCoverImageUrl] = useState(entry?.cover_image_url || '')
  const [coverImagePath, setCoverImagePath] = useState(entry?.cover_image_path || '')
  const [coverImagePublic, setCoverImagePublic] = useState(entry?.cover_image_public || false)
  const [userId, setUserId] = useState<string>('')
  const [location, setLocation] = useState<LocationData | null>(() => {
    if (entry?.location_latitude && entry?.location_longitude) {
      return {
        latitude: entry.location_latitude,
        longitude: entry.location_longitude,
        address: entry.location_address || '',
        city: entry.location_city || '',
        country: entry.location_country || '',
        timezone: entry.location_timezone || ''
      }
    }
    return null
  })
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastAutoSaveRef = useRef<Date | null>(null)
  const pendingSaveRef = useRef(false)

  // Weather data hook
  const {
    weatherData,
    loading: weatherLoading,
    error: weatherError
  } = useWeather(location, new Date(entryDate), {
    enabled: !!location,
    debounceMs: 2000, // Increase debounce to 2 seconds
    onError: (error) => {
      // Only log non-API key errors to avoid spam
      if (!error.includes('Invalid API key') && !error.includes('401')) {
        console.warn('Weather fetch error:', error)
      }
    }
  })

  // Initialize date from URL parameter if provided
  useEffect(() => {
    const dateParam = searchParams.get('date')
    if (dateParam && !entry?.id) {
      // Only set date from URL for new entries
      const paramDate = new Date(dateParam)
      if (!isNaN(paramDate.getTime())) {
        setEntryDate(format(paramDate, 'yyyy-MM-dd'))
      }
    }
  }, [searchParams, entry?.id])

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [supabase])
  // Handle voice transcription completion
  const handleVoiceTranscription = (transcription: string, audioUrlResult: string, audioPathResult: string) => {
    setVoiceTranscription(transcription)
    setAudioUrl(audioUrlResult)
    setAudioPath(audioPathResult)
    
    // Add transcription to content
    const newContent = content + (content ? '\n\n' : '') + transcription
    handleContentChange(newContent)
    
    // Hide voice recorder
    setShowVoiceRecorder(false)
    
    console.log('✅ Voice transcription completed:', transcription)
  }

  // Handle voice recording error
  const handleVoiceError = (error: string) => {
    console.error('Voice recording error:', error)
    alert(`Voice recording failed: ${error}`)
  }

  // Load existing analysis from database entry
  useEffect(() => {
    if (entry && entry.mood_score) {
      console.log('📊 Loading existing analysis from database')
      
      // Reconstruct analysis object from database fields
      const existingAnalysis: SentimentAnalysis = {
        score: entry.sentiment === 'positive' ? 0.5 : entry.sentiment === 'negative' ? -0.5 : 0,
        label: (entry.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral',
        confidence: 0.8, // Assume high confidence for saved analysis
        emotions: entry.emotion_data ? entry.emotion_data as any : {
          joy: 0.15,
          sadness: 0.1,
          anger: 0.1,
          fear: 0.1,
          surprise: 0.1,
          disgust: 0.05,
          neutral: 0.4
        },
        keywords: [],
        moodScore: entry.mood_score,
        emotionalThemes: entry.emotions || ['reflection'],
        emotionalIntensity: Math.abs(entry.sentiment === 'positive' ? 0.6 : entry.sentiment === 'negative' ? 0.6 : 0.3),
        dominantEmotion: entry.sentiment === 'positive' ? 'joy' : entry.sentiment === 'negative' ? 'sadness' : 'neutral'
      }
      
      setCurrentAnalysis(existingAnalysis)
      console.log('✅ Loaded existing analysis:', existingAnalysis)
    }
  }, [entry])

  // Auto-save function (WITHOUT emotion analysis)
  const performAutoSave = useCallback(async () => {
    if (pendingSaveRef.current) return
    
    const currentTitle = title
    const currentContent = content
    
    if (!currentContent.trim() && !currentTitle.trim()) return

    // Check cooldown period (15 seconds)
    const now = new Date()
    if (lastAutoSaveRef.current) {
      const timeSinceLastSave = now.getTime() - lastAutoSaveRef.current.getTime()
      if (timeSinceLastSave < 15000) { // 15 seconds cooldown
        return
      }
    }
    
    pendingSaveRef.current = true
    setIsSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const plainTextContent = getTextFromHtml(currentContent)
      
      let entryData: any = {
        user_id: user.id,
        title: currentTitle || null,
        content: plainTextContent, // Store plain text for backward compatibility
        content_html: currentContent, // Store HTML content for rich text
        updated_at: new Date().toISOString()
      }

      // Add audio data if available
      if (audioUrl && audioPath) {
        entryData.audio_url = audioUrl
        entryData.audio_path = audioPath
        if (voiceTranscription) {
          entryData.transcription_text = voiceTranscription
          entryData.transcription_model = process.env.NEXT_PUBLIC_OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe'
        }
      }

      // Add location data if available
      if (location) {
        entryData.location_latitude = location.latitude
        entryData.location_longitude = location.longitude
        entryData.location_address = location.address
        entryData.location_city = location.city
        entryData.location_country = location.country
        entryData.location_timezone = location.timezone
      }

      // Add cover image data if available
      if (coverImageUrl && coverImagePath) {
        entryData.cover_image_url = coverImageUrl
        entryData.cover_image_path = coverImagePath
        entryData.cover_image_public = coverImagePublic
      }

      // If this is a new entry with a custom date, set created_at
      if (!entry?.id && entryDate !== format(new Date(), 'yyyy-MM-dd')) {
        const customDate = new Date(entryDate + 'T' + format(new Date(), 'HH:mm:ss'))
        entryData.created_at = customDate.toISOString()
      }

      // Don't analyze during auto-save, just save the content
      console.log('💾 Auto-saving without analysis...')

      let result
      if (entry?.id) {
        result = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', entry.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('journal_entries')
          .insert(entryData)
          .select()
          .single()
      }

      if (result.error) throw result.error
      
      const saveTime = new Date()
      setLastSaved(saveTime)
      lastAutoSaveRef.current = saveTime
      setHasUnsavedChanges(false)
      onSave?.(result.data)
      
      if (!entry?.id && result.data) {
        router.replace(`/journal/${result.data.id}`)
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
      pendingSaveRef.current = false
    }
  }, [entry?.id, supabase, onSave, router, title, content, location, coverImageUrl, coverImagePath, coverImagePublic])

  // Manual mood analysis function
  const performMoodAnalysis = useCallback(async () => {
    const plainText = getTextFromHtml(content)
    
    if (!plainText.trim() || plainText.trim().length < 20) {
      alert('Please write at least 20 characters for mood analysis.')
      return
    }

    setIsAnalyzing(true)
    console.log('🧠 Starting manual mood analysis...')
    
    try {
      const analysis = await analyzeEmotionAPI(plainText)
      setCurrentAnalysis(analysis)
      
      // Save the analysis to database
      const { data: { user } } = await supabase.auth.getUser()
      if (user && (entry?.id || content.trim())) {
        const moodScore = calculateMoodScore(analysis)
        
        const entryData: any = {
          user_id: user.id,
          title: title || null,
          content: plainText, // Store plain text for backward compatibility
          content_html: content, // Store HTML content for rich text
          mood_score: moodScore,
          sentiment: analysis.label,
          emotion_data: analysis.emotions,
          emotions: analysis.emotionalThemes,
          updated_at: new Date().toISOString()
        }

        // Add audio data if available
        if (audioUrl && audioPath) {
          entryData.audio_url = audioUrl
          entryData.audio_path = audioPath
          if (voiceTranscription) {
            entryData.transcription_text = voiceTranscription
            entryData.transcription_model = process.env.NEXT_PUBLIC_OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe'
          }
        }

        // Add location data if available
        if (location) {
          entryData.location_latitude = location.latitude
          entryData.location_longitude = location.longitude
          entryData.location_address = location.address
          entryData.location_city = location.city
          entryData.location_country = location.country
          entryData.location_timezone = location.timezone
        }

        // Add cover image data if available
        if (coverImageUrl && coverImagePath) {
          entryData.cover_image_url = coverImageUrl
          entryData.cover_image_path = coverImagePath
          entryData.cover_image_public = coverImagePublic
        }

        // If this is a new entry with a custom date, set created_at
        if (!entry?.id && entryDate !== format(new Date(), 'yyyy-MM-dd')) {
          const customDate = new Date(entryDate + 'T' + format(new Date(), 'HH:mm:ss'))
          entryData.created_at = customDate.toISOString()
        }

        let result
        if (entry?.id) {
          result = await supabase
            .from('journal_entries')
            .update(entryData)
            .eq('id', entry.id)
            .select()
            .single()
        } else {
          result = await supabase
            .from('journal_entries')
            .insert(entryData)
            .select()
            .single()
        }

        if (result.error) throw result.error
        
        console.log('✅ Mood analysis saved to database')
        onSave?.(result.data)
        
        if (!entry?.id && result.data) {
          router.replace(`/journal/${result.data.id}`)
        }
      }
      
    } catch (error) {
      console.error('Manual mood analysis failed:', error)
      alert('Mood analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [content, title, entry?.id, supabase, onSave, router, location, coverImageUrl, coverImagePath, coverImagePublic])

  // Handle content changes (NO auto-analysis)
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setHasUnsavedChanges(true)
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save (30 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave()
    }, 30000)
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setHasUnsavedChanges(true)
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save (30 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave()
    }, 30000)
  }

  // Cleanup timeouts and save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      if (hasUnsavedChanges && !pendingSaveRef.current) {
        performAutoSave()
      }
    }
  }, [hasUnsavedChanges, performAutoSave])

  const handleManualSave = async () => {
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Manual save ignores cooldown
    lastAutoSaveRef.current = null
    await performAutoSave()
  }

  // Handle navigation back to dashboard with analysis
  const handleBackToDashboard = useCallback(async () => {
    console.log('🏠 Navigating back to dashboard...')
    
    // Save current content first
    if (hasUnsavedChanges) {
      await performAutoSave()
    }
    
    // Perform analysis if content exists and no analysis yet
    const plainText = getTextFromHtml(content)
    if (plainText.trim().length >= 20 && !currentAnalysis) {
      console.log('🧠 Performing analysis before leaving...')
      try {
        setIsAnalyzing(true)
        const analysis = await analyzeEmotionAPI(plainText)
        
        // Save analysis to database
        const { data: { user } } = await supabase.auth.getUser()
        if (user && (entry?.id || content.trim())) {
          const moodScore = calculateMoodScore(analysis)
          
          const entryData: any = {
            user_id: user.id,
            title: title || null,
            content: plainText, // Store plain text for backward compatibility
            content_html: content, // Store HTML content for rich text
            mood_score: moodScore,
            sentiment: analysis.label,
            emotion_data: analysis.emotions,
            emotions: analysis.emotionalThemes,
            updated_at: new Date().toISOString()
          }

          // Add location data if available
          if (location) {
            entryData.location_latitude = location.latitude
            entryData.location_longitude = location.longitude
            entryData.location_address = location.address
            entryData.location_city = location.city
            entryData.location_country = location.country
            entryData.location_timezone = location.timezone
          }

          // Add cover image data if available
          if (coverImageUrl && coverImagePath) {
            entryData.cover_image_url = coverImageUrl
            entryData.cover_image_path = coverImagePath
            entryData.cover_image_public = coverImagePublic
          }

          // If this is a new entry with a custom date, set created_at
          if (!entry?.id && entryDate !== format(new Date(), 'yyyy-MM-dd')) {
            const customDate = new Date(entryDate + 'T' + format(new Date(), 'HH:mm:ss'))
            entryData.created_at = customDate.toISOString()
          }

          if (entry?.id) {
            await supabase
              .from('journal_entries')
              .update(entryData)
              .eq('id', entry.id)
          } else {
            await supabase
              .from('journal_entries')
              .insert(entryData)
          }
        }
      } catch (error) {
        console.error('Analysis on navigation failed:', error)
      } finally {
        setIsAnalyzing(false)
      }
    }
    
    router.push('/dashboard')
  }, [hasUnsavedChanges, content, currentAnalysis, title, entry?.id, supabase, router, performAutoSave, location, coverImageUrl, coverImagePath, coverImagePublic])



  // Utility function to extract plain text from HTML
  const getTextFromHtml = (html: string): string => {
    if (typeof window === 'undefined') return html // Server-side fallback
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  // Calculate statistics from content
  const plainTextContent = getTextFromHtml(content)
  const wordCount = plainTextContent.trim().split(/\s+/).filter(word => word).length
  const readingTime = Math.ceil(wordCount / 200)

  const formatLastSaved = () => {
    if (!lastSaved) return ''
    const now = new Date()
    const diff = now.getTime() - lastSaved.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Saved just now'
    if (minutes === 1) return 'Saved 1 minute ago'
    return `Saved ${minutes} minutes ago`
  }

  const getMoodEmoji = (score?: number) => {
    if (!score) return '😐'
    if (score <= 2) return '😞'
    if (score <= 4) return '😔'
    if (score <= 6) return '😐'
    if (score <= 8) return '😊'
    return '😄'
  }

  const getMoodColorClass = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score <= 2) return 'text-red-500'
    if (score <= 4) return 'text-orange-500'
    if (score <= 6) return 'text-amber-600'
    if (score <= 8) return 'text-green-500'
    return 'text-emerald-500'
  }

  const emotionalInsights = currentAnalysis ? getEmotionalInsights(currentAnalysis) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="btn-ghost p-3"
                title="Back to Dashboard"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowLeft className="h-5 w-5" />
                )}
              </button>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Heart className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {entry?.id ? 'Edit Entry' : 'New Entry'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                {isSaving && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="h-4 w-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
                {hasUnsavedChanges && !isSaving && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <div className="h-2 w-2 rounded-full bg-amber-600" />
                    <span>Unsaved changes</span>
                  </div>
                )}
                {lastSaved && !hasUnsavedChanges && !isSaving && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Sparkles className="h-4 w-4" />
                    <span>{formatLastSaved()}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <div className="card !p-8 space-y-8">
              {/* Title Input */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-muted-foreground">
                  Entry Title (Optional)
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Give your entry a meaningful title..."
                  className="w-full border-0 bg-transparent text-3xl font-bold placeholder:text-muted-foreground/50 focus:outline-none resize-none"
                />
              </div>

              {/* Date Picker */}
              <div className="space-y-2">
                <label htmlFor="entryDate" className="text-sm font-medium text-muted-foreground">
                  Entry Date
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="entryDate"
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      max={format(new Date(), 'yyyy-MM-dd')} // Prevent future dates
                      className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      disabled={!!entry?.id} // Disable for existing entries to prevent confusion
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entryDate === format(new Date(), 'yyyy-MM-dd') ? 'Today' : format(new Date(entryDate), 'EEEE, MMM d')}
                    {entry?.id && ' (editing existing entry)'}
                  </span>
                </div>
                {entry?.id && (
                  <p className="text-xs text-amber-600">
                    Note: Date cannot be changed for existing entries
                  </p>
                )}
              </div>

              {/* Location Selector */}
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium text-muted-foreground">
                  Location (Optional)
                </label>
                <LocationSelector
                  value={location}
                  onChange={setLocation}
                  placeholder="Add location to your entry..."
                  allowCurrent={!entry?.id} // Only allow current location for new entries
                  disabled={isSaving}
                />
                {entry?.id && location && (
                  <p className="text-xs text-muted-foreground">
                    Location: {location.city && location.country ? `${location.city}, ${location.country}` : location.address}
                  </p>
                )}
              </div>

              {/* Cover Image Selector */}
              {userId && (
                <CoverImageSelector
                  currentImageUrl={coverImageUrl}
                  onImageSelect={(url, path, isPublic) => {
                    setCoverImageUrl(url)
                    setCoverImagePath(path)
                    setCoverImagePublic(isPublic)
                    setHasUnsavedChanges(true)
                  }}
                  userId={userId}
                />
              )}

              {/* Editor */}
              <div className="relative space-y-2">
                <label htmlFor="content" className="text-sm font-medium text-muted-foreground">
                  Your thoughts and feelings
                </label>
                <RichTextEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder="How are you feeling today? Share your thoughts, experiences, emotions, or anything on your mind. Write at least 20 characters to enable mood analysis..."
                  disabled={isSaving}
                />
              </div>

              {/* Statistics */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-blue-500" />
                    {plainTextContent.length} characters
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-emerald-500" />
                    {wordCount} words
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-amber-500" />
                    ~{readingTime} min read
                  </span>
                </div>
                
                {/* Mobile save status */}
                <div className="sm:hidden text-xs">
                  {isSaving && <span className="text-blue-600">Saving...</span>}
                  {hasUnsavedChanges && !isSaving && <span className="text-amber-600">Unsaved</span>}
                  {lastSaved && !hasUnsavedChanges && !isSaving && <span className="text-emerald-600">Saved</span>}
                </div>
              </div>

              {/* Voice Recorder */}
              {showVoiceRecorder && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-primary" />
                      Voice Recording
                    </h3>
                    <button
                      onClick={() => setShowVoiceRecorder(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <VoiceRecorder
                    onTranscriptionComplete={handleVoiceTranscription}
                    onError={handleVoiceError}
                    disabled={isSaving || isAnalyzing}
                  />
                </div>
              )}

              {/* Voice Recording Toggle */}
              {!showVoiceRecorder && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowVoiceRecorder(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200"
                  >
                    <Volume2 className="h-4 w-4" />
                    Add Voice Recording
                  </button>
                </div>
              )}

              {/* Existing Audio Display */}
              {audioUrl && !showVoiceRecorder && (
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-primary" />
                      Voice Recording
                    </h4>
                    {entry?.transcription_text && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        Transcribed
                      </span>
                    )}
                  </div>
                  
                  <audio 
                    controls 
                    src={audioUrl}
                    className="w-full mb-3"
                    preload="metadata"
                  >
                    Your browser does not support audio playback.
                  </audio>
                  
                  {entry?.transcription_text && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Transcription:</p>
                      <p className="italic">{entry.transcription_text}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={audioUrl}
                      download={`journal-audio-${entry?.id || 'new'}.webm`}
                      className="text-xs text-primary hover:underline"
                    >
                      Download Audio
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mood Analysis Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Mood Analysis Card */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Mood Analysis</h3>
                  </div>
                  {isAnalyzing && (
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  )}
                </div>

                {/* Manual Analysis Button */}
                <div className="mb-6">
                  <button
                    onClick={performMoodAnalysis}
                    disabled={isAnalyzing || content.trim().length < 20}
                    className="btn-primary w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Analyse My Mood
                      </>
                    )}
                  </button>
                  {content.trim().length < 20 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Write at least 20 characters to enable analysis
                    </p>
                  )}
                </div>

                {currentAnalysis ? (
                  <div className="space-y-4">
                    {/* Mood Score */}
                    <div className="text-center">
                      <div className={`text-4xl ${getMoodColorClass(currentAnalysis.moodScore)}`}>
                        {getMoodEmoji(currentAnalysis.moodScore)}
                      </div>
                      <div className="mt-2">
                        <span className={`text-2xl font-bold ${getMoodColorClass(currentAnalysis.moodScore)}`}>
                          {currentAnalysis.moodScore || calculateMoodScore(currentAnalysis)}
                        </span>
                        <span className="text-muted-foreground">/10</span>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {currentAnalysis.label} • {Math.round(currentAnalysis.confidence * 100)}% confident
                      </p>
                    </div>

                    {/* Dominant Emotion */}
                    {currentAnalysis.dominantEmotion && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Dominant Emotion</p>
                        <p className="font-medium capitalize">{currentAnalysis.dominantEmotion}</p>
                      </div>
                    )}

                    {/* Emotional Themes */}
                    {currentAnalysis.emotionalThemes && currentAnalysis.emotionalThemes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Emotional Themes</p>
                        <div className="flex flex-wrap gap-2">
                          {currentAnalysis.emotionalThemes.slice(0, 3).map((theme, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs capitalize"
                            >
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Emotional Intensity */}
                    {currentAnalysis.emotionalIntensity && (
                      <div>
                        <p className="text-sm font-medium mb-2">Emotional Intensity</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${currentAnalysis.emotionalIntensity * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(currentAnalysis.emotionalIntensity * 100)}% intensity
                        </p>
                      </div>
                    )}

                    {/* Keywords */}
                    {currentAnalysis.keywords && currentAnalysis.keywords.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Key Words</p>
                        <div className="flex flex-wrap gap-1">
                          {currentAnalysis.keywords.slice(0, 5).map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                      {content.trim().length < 20 
                        ? 'Write at least 20 characters to enable mood analysis'
                        : 'Click "Analyse My Mood" to see your emotional insights'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Emotional Insights */}
              {emotionalInsights.length > 0 && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      <h3 className="font-semibold">Insights</h3>
                    </div>
                    <button
                      onClick={() => setShowInsights(!showInsights)}
                      className="btn-ghost p-1"
                    >
                      {showInsights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {showInsights && (
                    <div className="space-y-3">
                      {emotionalInsights.map((insight, index) => (
                        <div key={index} className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <p className="text-sm text-emerald-800">{insight}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Weather Card */}
              {location && (
                <WeatherCard 
                  weatherData={weatherData} 
                  loading={weatherLoading}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}