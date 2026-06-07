export interface ExportData {
  [key: string]: string | number | boolean | null | undefined
}

export function exportToCSV(data: ExportData[], filename: string) {
  if (data.length === 0) {
    return
  }

  const headers = Object.keys(data[0])
  const csvRows: string[] = []

  // Add headers
  csvRows.push(headers.join(','))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      const escaped = String(value ?? '').replace(/"/g, '""')
      return `"${escaped}"`
    })
    csvRows.push(values.join(','))
  }

  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportIssuesToCSV(issues: any[]) {
  const exportData = issues.map((issue) => ({
    ID: issue.id,
    Name: issue.name,
    Description: issue.description || '',
    State: issue.state_id || '',
    Priority: issue.priority || '',
    Assignee: issue.assignee_id || '',
    'Start Date': issue.start_date || '',
    'Due Date': issue.due_date || '',
    'Created At': issue.created_at || '',
    'Updated At': issue.updated_at || '',
  }))

  exportToCSV(exportData, 'issues')
}

export function exportProjectsToCSV(projects: any[]) {
  const exportData = projects.map((project) => ({
    ID: project.id,
    Name: project.name,
    Identifier: project.identifier,
    Description: project.description || '',
    'Created At': project.created_at || '',
    'Updated At': project.updated_at || '',
  }))

  exportToCSV(exportData, 'projects')
}

export function exportCyclesToCSV(cycles: any[]) {
  const exportData = cycles.map((cycle) => ({
    ID: cycle.id,
    Name: cycle.name,
    Description: cycle.description || '',
    'Start Date': cycle.start_date || '',
    'End Date': cycle.end_date || '',
    'Created At': cycle.created_at || '',
    'Updated At': cycle.updated_at || '',
  }))

  exportToCSV(exportData, 'cycles')
}
