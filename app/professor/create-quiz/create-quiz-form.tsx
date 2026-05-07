'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCreateQuiz } from '@/lib/hooks/use-quizmind-data'

type CorrectAnswer = 'A' | 'B' | 'C' | 'D'

const INITIAL_FORM = {
  quizTitle: '',
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A' as CorrectAnswer,
}

export default function CreateQuizForm() {
  const router = useRouter()
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { createQuiz, loading: isSubmitting } = useCreateQuiz()

  const isFormValid = useMemo(() => {
    return (
      formData.quizTitle.trim().length >= 3 &&
      formData.question.trim().length >= 5 &&
      formData.optionA.trim().length > 0 &&
      formData.optionB.trim().length > 0 &&
      formData.optionC.trim().length > 0 &&
      formData.optionD.trim().length > 0
    )
  }, [formData])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!isFormValid) {
      setErrorMessage('Please complete all fields with valid values.')
      return
    }

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        throw new Error('You must be logged in as a professor to create quizzes.')
      }

      await createQuiz({
        professorId: user.id,
        professorEmail: user.email,
        quizTitle: formData.quizTitle.trim(),
        question: formData.question.trim(),
        optionA: formData.optionA.trim(),
        optionB: formData.optionB.trim(),
        optionC: formData.optionC.trim(),
        optionD: formData.optionD.trim(),
        correctAnswer: formData.correctAnswer,
      })

      setSuccessMessage('Quiz created successfully. Redirecting to dashboard...')
      setTimeout(() => {
        router.replace('/professor/dashboard')
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error('Quiz creation error:', error)
      const message = error instanceof Error ? error.message : 'Failed to create quiz.'
      setErrorMessage(message)
    }
  }

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-gray-800 bg-gray-950/90 p-4 shadow-xl sm:p-6">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Create Quiz</h1>
      <p className="mt-2 text-sm text-gray-400">
        Add one question with four options and choose the correct answer.
      </p>

      <form className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm text-gray-300">Quiz title</span>
          <input
            type="text"
            value={formData.quizTitle}
            onChange={(e) => setFormData((prev) => ({ ...prev, quizTitle: e.target.value }))}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none ring-blue-500 transition focus:ring-2"
            placeholder="Midterm Review"
            required
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm text-gray-300">Question</span>
          <textarea
            value={formData.question}
            onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
            className="min-h-28 w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none ring-blue-500 transition focus:ring-2"
            placeholder="What is the capital of France?"
            required
          />
        </label>

        <label>
          <span className="mb-1 block text-sm text-gray-300">Option A</span>
          <input
            type="text"
            value={formData.optionA}
            onChange={(e) => setFormData((prev) => ({ ...prev, optionA: e.target.value }))}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none ring-blue-500 transition focus:ring-2"
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-sm text-gray-300">Option B</span>
          <input
            type="text"
            value={formData.optionB}
            onChange={(e) => setFormData((prev) => ({ ...prev, optionB: e.target.value }))}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none ring-blue-500 transition focus:ring-2"
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-sm text-gray-300">Option C</span>
          <input
            type="text"
            value={formData.optionC}
            onChange={(e) => setFormData((prev) => ({ ...prev, optionC: e.target.value }))}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none ring-blue-500 transition focus:ring-2"
            required
          />
        </label>
        <label>
          <span className="mb-1 block text-sm text-gray-300">Option D</span>
          <input
            type="text"
            value={formData.optionD}
            onChange={(e) => setFormData((prev) => ({ ...prev, optionD: e.target.value }))}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none ring-blue-500 transition focus:ring-2"
            required
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm text-gray-300">Correct answer</span>
          <select
            value={formData.correctAnswer}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                correctAnswer: e.target.value as CorrectAnswer,
              }))
            }
            className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none ring-blue-500 transition focus:ring-2"
          >
            <option value="A">Option A</option>
            <option value="B">Option B</option>
            <option value="C">Option C</option>
            <option value="D">Option D</option>
          </select>
        </label>

        <div className="sm:col-span-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating quiz...' : 'Create Quiz'}
          </button>

          {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
          {successMessage ? <p className="text-sm text-green-400">{successMessage}</p> : null}
        </div>
      </form>
    </div>
  )
}
