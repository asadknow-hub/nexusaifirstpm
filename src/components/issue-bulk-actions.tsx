'use client'

import { useState } from 'react'

interface IssueBulkActionsProps {
  selectedIssues: string[]
  onAction: (action: string, issueIds: string[]) => void
  onClearSelection: () => void
}

export default function IssueBulkActions({ selectedIssues, onAction, onClearSelection }: IssueBulkActionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const bulkActions = [
    { value: 'assign', label: 'Assign to...', icon: '👤' },
    { value: 'change_state', label: 'Change state', icon: '📋' },
    { value: 'change_priority', label: 'Change priority', icon: '🔥' },
    { value: 'add_label', label: 'Add label', icon: '🏷️' },
    { value: 'remove_label', label: 'Remove label', icon: '❌' },
    { value: 'archive', label: 'Archive', icon: '📦' },
    { value: 'delete', label: 'Delete', icon: '🗑️' },
  ]

  const handleAction = (action: string) => {
    onAction(action, selectedIssues)
    setIsOpen(false)
  }

  if (selectedIssues.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
        <span className="text-sm text-gray-700">
          {selectedIssues.length} {selectedIssues.length === 1 ? 'issue' : 'issues'} selected
        </span>

        <div className="h-6 w-px bg-gray-200" />

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Bulk actions</span>
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  {bulkActions.map((action) => (
                    <button
                      key={action.value}
                      onClick={() => handleAction(action.value)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <button
          onClick={onClearSelection}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear selection
        </button>
      </div>
    </div>
  )
}
