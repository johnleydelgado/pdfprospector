import { Router, Request, Response } from 'express'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { ExtractedReport } from '../types/report'
import { ExportService } from '../services/exportService'

const router = Router()
const exportService = new ExportService()

// POST /api/export - Export extracted data in various formats
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { data, format } = req.body

  if (!data) {
    throw createError('No data provided for export', 400)
  }

  if (!format || !['json', 'csv', 'excel'].includes(format)) {
    throw createError('Invalid format. Supported formats: json, csv, excel', 400)
  }

  console.log(`📤 Exporting data in ${format.toUpperCase()} format`)

  try {
    const exportedData = await exportService.exportData(data as ExtractedReport, format)
    
    // Set appropriate headers based on format
    const contentTypes = {
      json: 'application/json',
      csv: 'text/csv',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    const fileExtensions = {
      json: 'json',
      csv: 'csv', 
      excel: 'xlsx'
    }

    const fileName = `${data.metadata?.fileName?.replace('.pdf', '') || 'extracted-data'}.${fileExtensions[format as keyof typeof fileExtensions]}`

    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes])
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    
    if (format === 'json') {
      res.json(exportedData)
    } else {
      res.send(exportedData)
    }

    console.log(`✅ Export completed: ${fileName}`)

  } catch (error) {
    console.error('❌ Export failed:', error)
    throw createError('Failed to export data', 500)
  }
}))

// GET /api/export/formats - Get supported export formats
router.get('/formats', asyncHandler(async (_req: Request, res: Response) => {
  const formats = [
    {
      format: 'json',
      name: 'JSON',
      description: 'JavaScript Object Notation - machine readable',
      extension: '.json',
      mimeType: 'application/json'
    },
    {
      format: 'csv',
      name: 'CSV',
      description: 'Comma Separated Values - spreadsheet compatible',
      extension: '.csv',
      mimeType: 'text/csv'
    },
    {
      format: 'excel',
      name: 'Excel',
      description: 'Microsoft Excel format with multiple sheets',
      extension: '.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  ]

  res.json({ formats })
}))

export default router