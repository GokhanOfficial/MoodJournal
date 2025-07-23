'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, Play, Pause, Upload, Loader2, Volume2 } from 'lucide-react'

interface VoiceRecorderProps {
  onTranscriptionComplete: (transcription: string, audioUrl: string, audioPath: string) => void
  onError: (error: string) => void
  disabled?: boolean
}

export default function VoiceRecorder({ onTranscriptionComplete, onError, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [hasRecording, setHasRecording] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      streamRef.current = stream
      chunksRef.current = []

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        setAudioBlob(blob)
        
        // Create audio URL for playback
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setHasRecording(true)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      onError('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const uploadAndTranscribe = async () => {
    if (!audioBlob) {
      onError('No recording available to transcribe')
      return
    }

    setIsProcessing(true)

    try {
      // Create form data
      const formData = new FormData()
      const fileName = `recording-${Date.now()}.webm`
      formData.append('audio', audioBlob, fileName)

      // Upload and transcribe
      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Transcription failed')
      }

      const result = await response.json()
      
      if (result.success) {
        onTranscriptionComplete(result.transcription, result.audioUrl, result.audioPath)
        
        // Reset state
        setAudioBlob(null)
        setHasRecording(false)
        setRecordingTime(0)
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
          setAudioUrl(null)
        }
      } else {
        throw new Error(result.error || 'Transcription failed')
      }

    } catch (error) {
      console.error('Transcription error:', error)
      onError(error instanceof Error ? error.message : 'Failed to transcribe audio')
    } finally {
      setIsProcessing(false)
    }
  }

  const discardRecording = () => {
    setAudioBlob(null)
    setHasRecording(false)
    setRecordingTime(0)
    setIsPlaying(false)
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Check if browser supports audio recording
  const isSupported = typeof navigator !== 'undefined' && 
                     navigator.mediaDevices && 
                     navigator.mediaDevices.getUserMedia

  if (!isSupported) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          Voice recording is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4 p-6 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl border border-border">
        {!hasRecording ? (
          // Recording state
          <div className="flex items-center space-x-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled || isProcessing}
              className={`relative p-4 rounded-full transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>
            
            <div className="text-center">
              <p className="text-sm font-medium">
                {isRecording ? 'Recording...' : 'Click to start recording'}
              </p>
              {isRecording && (
                <p className="text-lg font-mono text-primary">
                  {formatTime(recordingTime)}
                </p>
              )}
            </div>
          </div>
        ) : (
          // Playback and upload state
          <div className="flex items-center space-x-4">
            <button
              onClick={isPlaying ? pauseRecording : playRecording}
              disabled={disabled}
              className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 disabled:opacity-50"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            
            <div className="text-center">
              <p className="text-sm font-medium">Recording ready</p>
              <p className="text-xs text-muted-foreground">
                Duration: {formatTime(recordingTime)}
              </p>
            </div>
            
            <button
              onClick={uploadAndTranscribe}
              disabled={disabled || isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{isProcessing ? 'Transcribing...' : 'Transcribe'}</span>
            </button>
            
            <button
              onClick={discardRecording}
              disabled={disabled || isProcessing}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        )}
      </div>

      {/* Audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {!hasRecording 
            ? 'Record your thoughts and feelings. The audio will be transcribed and added to your journal entry.'
            : 'Play your recording to review, then click "Transcribe" to convert it to text.'
          }
        </p>
      </div>
    </div>
  )
}