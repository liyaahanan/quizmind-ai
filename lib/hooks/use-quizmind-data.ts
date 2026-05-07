'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  createQuizSetWithQuestions,
  createQuizWithQuestion,
  ensureStudent,
  fetchLeaderboard,
  fetchQuizQuestions,
  fetchResultDetails,
  fetchQuizzes,
  fetchResults,
  fetchStudentDashboard,
  submitQuizAttempt,
} from '@/lib/supabase/queries'
import type {
  CreateQuizSetPayload,
  CreateQuizPayload,
  LeaderboardEntry,
  Quiz,
  QuizQuestion,
  Result,
  StudentQuizSummary,
} from '@/lib/supabase/types'

export const useQuizzes = (professorId: string) => {
  const [data, setData] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const quizzes = await fetchQuizzes(supabase, professorId)
      setData(quizzes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quizzes.')
    } finally {
      setLoading(false)
    }
  }, [professorId])

  useEffect(() => {
    if (!professorId) return
    void reload()
  }, [professorId, reload])

  return { data, loading, error, reload }
}

export const useResults = (professorId: string) => {
  const [data, setData] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const results = await fetchResults(supabase, professorId)
      setData(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results.')
    } finally {
      setLoading(false)
    }
  }, [professorId])

  useEffect(() => {
    if (!professorId) return
    void reload()
  }, [professorId, reload])

  return { data, loading, error, reload }
}

export const useLeaderboard = (professorId: string) => {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const leaderboard = await fetchLeaderboard(supabase, professorId)
      setData(leaderboard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard.')
    } finally {
      setLoading(false)
    }
  }, [professorId])

  useEffect(() => {
    if (!professorId) return
    void reload()
  }, [professorId, reload])

  return { data, loading, error, reload }
}

export const useCreateQuiz = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createQuiz = useCallback(async (payload: CreateQuizPayload) => {
    try {
      setLoading(true)
      setError('')
      console.log('Creating quiz with payload:', payload)
      const supabase = createClient()
      const result = await createQuizWithQuestion(supabase, payload)
      console.log('Quiz created successfully:', result)
      return result
    } catch (err) {
      console.error('useCreateQuiz error:', err)
      const message = err instanceof Error ? err.message : 'Failed to create quiz.'
      setError(message)
      throw err // Re-throw the original error, not a new one
    } finally {
      setLoading(false)
    }
  }, [])

  return { createQuiz, loading, error }
}

export const useCreateQuizSet = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createQuizSet = useCallback(async (payload: CreateQuizSetPayload) => {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      return await createQuizSetWithQuestions(supabase, payload)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create quiz set.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { createQuizSet, loading, error }
}

export const useStudentDashboard = (studentId: string) => {
  const [data, setData] = useState<{
    quizzes: StudentQuizSummary[]
    completedCount: number
    averageMarks: number
    leaderboardPosition: number | null
  }>({ quizzes: [], completedCount: 0, averageMarks: 0, leaderboardPosition: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const snapshot = await fetchStudentDashboard(supabase, studentId)
      setData(snapshot)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    if (!studentId) return
    void reload()
  }, [studentId, reload])

  return { data, loading, error, reload }
}

export const useQuizRunner = (quizId: string) => {
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const response = await fetchQuizQuestions(supabase, quizId)
      setQuizTitle(response.quiz.title)
      setQuestions(response.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz.')
    } finally {
      setLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    if (!quizId) return
    void load()
  }, [quizId, load])

  return { quizTitle, questions, loading, error, reload: load }
}

export const useSubmitQuiz = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = useCallback(
    async (
      studentId: string,
      studentEmail: string,
      quizId: string,
      answers: Record<string, 'A' | 'B' | 'C' | 'D'>,
      questions: QuizQuestion[]
    ) => {
      try {
        setLoading(true)
        setError('')
        const supabase = createClient()
        await ensureStudent(supabase, studentId, studentEmail)
        return await submitQuizAttempt(supabase, studentId, quizId, answers, questions)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit quiz.'
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { submit, loading, error }
}

export const useResultDetails = (resultId: string, studentId: string) => {
  const [data, setData] = useState<{
    result: Result | null
    quizTitle: string
    rank: number | null
    participants: number
  }>({ result: null, quizTitle: '', rank: null, participants: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const response = await fetchResultDetails(supabase, resultId, studentId)
      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load result details.')
    } finally {
      setLoading(false)
    }
  }, [resultId, studentId])

  useEffect(() => {
    if (!resultId || !studentId) return
    void load()
  }, [resultId, studentId, load])

  return { data, loading, error, reload: load }
}
