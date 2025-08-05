import { useState } from 'react'
import { FileText, BarChart3, Upload } from 'lucide-react'
import PDFUpload from './components/PDFUpload'
import Dashboard from './components/Dashboard'
import { ExtractedReport } from './types/report'

function App() {
  const [extractedData, setExtractedData] = useState<ExtractedReport | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileProcessed = (data: ExtractedReport) => {
    setExtractedData(data)
    setIsProcessing(false)
  }

  const handleProcessingStart = () => {
    setIsProcessing(true)
    setExtractedData(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDFProspector</h1>
              <p className="text-sm text-gray-600">Agricultural & Environmental Report Extraction</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!extractedData && !isProcessing ? (
          /* Upload Section */
          <div className="text-center">
            <div className="mb-8">
              <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">
                Extract Data from Agricultural Reports
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload PDF documents to automatically extract goals, BMPs, implementation activities, 
                and monitoring metrics with high accuracy using AI-powered analysis.
              </p>
            </div>
            <PDFUpload 
              onFileProcessed={handleFileProcessed}
              onProcessingStart={handleProcessingStart}
            />
          </div>
        ) : isProcessing ? (
          /* Processing State */
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Processing PDF...</h2>
            <p className="text-gray-600">
              Extracting and categorizing data from your document. This may take a few minutes.
            </p>
          </div>
        ) : (
          /* Dashboard Section */
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-primary-600" />
                <div>
                  <h2 className="text-3xl font-semibold text-gray-900">Extraction Results</h2>
                  <p className="text-gray-600">Categorized data from your PDF document</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setExtractedData(null)
                  setIsProcessing(false)
                }}
                className="btn-secondary"
              >
                Upload New PDF
              </button>
            </div>
            <Dashboard data={extractedData} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App