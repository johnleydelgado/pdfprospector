import { useState } from "react";
import { ExtractedReport } from "@/types/report";
import {
  Target,
  Settings,
  Activity,
  BarChart3,
  Users,
  MapPin,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  Zap,
  Brain,
} from "lucide-react";
import SummaryCards from "./SummaryCards";
import DataTable from "./DataTable";
import Charts from "./Charts";
import ExportButton from "./ExportButton";

interface DashboardProps {
  data: ExtractedReport | null;
}

type TabType =
  | "overview"
  | "goals"
  | "bmps"
  | "implementation"
  | "monitoring"
  | "outreach"
  | "geographic";

export default function Dashboard({ data }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-xl font-semibold text-gray-700 mb-2">
            No Analysis Available
          </p>
          <p className="text-gray-500">
            Upload a PDF document to begin AI analysis
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: BarChart3,
      count: null,
    },
    {
      id: "goals" as const,
      label: "Goals",
      icon: Target,
      count: data.goals.length,
    },
    {
      id: "bmps" as const,
      label: "BMPs",
      icon: Settings,
      count: data.bmps.length,
    },
    {
      id: "implementation" as const,
      label: "Implementation",
      icon: Activity,
      count: data.implementation.length,
    },
    {
      id: "monitoring" as const,
      label: "Monitoring",
      icon: Clock,
      count: data.monitoring.length,
    },
    {
      id: "outreach" as const,
      label: "Outreach",
      icon: Users,
      count: data.outreach.length,
    },
    {
      id: "geographic" as const,
      label: "Geographic",
      icon: MapPin,
      count: data.geographicAreas.length,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Modern Header with Export */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Analysis Complete
                </h2>
                <p className="text-gray-600">
                  AI has successfully processed your document
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">
                {data.metadata.fileName}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Processed{" "}
                    {new Date(data.metadata.extractedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {(data.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">
                    {data.metadata.processingMethod}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 font-medium">
                    75%+ Accuracy
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="ml-6">
            <ExportButton data={data} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards data={data} />

      {/* Modern Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-3 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2
                    ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600 bg-blue-50/50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content with Modern Spacing */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Analytics Overview
                  </h3>
                </div>
                <p className="text-gray-600">
                  Comprehensive insights extracted from your watershed
                  management document
                </p>
              </div>

              <Charts data={data} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Target className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-900">
                      Key Goals
                    </h4>
                  </div>
                  <DataTable
                    data={data.goals.slice(0, 5)}
                    columns={[
                      { key: "title", label: "Title" },
                      { key: "status", label: "Status" },
                      { key: "priority", label: "Priority" },
                    ]}
                  />
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Settings className="h-5 w-5 text-purple-600" />
                    <h4 className="text-lg font-semibold text-gray-900">
                      Top BMPs
                    </h4>
                  </div>
                  <DataTable
                    data={data.bmps.slice(0, 5)}
                    columns={[
                      { key: "name", label: "Name" },
                      { key: "category", label: "Category" },
                      {
                        key: "effectiveness",
                        label: "Effectiveness",
                        format: (value) => `${value}%`,
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "goals" && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">
                    Strategic Goals
                  </h4>
                  <p className="text-sm text-gray-600">
                    {data.goals.length} goals identified by AI analysis
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <DataTable
                  data={data.goals}
                  columns={[
                    { key: "title", label: "Title" },
                    { key: "description", label: "Description" },
                    { key: "status", label: "Status" },
                    { key: "priority", label: "Priority" },
                    {
                      key: "targetDate",
                      label: "Target Date",
                      format: (value) =>
                        value ? new Date(value).toLocaleDateString() : "N/A",
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === "bmps" && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">
                    Best Management Practices
                  </h4>
                  <p className="text-sm text-gray-600">
                    {data.bmps.length} conservation practices extracted
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <DataTable
                  data={data.bmps}
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "category", label: "Category" },
                    { key: "description", label: "Description" },
                    {
                      key: "effectiveness",
                      label: "Effectiveness",
                      format: (value) => `${value}%`,
                    },
                    {
                      key: "implementationCost",
                      label: "Implementation Cost",
                      format: (value) =>
                        value ? `$${value.toLocaleString()}` : "N/A",
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === "implementation" && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">
                    Implementation Activities
                  </h4>
                  <p className="text-sm text-gray-600">
                    {data.implementation.length} action items identified
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <DataTable
                  data={data.implementation}
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "description", label: "Description" },
                    { key: "status", label: "Status" },
                    { key: "responsible", label: "Responsible" },
                    {
                      key: "budget",
                      label: "Budget",
                      format: (value) =>
                        value ? `$${value.toLocaleString()}` : "N/A",
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === "monitoring" && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">
                    Monitoring Metrics
                  </h4>
                  <p className="text-sm text-gray-600">
                    {data.monitoring.length} measurement parameters found
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <DataTable
                  data={data.monitoring}
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "description", label: "Description" },
                    { key: "unit", label: "Unit" },
                    {
                      key: "targetValue",
                      label: "Target",
                      format: (value) => value?.toString() || "N/A",
                    },
                    {
                      key: "currentValue",
                      label: "Current",
                      format: (value) => value?.toString() || "N/A",
                    },
                    { key: "frequency", label: "Frequency" },
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === "outreach" && (
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">
                    Outreach Activities
                  </h4>
                  <p className="text-sm text-gray-600">
                    {data.outreach.length} community engagement programs
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <DataTable
                  data={data.outreach}
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "description", label: "Description" },
                    { key: "targetAudience", label: "Target Audience" },
                    { key: "method", label: "Method" },
                    { key: "timeline", label: "Timeline" },
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === "geographic" && (
            <div className="bg-gradient-to-br from-teal-50 to-green-50 border border-teal-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-green-500 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">
                    Geographic Areas
                  </h4>
                  <p className="text-sm text-gray-600">
                    {data.geographicAreas.length} spatial regions identified
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <DataTable
                  data={data.geographicAreas}
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "type", label: "Type" },
                    { key: "area", label: "Area" },
                    {
                      key: "characteristics",
                      label: "Characteristics",
                      format: (value) =>
                        Array.isArray(value) ? value.join(", ") : value,
                    },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
