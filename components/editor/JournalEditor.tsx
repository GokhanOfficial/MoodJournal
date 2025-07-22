'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { analyzeSentiment, calculateMoodScore } from '@/services/emotion-analysis'
import { Save, Mic, MicOff, Loader2, ArrowLeft, Heart, Sparkles } from 'lucide-react'
import type { JournalEntry } from '@/types/database'
import Link from 'next/link'

interface JournalEditorProps {
  entry?: JournalEntry
  onSave?: (entry: JournalEntry) => void
}

export default function JournalEditor({ entry, onSave }: JournalEditorProps) {
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.content || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastAutoSaveRef = useRef<Date | null>(null)
  const pendingSaveRef = useRef(false)

  // Auto-save function that uses refs to get current values
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

      let entryData: any = {
        user_id: user.id,
        title: currentTitle || null,
        content: currentContent,
        updated_at: new Date().toISOString()
      }

      if (currentContent.trim().length > 20) {
        // Analyze sentiment for substantial content
        const sentiment = await analyzeSentiment(currentContent)
        const moodScore = calculateMoodScore(sentiment)
        
        entryData.mood_score = moodScore
        entryData.sentiment = sentiment.label
        entryData.emotion_data = sentiment.emotions
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
  }, [entry?.id, supabase, onSave, router, title, content])

  // Handle content changes with debounced auto-save
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsRecording(true)
      
      // Simple recording implementation
      // In a real app, you'd use MediaRecorder API
      setTimeout(() => {
        setIsRecording(false)
        stream.getTracks().forEach(track => track.stop())
        // This would normally send audio to OpenAI Whisper API
        const newContent = content + '\n[Voice note recorded - transcription would appear here]'
        handleContentChange(newContent)
      }, 5000)
    } catch (error) {
      console.error('Recording failed:', error)
    }
  }

  const formatLastSaved = () => {
    if (!lastSaved) return ''
    const now = new Date()
    const diff = now.getTime() - lastSaved.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Saved just now'
    if (minutes === 1) return 'Saved 1 minute ago'
    return `Saved ${minutes} minutes ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="btn-ghost p-3"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
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

          {/* Editor */}
          <div className="relative space-y-2">
            <label htmlFor="content" className="text-sm font-medium text-muted-foreground">
              Your thoughts and feelings
            </label>
            <div className="relative">
              <textarea
                id="content"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="How are you feeling today? Share your thoughts, experiences, emotions, or anything on your mind. The more you write, the better insights you'll receive..."
                className="min-h-[500px] w-full resize-none border-0 bg-transparent text-base leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none"
                autoFocus
              />
              
              {/* Voice input button */}
              <button
                onClick={startRecording}
                disabled={isRecording}
                className={`absolute bottom-4 right-4 rounded-full p-4 transition-all duration-200 shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 text-white scale-110' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
                }`}
                title={isRecording ? 'Recording...' : 'Record voice note'}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-blue-500" />
                {content.length} characters
              </span>
              <span className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                {content.trim().split(/\s+/).filter(word => word).length} words
              </span>
              <span className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-amber-500" />
                ~{Math.ceil(content.trim().split(/\s+/).filter(word => word).length / 200)} min read
              </span>
            </div>
            
            {/* Mobile save status */}
            <div className="sm:hidden text-xs">
              {isSaving && <span className="text-blue-600">Saving...</span>}
              {hasUnsavedChanges && !isSaving && <span className="text-amber-600">Unsaved</span>}
              {lastSaved && !hasUnsavedChanges && !isSaving && <span className="text-emerald-600">Saved</span>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}