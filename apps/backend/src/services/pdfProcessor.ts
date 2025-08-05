import pdfParse from 'pdf-parse'
import { ProcessingRequest } from '../types/report'
import { createError } from '../middleware/errorHandler'

export interface PDFContent {
  text: string
  pages: number
  info: any
  metadata: any
}

export class PDFProcessor {
  /**
   * Main text extraction method that converts PDF buffer to structured text
   * Handles PDF parsing, validation, and text cleaning for LLM processing
   */
  async extractText(request: ProcessingRequest): Promise<PDFContent> {
    try {
      console.log(`📄 Processing PDF: ${request.fileName} (${request.fileSize} bytes)`)
      
      // Parse PDF using pdf-parse library with optimized settings
      const data = await pdfParse(request.buffer, {
        // PDF parsing options for better text extraction
        max: 0, // No page limit - process entire document
        version: 'v1.10.100', // Use specific PDF.js version for consistency
      })

      // Validate extracted content
      if (!data.text || data.text.trim().length === 0) {
        throw createError('PDF appears to be empty or contains no extractable text', 400)
      }

      const content: PDFContent = {
        text: this.cleanText(data.text),
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata
      }

      console.log(`✅ PDF processed successfully: ${content.pages} pages, ${content.text.length} characters`)
      
      return content
    } catch (error) {
      console.error('❌ PDF processing failed:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          throw createError('Invalid PDF file format', 400)
        }
        if (error.message.includes('Password')) {
          throw createError('Password-protected PDFs are not supported', 400)
        }
        if (error.message.includes('Corrupt')) {
          throw createError('PDF file appears to be corrupted', 400)
        }
      }
      
      throw createError('Failed to process PDF file', 500)
    }
  }

  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page breaks and form feeds
      .replace(/[\f\r]/g, '')
      // Remove multiple consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim()
  }

  validatePDF(buffer: Buffer): boolean {
    // Check PDF magic number (starts with %PDF-)
    const pdfSignature = buffer.slice(0, 5).toString()
    return pdfSignature === '%PDF-'
  }

  extractMetadata(content: PDFContent): Record<string, any> {
    return {
      pages: content.pages,
      textLength: content.text.length,
      wordCount: content.text.split(/\s+/).length,
      hasImages: false, // pdf-parse doesn't extract images by default
      creationDate: content.info?.CreationDate,
      modificationDate: content.info?.ModDate,
      creator: content.info?.Creator,
      producer: content.info?.Producer,
      title: content.info?.Title,
      subject: content.info?.Subject,
      author: content.info?.Author
    }
  }
}