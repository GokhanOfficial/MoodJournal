export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface TranscriptionResponse {
  text: string
}

export class OpenAIClient {
  private baseURL: string
  private apiKey: string

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    
    this.baseURL = baseURL
    this.apiKey = apiKey
  }

  async chatCompletion(
    messages: OpenAIMessage[],
    model: string = process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: number = 0.7
  ): Promise<OpenAIResponse> {
    console.log('🤖 OpenAI API call:', { model, messageCount: messages.length })

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens: 1000,
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('📡 API Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error Response:', errorText)
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ API Success - Model used:', result.model, 'Tokens:', result.usage?.total_tokens)
    return result
  }

  async transcribeAudio(audioFile: File): Promise<TranscriptionResponse> {
    const formData = new FormData()
    formData.append('file', audioFile)
    formData.append('model', 'whisper-1')

    const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`OpenAI Transcription error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

// Function to create client instance (not at module level)
export function createOpenAIClient(): OpenAIClient {
  return new OpenAIClient()
}