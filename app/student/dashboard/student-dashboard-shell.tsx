'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useStudentDashboard } from '@/lib/hooks/use-quizmind-data'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Trophy, Target, BookOpen, TrendingUp } from 'lucide-react'
import { useState } from 'react'

type Props = {
  studentId: string
  email: string
}

export default function StudentDashboardShell({ studentId, email }: Props) {
  const { data, loading } = useStudentDashboard(studentId)
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const assigned = data.quizzes.filter((q) => !q.completed)
  const completed = data.quizzes.filter((q) => q.completed)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace('/login/student')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_50%,#8b5cf633,transparent_50%),radial-gradient(circle_at_80%_80%,#06b6d433,transparent_50%),radial-gradient(circle_at_40%_20%,#f9731633,transparent_50%)]" />
      <div className="fixed inset-0 bg-black/40" />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600" />
          <span className="text-xl font-bold">QuizMind AI</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <span className="text-sm text-gray-300">{email}</span>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/10 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </motion.div>
      </nav>

      <main className="relative z-10 px-6 py-8 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <h1 className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-violet-400 bg-clip-text text-4xl font-bold text-transparent">
              Student Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-300">Welcome back! Track your progress and take quizzes.</p>
          </motion.section>

          {/* Stats Cards */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { label: 'Assigned Quizzes', value: String(assigned.length), icon: BookOpen, color: 'from-cyan-500 to-blue-600' },
              { label: 'Completed Quizzes', value: String(data.completedCount), icon: Trophy, color: 'from-emerald-500 to-teal-600' },
              { label: 'Average Marks', value: `${data.averageMarks}%`, icon: Target, color: 'from-violet-500 to-purple-600' },
              { label: 'Leaderboard Position', value: data.leaderboardPosition ? `#${data.leaderboardPosition}` : '-', icon: TrendingUp, color: 'from-orange-500 to-red-600' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ y: -2 }}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all hover:border-cyan-500/30"
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </motion.section>

          {/* Quizzes Sections */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          >
            {/* Assigned Quizzes */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan-400" />
                Assigned Quizzes
              </h2>
              <div className="space-y-3">
                {assigned.map((quiz) => (
                  <motion.div
                    key={quiz.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Link
                      href={`/quiz/${quiz.id}`}
                      className="flex items-center justify-between rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4 transition-all hover:bg-cyan-500/10 hover:border-cyan-400/40"
                    >
                      <div>
                        <span className="font-medium text-white">{quiz.title}</span>
                        <p className="text-xs text-gray-400 mt-1">Click to start</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-cyan-300 font-medium">Start</span>
                        <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
                {!loading && !assigned.length ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No assigned quizzes available.</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Completed Quizzes */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-emerald-400" />
                Completed Quizzes
              </h2>
              <div className="space-y-3">
                {completed.map((quiz) => (
                  <motion.div
                    key={quiz.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4"
                  >
                    <div>
                      <span className="font-medium text-white">{quiz.title}</span>
                      <p className="text-xs text-gray-400 mt-1">Completed</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-300">{quiz.accuracy ?? 0}%</span>
                      <p className="text-xs text-gray-400">Score</p>
                    </div>
                  </motion.div>
                ))}
                {!loading && !completed.length ? (
                  <div className="text-center py-8">
                    <Trophy className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No completed quizzes yet.</p>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  )
}
