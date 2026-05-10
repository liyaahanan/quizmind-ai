'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SimplePDFUpload from '@/components/pdf-upload'
import { Brain, Sparkles, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function SimpleUploadPage() {
  const router = useRouter()
  const [quizTitle, setQuizTitle] = useState('')
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  console.log('🔄 SimpleUploadPage rendered')
  console.log('📝 Current quizTitle:', quizTitle)
  console.log('📊 Upload result:', uploadResult)

  const handleUploadComplete = (data: any) => {
    console.log('✅ Upload completed:', data)
    setUploadResult(data)
  }

  const handleUploadError = (error: string) => {
    console.log('❌ Upload error:', error)
    setUploadResult(null)
  }

  const saveQuizSets = async () => {
    if (!uploadResult || !quizTitle.trim()) {
      console.log('❌ Cannot save: missing data')
      return
    }

    console.log('💾 Starting save process...')
    setIsSaving(true)
    setSaveStatus('saving')
    setSaveError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('👤 User authenticated:', user.id)

      // Create the main quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quizTitle,
          professor_id: user.id,
        })
        .select('id')
        .single()

      if (quizError || !quizData) {
        console.log('❌ Quiz creation failed:', quizError)
        throw new Error('Failed to create quiz')
      }

      console.log('✅ Quiz created:', quizData.id)

      // Create quiz sets and questions
      for (const [setName, questions] of Object.entries(uploadResult.quizSets)) {
        console.log(`📝 Creating set ${setName} with ${(questions as any[]).length} questions`)

        // Create quiz set record
        const { error: setError } = await supabase
          .from('quiz_sets')
          .insert({
            quiz_id: quizData.id,
            set_name: setName as 'A' | 'B' | 'C',
          })

        if (setError) {
          console.log(`❌ Quiz set ${setName} failed:`, setError)
          throw new Error(`Failed to create quiz set ${setName}`)
        }

        // Create questions for this set
        const { error: questionsError } = await supabase
          .from('questions')
          .insert((questions as any[]).map((q: any) => ({
            quiz_id: quizData.id,
            question: q.question,
            option_a: q.optionA,
            option_b: q.optionB,
            option_c: q.optionC,
            option_d: q.optionD,
            correct_answer: q.correctAnswer,
            difficulty: q.difficulty,
          })))

        if (questionsError) {
          console.log(`❌ Questions for set ${setName} failed:`, questionsError)
          throw new Error(`Failed to create questions for set ${setName}`)
        }
      }

      console.log('✅ All quiz sets and questions saved')
      setSaveStatus('success')

      // Redirect after delay
      setTimeout(() => {
        console.log('🔄 Redirecting to dashboard')
        router.push('/professor/dashboard')
        router.refresh()
      }, 2000)

    } catch (err) {
      console.log('❌ Save error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to save quiz sets'
      setSaveError(errorMsg)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const resetAll = () => {
    console.log('🔄 Resetting everything')
    setQuizTitle('')
    setUploadResult(null)
    setSaveStatus('idle')
    setSaveError(null)
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_50%,#8b5cf633,transparent_50%),radial-gradient(circle_at_80%_80%,#06b6d433,transparent_50%),radial-gradient(circle_at_40%_20%,#f9731633,transparent_50%)]" />
      <div className="fixed inset-0 bg-black/40" />
      
      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Brain className="h-8 w-8 text-cyan-500" />
            <h1 className="text-3xl font-bold text-white">PDF Quiz Generator</h1>
          </motion.div>
          <p className="text-gray-300">
            Upload a PDF to generate anti-cheating quiz sets automatically
          </p>
        </div>

        {/* Quiz Title */}
        <div className="border border-white/10 rounded-xl p-6 bg-white/5 mb-6">
          <label className="block text-sm font-medium text-white mb-2">Quiz Title</label>
          <input
            type="text"
            value={quizTitle}
            onChange={(e) => {
              console.log('📝 Title changed:', e.target.value)
              setQuizTitle(e.target.value)
            }}
            placeholder="e.g., Chapter 5: Cellular Biology"
            className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 focus:border-cyan-500 focus:outline-none transition text-white placeholder-gray-400"
            disabled={isSaving}
          />
        </div>

        {/* PDF Upload */}
        <div className="mb-6">
          <SimplePDFUpload 
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </div>

        {/* Save Button */}
        <AnimatePresence>
          {uploadResult && quizTitle.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-white">Quiz Sets Generated!</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {Object.entries(uploadResult.quizSets).map(([setName, questions]) => (
                    <div key={setName} className="text-center">
                      <p className="text-2xl font-bold text-cyan-400">{(questions as any[]).length}</p>
                      <p className="text-sm text-gray-400">Set {setName}</p>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={saveQuizSets}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 py-3 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Quiz Sets'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Status */}
        <AnimatePresence>
          {saveStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="border border-green-500/30 bg-green-500/10 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold text-white">Quiz Saved!</p>
                  <p className="text-sm text-gray-300">Redirecting to dashboard...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {saveStatus === 'error' && saveError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="border border-red-500/30 bg-red-500/10 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-semibold text-white">Save Failed</p>
                  <p className="text-sm text-gray-300">{saveError}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-black/50 rounded text-xs text-gray-400">
            <div>Quiz Title: {quizTitle || 'Empty'}</div>
            <div>Upload Result: {uploadResult ? 'Available' : 'None'}</div>
            <div>Save Status: {saveStatus}</div>
            <div>Is Saving: {isSaving ? 'Yes' : 'No'}</div>
            <div>Save Error: {saveError || 'None'}</div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
