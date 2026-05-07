'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuizRunner, useSubmitQuiz } from '@/lib/hooks/use-quizmind-data'

type Props = {
  quizId: string
  studentId: string
  studentEmail: string
}

export default function QuizRunner({ quizId, studentId, studentEmail }: Props) {
  const router = useRouter()
  const { quizTitle, questions, loading } = useQuizRunner(quizId)
  const { submit, loading: submitting, error } = useSubmitQuiz()
  const [index, setIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(20 * 60)
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [warning, setWarning] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (secondsLeft === 0 && questions.length) {
      void handleSubmit()
    }
  }, [secondsLeft, questions.length])

  useEffect(() => {
    const onCopy = (event: ClipboardEvent) => {
      event.preventDefault()
      setWarning('Copy is disabled during quiz attempts.')
      setTimeout(() => setWarning(''), 2500)
    }
    document.addEventListener('copy', onCopy)
    return () => document.removeEventListener('copy', onCopy)
  }, [])

  const progress = useMemo(
    () => (questions.length ? Math.round(((index + 1) / questions.length) * 100) : 0),
    [index, questions.length]
  )

  const current = questions[index]
  const optionLabel = (option: 'A' | 'B' | 'C' | 'D') => {
    if (option === 'A') return current.option_a
    if (option === 'B') return current.option_b
    if (option === 'C') return current.option_c
    return current.option_d
  }
  const formatTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`

  const handleSubmit = async () => {
    try {
      const result = await submit(studentId, studentEmail, quizId, answers, questions)
      router.replace(`/results/${result.resultId}`)
      router.refresh()
    } catch {
      // hook already provides user-facing error
    }
  }

  const goFullscreen = async () => {
    if (document.fullscreenElement) return
    await document.documentElement.requestFullscreen()
  }

  if (loading) {
    return <main className="min-h-screen bg-[#05060a] p-6 text-white">Loading quiz...</main>
  }

  if (!questions.length) {
    return <main className="min-h-screen bg-[#05060a] p-6 text-white">No questions found.</main>
  }

  return (
    <main className="min-h-screen bg-[#05060a] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">{quizTitle}</h1>
            <div className="flex items-center gap-3">
              <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-sm">
                {formatTime}
              </span>
              <button onClick={goFullscreen} className="rounded-lg bg-violet-600 px-3 py-1 text-sm">
                Fullscreen
              </button>
            </div>
          </div>
          <div className="mt-3 h-2 rounded bg-white/10">
            <motion.div className="h-2 rounded bg-cyan-400" animate={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p className="mb-4 text-sm text-gray-400">
              Question {index + 1} of {questions.length}
            </p>
            <h2 className="mb-4 text-lg font-medium">{current.question}</h2>
            <div className="space-y-2">
              {(['A', 'B', 'C', 'D'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: option }))}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    answers[current.id] === option
                      ? 'border-cyan-300 bg-cyan-500/15'
                      : 'border-white/15 bg-black/20 hover:bg-black/35'
                  }`}
                >
                  {option}. {optionLabel(option)}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="rounded-lg border border-white/15 px-4 py-2"
              >
                Previous
              </button>
              <button
                onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="rounded-lg border border-white/15 px-4 py-2"
              >
                Next
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 disabled:opacity-60"
              >
                Submit
              </button>
            </div>
            {warning ? <p className="mt-3 text-sm text-amber-300">{warning}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <h3 className="mb-3 text-sm text-gray-300">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setIndex(i)}
                  className={`rounded py-1 text-sm ${
                    i === index
                      ? 'bg-cyan-500 text-black'
                      : answers[q.id]
                        ? 'bg-violet-600/70'
                        : 'bg-white/10'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
