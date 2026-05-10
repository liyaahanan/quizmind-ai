/**
 * Client-side PDF Text Extraction Utility using pdfjs-dist
 * Compatible with Next.js 16 + Turbopack + Vercel
 * ONLY FOR CLIENT-SIDE USE
 */

import * as pdfjs from 'pdfjs-dist'

// Use CDN worker for compatibility with Next.js 16 + Turbopack + Vercel
pdfjs.GlobalWorkerOptions.workerSrc =
  pdfjs.GlobalWorkerOptions.workerSrc =
  pdfjs.GlobalWorkerOptions.workerSrc =
  'https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs'

export interface PDFExtractionOptions {
  maxPages?: number
  maxLength?: number
  includeMetadata?: boolean
  onProgress?: (current: number, total: number) => void
}

export interface PDFExtractionResult {
  text: string
  metadata?: {
    title?: string
    author?: string
    subject?: string
    creator?: string
    producer?: string
    creationDate?: string
    modificationDate?: string
    pages: number
  }
  pageCount: number
  extractedAt: string
}

/**
 * Extract text from PDF file using pdfjs-dist (CLIENT-SIDE ONLY)
 */
export async function extractPDFTextClient(
  file: File,
  options: PDFExtractionOptions = {}
): Promise<PDFExtractionResult> {
  const {
    maxPages = 50,
    maxLength = 50000,
    includeMetadata = true,
    onProgress
  } = options

  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      disableFontFace: true,
      disableAutoFetch: true,
      disableStream: true,
    })

    const pdf = await loadingTask.promise
    const pageCount = Math.min(pdf.numPages, maxPages)

    let extractedText = ''

    const metadata: PDFExtractionResult['metadata'] = {
      pages: pdf.numPages
    }

    if (includeMetadata) {
      try {
        const pdfMetadata = await pdf.getMetadata()
        const info = pdfMetadata.info as any

        metadata.title = info?.Title
        metadata.author = info?.Author
        metadata.subject = info?.Subject
        metadata.creator = info?.Creator
        metadata.producer = info?.Producer
        metadata.creationDate = info?.CreationDate
        metadata.modificationDate = info?.ModDate
      } catch (metadataError) {
        console.warn('Failed to extract metadata:', metadataError)
      }
    }

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()

        const pageText = textContent.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ')

        extractedText += pageText + '\n'

        if (onProgress) {
          onProgress(pageNum, pageCount)
        }

        if (extractedText.length >= maxLength) {
          extractedText = extractedText.substring(0, maxLength)
          break
        }

      } catch (pageError) {
        console.warn(`Failed page ${pageNum}:`, pageError)
      }
    }

    extractedText = cleanExtractedText(extractedText)

    return {
      text: extractedText,
      metadata: includeMetadata ? metadata : undefined,
      pageCount: pdf.numPages,
      extractedAt: new Date().toISOString()
    }

  } catch (error) {
    console.error('PDF extraction error:', error)

    throw new Error(
      `Failed to extract PDF text: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Clean extracted text
 */
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\f/g, '\n')
    .replace(/[^\w\s\-\.,;:!?()[\]{}"'/\\@#$%&*+<>=|~`]/g, '')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim()
}

/**
 * Validate uploaded PDF
 */
export function validatePDFFile(
  file: File
): { valid: boolean; error?: string } {

  if (file.type !== 'application/pdf') {
    return {
      valid: false,
      error: 'File must be PDF'
    }
  }

  const maxSize = 50 * 1024 * 1024

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'PDF must be smaller than 50MB'
    }
  }

  if (file.size < 1024) {
    return {
      valid: false,
      error: 'PDF appears empty or corrupted'
    }
  }

  return { valid: true }
}

/**
 * Extract chapter PDF (CLIENT-SIDE ONLY)
 */
export async function extractChapterPDFClient(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {

  const validation = validatePDFFile(file)

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  try {
    onProgress?.(0, 'Loading PDF...')

    const result = await extractPDFTextClient(file, {
      maxPages: 100,
      maxLength: 100000,
      onProgress: (current, total) => {
        const progress = (current / total) * 100

        onProgress?.(
          progress,
          `Extracting page ${current} of ${total}`
        )
      }
    })

    onProgress?.(100, 'PDF extraction complete')

    if (!result.text.trim()) {
      throw new Error(
        'No text extracted from PDF'
      )
    }

    return result.text

  } catch (error) {
    console.error('Chapter extraction error:', error)

    throw new Error(
      `Failed extracting chapter PDF: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

export default {
  extractPDFTextClient,
  extractChapterPDFClient,
  validatePDFFile
}
