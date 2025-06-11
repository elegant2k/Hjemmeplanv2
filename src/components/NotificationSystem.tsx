import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { IconMap } from '@/components/IconMap'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

interface NotificationSystemProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemove
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

interface NotificationCardProps {
  notification: Notification
  onRemove: (id: string) => void
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onRemove
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = useCallback(() => {
    setIsRemoving(true)
    setTimeout(() => {
      onRemove(notification.id)
    }, 300)
  }, [onRemove, notification.id])

  useEffect(() => {
    // Slide in animation
    const showTimer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto-remove after duration
    const duration = notification.duration || 5000
    const removeTimer = setTimeout(() => {
      handleRemove()
    }, duration)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(removeTimer)
    }
  }, [notification.duration, handleRemove])

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <IconMap type="complete" size={18} />
      case 'error':
        return <IconMap type="rejected" size={18} />
      case 'warning':
        return <IconMap type="warning" size={18} />
      case 'info':
        return <IconMap type="info" size={18} />
      default:
        return <IconMap type="bell" size={18} />
    }
  }

  return (
    <div
      className={cn(
        'border rounded-lg shadow-lg p-4 transition-all duration-300 transform',
        getTypeStyles(notification.type),
        isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isRemoving && 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-lg">{getTypeIcon(notification.type)}</div>
          <div className="flex-1">
            <h4 className="font-medium">{notification.title}</h4>
            {notification.message && (
              <p className="text-sm mt-1 opacity-90">{notification.message}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="text-current opacity-50 hover:opacity-100 transition-opacity ml-2"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    setNotifications(prev => [...prev, newNotification])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const showSuccess = (title: string, message?: string) => {
    addNotification({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    addNotification({ type: 'error', title, message })
  }

  const showInfo = (title: string, message?: string) => {
    addNotification({ type: 'info', title, message })
  }

  const showWarning = (title: string, message?: string) => {
    addNotification({ type: 'warning', title, message })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning
  }
}

export default NotificationSystem