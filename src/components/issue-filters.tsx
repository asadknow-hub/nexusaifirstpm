'use client'

import { useState } from 'react'

interface IssueFiltersProps {
  onFilterChange: (filters: FilterState) => void
  onSortChange: (sort: SortState) => void
}

interface FilterState {
  priority: string[]
  state: string[]
  assignee: string[]
  labels: string[]
}

interface SortState {
  field: string
  order: 'asc' | 'desc'
}

export default function IssueFilters({ onFilterChange, onSortChange }: IssueFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    priority: [],
    state: [],
    assignee: [],
    labels: [],
  })
  const [sort, setSort] = useState<SortState>({
    field: 'created_at',
    order: 'desc',
  })

  const priorityOptions = [
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'low', label: 'Low', color: 'bg-blue-500' },
    { value: 'none', label: 'None', color: 'bg-gray-500' },
  ]

  const sortOptions = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'updated_at', label: 'Updated Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'name', label: 'Name' },
  ]

  const toggleFilter = (type: keyof FilterState, value: string) => {
    const newFilters = {
      ...filters,
      [type]: filters[type].includes(value)
        ? filters[type].filter((v) => v !== value)
        : [...filters[type], value],
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSortChange = (field: string) => {
    const newOrder: 'asc' | 'desc' = sort.field === field && sort.order === 'desc' ? 'asc' : 'desc'
    const newSort = {
      field,
      order: newOrder,
    }
    setSort(newSort)
    onSortChange(newSort)
  }

  const clearFilters = () => {
    const clearedFilters = {
      priority: [],
      state: [],
      assignee: [],
      labels: [],
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="text-sm">Filters</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Priority</h4>
                <div className="space-y-2">
                  {priorityOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.priority.includes(option.value)}
                        onChange={() => toggleFilter('priority', option.value)}
                        className="rounded border-gray-300"
                      />
                      <span className={`w-3 h-3 rounded ${option.color}`} />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Sort By</h4>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        sort.field === option.value
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {sort.field === option.value && (
                          <span className="text-xs">
                            {sort.order === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
