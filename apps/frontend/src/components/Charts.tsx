import { ExtractedReport } from '@/types/report'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

interface ChartsProps {
  data: ExtractedReport
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// Generate timeline data from actual extracted data
function generateTimelineFromData(data: ExtractedReport) {
  // Group activities by dates if available, or return empty timeline
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // For now, return basic counts since we don't have date information in the current data structure
  // This could be enhanced when date fields are added to the data model
  return months.slice(0, 6).map((month, index) => ({
    month,
    goals: Math.max(0, data.goals.length - index),
    activities: Math.max(0, data.implementation.length - index),
    monitoring: Math.max(0, data.monitoring.length - index),
  }))
}

export default function Charts({ data }: ChartsProps) {
  // Status distribution for goals
  const goalStatusData = data.goals.reduce((acc, goal) => {
    acc[goal.status] = (acc[goal.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const goalStatusChartData = Object.entries(goalStatusData).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
    value: count,
  }))

  // BMP effectiveness distribution
  const bmpEffectivenessData = data.bmps.map((bmp) => ({
    name: bmp.name.length > 20 ? bmp.name.substring(0, 20) + '...' : bmp.name,
    effectiveness: bmp.effectiveness,
    category: bmp.category,
  })).slice(0, 10) // Top 10 BMPs

  // Implementation activities by status
  const implementationStatusData = data.implementation.reduce((acc, activity) => {
    acc[activity.status] = (acc[activity.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const implementationChartData = Object.entries(implementationStatusData).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }))

  // Generate timeline data from actual extracted data
  const timelineData = generateTimelineFromData(data)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Goal Status Distribution */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Goal Status Distribution</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={goalStatusChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {goalStatusChartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* BMP Effectiveness */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Top BMP Effectiveness</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bmpEffectivenessData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis 
              label={{ value: 'Effectiveness (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value, _name) => [`${value}%`, 'Effectiveness']}
              labelFormatter={(label) => `BMP: ${label}`}
            />
            <Bar dataKey="effectiveness" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Implementation Status */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Implementation Activities Status</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={implementationChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity Timeline */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline (Sample)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="goals" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Goals"
            />
            <Line 
              type="monotone" 
              dataKey="activities" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Activities"
            />
            <Line 
              type="monotone" 
              dataKey="monitoring" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Monitoring"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}