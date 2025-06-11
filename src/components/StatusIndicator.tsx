import React from 'react'
import { cn } from '@/lib/utils'

export type StatusType = 
  | 'completed' 
  | 'pending' 
  | 'overdue' 
  | 'awaiting-approval'
  | 'active'
  | 'inactive'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

interface StatusIndicatorProps {
  status: StatusType
  label?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'badge' | 'dot' | 'pill'
  showIcon?: boolean
  className?: string
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  variant = 'badge',
  showIcon = true,
  className
}) => {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✅',
          defaultLabel: 'Fullført'
        }
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⏳',
          defaultLabel: 'Venter'
        }
      case 'overdue':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '⚠️',
          defaultLabel: 'Forsinket'
        }
      case 'awaiting-approval':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '👀',
          defaultLabel: 'Venter godkjenning'
        }
      case 'active':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '🟢',
          defaultLabel: 'Aktiv'
        }
      case 'inactive':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '⚪',
          defaultLabel: 'Inaktiv'
        }
      case 'success':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✓',
          defaultLabel: 'Suksess'
        }
      case 'warning':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⚠',
          defaultLabel: 'Advarsel'
        }
      case 'error':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '✗',
          defaultLabel: 'Feil'
        }
      case 'info':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: 'ℹ',
          defaultLabel: 'Info'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '○',
          defaultLabel: 'Ukjent'
        }
    }
  }

  const getSizeStyles = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1'
      case 'md':
        return 'text-sm px-3 py-1'
      case 'lg':
        return 'text-base px-4 py-2'
      default:
        return 'text-sm px-3 py-1'
    }
  }

  const getVariantStyles = (variant: 'badge' | 'dot' | 'pill') => {
    switch (variant) {
      case 'badge':
        return 'rounded border font-medium'
      case 'dot':
        return 'rounded-full w-3 h-3 border-2'
      case 'pill':
        return 'rounded-full border font-medium'
      default:
        return 'rounded border font-medium'
    }
  }

  const config = getStatusConfig(status)
  const displayLabel = label || config.defaultLabel

  if (variant === 'dot') {
    return (
      <div
        className={cn(
          'inline-block',
          config.color,
          getVariantStyles(variant),
          className
        )}
        title={displayLabel}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1',
        config.color,
        getSizeStyles(size),
        getVariantStyles(variant),
        className
      )}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{displayLabel}</span>
    </span>
  )
}

export default StatusIndicator