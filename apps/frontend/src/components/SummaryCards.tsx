import { ExtractedReport } from '@/types/report'
import { Target, Settings, Activity, Clock, Users, MapPin, TrendingUp } from 'lucide-react'

interface SummaryCardsProps {
  data: ExtractedReport
}

export default function SummaryCards({ data }: SummaryCardsProps) {
  const completedGoals = data.goals.filter(goal => goal.status === 'completed').length
  const ongoingActivities = data.implementation.filter(activity => activity.status === 'ongoing').length
  const totalBudget = data.implementation.reduce((sum, activity) => sum + (activity.budget || 0), 0)
  const avgEffectiveness = data.bmps.length > 0 
    ? Math.round(data.bmps.reduce((sum, bmp) => sum + bmp.effectiveness, 0) / data.bmps.length)
    : 0

  const cards = [
    {
      title: 'Total Goals',
      value: data.summary.totalGoals,
      subtitle: `${completedGoals} completed`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'BMPs Identified',
      value: data.summary.totalBMPs,
      subtitle: `${avgEffectiveness}% avg effectiveness`,
      icon: Settings,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Implementation Activities',
      value: data.implementation.length,
      subtitle: `${ongoingActivities} ongoing`,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Monitoring Metrics',
      value: data.monitoring.length,
      subtitle: 'Active measurements',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Outreach Activities',
      value: data.outreach.length,
      subtitle: 'Community engagement',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Geographic Areas',
      value: data.geographicAreas.length,
      subtitle: 'Coverage zones',
      icon: MapPin,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Completion Rate',
      value: `${Math.round(data.summary.completionRate)}%`,
      subtitle: 'Overall progress',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    // Commented out - assessment doesn't require accuracy display
    // {
    //   title: 'Extraction Accuracy',
    //   value: data.summary.extractionAccuracy ? `${data.summary.extractionAccuracy}%` : 'N/A',
    //   subtitle: 'AI extraction quality',
    //   icon: CheckCircle,
    //   color: 'text-emerald-600',
    //   bgColor: 'bg-emerald-50',
    // },
    {
      title: 'Total Budget',
      value: totalBudget > 0 ? `$${(totalBudget / 1000000).toFixed(1)}M` : 'N/A',
      subtitle: 'Implementation cost',
      icon: TrendingUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="card">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}