import axios from 'axios'
import { ExtractedReport } from '@/types/report'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for large PDF processing
})

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export const uploadAndProcessPDF = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<ExtractedReport> => {
  const formData = new FormData()
  formData.append('pdf', file)

  try {
    const response = await api.post('/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          })
        }
      },
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message
      throw new Error(`Failed to process PDF: ${message}`)
    }
    throw new Error('An unexpected error occurred while processing the PDF')
  }
}

export const exportData = async (
  data: ExtractedReport,
  format: 'json' | 'csv' | 'excel'
): Promise<Blob> => {
  try {
    const response = await api.post('/export', {
      data,
      format,
    }, {
      responseType: 'blob',
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message
      throw new Error(`Failed to export data: ${message}`)
    }
    throw new Error('An unexpected error occurred while exporting data')
  }
}

export const getHealthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    throw new Error('Backend service is not available')
  }
}