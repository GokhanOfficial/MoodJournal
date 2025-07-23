'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Bot, Shield, Send, Loader2 } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export default function TherapistChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('therapist-chat-history')
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (error) {
        console.error('Error loading chat history:', error)
      }
    }
  }, [])

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('therapist-chat-history', JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add initial greeting when chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: ChatMessage = {
        role: 'assistant',
        content: "Hello! I'm Dr. Elena, your AI therapist. I'm here to provide emotional support and help you work through your feelings. I can see patterns from your mood tracking, and I only have access to entries from your more challenging days to respect your privacy. How are you feeling today?",
        timestamp: Date.now()
      }
      setMessages([greeting])
    }
  }, [isOpen, messages.length])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/therapist/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          chatHistory: messages
        })
      })

      console.log('🌐 Chat API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Chat API error:', errorData)
        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('✅ Chat API success:', { hasMessage: !!data.message })

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('💥 Error sending message:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment. If you're in crisis, please reach out to a mental health professional or crisis hotline immediately.",
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem('therapist-chat-history')
    // Add greeting again
    const greeting: ChatMessage = {
      role: 'assistant',
      content: "Hello! I'm Dr. Elena, your AI therapist. I'm here to provide emotional support and help you work through your feelings. How are you feeling today?",
      timestamp: Date.now()
    }
    setMessages([greeting])
  }

  if (!isOpen) {
    return (
      <div className="card">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Bot className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI Therapist - Dr. Elena</h3>
              <p className="text-sm text-muted-foreground">
                Confidential emotional support based on your mood patterns
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="btn-primary"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Start Session
          </button>
        </div>
        
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <Shield className="h-4 w-4" />
            <span>
              Privacy Protected: Dr. Elena only has access to journal entries from your low mood days. 
              All other entries remain completely private.
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Bot className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Dr. Elena - AI Therapist</h3>
              <p className="text-xs text-muted-foreground">
                Privacy protected therapy chat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded"
            >
              Clear Chat
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h4 className="font-medium mb-2">Welcome to your safe space</h4>
            <p className="text-sm text-muted-foreground">
              I'm Dr. Elena, your AI therapist. I'm here to listen and support you.
            </p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                <Bot className="h-4 w-4 text-blue-500" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <div className="h-4 w-4 rounded-full bg-primary/20" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
              <Bot className="h-4 w-4 text-blue-500" />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Dr. Elena is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share what's on your mind..."
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Shield className="h-3 w-3" />
          <span>Your privacy is protected. Only low mood entries are accessible.</span>
        </div>
      </div>
    </div>
  )
}