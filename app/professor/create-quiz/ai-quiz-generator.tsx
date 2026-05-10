'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Brain,
  Sparkles,
  ChevronRight,
  X,
  BarChart3
} from 'lucide-react'

interface QuizSet {
  A: any[]
  B: any[]
  C: any[]
}

interface GenerationProgress {
  stage: 'uploading' | 'extracting' | 'generating' | 'complete' | 'error'
  progress: number
  message: string
}

export default function AIQuizGenerator() {
  console.log('🔥 AIQuizGenerator component rendered!')
  
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toasts, success, error: showError, info, removeToast } = useToast()
  const [syllabusText, setSyllabusText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<GenerationProgress>({
    stage: 'uploading',
    progress: 0,
    message: ''
  })
  const [generatedQuizSets, setGeneratedQuizSets] = useState<QuizSet | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quizTitle, setQuizTitle] = useState('')

  const handleTitleChange = (value: string) => {
    setQuizTitle(value)
    // Auto-generate when title is filled and file is selected
    if (value.trim() && selectedFile) {
      setTimeout(() => generateQuizSets(), 500)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔥 handleFileSelect() called!')
    console.log('📁 Event target:', event.target)
    console.log('📋 Files:', event.target.files)
    
    const file = event.target.files?.[0]
    console.log('📄 Selected file:', file)
    
    if (file) {
      console.log('📋 File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      })
      
      if (file.type === 'application/pdf') {
        console.log('✅ Valid PDF file selected')
        setSelectedFile(file)
        setError(null)
        success('PDF Selected', `Processing ${file.name}...`)
        
        // Auto-generate quiz sets when PDF is selected
        if (quizTitle.trim()) {
          console.log('🚀 Auto-triggering generateQuizSets()')
          await generateQuizSets()
        } else {
          console.log('⚠️ Quiz title missing, showing info message')
          info('Quiz Title Required', 'Please enter a quiz title to continue')
        }
      } else {
        console.log('❌ Invalid file type:', file.type)
        const errorMsg = 'Please select a PDF file'
        setError(errorMsg)
        showError('Invalid File', errorMsg)
        setSelectedFile(null)
      }
    } else {
      console.log('❌ No file selected')
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const generateQuizSets = async () => {
    console.log('🚀 generateQuizSets() called!')
    console.log('📝 Syllabus text length:', syllabusText.length)
    console.log('📄 Selected file:', selectedFile?.name || 'None')
    console.log('📋 Quiz title:', quizTitle)
    
    if (!syllabusText.trim() && !selectedFile) {
      console.log('❌ Missing content')
      const errorMsg = 'Please provide syllabus text or upload a PDF file'
      setError(errorMsg)
      showError('Missing Content', errorMsg)
      return
    }

    if (!quizTitle.trim()) {
      console.log('❌ Missing quiz title')
      const errorMsg = 'Please enter a quiz title'
      setError(errorMsg)
      showError('Missing Title', errorMsg)
      return
    }

    console.log('✅ All validations passed, starting generation...')
    setIsGenerating(true)
    setError(null)
    setProgress({ stage: 'uploading', progress: 0, message: 'Preparing to generate quiz sets...' })
    info('Generation Started', 'Creating anti-cheating quiz sets...')

    try {
      let extractedText = syllabusText
      
      // Extract PDF text client-side if PDF is selected
      if (selectedFile) {
        console.log('📄 Starting client-side PDF extraction...')
        setProgress({ stage: 'extracting', progress: 10, message: 'Validating PDF file...' })
        
        // Dynamic import to avoid server-side DOM issues
        const { validatePDFFile, extractChapterPDFClient } = await import('@/lib/pdf-extractor-client')
        
        // Validate PDF file
        const validation = validatePDFFile(selectedFile)
        if (!validation.valid) {
          throw new Error(validation.error)
        }
        
        console.log('✅ PDF validation passed, extracting text...')
        setProgress({ stage: 'extracting', progress: 20, message: 'Extracting text from PDF...' })
        
        // Extract text from PDF
        extractedText = await extractChapterPDFClient(
          selectedFile,
          (progress: number, status: string) => {
            console.log(`📄 PDF extraction progress: ${progress}% - ${status}`)
            setProgress({ 
              stage: 'extracting', 
              progress: 20 + (progress * 0.4), // 20-60% range for extraction
              message: status 
            })
          }
        )
        
        console.log('✅ PDF text extracted successfully, length:', extractedText.length)
        setProgress({ stage: 'generating', progress: 60, message: 'Text extracted, generating quiz sets...' })
        
        // Combine with existing syllabus text
        if (syllabusText.trim()) {
          extractedText = `${syllabusText}\n\n${extractedText}`.trim()
        }
      }

      console.log('� Creating FormData with extracted text...')
      const formData = new FormData()
      formData.append('syllabusText', extractedText)
      formData.append('count', questionCount.toString())
      // Note: No longer sending the file, only the extracted text

      console.log('📤 FormData contents:')
      formData.forEach((value, key) => {
        console.log(`  ${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value)
      })

      console.log('🌐 Sending fetch request to /api/ai/generate-quiz-sets')
      
      const response = await fetch('/api/ai/generate-quiz-sets', {
        method: 'POST',
        body: formData,
      })

      console.log('📥 Response received:', response.status, response.statusText)

      // Simulate progress updates for API generation (60-100% range)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.stage === 'generating' && prev.progress < 80) {
            return { ...prev, progress: Math.min(prev.progress + 5, 80), message: 'Generating Set A questions...' }
          } else if (prev.stage === 'generating' && prev.progress >= 80 && prev.progress < 95) {
            return { ...prev, progress: Math.min(prev.progress + 3, 95), message: 'Generating Sets B and C questions...' }
          } else if (prev.stage === 'generating' && prev.progress >= 95) {
            return { ...prev, stage: 'complete', progress: 100, message: 'Quiz sets generated successfully!' }
          }
          return prev
        })
      }, 500)

      clearInterval(progressInterval)

      if (!response.ok) {
        console.log('❌ Response not OK:', response.status)
        const errorData = await response.json()
        console.log('❌ Error data:', errorData)
        throw new Error(errorData.error || 'Failed to generate quiz sets')
      }

      console.log('✅ Parsing response JSON...')
      const data = await response.json()
      console.log('✅ Response data:', data)
      setGeneratedQuizSets(data.quizSets)
      setProgress({ stage: 'complete', progress: 100, message: 'Quiz sets generated successfully!' })
      success('Success!', `Generated ${Object.keys(data.quizSets).length} quiz sets`)

    } catch (err) {
      console.error('Quiz generation error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate quiz sets'
      setError(errorMsg)
      setProgress({ stage: 'error', progress: 0, message: 'Generation failed' })
      showError('Generation Failed', errorMsg)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveQuizSets = async () => {
    if (!generatedQuizSets || !quizTitle.trim()) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

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
        throw new Error('Failed to create quiz')
      }

      // Create quiz sets and questions
      for (const [setName, questions] of Object.entries(generatedQuizSets)) {
        // Create quiz set record
        const { error: setError } = await supabase
          .from('quiz_sets')
          .insert({
            quiz_id: quizData.id,
            set_name: setName as 'A' | 'B' | 'C',
          })

        if (setError) {
          throw new Error(`Failed to create quiz set ${setName}`)
        }

        // Create questions for this set
        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questions.map((q: any) => ({
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
          throw new Error(`Failed to create questions for set ${setName}`)
        }
      }

      // Redirect to quiz management
      success('Quiz Saved!', 'Quiz sets have been saved successfully')
      setTimeout(() => {
        router.push('/professor/dashboard')
        router.refresh()
      }, 1500)

    } catch (err) {
      console.error('Save quiz sets error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to save quiz sets'
      setError(errorMsg)
      showError('Save Failed', errorMsg)
    }
  }

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'uploading':
        return <Upload className="h-5 w-5" />
      case 'extracting':
        return <FileText className="h-5 w-5" />
      case 'generating':
        return <Brain className="h-5 w-5" />
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Loader2 className="h-5 w-5" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-cyan-500" />
          <h1 className="text-2xl font-bold">AI Quiz Generator</h1>
        </div>
        <p className="text-gray-300">
          Generate anti-cheating quiz sets with AI-powered question variations
        </p>
      </div>

      {/* Quiz Title Input */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/5">
        <label className="block text-sm font-medium mb-2">Quiz Title</label>
        <input
          type="text"
          value={quizTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., Chapter 5: Cellular Biology"
          className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/5 focus:border-cyan-500 focus:outline-none transition"
          disabled={isGenerating}
        />
      </div>

      {/* Content Input Section */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/5">
        <h2 className="text-lg font-semibold mb-4">Content Source</h2>
        
        {/* Text Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Syllabus Text</label>
          <textarea
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}
            placeholder="Paste your chapter content or syllabus here..."
            className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 focus:border-cyan-500 focus:outline-none transition resize-none h-32"
            disabled={isGenerating}
          />
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Or Upload PDF</label>
          <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-cyan-500/50 transition">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isGenerating}
            />
            
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-cyan-500" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 rounded-lg hover:bg-white/10 transition"
                  disabled={isGenerating}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF files up to 50MB</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition"
                  disabled={isGenerating}
                >
                  Select PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-sm font-medium mb-2">Questions per Set</label>
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/5 focus:border-cyan-500 focus:outline-none transition"
            disabled={isGenerating}
          >
            <option value={3}>3 questions</option>
            <option value={5}>5 questions</option>
            <option value={8}>8 questions</option>
            <option value={10}>10 questions</option>
            <option value={15}>15 questions</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-red-500/30 bg-red-500/10 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-300">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Display */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-cyan-500/30 bg-cyan-500/10 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin">
                {getStageIcon()}
              </div>
              <div className="flex-1">
                <p className="font-medium">{progress.message}</p>
                <p className="text-sm text-gray-400">
                  {progress.stage === 'generating' && 'This may take 1-2 minutes...'}
                </p>
              </div>
              <span className="text-sm font-mono">{progress.progress}%</span>
            </div>
            
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-violet-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Results */}
      <AnimatePresence>
        {generatedQuizSets && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-green-500/30 bg-green-500/10 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <h3 className="text-lg font-semibold">Quiz Sets Generated Successfully!</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.entries(generatedQuizSets).map(([setName, questions]) => (
                <div key={setName} className="border border-white/20 rounded-lg p-4 bg-white/5">
                  <h4 className="font-medium mb-2">Set {setName}</h4>
                  <p className="text-2xl font-bold text-cyan-400">{questions.length}</p>
                  <p className="text-sm text-gray-400">questions</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveQuizSets}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-600 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Save Quiz Sets
              </button>
              <button
                onClick={() => {
                  setGeneratedQuizSets(null)
                  setProgress({ stage: 'uploading', progress: 0, message: '' })
                }}
                className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition"
              >
                Generate Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button */}
      {!generatedQuizSets && !isGenerating && (
        <button
          onClick={generateQuizSets}
          disabled={!syllabusText.trim() && !selectedFile}
          className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Brain className="h-5 w-5" />
          Generate Anti-Cheating Quiz Sets
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
