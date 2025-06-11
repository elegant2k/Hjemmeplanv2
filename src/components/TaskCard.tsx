import React from 'react'
import { cn } from '@/lib/utils'
import IconMap from '@/components/IconMap'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import StatusIndicator from '@/components/StatusIndicator'
import type { StatusType } from '@/components/StatusIndicator'

interface TaskCardProps {
  id: string
  title: string
  description?: string
  points: number
  assignedTo?: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'once'
  status: StatusType
  dueDate?: Date
  completedAt?: Date
  allowanceAmount?: number
  isActive?: boolean
  onToggleComplete?: () => void
  onEdit?: () => void
  onClick?: () => void
  className?: string
}

const TaskCard: React.FC<TaskCardProps> = ({
  title,
  description,
  points,
  assignedTo,
  frequency,
  status,
  dueDate,
  completedAt,
  allowanceAmount,
  isActive = true,
  onToggleComplete,
  onEdit,
  onClick,
  className
}) => {
  const getFrequencyIcon = (freq: string) => {
    switch (freq) {
      case 'daily':
        return <IconMap type="calendar" size={16} />
      case 'weekly':
        return <IconMap type="calendar" size={16} />
      case 'monthly':
        return <IconMap type="calendar" size={16} />
      case 'once':
        return <IconMap type="target" size={16} />
      default:
        return <IconMap type="tasks" size={16} />
    }
  }

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('no-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const isOverdue = dueDate && new Date() > dueDate && status !== 'completed'

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        !isActive && 'opacity-60 bg-gray-50',
        isOverdue && 'border-red-300 bg-red-50',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      interactive={!!onClick}
      onClick={onClick}
    >
      {/* Priority indicator */}
      {isOverdue && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
      )}
      {status === 'completed' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className={cn(
                'text-lg font-semibold',
                status === 'completed' ? 'text-green-800 line-through' : 'text-gray-900'
              )}>
                {title}
              </h3>
              {!isActive && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                  Inaktiv
                </span>
              )}
            </div>
            
            {description && (
              <p className="text-sm text-gray-600 mb-2">
                {description}
              </p>
            )}

            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                {getFrequencyIcon(frequency)}
                <span>{getFrequencyLabel(frequency)}</span>
              </div>
              
              {assignedTo && (
                <div className="flex items-center space-x-1">
                  <IconMap type="user" size={16} />
                  <span>{assignedTo}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <StatusIndicator status={status} size="sm" />
            
            {onToggleComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleComplete()
                }}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  status === 'completed'
                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                disabled={!isActive}
              >
                {status === 'completed' ? (
                  <IconMap type="complete" size={16} />
                ) : (
                  <IconMap type="incomplete" size={16} />
                )}
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Poeng:</span>
              <span className="font-medium text-blue-600">{points}p</span>
            </div>
            
            {allowanceAmount && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Lommepenger:</span>
                <span className="font-medium text-green-600">{allowanceAmount} kr</span>
              </div>
            )}
          </div>

          <div className="space-y-1 text-right">
            {dueDate && (
              <div className="flex items-center justify-end space-x-2">
                <span className="text-gray-500">Forfaller:</span>
                <span className={cn(
                  'font-medium',
                  isOverdue ? 'text-red-600' : 'text-gray-900'
                )}>
                  {formatDate(dueDate)}
                </span>
              </div>
            )}
            
            {completedAt && (
              <div className="flex items-center justify-end space-x-2">
                <span className="text-gray-500">Fullført:</span>
                <span className="font-medium text-green-600">
                  {formatDate(completedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {onEdit && (
        <CardFooter className="pt-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Rediger oppgave
          </button>
        </CardFooter>
      )}
    </Card>
  )
}

export default TaskCard