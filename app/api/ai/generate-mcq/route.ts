import { NextResponse } from 'next/server'
import * as pdfParse from 'pdf-parse'
import type { GeneratedMcq } from '@/lib/supabase/types'

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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing.')

  const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
    throw new Error(`Gemini request failed: ${message}`)
  }

  const json = await response.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text as string
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
        const buffer = Buffer.from(await file.arrayBuffer())
        const parsed = await pdfParse(buffer)
        content = `${content}\n${parsed.text}`.trim()
      } else {
        const text = await file.text()
        content = `${content}\n${text}`.trim()
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'Provide syllabus text or upload a file.' }, { status: 400 })
    }

    const prompt = buildPrompt(content, setLabel, Number.isFinite(count) ? Math.min(Math.max(count, 1), 20) : 5)
    const provider = (process.env.AI_PROVIDER ?? (process.env.OPENAI_API_KEY ? 'openai' : 'gemini')).toLowerCase()
    const raw = provider === 'gemini' ? await callGemini(prompt) : await callOpenAI(prompt)
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
