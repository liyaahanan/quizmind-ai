export type Professor = {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export type Student = {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export type Quiz = {
  id: string
  professor_id: string
  title: string
  created_at: string
  updated_at: string
}

export type Question = {
  id: string
  quiz_id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
  updated_at: string
}

export type Result = {
  id: string
  quiz_id: string
  student_id: string
  score: number
  max_score: number
  accuracy: number | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type LeaderboardEntry = {
  studentId: string
  name: string
  score: number
}

export type QuizQuestion = {
  id: string
  quiz_id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
}

export type StudentQuizSummary = {
  id: string
  title: string
  created_at: string
  completed: boolean
  score: number | null
  accuracy: number | null
}

export type CreateQuizPayload = {
  professorId: string
  professorEmail: string
  quizTitle: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: 'A' | 'B' | 'C' | 'D'
}

export type GeneratedMcq = {
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  difficulty: 'easy' | 'medium' | 'hard'
}

export type CreateQuizSetPayload = {
  professorId: string
  professorEmail: string
  quizTitle: string
  setLabel: 'A' | 'B' | 'C'
  mcqs: GeneratedMcq[]
}
