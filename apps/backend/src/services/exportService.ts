import { ExtractedReport } from '../types/report'
import { createError } from '../middleware/errorHandler'
import * as XLSX from 'xlsx'

export class ExportService {
  async exportData(data: ExtractedReport, format: 'json' | 'csv' | 'excel'): Promise<string | Buffer> {
    switch (format) {
      case 'json':
        return this.exportAsJSON(data)
      case 'csv':
        return this.exportAsCSV(data)
      case 'excel':
        return this.exportAsExcel(data)
      default:
        throw createError(`Unsupported export format: ${format}`, 400)
    }
  }

  private exportAsJSON(data: ExtractedReport): string {
    return JSON.stringify(data, null, 2)
  }

  private exportAsCSV(data: ExtractedReport): string {
    const csvSections: string[] = []

    // Goals section
    if (data.goals.length > 0) {
      csvSections.push('GOALS')
      csvSections.push('ID,Title,Description,Status,Priority,Target Date')
      data.goals.forEach(goal => {
        const row = [
          goal.id,
          `"${goal.title}"`,
          `"${goal.description}"`,
          goal.status,
          goal.priority,
          goal.targetDate || ''
        ].join(',')
        csvSections.push(row)
      })
      csvSections.push('')
    }

    // BMPs section
    if (data.bmps.length > 0) {
      csvSections.push('BEST MANAGEMENT PRACTICES')
      csvSections.push('ID,Name,Description,Category,Implementation Cost,Maintenance Cost,Effectiveness,Applicable Areas')
      data.bmps.forEach(bmp => {
        const row = [
          bmp.id,
          `"${bmp.name}"`,
          `"${bmp.description}"`,
          bmp.category,
          bmp.implementationCost || 'N/A',
          bmp.maintenanceCost || 'N/A',
          `${bmp.effectiveness}%`,
          `"${bmp.applicableAreas.join('; ')}"`
        ].join(',')
        csvSections.push(row)
      })
      csvSections.push('')
    }

    // Implementation section
    if (data.implementation.length > 0) {
      csvSections.push('IMPLEMENTATION ACTIVITIES')
      csvSections.push('ID,Name,Description,Start Date,End Date,Budget,Responsible,Status')
      data.implementation.forEach(impl => {
        const row = [
          impl.id,
          `"${impl.name}"`,
          `"${impl.description}"`,
          impl.startDate || 'N/A',
          impl.endDate || 'N/A',
          impl.budget || 'N/A',
          impl.responsible,
          impl.status
        ].join(',')
        csvSections.push(row)
      })
      csvSections.push('')
    }

    // Monitoring section
    if (data.monitoring.length > 0) {
      csvSections.push('MONITORING METRICS')
      csvSections.push('ID,Name,Description,Unit,Target Value,Current Value,Frequency,Methodology,Responsible Party')
      data.monitoring.forEach(metric => {
        const row = [
          metric.id,
          `"${metric.name}"`,
          `"${metric.description}"`,
          metric.unit,
          metric.targetValue || 'N/A',
          metric.currentValue || 'N/A',
          metric.frequency,
          `"${metric.methodology}"`,
          metric.responsibleParty
        ].join(',')
        csvSections.push(row)
      })
      csvSections.push('')
    }

    // Outreach section
    if (data.outreach.length > 0) {
      csvSections.push('OUTREACH ACTIVITIES')
      csvSections.push('ID,Name,Description,Target Audience,Method,Timeline,Expected Outcome,Budget')
      data.outreach.forEach(activity => {
        const row = [
          activity.id,
          `"${activity.name}"`,
          `"${activity.description}"`,
          activity.targetAudience,
          activity.method,
          activity.timeline,
          `"${activity.expectedOutcome}"`,
          activity.budget || 'N/A'
        ].join(',')
        csvSections.push(row)
      })
      csvSections.push('')
    }

    // Geographic Areas section
    if (data.geographicAreas.length > 0) {
      csvSections.push('GEOGRAPHIC AREAS')
      csvSections.push('ID,Name,Type,Area,Coordinates,Characteristics')
      data.geographicAreas.forEach(area => {
        const coordinates = area.coordinates 
          ? `"${area.coordinates.lat}, ${area.coordinates.lng}"`
          : 'N/A'
        const row = [
          area.id,
          `"${area.name}"`,
          area.type,
          area.area,
          coordinates,
          `"${area.characteristics.join('; ')}"`
        ].join(',')
        csvSections.push(row)
      })
      csvSections.push('')
    }

    // Metadata section
    csvSections.push('METADATA')
    csvSections.push('Property,Value')
    csvSections.push(`File Name,"${data.metadata.fileName}"`)
    csvSections.push(`File Size,${data.metadata.fileSize} bytes`)
    csvSections.push(`Extracted At,"${data.metadata.extractedAt}"`)
    csvSections.push(`Processing Method,"${data.metadata.processingMethod}"`)

    return csvSections.join('\n')
  }

  private exportAsExcel(data: ExtractedReport): Buffer {
    const workbook = XLSX.utils.book_new()
    
    // Create Summary sheet
    const summaryData = [
      { Metric: 'Total Goals', Value: data.summary.totalGoals },
      { Metric: 'Total BMPs', Value: data.summary.totalBMPs },
      { Metric: 'Completion Rate', Value: `${data.summary.completionRate}%` },
      { Metric: 'Extraction Accuracy', Value: `${data.summary.extractionAccuracy}%` },
      { Metric: 'Processing Time', Value: `${data.summary.processingTime}ms` }
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    
    // Create Goals sheet
    if (data.goals.length > 0) {
      const goalsSheet = XLSX.utils.json_to_sheet(data.goals.map(goal => ({
        ID: goal.id,
        Title: goal.title,
        Description: goal.description,
        Status: goal.status,
        Priority: goal.priority,
        'Target Date': goal.targetDate || 'N/A'
      })))
      XLSX.utils.book_append_sheet(workbook, goalsSheet, 'Goals')
    }
    
    // Create BMPs sheet
    if (data.bmps.length > 0) {
      const bmpsSheet = XLSX.utils.json_to_sheet(data.bmps.map(bmp => ({
        ID: bmp.id,
        Name: bmp.name,
        Description: bmp.description,
        Category: bmp.category,
        'Implementation Cost': bmp.implementationCost || 'N/A',
        'Maintenance Cost': bmp.maintenanceCost || 'N/A',
        'Effectiveness (%)': bmp.effectiveness,
        'Applicable Areas': bmp.applicableAreas.join('; ')
      })))
      XLSX.utils.book_append_sheet(workbook, bmpsSheet, 'BMPs')
    }
    
    // Create Implementation sheet
    if (data.implementation.length > 0) {
      const implSheet = XLSX.utils.json_to_sheet(data.implementation.map(impl => ({
        ID: impl.id,
        Name: impl.name,
        Description: impl.description,
        'Start Date': impl.startDate || 'N/A',
        'End Date': impl.endDate || 'N/A',
        Budget: impl.budget || 'N/A',
        Responsible: impl.responsible,
        Status: impl.status
      })))
      XLSX.utils.book_append_sheet(workbook, implSheet, 'Implementation')
    }
    
    // Create Monitoring sheet
    if (data.monitoring.length > 0) {
      const monitoringSheet = XLSX.utils.json_to_sheet(data.monitoring.map(metric => ({
        ID: metric.id,
        Name: metric.name,
        Description: metric.description,
        Unit: metric.unit,
        'Target Value': metric.targetValue || 'N/A',
        'Current Value': metric.currentValue || 'N/A',
        Frequency: metric.frequency,
        Methodology: metric.methodology,
        'Responsible Party': metric.responsibleParty
      })))
      XLSX.utils.book_append_sheet(workbook, monitoringSheet, 'Monitoring')
    }
    
    // Create Outreach sheet
    if (data.outreach.length > 0) {
      const outreachSheet = XLSX.utils.json_to_sheet(data.outreach.map(activity => ({
        ID: activity.id,
        Name: activity.name,
        Description: activity.description,
        'Target Audience': activity.targetAudience,
        Method: activity.method,
        Timeline: activity.timeline,
        'Expected Outcome': activity.expectedOutcome,
        Budget: activity.budget || 'N/A'
      })))
      XLSX.utils.book_append_sheet(workbook, outreachSheet, 'Outreach')
    }
    
    // Create Geographic Areas sheet
    if (data.geographicAreas.length > 0) {
      const geoSheet = XLSX.utils.json_to_sheet(data.geographicAreas.map(area => ({
        ID: area.id,
        Name: area.name,
        Type: area.type,
        Area: area.area,
        Coordinates: area.coordinates ? `${area.coordinates.lat}, ${area.coordinates.lng}` : 'N/A',
        Characteristics: area.characteristics.join('; ')
      })))
      XLSX.utils.book_append_sheet(workbook, geoSheet, 'Geographic Areas')
    }
    
    // Create Metadata sheet
    const metadataData = [
      { Property: 'File Name', Value: data.metadata.fileName },
      { Property: 'File Size', Value: `${data.metadata.fileSize} bytes` },
      { Property: 'Extracted At', Value: data.metadata.extractedAt },
      { Property: 'Processing Method', Value: data.metadata.processingMethod }
    ]
    const metadataSheet = XLSX.utils.json_to_sheet(metadataData)
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata')
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  }
}