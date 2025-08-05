import { useState } from 'react'
import { ExtractedReport } from '@/types/report'
import { 
  Target, 
  Settings, 
  Activity, 
  BarChart3, 
  Users, 
  MapPin,

  FileText,
  Clock,
  CheckCircle
} from 'lucide-react'
import SummaryCards from './SummaryCards'
import DataTable from './DataTable'
import Charts from './Charts'
import ExportButton from './ExportButton'

interface DashboardProps {
  data: ExtractedReport | null
}

type TabType = 'overview' | 'goals' | 'bmps' | 'implementation' | 'monitoring' | 'outreach' | 'geographic'

export default function Dashboard({ data }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  if (!data) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600">No data to display</p>
      </div>
    )
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3, count: null },
    { id: 'goals' as const, label: 'Goals', icon: Target, count: data.goals.length },
    { id: 'bmps' as const, label: 'BMPs', icon: Settings, count: data.bmps.length },
    { id: 'implementation' as const, label: 'Implementation', icon: Activity, count: data.implementation.length },
    { id: 'monitoring' as const, label: 'Monitoring', icon: Clock, count: data.monitoring.length },
    { id: 'outreach' as const, label: 'Outreach', icon: Users, count: data.outreach.length },
    { id: 'geographic' as const, label: 'Geographic', icon: MapPin, count: data.geographicAreas.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {data.metadata.fileName}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span>Extracted: {new Date(data.metadata.extractedAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>{(data.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</span>
            {data.summary.extractionAccuracy && (
              <>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span>{data.summary.extractionAccuracy}% accuracy</span>
                </span>
              </>
            )}
          </div>
        </div>
        <ExportButton data={data} />
      </div>

      {/* Summary Cards */}
      <SummaryCards data={data} />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Charts data={data} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Goals</h4>
                <DataTable
                  data={data.goals.slice(0, 5)}
                  columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'status', label: 'Status' },
                    { key: 'priority', label: 'Priority' },
                  ]}
                />
              </div>
              <div className="card">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Top BMPs</h4>
                <DataTable
                  data={data.bmps.slice(0, 5)}
                  columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'category', label: 'Category' },
                    { key: 'effectiveness', label: 'Effectiveness', format: (value) => `${value}%` },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Goals ({data.goals.length})</h4>
            <DataTable
              data={data.goals}
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'description', label: 'Description' },
                { key: 'status', label: 'Status' },
                { key: 'priority', label: 'Priority' },
                { key: 'targetDate', label: 'Target Date', format: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
              ]}
            />
          </div>
        )}

        {activeTab === 'bmps' && (
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Best Management Practices ({data.bmps.length})</h4>
            <DataTable
              data={data.bmps}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'category', label: 'Category' },
                { key: 'description', label: 'Description' },
                { key: 'effectiveness', label: 'Effectiveness', format: (value) => `${value}%` },
                { key: 'implementationCost', label: 'Implementation Cost', format: (value) => value ? `$${value.toLocaleString()}` : 'N/A' },
              ]}
            />
          </div>
        )}

        {activeTab === 'implementation' && (
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Implementation Activities ({data.implementation.length})</h4>
            <DataTable
              data={data.implementation}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'description', label: 'Description' },
                { key: 'status', label: 'Status' },
                { key: 'responsible', label: 'Responsible' },
                { key: 'budget', label: 'Budget', format: (value) => value ? `$${value.toLocaleString()}` : 'N/A' },
              ]}
            />
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Monitoring Metrics ({data.monitoring.length})</h4>
            <DataTable
              data={data.monitoring}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'description', label: 'Description' },
                { key: 'unit', label: 'Unit' },
                { key: 'targetValue', label: 'Target', format: (value) => value?.toString() || 'N/A' },
                { key: 'currentValue', label: 'Current', format: (value) => value?.toString() || 'N/A' },
                { key: 'frequency', label: 'Frequency' },
              ]}
            />
          </div>
        )}

        {activeTab === 'outreach' && (
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Outreach Activities ({data.outreach.length})</h4>
            <DataTable
              data={data.outreach}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'description', label: 'Description' },
                { key: 'targetAudience', label: 'Target Audience' },
                { key: 'method', label: 'Method' },
                { key: 'timeline', label: 'Timeline' },
              ]}
            />
          </div>
        )}

        {activeTab === 'geographic' && (
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Geographic Areas ({data.geographicAreas.length})</h4>
            <DataTable
              data={data.geographicAreas}
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'type', label: 'Type' },
                { key: 'area', label: 'Area' },
                { key: 'characteristics', label: 'Characteristics', format: (value) => Array.isArray(value) ? value.join(', ') : value },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  )
}