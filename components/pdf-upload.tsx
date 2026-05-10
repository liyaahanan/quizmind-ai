'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'

interface SimplePDFUploadProps {
  onUploadComplete?: (data: any) => void
  onUploadError?: (error: string) => void
}

export default function SimplePDFUpload({ onUploadComplete, onUploadError }: SimplePDFUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    console.log('🔥 File input onChange triggered!')
    
    const file = event.target.files?.[0]
    console.log('📁 Selected file:', file)
    
    if (!file) {
      console.log('❌ No file selected')
      return
    }

    console.log('📋 File type:', file.type)
    console.log('📏 File size:', file.size)

    if (file.type !== 'application/pdf') {
      console.log('❌ Invalid file type')
      setErrorMessage('Please select a PDF file')
      setUploadStatus('error')
      onUploadError?.('Please select a PDF file')
      return
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      console.log('❌ File too large')
      setErrorMessage('PDF file must be smaller than 50MB')
      setUploadStatus('error')
      onUploadError?.('PDF file must be smaller than 50MB')
      return
    }

    console.log('✅ File validation passed')
    setSelectedFile(file)
    setErrorMessage(null)
    setUploadStatus('uploading')
    
    // Immediately trigger upload
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    console.log('🚀 Starting file upload...')
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('syllabusText', '') // Empty text, using PDF only
      formData.append('count', '5') // Default 5 questions
      formData.append('file', file)

      console.log('📤 Sending request to /api/ai/generate-quiz-sets')
      console.log('📦 FormData contents:')
      formData.forEach((value, key) => {
        console.log(`  ${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value)
      })

      const response = await fetch('/api/ai/generate-quiz-sets', {
        method: 'POST',
        body: formData,
      })

      console.log('📥 Response received:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ Upload failed:', errorData)
        throw new Error(errorData.error || 'Failed to generate quiz sets')
      }

      const data = await response.json()
      console.log('✅ Upload successful:', data)
      
      setUploadStatus('success')
      setIsUploading(false)
      onUploadComplete?.(data)

    } catch (error) {
      console.log('❌ Upload error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload PDF'
      setErrorMessage(errorMsg)
      setUploadStatus('error')
      setIsUploading(false)
      onUploadError?.(errorMsg)
    }
  }

  const resetUpload = () => {
    console.log('🔄 Resetting upload')
    setSelectedFile(null)
    setUploadStatus('idle')
    setErrorMessage(null)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileSelect = () => {
    console.log('🖱️ Triggering file selection')
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {!selectedFile ? (
        <div
          onClick={triggerFileSelect}
          className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Upload PDF</h3>
          <p className="text-sm text-gray-400 mb-4">
            Click to select or drag and drop
          </p>
          <p className="text-xs text-gray-500">PDF files up to 50MB</p>
        </div>
      ) : (
        <div className="border border-white/20 rounded-lg p-4 bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {uploadStatus === 'success' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : uploadStatus === 'error' ? (
                <AlertCircle className="h-8 w-8 text-red-500" />
              ) : (
                <FileText className="h-8 w-8 text-cyan-500" />
              )}
              <div>
                <p className="font-medium text-white">{selectedFile.name}</p>
                <p className="text-sm text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              disabled={isUploading}
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {isUploading && (
            <div className="flex items-center gap-3 py-3">
              <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
              <span className="text-sm text-gray-300">Processing PDF...</span>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="py-3">
              <p className="text-sm text-green-400">✅ Quiz sets generated successfully!</p>
            </div>
          )}

          {uploadStatus === 'error' && errorMessage && (
            <div className="py-3">
              <p className="text-sm text-red-400">❌ {errorMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-black/50 rounded text-xs text-gray-400">
          <div>Status: {uploadStatus}</div>
          <div>Uploading: {isUploading ? 'Yes' : 'No'}</div>
          <div>File: {selectedFile ? selectedFile.name : 'None'}</div>
          <div>Error: {errorMessage || 'None'}</div>
        </div>
      )}
    </div>
  )
}
