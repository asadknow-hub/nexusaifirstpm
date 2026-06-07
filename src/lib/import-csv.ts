export interface ImportResult {
  success: boolean
  data: any[]
  errors: string[]
}

export function parseCSV(csvText: string): ImportResult {
  const lines = csvText.split('\n').filter((line) => line.trim() !== '')
  
  if (lines.length === 0) {
    return { success: false, data: [], errors: ['CSV file is empty'] }
  }

  const headers = parseCSVLine(lines[0])
  const data: any[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i])
      const row: any = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      data.push(row)
    } catch (error) {
      errors.push(`Error parsing line ${i + 1}: ${error}`)
    }
  }

  return {
    success: errors.length === 0,
    data,
    errors,
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

export function importIssuesFromCSV(csvText: string): ImportResult {
  const result = parseCSV(csvText)
  
  if (!result.success) {
    return result
  }

  const issues = result.data.map((row) => ({
    name: row.Name || '',
    description: row.Description || '',
    priority: row.Priority || 'none',
    state_id: row.State || null,
    assignee_id: row.Assignee || null,
    start_date: row['Start Date'] || null,
    due_date: row['Due Date'] || null,
  }))

  return {
    success: true,
    data: issues,
    errors: [],
  }
}

export function importProjectsFromCSV(csvText: string): ImportResult {
  const result = parseCSV(csvText)
  
  if (!result.success) {
    return result
  }

  const projects = result.data.map((row) => ({
    name: row.Name || '',
    identifier: row.Identifier || '',
    description: row.Description || '',
  }))

  return {
    success: true,
    data: projects,
    errors: [],
  }
}

export function importCyclesFromCSV(csvText: string): ImportResult {
  const result = parseCSV(csvText)
  
  if (!result.success) {
    return result
  }

  const cycles = result.data.map((row) => ({
    name: row.Name || '',
    description: row.Description || '',
    start_date: row['Start Date'] || null,
    end_date: row['End Date'] || null,
  }))

  return {
    success: true,
    data: cycles,
    errors: [],
  }
}
