import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, X } from "lucide-react";
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



  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      let errorMessage = "File upload failed";
      
      if (rejection.errors) {
        const error = rejection.errors[0];
        if (error.code === 'file-invalid-type') {
          errorMessage = `Invalid file format. Only PDF files are supported. You uploaded: ${rejection.file.type || 'unknown file type'}`;
        } else if (error.code === 'file-too-large') {
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
  }, [onProcessingError]);

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
      const errorMsg = error instanceof Error ? error.message : "Failed to process PDF";
      
      // Notify parent component of error (maintains error state across renders)
      onProcessingError(errorMsg);
      // Keep selectedFile so user can see error and retry

    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200
          ${
            errorMessage
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
              : isDragActive
              ? "border-primary-500 bg-primary-50 cursor-pointer"
              : "border-gray-300 hover:border-primary-400 hover:bg-gray-50 cursor-pointer"
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

        {isDragActive ? (
          <p className="text-lg text-primary-600 font-medium">
            Drop your PDF here...
          </p>
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
            <button onClick={handleUpload} className="btn-primary flex-1">
              Process PDF
            </button>
          </div>
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
              <p className="text-sm text-red-700 leading-relaxed">{errorMessage}</p>
              
              {/* Helpful tips */}
              <div className="mt-4 p-3 bg-white/70 rounded-md border border-red-200">
                <p className="text-xs font-medium text-red-800 mb-2">💡 Tips:</p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Only PDF files (.pdf) are supported</li>
                  <li>• Maximum file size is 100MB</li>
                  <li>• Make sure the file isn't corrupted or password-protected</li>
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
                {selectedFile && selectedFile.type === 'application/pdf' && (
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

      {/* Instructions */}
      <div className="mt-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          What happens next?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
              1
            </div>
            <p className="font-medium text-gray-900">Text Extraction</p>
            <p className="text-gray-600 mt-1">
              Extract and structure content from your PDF
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
              2
            </div>
            <p className="font-medium text-gray-900">AI Analysis</p>
            <p className="text-gray-600 mt-1">
              Categorize goals, BMPs, and activities using AI
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
              3
            </div>
            <p className="font-medium text-gray-900">Results Dashboard</p>
            <p className="text-gray-600 mt-1">
              View extracted data with charts and summaries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
