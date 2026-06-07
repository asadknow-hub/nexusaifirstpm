'use client'

import { useState } from 'react'

interface KanbanDragDropProps {
  onDrop: (issueId: string, newStateId: string) => void
  children: React.ReactNode
}

interface DragState {
  draggedIssueId: string | null
  draggedOverStateId: string | null
}

export default function KanbanDragDrop({ onDrop, children }: KanbanDragDropProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggedIssueId: null,
    draggedOverStateId: null,
  })

  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    setDragState({ ...dragState, draggedIssueId: issueId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, stateId: string) => {
    e.preventDefault()
    if (dragState.draggedOverStateId !== stateId) {
      setDragState({ ...dragState, draggedOverStateId: stateId })
    }
  }

  const handleDragEnd = () => {
    setDragState({ draggedIssueId: null, draggedOverStateId: null })
  }

  const handleDrop = (e: React.DragEvent, stateId: string) => {
    e.preventDefault()
    if (dragState.draggedIssueId && dragState.draggedIssueId !== stateId) {
      onDrop(dragState.draggedIssueId, stateId)
    }
    setDragState({ draggedIssueId: null, draggedOverStateId: null })
  }

  return (
    <div
      onDragEnd={handleDragEnd}
      className="kanban-drag-drop-container"
    >
      {children}
    </div>
  )
}

export function DraggableIssue({
  issueId,
  children,
  onDragStart,
}: {
  issueId: string
  children: React.ReactNode
  onDragStart: (e: React.DragEvent, issueId: string) => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, issueId)}
      className="cursor-move hover:bg-gray-50 transition-colors"
    >
      {children}
    </div>
  )
}

export function DroppableColumn({
  stateId,
  children,
  onDragOver,
  onDrop,
  isDraggingOver,
}: {
  stateId: string
  children: React.ReactNode
  onDragOver: (e: React.DragEvent, stateId: string) => void
  onDrop: (e: React.DragEvent, stateId: string) => void
  isDraggingOver: boolean
}) {
  return (
    <div
      onDragOver={(e) => onDragOver(e, stateId)}
      onDrop={(e) => onDrop(e, stateId)}
      className={`min-h-[200px] transition-colors ${
        isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
      }`}
    >
      {children}
    </div>
  )
}
