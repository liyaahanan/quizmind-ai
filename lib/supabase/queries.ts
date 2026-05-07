import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CreateQuizPayload,
  CreateQuizSetPayload,
  LeaderboardEntry,
  GeneratedMcq,
  Quiz,
  QuizQuestion,
  Result,
  StudentQuizSummary,
} from './types'

export const fetchQuizzes = async (supabase: SupabaseClient, professorId: string) => {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id, professor_id, title, created_at, updated_at')
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Quiz[]
}

export const createQuizWithQuestion = async (
  supabase: SupabaseClient,
  payload: CreateQuizPayload
) => {
  const { professorId, professorEmail } = payload

  // First verify the user exists in auth.users by checking their session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication error: User not found in auth system')
  }

  // Check if professor already exists
  const { data: existingProfessor, error: checkError } = await supabase
    .from('professors')
    .select('id, email')
    .eq('id', professorId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
    throw new Error(`Professor check failed: ${checkError.message}`)
  }

  // Only create professor record if it doesn't exist
  if (!existingProfessor) {
    const { error: professorError } = await supabase.from('professors').insert({
      id: professorId,
      email: professorEmail,
    })

    if (professorError) {
      throw new Error(`Failed to create professor record: ${professorError.message}`)
    }
  }

  // Create the quiz
  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      title: payload.quizTitle.trim(),
      professor_id: professorId,
    })
    .select('id')
    .single()

  if (quizError) {
    throw new Error(`Quiz creation failed: ${quizError.message}`)
  }

  if (!quizData) {
    throw new Error('Quiz creation failed: No data returned')
  }

  // Create the question
  const { error: questionError } = await supabase.from('questions').insert({
    quiz_id: quizData.id,
    question: payload.question.trim(),
    option_a: payload.optionA.trim(),
    option_b: payload.optionB.trim(),
    option_c: payload.optionC.trim(),
    option_d: payload.optionD.trim(),
    correct_answer: payload.correctAnswer,
    difficulty: 'medium',
  })

  if (questionError) {
    // Clean up the quiz if question creation fails
    await supabase.from('quizzes').delete().eq('id', quizData.id)
    throw new Error(`Question creation failed: ${questionError.message}`)
  }

  return quizData.id as string
}

const mapGeneratedQuestion = (quizId: string, mcq: GeneratedMcq) => ({
  quiz_id: quizId,
  question: mcq.question,
  option_a: mcq.optionA,
  option_b: mcq.optionB,
  option_c: mcq.optionC,
  option_d: mcq.optionD,
  correct_answer: mcq.correctAnswer,
  difficulty: mcq.difficulty,
})

export const createQuizSetWithQuestions = async (
  supabase: SupabaseClient,
  payload: CreateQuizSetPayload
) => {
  const { professorId, professorEmail, quizTitle, setLabel, mcqs } = payload

  // First verify the user exists in auth.users by checking their session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Authentication error: User not found in auth system')
  }

  // Check if professor already exists
  const { data: existingProfessor, error: checkError } = await supabase
    .from('professors')
    .select('id, email')
    .eq('id', professorId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
    throw new Error(`Professor check failed: ${checkError.message}`)
  }

  // Only create professor record if it doesn't exist
  if (!existingProfessor) {
    const { error: professorError } = await supabase.from('professors').insert({
      id: professorId,
      email: professorEmail,
    })

    if (professorError) {
      throw new Error(`Failed to create professor record: ${professorError.message}`)
    }
  }

  // Create the quiz
  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      title: `${quizTitle.trim()} (Set ${setLabel})`,
      professor_id: professorId,
    })
    .select('id')
    .single()

  if (quizError) {
    throw new Error(`Quiz creation failed: ${quizError.message}`)
  }

  if (!quizData) {
    throw new Error('Quiz creation failed: No data returned')
  }

  // Create the questions
  const { error: questionsError } = await supabase
    .from('questions')
    .insert(mcqs.map((mcq) => mapGeneratedQuestion(quizData.id, mcq)))

  if (questionsError) {
    // Clean up the quiz if question creation fails
    await supabase.from('quizzes').delete().eq('id', quizData.id)
    throw new Error(`Questions creation failed: ${questionsError.message}`)
  }

  return quizData.id as string
}

export const fetchResults = async (supabase: SupabaseClient, professorId: string) => {
  const { data, error } = await supabase
    .from('results')
    .select('id, quiz_id, student_id, score, max_score, accuracy, completed_at, created_at, updated_at, quizzes!inner(professor_id)')
    .eq('quizzes.professor_id', professorId)

  if (error) throw error

  return ((data ?? []).map(({ quizzes: _ignored, ...result }) => result) as unknown[]) as Result[]
}

type LeaderboardRow = {
  student_id: string
  score: number
  students: { full_name: string | null } | null
}

export const fetchLeaderboard = async (
  supabase: SupabaseClient,
  professorId: string,
  limit = 5
) => {
  const { data, error } = await supabase
    .from('results')
    .select('student_id, score, students(full_name), quizzes!inner(professor_id)')
    .eq('quizzes.professor_id', professorId)

  if (error) throw error

  const totals = new Map<string, { total: number; count: number; name: string }>()

  ;((data ?? []) as unknown as LeaderboardRow[]).forEach((row) => {
    const existing = totals.get(row.student_id) ?? {
      total: 0,
      count: 0,
      name: row.students?.full_name ?? 'Student',
    }
    existing.total += Number(row.score || 0)
    existing.count += 1
    totals.set(row.student_id, existing)
  })

  return [...totals.entries()]
    .map(([studentId, value]) => ({
      studentId,
      name: value.name,
      score: value.count ? Math.round(value.total / value.count) : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export const ensureStudent = async (supabase: SupabaseClient, studentId: string, email: string) => {
  const { error } = await supabase
    .from('students')
    .upsert({ id: studentId, email }, { onConflict: 'id' })

  if (error) throw error
}

export const fetchStudentDashboard = async (
  supabase: SupabaseClient,
  studentId: string
): Promise<{
  quizzes: StudentQuizSummary[]
  completedCount: number
  averageMarks: number
  leaderboardPosition: number | null
}> => {
  const { data: quizzes, error: quizzesError } = await supabase
    .from('quizzes')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })

  if (quizzesError) throw quizzesError

  const { data: results, error: resultsError } = await supabase
    .from('results')
    .select('quiz_id, score, max_score, accuracy, student_id')

  if (resultsError) throw resultsError

  const myResults = (results ?? []).filter((row) => row.student_id === studentId)
  const resultByQuiz = new Map(myResults.map((row) => [row.quiz_id, row]))

  const summaries: StudentQuizSummary[] = (quizzes ?? []).map((quiz) => {
    const result = resultByQuiz.get(quiz.id)
    return {
      id: quiz.id,
      title: quiz.title,
      created_at: quiz.created_at,
      completed: Boolean(result),
      score: result?.score ?? null,
      accuracy: result?.accuracy ?? null,
    }
  })

  const completedCount = myResults.length
  const averageMarks = completedCount
    ? Math.round(
        myResults.reduce((acc, row) => acc + (row.max_score ? (Number(row.score) / Number(row.max_score)) * 100 : 0), 0) /
          completedCount
      )
    : 0

  const grouped = new Map<string, { total: number; count: number }>()
  ;(results ?? []).forEach((row) => {
    const current = grouped.get(row.student_id) ?? { total: 0, count: 0 }
    current.total += row.max_score ? (Number(row.score) / Number(row.max_score)) * 100 : 0
    current.count += 1
    grouped.set(row.student_id, current)
  })

  const ranking = [...grouped.entries()]
    .map(([id, v]) => ({ studentId: id, score: v.count ? v.total / v.count : 0 }))
    .sort((a, b) => b.score - a.score)

  const position = ranking.findIndex((row) => row.studentId === studentId)

  return {
    quizzes: summaries,
    completedCount,
    averageMarks,
    leaderboardPosition: position >= 0 ? position + 1 : null,
  }
}

export const fetchQuizQuestions = async (supabase: SupabaseClient, quizId: string) => {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('id, title')
    .eq('id', quizId)
    .single()
  if (quizError) throw quizError

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, difficulty')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true })
  if (questionsError) throw questionsError

  return { quiz, questions: (questions ?? []) as QuizQuestion[] }
}

export const submitQuizAttempt = async (
  supabase: SupabaseClient,
  studentId: string,
  quizId: string,
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>,
  questions: QuizQuestion[]
) => {
  const { data: existing, error: existingError } = await supabase
    .from('results')
    .select('id')
    .eq('student_id', studentId)
    .eq('quiz_id', quizId)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) throw new Error('You already submitted this quiz.')

  const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length
  const total = questions.length
  const accuracy = total ? Number(((correct / total) * 100).toFixed(2)) : 0

  const { data, error } = await supabase
    .from('results')
    .insert({
      quiz_id: quizId,
      student_id: studentId,
      score: correct,
      max_score: total,
      accuracy,
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) throw error ?? new Error('Failed to save result.')
  return { resultId: data.id as string, correct, total, accuracy }
}

export const fetchResultDetails = async (
  supabase: SupabaseClient,
  resultId: string,
  studentId: string
) => {
  const { data: result, error: resultError } = await supabase
    .from('results')
    .select('id, quiz_id, student_id, score, max_score, accuracy, completed_at, created_at')
    .eq('id', resultId)
    .eq('student_id', studentId)
    .single()
  if (resultError) throw resultError

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('id, title')
    .eq('id', result.quiz_id)
    .single()
  if (quizError) throw quizError

  const { data: allQuizResults, error: allQuizResultsError } = await supabase
    .from('results')
    .select('student_id, accuracy')
    .eq('quiz_id', result.quiz_id)
  if (allQuizResultsError) throw allQuizResultsError

  const ranking = (allQuizResults ?? [])
    .map((row) => ({ student_id: row.student_id, accuracy: Number(row.accuracy ?? 0) }))
    .sort((a, b) => b.accuracy - a.accuracy)
  const rank = ranking.findIndex((row) => row.student_id === studentId)

  return {
    result: result as Result,
    quizTitle: quiz.title as string,
    rank: rank >= 0 ? rank + 1 : null,
    participants: ranking.length,
  }
}
