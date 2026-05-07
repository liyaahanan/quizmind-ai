'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCreateQuizSet } from '@/lib/hooks/use-quizmind-data'
import type { GeneratedMcq } from '@/lib/supabase/types'

type Props = {
  professorId: string
  email: string
}

const emptyMcq: GeneratedMcq = {
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  difficulty: 'medium',
}

export default function AiGenerateShell({ professorId, email }: Props) {
  const router = useRouter()
  const { createQuizSet, loading: saving } = useCreateQuizSet()
  const [quizTitle, setQuizTitle] = useState('')
  const [syllabusText, setSyllabusText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [setLabel, setSetLabel] = useState<'A' | 'B' | 'C'>('A')
  const [count, setCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [mcqs, setMcqs] = useState<GeneratedMcq[]>([])

  const canSave = useMemo(
    () =>
      quizTitle.trim().length > 2 &&
      mcqs.length > 0 &&
      mcqs.every(
        (mcq) =>
          mcq.question &&
          mcq.optionA &&
          mcq.optionB &&
          mcq.optionC &&
          mcq.optionD &&
          ['A', 'B', 'C', 'D'].includes(mcq.correctAnswer)
      ),
    [quizTitle, mcqs]
  )

  const runGeneration = async () => {
    setError('')
    setGenerating(true)
    setProgress(8)

    const ticker = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 6 : p))
    }, 350)

    try {
      const formData = new FormData()
      formData.append('syllabusText', syllabusText)
      formData.append('setLabel', setLabel)
      formData.append('count', String(count))
      if (file) formData.append('file', file)

      const response = await fetch('/api/ai/generate-mcq', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'MCQ generation failed.')
      }

      setMcqs(payload.mcqs || [])
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.')
    } finally {
      clearInterval(ticker)
      setGenerating(false)
      setTimeout(() => setProgress(0), 500)
    }
  }

  const saveSet = async () => {
    try {
      setError('')
      await createQuizSet({
        professorId,
        professorEmail: email,
        quizTitle: quizTitle.trim(),
        setLabel,
        mcqs,
      })
      router.replace('/professor/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save generated set.')
    }
  }

  const updateTextField = (
    index: number,
    field: 'question' | 'optionA' | 'optionB' | 'optionC' | 'optionD',
    value: string
  ) => {
    setMcqs((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const updateCorrectAnswer = (index: number, value: 'A' | 'B' | 'C' | 'D') => {
    setMcqs((prev) => prev.map((item, i) => (i === index ? { ...item, correctAnswer: value } : item)))
  }

  const updateDifficulty = (index: number, value: 'easy' | 'medium' | 'hard') => {
    setMcqs((prev) => prev.map((item, i) => (i === index ? { ...item, difficulty: value } : item)))
  }

  return (
    <main className="min-h-screen bg-[#05060a] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <h1 className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-3xl font-bold text-transparent">
            AI MCQ Generation Studio
          </h1>
          <p className="mt-2 text-gray-300">Upload syllabus text/PDF and generate editable MCQ sets.</p>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <label className="mb-2 block text-sm text-gray-300">Quiz title</label>
            <input
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 p-3"
              placeholder="AI Generated Midterm"
            />
            <label className="mb-2 mt-4 block text-sm text-gray-300">Syllabus text</label>
            <textarea
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              className="min-h-40 w-full rounded-lg border border-white/10 bg-black/30 p-3"
              placeholder="Paste syllabus text here..."
            />
            <label className="mb-2 mt-4 block text-sm text-gray-300">Upload syllabus file (txt/pdf)</label>
            <input
              type="file"
              accept=".txt,.md,.pdf"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-white/10 bg-black/30 p-2"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="mb-2 block text-sm text-gray-300">Set</span>
                <select
                  value={setLabel}
                  onChange={(e) => setSetLabel(e.target.value as 'A' | 'B' | 'C')}
                  className="w-full rounded-lg border border-white/10 bg-black/30 p-3"
                >
                  <option value="A">Set A</option>
                  <option value="B">Set B</option>
                  <option value="C">Set C</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-gray-300">Question count</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-black/30 p-3"
                />
              </label>
            </div>

            <button
              onClick={runGeneration}
              disabled={generating}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-3 font-semibold disabled:opacity-60"
            >
              {generating ? 'Generating with AI...' : `Generate Set ${setLabel}`}
            </button>
            {progress > 0 ? (
              <div className="mt-3">
                <div className="h-2 rounded bg-white/10">
                  <motion.div
                    className="h-2 rounded bg-cyan-400"
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-300">AI generation progress: {progress}%</p>
              </div>
            ) : null}

            <button
              onClick={saveSet}
              disabled={!canSave || saving}
              className="mt-4 w-full rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving to Supabase...' : 'Save MCQ Set to Supabase'}
            </button>
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          </div>
        </section>

        <section className="space-y-4">
          {mcqs.map((mcq, index) => (
            <motion.div
              key={`mcq-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
            >
              <h3 className="mb-3 text-sm font-semibold text-cyan-300">Question {index + 1}</h3>
              <input
                value={mcq.question}
                  onChange={(e) => updateTextField(index, 'question', e.target.value)}
                className="mb-3 w-full rounded-lg border border-white/10 bg-black/30 p-3"
                placeholder="Question"
              />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {(['optionA', 'optionB', 'optionC', 'optionD'] as const).map((field) => (
                  <input
                    key={field}
                    value={mcq[field]}
                    onChange={(e) => updateTextField(index, field, e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/30 p-3"
                    placeholder={field}
                  />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <select
                  value={mcq.correctAnswer}
                  onChange={(e) =>
                    updateCorrectAnswer(index, e.target.value as 'A' | 'B' | 'C' | 'D')
                  }
                  className="rounded-lg border border-white/10 bg-black/30 p-3"
                >
                  <option value="A">Correct: A</option>
                  <option value="B">Correct: B</option>
                  <option value="C">Correct: C</option>
                  <option value="D">Correct: D</option>
                </select>
                <select
                  value={mcq.difficulty}
                  onChange={(e) =>
                    updateDifficulty(index, e.target.value as 'easy' | 'medium' | 'hard')
                  }
                  className="rounded-lg border border-white/10 bg-black/30 p-3"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </motion.div>
          ))}
          {!mcqs.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
              Generated MCQs will appear here as editable cards.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
