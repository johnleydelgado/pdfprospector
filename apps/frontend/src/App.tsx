import { useState } from "react";
import {
  FileText,
  BarChart3,
  Upload,
  Sparkles,
  Brain,
  Zap,
} from "lucide-react";
import PDFUpload from "./components/PDFUpload";
import Dashboard from "./components/Dashboard";
import { ExtractedReport } from "./types/report";

function App() {
  // State management for the application flow
  const [extractedData, setExtractedData] = useState<ExtractedReport | null>(
    null
  ); // Stores successful extraction results
  const [isProcessing, setIsProcessing] = useState(false); // Controls loading/processing state
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Manages error messages across the app

  // Handler for successful PDF processing
  // Transitions from processing state to dashboard display
  const handleFileProcessed = (data: ExtractedReport) => {
    setExtractedData(data);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  // Handler for starting PDF processing
  // Clears previous data and enters loading state
  const handleProcessingStart = () => {
    setIsProcessing(true);
    setExtractedData(null);
    setErrorMessage(null);
  };

  // Handler for processing errors
  // Manages error state at app level to prevent component unmounting
  const handleProcessingError = (error: string | null) => {
    setIsProcessing(false);
    setErrorMessage(error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  PDFProspector AI
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Intelligent Document Analysis • 75%+ Accuracy
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <Zap className="w-3 h-3" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Enhanced</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Three-state conditional rendering */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isProcessing ? (
          /* Modern Processing State */
          <div className="text-center py-20">
            <div className="relative mx-auto w-24 h-24 mb-8">
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping"></div>
              <div
                className="absolute inset-2 rounded-full border-4 border-purple-200 animate-ping"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="absolute inset-4 rounded-full border-4 border-pink-200 animate-ping"
                style={{ animationDelay: "0.4s" }}
              ></div>

              {/* Center icon */}
              <div className="absolute inset-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-white animate-pulse" />
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                AI Analysis in Progress
              </h2>
              <p className="text-gray-600 mb-6">
                Our advanced AI is extracting structured data from your document
                with 75%+ accuracy
              </p>

              {/* Processing steps */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Document structure preserved</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                  <span>AI models analyzing content</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-purple-600">
                  <div
                    className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                    style={{ animationDelay: "1s" }}
                  ></div>
                  <span>Extracting insights and metrics</span>
                </div>
              </div>
            </div>
          </div>
        ) : extractedData ? (
          /* Modern Dashboard Section */
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Analysis Complete
                  </h2>
                  <p className="text-gray-600">
                    Comprehensive insights extracted with AI precision
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setExtractedData(null);
                  setIsProcessing(false);
                  setErrorMessage(null);
                }}
                className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Upload className="h-4 w-4" />
                <span>Analyze New Document</span>
              </button>
            </div>
            <Dashboard data={extractedData} />
          </div>
        ) : (
          /* Modern Upload Section */
          <div>
            {/* PDFUpload component with modern AI styling */}
            <PDFUpload
              onFileProcessed={handleFileProcessed}
              onProcessingStart={handleProcessingStart}
              onProcessingError={handleProcessingError}
              errorMessage={errorMessage}
            />
          </div>
        )}

        {/* Background decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div
            className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>
      </main>
    </div>
  );
}

export default App;
