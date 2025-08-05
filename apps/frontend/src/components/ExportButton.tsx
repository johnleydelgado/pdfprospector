import { useState } from 'react'
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react'
import { ExtractedReport } from '@/types/report'
import { exportData } from '@/services/api'

interface ExportButtonProps {
  data: ExtractedReport
}

export default function ExportButton({ data }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleExport = async (format: 'json' | 'csv' | 'excel') => {
    try {
      setIsExporting(true)
      setShowDropdown(false)

      const blob = await exportData(data, format)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${data.metadata.fileName.replace('.pdf', '')}_extracted.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      // You could add toast notification here
    } finally {
      setIsExporting(false)
    }
  }

  const exportOptions = [
    {
      format: 'json' as const,
      label: 'JSON',
      description: 'Machine-readable format',
      icon: FileText,
    },
    {
      format: 'csv' as const,
      label: 'CSV',
      description: 'Spreadsheet compatible',
      icon: Table,
    },
    {
      format: 'excel' as const,
      label: 'Excel',
      description: 'Microsoft Excel format',
      icon: FileSpreadsheet,
    },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        className="btn-primary flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              {exportOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.format}
                    onClick={() => handleExport(option.format)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                  >
                    <Icon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}