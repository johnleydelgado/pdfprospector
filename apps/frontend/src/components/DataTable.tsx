interface Column {
  key: string
  label: string
  format?: (value: any) => string
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  maxRows?: number
}

export default function DataTable({ data, columns, maxRows = 10 }: DataTableProps) {
  const displayData = maxRows ? data.slice(0, maxRows) : data

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'ongoing': 'bg-blue-100 text-blue-800',
      'planned': 'bg-gray-100 text-gray-800',
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800',
    }

    const colorClass = statusColors[status.toLowerCase() as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    )
  }

  const formatCellValue = (value: any, column: Column): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">N/A</span>
    }

    if (column.format) {
      return column.format(value)
    }

    // Special formatting for certain field types
    if (column.key.includes('status') || column.key.includes('priority')) {
      return getStatusBadge(value.toString())
    }

    if (typeof value === 'string' && value.length > 100) {
      return (
        <span title={value}>
          {value.substring(0, 100)}...
        </span>
      )
    }

    return value.toString()
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayData.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {formatCellValue(row[column.key], column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length > maxRows && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 text-center">
          Showing {maxRows} of {data.length} items
        </div>
      )}
    </div>
  )
}