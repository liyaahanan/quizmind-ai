'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ResponsiveContainer, RadialBar, RadialBarChart } from 'recharts'
import { useResultDetails } from '@/lib/hooks/use-quizmind-data'

type Props = {
  resultId: string
  studentId: string
}

export default function ResultShell({ resultId, studentId }: Props) {
  const { data, loading, error } = useResultDetails(resultId, studentId)

  const chartData = useMemo(
    () => [{ name: 'Accuracy', value: Number(data.result?.accuracy ?? 0), fill: '#22d3ee' }],
    [data.result?.accuracy]
  )

  if (loading) return <main className="min-h-screen bg-[#05060a] p-6 text-white">Loading result...</main>
  if (error || !data.result)
    return <main className="min-h-screen bg-[#05060a] p-6 text-white">{error || 'Result not found.'}</main>

  const wrong = Number(data.result.max_score) - Number(data.result.score)

  return (
    <main className="min-h-screen bg-[#05060a] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold">{data.quizTitle} - Result</h1>
          <p className="mt-2 text-gray-300">
            Score: {data.result.score}/{data.result.max_score} | Accuracy: {data.result.accuracy ?? 0}%
          </p>
          <p className="text-gray-300">
            Correct: {data.result.score} | Wrong: {wrong} | Rank: {data.rank ? `#${data.rank}` : '-'} /{' '}
            {data.participants}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <h2 className="mb-3 font-semibold">Performance Chart</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart data={chartData} innerRadius="40%" outerRadius="100%" barSize={24}>
                  <RadialBar dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <h2 className="mb-3 font-semibold">Summary</h2>
            <ul className="space-y-2 text-sm text-gray-200">
              <li>Marks secured: {data.result.score}</li>
              <li>Total questions: {data.result.max_score}</li>
              <li>Accuracy: {data.result.accuracy ?? 0}%</li>
              <li>Completed: {new Date(data.result.completed_at ?? data.result.created_at).toLocaleString()}</li>
            </ul>
            <Link href="/student/dashboard" className="mt-4 inline-block rounded bg-cyan-600 px-4 py-2">
              Back to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
