import { NextResponse } from 'next/server'
import type { GeneratedMcq } from '@/lib/supabase/types'
// PDF extraction moved to client-side to avoid server-side DOM issues

export const runtime = 'nodejs'

const extractJsonArray = (raw: string) => {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start < 0 || end < 0 || end <= start) {
    throw new Error('AI response did not return JSON array.')
  }
  return raw.slice(start, end + 1)
}

const buildPrompt = (text: string, setLabel: 'A' | 'B' | 'C', count: number) => `
You are generating MCQs for university professors.
Generate ${count} multiple-choice questions for quiz set ${setLabel}.
Return ONLY JSON array with this exact shape:
[
  {
    "question": "string",
    "optionA": "string",
    "optionB": "string",
    "optionC": "string",
    "optionD": "string",
    "correctAnswer": "A|B|C|D",
    "difficulty": "easy|medium|hard"
  }
]
Syllabus content:
${text.slice(0, 12000)}
`

const callOpenAI = async (prompt: string) => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is missing.')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`OpenAI request failed: ${message}`)
  }

  const json = await response.json()
  return json.choices?.[0]?.message?.content as string
}

const callGemini = async (prompt: string) => {
  // Temporary testing fix — move back to environment variables later.
  const apiKey = 'AIzaSyAZA7iWCwTvlKib4fr4bsWivlHPOkqJ7XI'
  
  // Use hardcoded key (now real) or environment variable as fallback
  const finalApiKey = apiKey || process.env.GEMINI_API_KEY
  
  if (!finalApiKey) {
    console.error('GEMINI_API_KEY is missing. Environment variables available:', {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      AI_PROVIDER: process.env.AI_PROVIDER,
      NODE_ENV: process.env.NODE_ENV
    })
    throw new Error('GEMINI_API_KEY is missing. Please configure it in your deployment environment.')
  }

  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash-latest'
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${finalApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    if (!response.ok) {
      const message = await response.text()
      console.error('Gemini API error:', { status: response.status, message })
      throw new Error(`Gemini request failed: ${message}`)
    }

    const json = await response.json()
    const result = json.candidates?.[0]?.content?.parts?.[0]?.text as string
    
    if (!result) {
      console.error('Invalid Gemini response structure:', json)
      throw new Error('Gemini returned invalid response format')
    }
    
    return result
  } catch (error) {
    console.error('Gemini API call failed:', error)
    throw error
  }
}

const normalizeMcqs = (items: unknown[]): GeneratedMcq[] =>
  items.map((item) => {
    const row = item as Record<string, string>
    const difficulty = (row.difficulty || 'medium').toLowerCase()
    return {
      question: row.question?.trim() || '',
      optionA: row.optionA?.trim() || '',
      optionB: row.optionB?.trim() || '',
      optionC: row.optionC?.trim() || '',
      optionD: row.optionD?.trim() || '',
      correctAnswer: (row.correctAnswer || 'A') as 'A' | 'B' | 'C' | 'D',
      difficulty: (['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium') as
        | 'easy'
        | 'medium'
        | 'hard',
    }
  })

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const syllabusText = (formData.get('syllabusText') as string | null)?.trim() ?? ''
    const setLabel = ((formData.get('setLabel') as string | null) ?? 'A') as 'A' | 'B' | 'C'
    const count = Number(formData.get('count') ?? 5)
    const file = formData.get('file') as File | null

    let content = syllabusText

    if (file && file.size > 0) {
      if (file.type === 'application/pdf') {
        // PDF processing moved to client-side to avoid server-side DOM issues
        return NextResponse.json({ 
          error: 'PDF processing is now handled client-side. Please extract text from PDF and submit as text content.' 
        }, { status: 400 })
      } else {
        const text = await file.text()
        content = `${content}\n${text}`.trim()
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'Provide syllabus text or upload a file.' }, { status: 400 })
    }

    const prompt = buildPrompt(content, setLabel, Number.isFinite(count) ? Math.min(Math.max(count, 1), 20) : 5)
    
    // Enhanced provider selection with fallback logic
    let provider = (process.env.AI_PROVIDER ?? '').toLowerCase()
    
    // If no provider specified, choose based on available API keys
    if (!provider) {
      if (process.env.OPENAI_API_KEY) {
        provider = 'openai'
      } else if (process.env.GEMINI_API_KEY) {
        provider = 'gemini'
      } else {
        // Default fallback - try OpenAI first, then Gemini
        provider = 'openai'
      }
    }
    
    // Final fallback: if chosen provider doesn't have API key, switch to the other
    if (provider === 'gemini' && !process.env.GEMINI_API_KEY && process.env.OPENAI_API_KEY) {
      console.warn('Gemini API key not found, falling back to OpenAI')
      provider = 'openai'
    } else if (provider === 'openai' && !process.env.OPENAI_API_KEY && process.env.GEMINI_API_KEY) {
      console.warn('OpenAI API key not found, falling back to Gemini')
      provider = 'gemini'
    }
    
    console.log(`Using AI provider: ${provider}`)
    
    let raw: string
    try {
      if (provider === 'gemini') {
        raw = await callGemini(prompt)
      } else {
        raw = await callOpenAI(prompt)
      }
    } catch (error) {
      // If the primary provider fails, try the fallback provider
      const fallbackProvider = provider === 'gemini' ? 'openai' : 'gemini'
      const fallbackHasApiKey = fallbackProvider === 'gemini' ? 
        !!process.env.GEMINI_API_KEY : !!process.env.OPENAI_API_KEY
      
      if (fallbackHasApiKey) {
        console.warn(`${provider} failed, trying fallback: ${fallbackProvider}`)
        try {
          raw = fallbackProvider === 'gemini' ? await callGemini(prompt) : await callOpenAI(prompt)
        } catch (fallbackError) {
          console.error('Both AI providers failed')
          throw new Error(`Both AI providers failed. Primary error: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
        }
      } else {
        throw error
      }
    }
    const parsed = JSON.parse(extractJsonArray(raw))
    const mcqs = normalizeMcqs(Array.isArray(parsed) ? parsed : [])

    if (!mcqs.length) {
      return NextResponse.json({ error: 'AI did not generate valid MCQs.' }, { status: 502 })
    }

    return NextResponse.json({ mcqs })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate MCQs.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
