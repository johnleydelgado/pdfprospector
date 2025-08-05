export interface Goal {
  id: string
  title: string
  description: string
  targetDate?: string
  status: 'planned' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
}

export interface BMP {
  id: string
  name: string
  description: string
  category: string
  implementationCost?: number
  maintenanceCost?: number
  effectiveness: number // percentage
  applicableAreas: string[]
}

export interface ImplementationActivity {
  id: string
  name: string
  description: string
  startDate?: string
  endDate?: string
  budget?: number
  responsible: string
  status: 'planned' | 'ongoing' | 'completed'
  relatedGoals: string[]
  relatedBMPs: string[]
}

export interface MonitoringMetric {
  id: string
  name: string
  description: string
  unit: string
  targetValue?: number
  currentValue?: number
  frequency: string
  methodology: string
  responsibleParty: string
}

export interface OutreachActivity {
  id: string
  name: string
  description: string
  targetAudience: string
  method: string
  timeline: string
  expectedOutcome: string
  budget?: number
}

export interface GeographicArea {
  id: string
  name: string
  type: 'watershed' | 'county' | 'region' | 'state'
  area: number // in acres or square miles
  coordinates?: {
    lat: number
    lng: number
  }
  characteristics: string[]
}

export interface ExtractedReport {
  summary: {
    totalGoals: number
    totalBMPs: number
    completionRate: number
    extractionAccuracy?: number
    processingTime?: number
  }
  goals: Goal[]
  bmps: BMP[]
  implementation: ImplementationActivity[]
  monitoring: MonitoringMetric[]
  outreach: OutreachActivity[]
  geographicAreas: GeographicArea[]
  metadata: {
    fileName: string
    fileSize: number
    extractedAt: string
    processingMethod: string
  }
}