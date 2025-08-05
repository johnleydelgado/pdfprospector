import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, X } from 'lucide-react'
import { ExtractedReport } from '@/types/report'
import { uploadAndProcessPDF } from '@/services/api'

interface PDFUploadProps {
  onFileProcessed: (data: ExtractedReport) => void
  onProcessingStart: () => void
}

export default function PDFUpload({ onFileProcessed, onProcessingStart }: PDFUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setUploadError(null)
    
    if (rejectedFiles.length > 0) {
      setUploadError('Please upload a valid PDF file (max 100MB)')
      return
    }

    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploadError(null)
      onProcessingStart()
      
      const result = await uploadAndProcessPDF(selectedFile)
      onFileProcessed(result)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process PDF')
      setSelectedFile(null)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setUploadError(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {isDragActive ? (
          <p className="text-lg text-primary-600 font-medium">Drop your PDF here...</p>
        ) : (
          <div>
            <p className="text-lg text-gray-700 font-medium mb-2">
              Drag & drop your PDF here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF files up to 100MB
            </p>
          </div>
        )}
      </div>

      {/* Selected File */}
      {selectedFile && (
        <div className="mt-6 card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleUpload}
              className="btn-primary flex-1"
            >
              Process PDF
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="mt-6 p-4 bg-error-50 border border-error-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-error-600" />
            <p className="text-error-700 font-medium">Upload Error</p>
          </div>
          <p className="text-error-600 mt-1">{uploadError}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">What happens next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
              1
            </div>
            <p className="font-medium text-gray-900">Text Extraction</p>
            <p className="text-gray-600 mt-1">Extract and structure content from your PDF</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
              2
            </div>
            <p className="font-medium text-gray-900">AI Analysis</p>
            <p className="text-gray-600 mt-1">Categorize goals, BMPs, and activities using AI</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
              3
            </div>
            <p className="font-medium text-gray-900">Results Dashboard</p>
            <p className="text-gray-600 mt-1">View extracted data with charts and summaries</p>
          </div>
        </div>
      </div>
    </div>
  )
}