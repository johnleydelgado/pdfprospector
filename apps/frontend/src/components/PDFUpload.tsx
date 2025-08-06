import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  AlertCircle,
  X,
  Sparkles,
  Zap,
  Brain,
} from "lucide-react";
import { ExtractedReport } from "@/types/report";
import { uploadAndProcessPDF } from "@/services/api";

interface PDFUploadProps {
  onFileProcessed: (data: ExtractedReport) => void;
  onProcessingStart: () => void;
  onProcessingError: (error: string | null) => void;
  errorMessage: string | null;
}

export default function PDFUpload({
  onFileProcessed,
  onProcessingStart,
  onProcessingError,
  errorMessage,
}: PDFUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        let errorMessage = "File upload failed";

        if (rejection.errors) {
          const error = rejection.errors[0];
          if (error.code === "file-invalid-type") {
            errorMessage = `Invalid file format. Only PDF files are supported. You uploaded: ${
              rejection.file.type || "unknown file type"
            }`;
          } else if (error.code === "file-too-large") {
            const sizeMB = (rejection.file.size / 1024 / 1024).toFixed(1);
            errorMessage = `File too large. Maximum size is 100MB, but your file is ${sizeMB}MB`;
          } else {
            errorMessage = error.message || "File upload failed";
          }
        }

        onProcessingError(errorMessage);
        return;
      }

      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        onProcessingError(null); // Clear any previous errors
      }
    },
    [onProcessingError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: !!errorMessage, // Disable when there's an error
  });

  /**
   * Main upload handler - orchestrates the PDF processing workflow
   * Calls backend API and manages state transitions for success/error cases
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      // Notify parent component that processing has started
      onProcessingStart();

      // Call backend API to process PDF and extract structured data
      const result = await uploadAndProcessPDF(selectedFile);

      // Notify parent component of successful extraction
      onFileProcessed(result);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to process PDF";

      // Notify parent component of error (maintains error state across renders)
      onProcessingError(errorMsg);
      // Keep selectedFile so user can see error and retry
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* AI-powered Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          AI-Powered PDF Analysis
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transform your watershed management documents into structured insights
          with advanced AI extraction
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 group overflow-hidden
          ${
            errorMessage
              ? "border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-50"
              : isDragActive
              ? "border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer shadow-lg scale-[1.02]"
              : "border-gray-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 cursor-pointer hover:shadow-md hover:scale-[1.01]"
          }
        `}
      >
        <input {...getInputProps()} />

        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Upload Icon with Animation */}
        <div className="relative z-10">
          <div
            className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
              isDragActive
                ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg scale-110"
                : "bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-purple-100"
            }`}
          >
            <Upload
              className={`h-8 w-8 transition-all duration-300 ${
                isDragActive
                  ? "text-white"
                  : "text-gray-400 group-hover:text-blue-500"
              }`}
            />
          </div>

          {isDragActive ? (
            <div className="space-y-2">
              <p className="text-xl font-semibold text-blue-600">
                Release to upload your PDF
              </p>
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-600">
                  AI analysis will begin automatically
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-700">
                  Upload Your PDF Document
                </p>
                <p className="text-gray-500">
                  Drag and drop or click to select your watershed management
                  plan
                </p>
              </div>

              {/* Feature Tags */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Zap className="w-3 h-3 mr-1" />
                  AI-Powered
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Up to 100MB
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Secure Processing
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected File with Modern Design */}
      {selectedFile && (
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {selectedFile.name}
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span>•</span>
                  <span className="text-green-600 font-medium">
                    Ready for analysis
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={handleUpload}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <Brain className="w-5 h-5" />
            <span>Start AI Analysis</span>
            <Sparkles className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-6 p-6 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-base font-semibold text-red-800 mb-1">
                Upload Error
              </h3>
              <p className="text-sm text-red-700 leading-relaxed">
                {errorMessage}
              </p>

              {/* Helpful tips */}
              <div className="mt-4 p-3 bg-white/70 rounded-md border border-red-200">
                <p className="text-xs font-medium text-red-800 mb-2">
                  💡 Tips:
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Only PDF files (.pdf) are supported</li>
                  <li>• Maximum file size is 100MB</li>
                  <li>
                    • Make sure the file isn't corrupted or password-protected
                  </li>
                </ul>
              </div>

              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => {
                    onProcessingError(null);
                    setSelectedFile(null); // Clear selected file on dismiss
                  }}
                  className="text-sm bg-white text-red-700 px-4 py-2 rounded-md border border-red-200 hover:bg-red-50 transition-colors font-medium"
                >
                  Try Another File
                </button>
                {selectedFile && selectedFile.type === "application/pdf" && (
                  <button
                    onClick={handleUpload}
                    className="text-sm bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                  >
                    Retry Upload
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Process Flow */}
      <div className="mt-12">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            How It Works
          </h3>
          <p className="text-gray-600">
            Advanced AI extracts structured data from your documents in seconds
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-900 mb-2">Smart Extraction</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Advanced PDF processing preserves document structure and
                extracts clean text
              </p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-900 mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Dual AI models categorize goals, BMPs, and activities with 75%+
                accuracy
              </p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-gray-900 mb-2">
                Interactive Dashboard
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Explore results with dynamic charts, tables, and export options
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
