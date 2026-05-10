'use client'

import AIQuizGenerator from './ai-quiz-generator'

export default function CreateQuizPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">
        Create AI Quiz
      </h1>

      <AIQuizGenerator />
    </div>
  )
}
