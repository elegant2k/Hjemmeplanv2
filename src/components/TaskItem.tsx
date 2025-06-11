import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import IconMap from '@/components/IconMap'
import { Card, CardContent } from '@/components/ui/card'
import StatusIndicator from '@/components/StatusIndicator'
import { completionService } from '@/services/completionService'
import { useUser } from '@/contexts/UserContext'
import type { Task, TaskCompletion, User } from '@/models'

interface TaskItemProps {
  task: Task
  completion?: TaskCompletion
  assignedUser?: User
  onToggleComplete?: (taskId: string, completed: boolean) => void
  onCompletionUpdate?: () => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onAssign?: (taskId: string, userId: string) => void
  onToggleActive?: (taskId: string, active: boolean) => void
  availableUsers?: User[]
  isExpanded?: boolean
  onToggleExpand?: () => void
  isSelected?: boolean
  onSelect?: (taskId: string, selected: boolean) => void
  className?: string
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  completion,
  assignedUser,
  onToggleComplete,
  onCompletionUpdate,
  onEdit,
  onDelete,
  onAssign,
  onToggleActive,
  availableUsers = [],
  isExpanded = false,
  onToggleExpand,
  isSelected = false,
  onSelect,
  className
}) => {
  const { currentUser, currentFamily } = useUser()
  const [showActions, setShowActions] = useState(false)
  const [isReassigning, setIsReassigning] = useState(false)
  const [isTogglingActive, setIsTogglingActive] = useState(false)
  const [isProcessingCompletion, setIsProcessingCompletion] = useState(false)

  const getTaskStatus = () => {
    if (completion) {
      switch (completion.status) {
        case 'approved':
          return 'completed'
        case 'pending':
          return 'awaiting-approval'
        case 'rejected':
          return 'pending'
        default:
          return 'pending'
      }
    }
    return 'pending'
  }

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return <IconMap type="calendar" size={16} className="text-blue-600" />
      case 'weekly':
        return <IconMap type="calendar" size={16} className="text-green-600" />
      case 'monthly':
        return <IconMap type="calendar" size={16} className="text-purple-600" />
      case 'once':
        return <IconMap type="target" size={16} className="text-orange-600" />
      default:
        return <IconMap type="tasks" size={16} className="text-gray-600" />
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'Daglig'
      case 'weekly':
        return 'Ukentlig'
      case 'monthly':
        return 'Månedlig'
      case 'once':
        return 'Én gang'
      default:
        return 'Ukjent'
    }
  }

  const handleTaskCompletion = async (shouldComplete: boolean) => {
    if (!currentUser || !currentFamily) return
    
    setIsProcessingCompletion(true)
    
    try {
      if (shouldComplete && taskStatus !== 'completed') {
        // Create a new completion record
        await completionService.createCompletion({
          taskId: task.id,
          userId: currentUser.id,
          familyId: currentFamily.id,
          completedAt: new Date(),
          status: 'pending',
          pointsAwarded: task.points,
          allowanceAwarded: task.allowanceEnabled ? task.allowanceAmount : undefined
        })
        
        // Notify parent component to refresh data
        onCompletionUpdate?.()
      } else if (!shouldComplete && completion) {
        // Handle unchecking - for now just call the original handler
        onToggleComplete?.(task.id, false)
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
      // TODO: Show error notification when integrated with notification system
    } finally {
      setIsProcessingCompletion(false)
    }
  }

  const taskStatus = getTaskStatus()
  const isCompleted = taskStatus === 'completed'
  const isPending = taskStatus === 'awaiting-approval'

  return (
    <div
      className={cn(
        'relative transition-all duration-200 hover:shadow-md',
        !task.isActive && 'opacity-60 bg-gray-50',
        isCompleted && 'border-green-300 bg-green-50',
        isPending && 'border-blue-300 bg-blue-50',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Card className={className}>
      {/* Priority indicator */}
      {task.points >= 50 && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" title="Høy prioritet" />
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-2">
              {/* Selection checkbox */}
              {onSelect && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect(task.id, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              )}

              {/* Completion checkbox */}
              {(onToggleComplete || onCompletionUpdate) && (
                <button
                  onClick={() => handleTaskCompletion(taskStatus !== 'completed')}
                  className={cn(
                    'w-6 h-6 rounded border-2 flex items-center justify-center text-sm transition-colors',
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isPending
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-300 hover:border-gray-400',
                    isProcessingCompletion && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={!task.isActive || isProcessingCompletion}
                >
                  {isProcessingCompletion ? (
                    <IconMap type="clock" size={14} className="animate-spin" />
                  ) : isCompleted ? (
                    <IconMap type="complete" size={14} />
                  ) : isPending ? (
                    <IconMap type="eye" size={14} />
                  ) : ''}
                </button>
              )}

              {/* Title */}
              <h3 className={cn(
                'text-lg font-semibold flex-1',
                isCompleted ? 'text-green-800 line-through' : 'text-gray-900'
              )}>
                {task.title}
              </h3>

              {/* Status indicator */}
              <StatusIndicator status={taskStatus as any} size="sm" />
            </div>

            {/* Task details */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              {/* Frequency */}
              <div className="flex items-center space-x-1">
                {getFrequencyIcon(task.frequency)}
                <span>{getFrequencyLabel(task.frequency)}</span>
              </div>

              {/* Assigned user */}
              {assignedUser && (
                <div className="flex items-center space-x-1">
                  <IconMap type="user" size={16} />
                  <span>{assignedUser.name}</span>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    assignedUser.role === 'parent'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  )}>
                    {assignedUser.role === 'parent' ? 'Forelder' : 'Barn'}
                  </span>
                </div>
              )}

              {/* Points */}
              <div className="flex items-center space-x-1">
                <IconMap type="target" size={16} className="text-blue-600" />
                <span>{task.points} poeng</span>
              </div>

              {/* Allowance */}
              {task.allowanceEnabled && task.allowanceAmount && (
                <div className="flex items-center space-x-1">
                  <IconMap type="money" size={16} className="text-green-600" />
                  <span>{task.allowanceAmount} kr</span>
                </div>
              )}

              {/* Active status */}
              {!task.isActive && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                  Inaktiv
                </span>
              )}
            </div>

            {/* Description preview */}
            {task.description && (
              <p className={cn(
                'text-sm text-gray-600 mb-3',
                !isExpanded && 'line-clamp-2'
              )}>
                {task.description}
              </p>
            )}

            {/* Expandable details */}
            {isExpanded && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Oppgavedetaljer</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Opprettet:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(task.createdAt).toLocaleDateString('no-NO')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Opprettet av:</span>
                    <span className="ml-2 text-gray-600">
                      {task.createdBy}
                    </span>
                  </div>
                  {completion && (
                    <>
                      <div>
                        <span className="font-medium text-gray-700">Fullført:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(completion.completedAt).toLocaleDateString('no-NO')}
                        </span>
                      </div>
                      {completion.approvedAt && (
                        <div>
                          <span className="font-medium text-gray-700">Godkjent:</span>
                          <span className="ml-2 text-gray-600">
                            {new Date(completion.approvedAt).toLocaleDateString('no-NO')}
                          </span>
                        </div>
                      )}
                      {completion.notes && (
                        <div className="sm:col-span-2">
                          <span className="font-medium text-gray-700">Notater:</span>
                          <p className="mt-1 text-gray-600">{completion.notes}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn(
            'flex flex-col space-y-1 ml-4 transition-opacity duration-200',
            showActions ? 'opacity-100' : 'opacity-0'
          )}>
            {/* Expand/collapse */}
            {onToggleExpand && (task.description || completion) && (
              <button
                onClick={onToggleExpand}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title={isExpanded ? 'Skjul detaljer' : 'Vis detaljer'}
              >
                <IconMap type={isExpanded ? 'up' : 'down'} size={16} />
              </button>
            )}

            {/* Activation toggle */}
            {onToggleActive && (
              <button
                onClick={async () => {
                  setIsTogglingActive(true)
                  try {
                    await onToggleActive(task.id, !task.isActive)
                  } finally {
                    setIsTogglingActive(false)
                  }
                }}
                disabled={isTogglingActive}
                className={cn(
                  "p-2 rounded transition-colors",
                  task.isActive
                    ? "text-green-600 hover:text-green-800 hover:bg-green-100"
                    : "text-gray-400 hover:text-green-600 hover:bg-green-100",
                  isTogglingActive && "opacity-50 cursor-not-allowed"
                )}
                title={task.isActive ? "Deaktiver oppgave" : "Aktiver oppgave"}
              >
                {isTogglingActive ? (
                  <IconMap type="clock" size={16} className="animate-spin" />
                ) : task.isActive ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                ) : (
                  <div className="w-3 h-3 border-2 border-gray-400 rounded-full" />
                )}
              </button>
            )}

            {/* Edit */}
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                title="Rediger oppgave"
              >
                <IconMap type="edit" size={16} />
              </button>
            )}

            {/* Delete */}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                title="Slett oppgave"
              >
                <IconMap type="delete" size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Reassignment */}
        {onAssign && availableUsers.length > 0 && showActions && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Tildel til:</span>
              <select
                value={task.assignedTo}
                onChange={async (e) => {
                  const newUserId = e.target.value
                  if (newUserId === task.assignedTo) return // No change
                  
                  setIsReassigning(true)
                  try {
                    await onAssign(task.id, newUserId)
                  } catch (error) {
                    console.error('Assignment failed:', error)
                    // Reset select to original value on error
                    e.target.value = task.assignedTo
                  } finally {
                    setIsReassigning(false)
                  }
                }}
                disabled={isReassigning || !task.isActive}
                className={cn(
                  "text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  (isReassigning || !task.isActive) && "opacity-50 cursor-not-allowed"
                )}
              >
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role === 'parent' ? 'Forelder' : 'Barn'})
                  </option>
                ))}
              </select>
              {isReassigning && (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {!task.isActive && (
              <p className="text-xs text-gray-500 mt-1">
                Inaktive oppgaver kan ikke tilldeles på nytt
              </p>
            )}
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  )
}

export default TaskItem