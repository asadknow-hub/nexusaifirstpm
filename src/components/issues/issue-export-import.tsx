'use client'

import { useState } from 'react'
import { Download, Upload, FileJson, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface Issue {
  id: string
  sequence_id: number
  name: string
  description_json: any
  priority: string
  state_id: string
  start_date?: string
  target_date?: string
  completed_at?: string
  created_at: string
}

interface IssueExportImportProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function IssueExportImport({ projectId, open, onOpenChange }: IssueExportImportProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function exportAsJSON() {
    setLoading(true)
    try {
      const { data: issues, error } = await supabase
        .from('issues')
        .select('*')
        .eq('project_id', projectId)

      if (error) throw error

      const dataStr = JSON.stringify(issues, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `issues-${projectId}-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export issues')
    } finally {
      setLoading(false)
    }
  }

  async function exportAsCSV() {
    setLoading(true)
    try {
      const { data: issues, error } = await supabase
        .from('issues')
        .select('*')
        .eq('project_id', projectId)

      if (error) throw error

      if (!issues || issues.length === 0) {
        alert('No issues to export')
        return
      }

      // Convert to CSV
      const headers = ['ID', 'Sequence', 'Name', 'Description', 'Priority', 'State ID', 'Start Date', 'Target Date', 'Completed At', 'Created At']
      const rows = issues.map((issue: Issue) => [
        issue.id,
        issue.sequence_id,
        `"${(issue.name || '').replace(/"/g, '""')}"`,
        `"${(typeof issue.description_json === 'string' ? issue.description_json : JSON.stringify(issue.description_json) || '').replace(/"/g, '""')}"`,
        issue.priority,
        issue.state_id,
        issue.start_date || '',
        issue.target_date || '',
        issue.completed_at || '',
        issue.created_at,
      ])

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      const dataBlob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `issues-${projectId}-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export issues')
    } finally {
      setLoading(false)
    }
  }

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        let importedIssues: any[] = []

        if (file.name.endsWith('.json')) {
          importedIssues = JSON.parse(content)
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n')
          const headers = lines[0].split(',')
          importedIssues = lines.slice(1).map(line => {
            const values = line.split(',')
            const issue: any = {}
            headers.forEach((header, index) => {
              issue[header.toLowerCase().replace(/ /g, '_')] = values[index]?.replace(/"/g, '')
            })
            return issue
          }).filter(issue => issue.name)
        }

        // Import issues
        for (const issue of importedIssues) {
          await supabase.from('issues').insert({
            project_id: projectId,
            workspace_id: issue.workspace_id,
            name: issue.name,
            description_json: issue.description_json,
            priority: issue.priority,
            state_id: issue.state_id,
            start_date: issue.start_date,
            target_date: issue.target_date,
          })
        }

        alert(`Successfully imported ${importedIssues.length} issues`)
        onOpenChange(false)
        window.location.reload()
      } catch (error) {
        console.error('Import error:', error)
        alert('Failed to import issues')
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export/Import Issues</DialogTitle>
          <DialogDescription>
            Export issues to CSV or JSON, or import from a file
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Export</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={exportAsJSON}
                disabled={loading}
              >
                <FileJson className="h-4 w-4" />
                Export as JSON
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={exportAsCSV}
                disabled={loading}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export as CSV
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <h3 className="text-sm font-medium">Import</h3>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleImport}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Import issues from a JSON or CSV file. Existing issues will not be overwritten.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
