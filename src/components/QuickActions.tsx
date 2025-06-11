import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import IconMap from '@/components/IconMap'

interface QuickActionsProps {
  onAddTask?: () => void
  onMarkAllComplete?: () => void
  onRefresh?: () => void
  onViewReports?: () => void
  isParent?: boolean
  isLoading?: boolean
  className?: string
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddTask,
  onMarkAllComplete,
  onRefresh,
  onViewReports,
  isParent = false,
  isLoading = false,
  className
}) => {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh && !refreshing) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setTimeout(() => setRefreshing(false), 500) // Minimum loading time for UX
      }
    }
  }

  const actions = [
    {
      key: 'refresh',
      label: 'Oppdater',
      icon: 'refresh',
      onClick: handleRefresh,
      loading: refreshing,
      available: true,
      variant: 'secondary' as const
    },
    {
      key: 'add-task',
      label: 'Ny oppgave',
      icon: 'add',
      onClick: onAddTask,
      loading: false,
      available: isParent,
      variant: 'primary' as const
    },
    {
      key: 'mark-all',
      label: 'Merk alle som fullført',
      icon: 'complete',
      onClick: onMarkAllComplete,
      loading: false,
      available: !isParent,
      variant: 'secondary' as const
    },
    {
      key: 'reports',
      label: 'Se rapporter',
      icon: 'chart',
      onClick: onViewReports,
      loading: false,
      available: isParent,
      variant: 'secondary' as const
    }
  ]

  const availableActions = actions.filter(action => action.available)

  if (availableActions.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {availableActions.map((action) => (
        <Button
          key={action.key}
          onClick={action.onClick}
          className={`${cn(
            'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
            action.variant === 'primary'
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow'
          )} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading || action.loading}
        >
          {action.loading ? (
            <IconMap type="refresh" size={16} className="animate-spin" />
          ) : (
            <IconMap type={action.icon as any} size={16} />
          )}
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}
    </div>
  )
}

export default QuickActions