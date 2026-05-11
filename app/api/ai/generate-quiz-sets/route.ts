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

const buildAntiCheatingPrompt = (text: string, setLabel: 'A' | 'B' | 'C', count: number, previousSets?: GeneratedMcq[]) => `
You are generating MCQs for university professors with anti-cheating measures.
Generate ${count} multiple-choice questions for quiz set ${setLabel}.

CRITICAL REQUIREMENTS:
1. Cover the SAME learning objectives as other sets
2. Maintain EQUAL difficulty (mix of easy, medium, hard)
3. Use DIFFERENT questions or significantly reworded versions
4. Randomize answer options
5. Ensure academic integrity and prevent copying

${previousSets ? `
PREVIOUSLY GENERATED QUESTIONS (AVOID DUPLICATES):
${previousSets.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

AVOID:
- Exact same questions
- Same answer options in same order
- Identical question structure
` : ''}

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
      temperature: 0.7, // Higher temperature for more variety
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

 const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${finalApiKey}`,
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

const shuffleOptions = (mcq: GeneratedMcq): GeneratedMcq => {
  const options = [
    { key: 'A', text: mcq.optionA },
    { key: 'B', text: mcq.optionB },
    { key: 'C', text: mcq.optionC },
    { key: 'D', text: mcq.optionD }
  ]
  
  // Shuffle options
  const shuffled = [...options].sort(() => Math.random() - 0.5)
  
  // Find new correct answer key
  const correctOption = options.find(opt => opt.key === mcq.correctAnswer)
  const newCorrectKey = shuffled.find(opt => opt.text === correctOption?.text)?.key || 'A'
  
  return {
    ...mcq,
    optionA: shuffled[0].text,
    optionB: shuffled[1].text,
    optionC: shuffled[2].text,
    optionD: shuffled[3].text,
    correctAnswer: newCorrectKey as 'A' | 'B' | 'C' | 'D'
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const syllabusText = (formData.get('syllabusText') as string | null)?.trim() ?? ''
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

    const questionCount = Number.isFinite(count) ? Math.min(Math.max(count, 5), 20) : 5
    const quizSets: Record<string, GeneratedMcq[]> = {}
    let allPreviousQuestions: GeneratedMcq[] = []

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

    // Generate Set A
    try {
      const promptA = buildAntiCheatingPrompt(content, 'A', questionCount, allPreviousQuestions)
      
      let rawA: string
      try {
        rawA = provider === 'gemini' ? await callGemini(promptA) : await callOpenAI(promptA)
      } catch (error) {
        // Try fallback provider
        const fallbackProvider = provider === 'gemini' ? 'openai' : 'gemini'
        const fallbackHasApiKey = fallbackProvider === 'gemini' ? 
          !!process.env.GEMINI_API_KEY : !!process.env.OPENAI_API_KEY
        
        if (fallbackHasApiKey) {
          console.warn(`${provider} failed for Set A, trying fallback: ${fallbackProvider}`)
          rawA = fallbackProvider === 'gemini' ? await callGemini(promptA) : await callOpenAI(promptA)
        } else {
          throw error
        }
      }
      
      const parsedA = JSON.parse(extractJsonArray(rawA))
      const mcqsA = normalizeMcqs(Array.isArray(parsedA) ? parsedA : []).map(shuffleOptions)
      
      if (!mcqsA.length) {
        throw new Error('Failed to generate valid questions for Set A')
      }
      
      quizSets.A = mcqsA
      allPreviousQuestions = [...mcqsA]
    } catch (error) {
      throw new Error(`Failed to generate Set A: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Generate Set B
    try {
      const promptB = buildAntiCheatingPrompt(content, 'B', questionCount, allPreviousQuestions)
      
      let rawB: string
      try {
        rawB = provider === 'gemini' ? await callGemini(promptB) : await callOpenAI(promptB)
      } catch (error) {
        const fallbackProvider = provider === 'gemini' ? 'openai' : 'gemini'
        const fallbackHasApiKey = fallbackProvider === 'gemini' ? 
          !!process.env.GEMINI_API_KEY : !!process.env.OPENAI_API_KEY
        
        if (fallbackHasApiKey) {
          console.warn(`${provider} failed for Set B, trying fallback: ${fallbackProvider}`)
          rawB = fallbackProvider === 'gemini' ? await callGemini(promptB) : await callOpenAI(promptB)
        } else {
          throw error
        }
      }
      
      const parsedB = JSON.parse(extractJsonArray(rawB))
      const mcqsB = normalizeMcqs(Array.isArray(parsedB) ? parsedB : []).map(shuffleOptions)
      
      if (!mcqsB.length) {
        throw new Error('Failed to generate valid questions for Set B')
      }
      
      quizSets.B = mcqsB
      allPreviousQuestions = [...allPreviousQuestions, ...mcqsB]
    } catch (error) {
      throw new Error(`Failed to generate Set B: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Generate Set C
    try {
      const promptC = buildAntiCheatingPrompt(content, 'C', questionCount, allPreviousQuestions)
      
      let rawC: string
      try {
        rawC = provider === 'gemini' ? await callGemini(promptC) : await callOpenAI(promptC)
      } catch (error) {
        const fallbackProvider = provider === 'gemini' ? 'openai' : 'gemini'
        const fallbackHasApiKey = fallbackProvider === 'gemini' ? 
          !!process.env.GEMINI_API_KEY : !!process.env.OPENAI_API_KEY
        
        if (fallbackHasApiKey) {
          console.warn(`${provider} failed for Set C, trying fallback: ${fallbackProvider}`)
          rawC = fallbackProvider === 'gemini' ? await callGemini(promptC) : await callOpenAI(promptC)
        } else {
          throw error
        }
      }
      
      const parsedC = JSON.parse(extractJsonArray(rawC))
      const mcqsC = normalizeMcqs(Array.isArray(parsedC) ? parsedC : []).map(shuffleOptions)
      
      if (!mcqsC.length) {
        throw new Error('Failed to generate valid questions for Set C')
      }
      
      quizSets.C = mcqsC
    } catch (error) {
      throw new Error(`Failed to generate Set C: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Validate all sets have questions
    const totalQuestions = Object.values(quizSets).reduce((sum, set) => sum + set.length, 0)
    if (totalQuestions === 0) {
      return NextResponse.json({ error: 'AI did not generate valid MCQs for any set.' }, { status: 502 })
    }

    // Analyze difficulty distribution
    const difficultyAnalysis = {
      A: { easy: 0, medium: 0, hard: 0 },
      B: { easy: 0, medium: 0, hard: 0 },
      C: { easy: 0, medium: 0, hard: 0 }
    }

    Object.entries(quizSets).forEach(([setName, questions]) => {
      questions.forEach(q => {
        difficultyAnalysis[setName as keyof typeof difficultyAnalysis][q.difficulty]++
      })
    })

    return NextResponse.json({ 
      quizSets,
      analysis: {
        totalQuestions,
        questionsPerSet: Object.fromEntries(
          Object.entries(quizSets).map(([name, set]) => [name, set.length])
        ),
        difficultyDistribution: difficultyAnalysis
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate quiz sets.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
