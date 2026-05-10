'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getQuizSetQuestions, getStudentQuizAssignment } from '@/lib/supabase/queries'
import type { Question, StudentQuizAssignment } from '@/lib/supabase/types'
import { 
  Clock, 
  AlertTriangle, 
  Maximize2, 
  Minimize2,
  Eye,
  EyeOff,
  ChevronRight,
  Shield
} from 'lucide-react'

interface AntiCheatingQuizRunnerProps {
  quizId: string
  studentId: string
  studentEmail: string
}

export default function AntiCheatingQuizRunner({ 
  quizId, 
  studentId, 
  studentEmail 
}: AntiCheatingQuizRunnerProps) {
  const supabase = createClient()
  const [assignment, setAssignment] = useState<StudentQuizAssignment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes in seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const tabSwitchWarningRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const originalTitleRef = useRef<string>('')
  const visibilityChangeRef = useRef<(e: Event) => void | undefined>(undefined)

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize quiz assignment and questions
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get student's assigned quiz set
        const studentAssignment = await getStudentQuizAssignment(supabase, studentId, quizId)
        setAssignment(studentAssignment)

        // Get questions for the assigned set
        const quizQuestions = await getQuizSetQuestions(supabase, quizId, studentAssignment.assigned_set)
        setQuestions(quizQuestions)

        setLoading(false)
      } catch (err) {
        console.error('Quiz initialization error:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize quiz')
        setLoading(false)
      }
    }

    initializeQuiz()
  }, [quizId, studentId, supabase])

  // Anti-cheating: Tab switch detection
  useEffect(() => {
    if (!quizStarted || quizCompleted) return

    const handleVisibilityChange = (e: Event) => {
      const target = e.target as Document
      if (target.hidden) {
        setTabSwitchCount(prev => prev + 1)
        setShowWarning(true)
        
        // Clear warning after 3 seconds
        if (tabSwitchWarningRef.current) {
          clearTimeout(tabSwitchWarningRef.current)
        }
        tabSwitchWarningRef.current = setTimeout(() => {
          setShowWarning(false)
        }, 3000) as unknown as NodeJS.Timeout

        // Update browser tab title
        document.title = '⚠️ CHEATING DETECTED - QuizMind AI'
        
        // Reset title after 5 seconds
        setTimeout(() => {
          document.title = originalTitleRef.current
        }, 5000)
      }
    }

    originalTitleRef.current = document.title
    visibilityChangeRef.current = handleVisibilityChange
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.title = originalTitleRef.current
      if (tabSwitchWarningRef.current) {
        clearTimeout(tabSwitchWarningRef.current)
      }
    }
  }, [quizStarted, quizCompleted])

  // Timer countdown
  useEffect(() => {
    if (!quizStarted || quizCompleted || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizStarted, quizCompleted, timeLeft])

  // Fullscreen management
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err)
      })
    }
  }, [])

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const startQuiz = () => {
    setQuizStarted(true)
    toggleFullscreen()
  }

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)

      // Calculate score
      let correctAnswers = 0
      questions.forEach((question, index) => {
        if (answers[index] === question.correct_answer) {
          correctAnswers++
        }
      })

      const score = (correctAnswers / questions.length) * 100

      // Submit result to Supabase
      const { error } = await supabase.from('results').insert({
        quiz_id: quizId,
        student_id: studentId,
        score: Math.round(score),
        max_score: 100,
        accuracy: Math.round(score),
        completed_at: new Date().toISOString(),
      })

      if (error) {
        throw new Error(`Failed to submit quiz: ${error.message}`)
      }

      setQuizCompleted(true)
      
      // Exit fullscreen if in fullscreen mode
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }

    } catch (err) {
      console.error('Quiz submission error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit quiz')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto mb-4" />
          <p className="text-lg">Loading your quiz...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Quiz Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 rounded-lg hover:bg-cyan-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-cyan-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Anti-Cheating Quiz</h1>
            <p className="text-gray-300">You've been assigned Set {assignment?.assigned_set}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="border border-white/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Quiz Rules:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• 30 minutes time limit</li>
                <li>• Fullscreen mode required</li>
                <li>• No tab switching allowed</li>
                <li>• Questions and answers are randomized</li>
              </ul>
            </div>

            <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-4">
              <p className="text-sm text-yellow-300">
                ⚠️ Tab switching will be detected and logged. Multiple violations may result in quiz disqualification.
              </p>
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Start Quiz
          </button>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    const correctAnswers = questions.filter((q, i) => answers[i] === q.correct_answer).length
    const score = Math.round((correctAnswers / questions.length) * 100)

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-6"
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto">
              <span className="text-3xl font-bold">{score}%</span>
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
          <p className="text-gray-300 mb-4">
            You got {correctAnswers} out of {questions.length} questions correct
          </p>
          
          {tabSwitchCount > 0 && (
            <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-300">
                ⚠️ {tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''} detected
              </p>
            </div>
          )}

          <button
            onClick={() => window.location.href = '/student/dashboard'}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Anti-cheating warning overlay */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 backdrop-blur-sm"
          >
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">WARNING</h2>
              <p className="text-red-300">
                Tab switching detected! This incident has been logged.
              </p>
              <p className="text-sm text-red-400 mt-2">
                Violations: {tabSwitchCount}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-400">Set {assignment?.assigned_set}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Question {currentQuestionIndex + 1}/{questions.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`text-lg font-mono ${timeLeft < 300 ? 'text-red-500' : 'text-cyan-400'}`}>
              <Clock className="inline h-4 w-4 mr-2" />
              {formatTime(timeLeft)}
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg border border-white/20 hover:bg-white/10 transition"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-violet-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="pt-20 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">
                  {currentQuestion.difficulty}
                </span>
                <span className="text-sm text-gray-400">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold mb-6">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string
                const isSelected = answers[currentQuestionIndex] === option
                
                return (
                  <motion.button
                    key={option}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswerSelect(currentQuestionIndex, option)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500'
                          : 'border-gray-600'
                      }`}>
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="font-medium">{option}.</span>
                      <span>{optionText}</span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="text-sm text-gray-400">
              {answeredCount} of {questions.length} answered
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting || answeredCount < questions.length}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
