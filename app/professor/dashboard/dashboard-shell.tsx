'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import LogoutButton from './logout-button'
import { useLeaderboard, useQuizzes, useResults } from '@/lib/hooks/use-quizmind-data'
import type { Quiz, Result } from '@/lib/supabase/types'

type DashboardShellProps = {
  email: string
  professorId: string
}

const navItems = ['Overview', 'Analytics', 'Quizzes', 'AI Studio', 'Leaderboard']

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toPercentage = (score: number, maxScore: number) =>
  maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

const buildEngagementData = (results: Result[]) => {
  const counts = new Array(7).fill(0)
  results.forEach((result) => {
    const day = new Date(result.created_at).getDay()
    counts[day] += 1
  })
  return dayLabels.map((day, index) => ({ day, students: counts[index] }))
}

const buildScoreData = (quizzes: Quiz[], results: Result[]) => {
  return quizzes.slice(0, 6).map((quiz) => {
    const quizResults = results.filter((result) => result.quiz_id === quiz.id)
    const avg = quizResults.length
      ? Math.round(
          quizResults.reduce((acc, row) => acc + toPercentage(row.score, row.max_score), 0) /
            quizResults.length
        )
      : 0
    return { quiz: quiz.title.slice(0, 12), avg }
  })
}

export default function DashboardShell({ email, professorId }: DashboardShellProps) {
  const { data: quizzes, loading: quizzesLoading } = useQuizzes(professorId)
  const { data: results, loading: resultsLoading } = useResults(professorId)
  const { data: leaderboard, loading: leaderboardLoading } = useLeaderboard(professorId)

  const uniqueStudents = new Set(results.map((result) => result.student_id)).size
  const averageScore = results.length
    ? Math.round(
        results.reduce((acc, row) => acc + toPercentage(row.score, row.max_score), 0) / results.length
      )
    : 0
  const completionRate = results.length
    ? Math.round((results.filter((row) => row.completed_at).length / results.length) * 100)
    : 0

  const stats = [
    { label: 'Total Quizzes', value: String(quizzes.length), delta: 'Live' },
    { label: 'Active Students', value: String(uniqueStudents), delta: 'Live' },
    { label: 'Avg. Score', value: `${averageScore}%`, delta: 'Live' },
    { label: 'Completion Rate', value: `${completionRate}%`, delta: 'Live' },
  ]

  const engagementData = buildEngagementData(results)
  const scoreData = buildScoreData(quizzes, results)
  const recentQuizzes = quizzes.slice(0, 6).map((quiz) => {
    const quizResults = results.filter((result) => result.quiz_id === quiz.id)
    const avgScore = quizResults.length
      ? Math.round(
          quizResults.reduce((acc, row) => acc + toPercentage(row.score, row.max_score), 0) /
            quizResults.length
        )
      : 0
    return {
      title: quiz.title,
      students: quizResults.length,
      avg: `${avgScore}%`,
      status: quizResults.length ? 'Published' : 'Draft',
    }
  })

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#8b5cf633,transparent_40%),radial-gradient(circle_at_bottom_left,#06b6d433,transparent_35%)]" />

      <div className="relative mx-auto flex w-full max-w-[1500px] flex-col lg:flex-row">
        <motion.aside
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="border-b border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r"
        >
          <div className="mb-6 flex items-center justify-between lg:block">
            <h1 className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-violet-400 bg-clip-text text-2xl font-bold text-transparent">
              QuizMind AI
            </h1>
            <div className="lg:hidden">
              <LogoutButton />
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {navItems.map((item, index) => (
              <motion.button
                key={item}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
              >
                {item}
              </motion.button>
            ))}
          </nav>

          <div className="mt-6 hidden lg:block">
            <LogoutButton />
          </div>
        </motion.aside>

        <main className="w-full p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
          >
            <p className="text-sm text-gray-300">Welcome back, Professor</p>
            <h2 className="mt-1 text-2xl font-semibold">{email}</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/professor/create-quiz"
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-semibold shadow-[0_0_24px_rgba(34,211,238,0.35)] transition hover:scale-[1.02]"
              >
                Create Quiz
              </Link>
              <Link
                href="/professor/ai-generate"
                className="rounded-lg border border-fuchsia-300/40 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold transition hover:bg-fuchsia-500/20"
              >
                Generate with AI
              </Link>
            </div>
          </motion.div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/40"
              >
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                <p className="mt-1 text-sm text-emerald-300">{stat.delta}</p>
              </motion.div>
            ))}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <h3 className="mb-3 font-semibold">Student Engagement</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '0.75rem',
                      }}
                    />
                    <Line type="monotone" dataKey="students" stroke="#22d3ee" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {resultsLoading ? <p className="mt-2 text-xs text-gray-400">Loading analytics...</p> : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <h3 className="mb-3 font-semibold">Quiz Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="quiz" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '0.75rem',
                      }}
                    />
                    <Bar dataKey="avg" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {quizzesLoading ? <p className="mt-2 text-xs text-gray-400">Loading performance...</p> : null}
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <h3 className="mb-4 font-semibold">Recent Quizzes</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="text-gray-300">
                    <tr>
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Students</th>
                      <th className="pb-3">Avg. Score</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentQuizzes.map((quiz) => (
                      <tr key={quiz.title} className="border-t border-white/10">
                        <td className="py-3">{quiz.title}</td>
                        <td className="py-3 text-gray-300">{quiz.students}</td>
                        <td className="py-3 text-cyan-300">{quiz.avg}</td>
                        <td className="py-3">
                          <span className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/10 px-3 py-1 text-xs">
                            {quiz.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!recentQuizzes.length ? (
                      <tr>
                        <td className="py-3 text-gray-400" colSpan={4}>
                          No quizzes yet. Create your first quiz.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <h3 className="mb-4 font-semibold">Leaderboard</h3>
              <ul className="space-y-3">
                {leaderboard.map((student, index) => (
                  <li
                    key={student.name}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  >
                    <span className="text-sm text-gray-200">
                      #{index + 1} {student.name}
                    </span>
                    <span className="font-semibold text-emerald-300">{student.score}</span>
                  </li>
                ))}
                {!leaderboard.length && !leaderboardLoading ? (
                  <li className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-400">
                    No leaderboard data yet.
                  </li>
                ) : null}
              </ul>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-5 backdrop-blur-xl">
              <h3 className="font-semibold">AI Quiz Generation</h3>
              <p className="mt-2 text-sm text-gray-300">
                Generate adaptive quizzes from lecture goals and Bloom&apos;s taxonomy levels.
              </p>
              <button className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400">
                Generate Smart Quiz
              </button>
            </div>

            <div className="rounded-2xl border border-violet-300/30 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-5 backdrop-blur-xl">
              <h3 className="font-semibold">Upload Syllabus</h3>
              <p className="mt-2 text-sm text-gray-300">
                Upload a PDF syllabus to auto-create modules, quizzes, and question banks.
              </p>
              <label className="mt-4 block cursor-pointer rounded-lg border border-dashed border-violet-300/40 bg-black/20 px-4 py-6 text-center text-sm transition hover:bg-black/35">
                Drop file or click to upload
                <input type="file" className="hidden" />
              </label>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
