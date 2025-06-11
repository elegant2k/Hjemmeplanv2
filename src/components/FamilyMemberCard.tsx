import React, { useState } from 'react'
import { cn, getUserAvatarIcon, shouldUseIconMap } from '@/lib/utils'
import IconMap from '@/components/IconMap'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { completionService } from '@/services/completionService'
import { useUser } from '@/contexts/UserContext'
import type { User, Task, TaskCompletion, Streak } from '@/models'

interface FamilyMemberCardProps {
  user: User
  tasks: Task[]
  completions: TaskCompletion[]
  streaks: Streak[]
  onTaskToggle: (taskId: string, completed: boolean) => void
  onCompletionUpdate?: () => void
  isActive?: boolean
  onClick?: () => void
  className?: string
}

const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  user,
  tasks,
  completions,
  streaks,
  onTaskToggle,
  onCompletionUpdate,
  isActive = false,
  onClick,
  className
}) => {
  const { currentUser, currentFamily } = useUser()
  const [isProcessingCompletion, setIsProcessingCompletion] = useState<string | null>(null)
  
  // Get user's tasks
  const userTasks = tasks.filter(task => task.assignedTo === user.id && task.isActive)
  
  // Get today's date for filtering
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Calculate task statuses
  const getTaskStatus = (task: Task) => {
    const completion = completions.find(c => c.taskId === task.id && c.userId === user.id)
    
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
    
    // Check if task is overdue (simplified logic)
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'awaiting-approval':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <IconMap type="complete" size={16} className="text-green-600" />
      case 'pending':
        return <IconMap type="clock" size={16} className="text-yellow-600" />
      case 'overdue':
        return <IconMap type="warning" size={16} className="text-red-600" />
      case 'awaiting-approval':
        return <IconMap type="eye" size={16} className="text-blue-600" />
      default:
        return <IconMap type="tasks" size={16} className="text-gray-600" />
    }
  }

  const getRoleColor = (role: User['role']) => {
    return role === 'parent' 
      ? 'bg-purple-100 text-purple-800 border-purple-200'
      : 'bg-green-100 text-green-800 border-green-200'
  }

  // Calculate completion stats
  const completedTasks = userTasks.filter(task => getTaskStatus(task) === 'completed').length
  const totalTasks = userTasks.length
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  
  // Get user's longest streak
  const userStreaks = streaks.filter(streak => streak.userId === user.id)
  const maxStreak = userStreaks.length > 0 ? Math.max(...userStreaks.map(s => s.currentStreak)) : 0

  const handleTaskCompletion = async (task: Task, shouldComplete: boolean) => {
    if (!currentUser || !currentFamily) return
    
    // Only allow users to complete their own tasks
    if (task.assignedTo !== currentUser.id) return
    
    const taskStatus = getTaskStatus(task)
    setIsProcessingCompletion(task.id)
    
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
      } else if (!shouldComplete) {
        // Handle unchecking - call the original handler
        onTaskToggle(task.id, false)
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
    } finally {
      setIsProcessingCompletion(null)
    }
  }

  // Helper function to render avatars properly
  const renderAvatar = (user: User) => {
    const iconType = getUserAvatarIcon(user)
    
    if (iconType) {
      return (
        <IconMap 
          type={iconType as any} 
          size={24} 
          className="text-gray-600"
        />
      )
    } else if (user.avatar) {
      // For other avatars, try to display normally
      return <span className="text-xl">{user.avatar}</span>
    } else {
      // Fallback to role-based icon
      return (
        <IconMap 
          type={user.role === 'parent' ? 'parent' : 'child'} 
          size={24} 
          className="text-gray-600"
        />
      )
    }
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        isActive && 'ring-2 ring-blue-500 shadow-lg',
        onClick && 'cursor-pointer hover:shadow-lg',
        className
      )}
      interactive={!!onClick}
      onClick={onClick}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-xl',
              isActive ? 'ring-2 ring-blue-500 ring-offset-2' : 'bg-gray-100'
            )}>
              {renderAvatar(user)}
            </div>
            
            {/* User info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.name}
              </h3>
              <div className="flex items-center space-x-2">
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full border flex items-center space-x-1',
                  getRoleColor(user.role)
                )}>
                  <IconMap 
                    type={user.role === 'parent' ? 'parent' : 'child'} 
                    size={12}
                  />
                  <span>{user.role === 'parent' ? 'Forelder' : 'Barn'}</span>
                </span>
                {user.age && (
                  <span className="text-xs text-gray-500">
                    {user.age} år
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Streak indicator */}
          {maxStreak > 0 && (
            <div className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
              <IconMap type="fire" size={14} />
              <span className="font-medium">{maxStreak}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Fremgang i dag</span>
              <span>{completedTasks}/{totalTasks} fullført</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  completionPercentage === 100 ? 'bg-green-500' : 
                  completionPercentage >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                )}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Task list */}
        <div className="space-y-2">
          {userTasks.slice(0, 3).map((task) => {
            const taskStatus = getTaskStatus(task)
            return (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTaskCompletion(task, taskStatus !== 'completed')}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center text-xs transition-colors',
                      taskStatus === 'completed' 
                        ? 'bg-green-500 border-green-500 text-white'
                        : taskStatus === 'awaiting-approval'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300 hover:border-gray-400',
                      isProcessingCompletion === task.id && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={isProcessingCompletion === task.id || task.assignedTo !== currentUser?.id}
                  >
                    {isProcessingCompletion === task.id ? (
                      <IconMap type="clock" size={12} />
                    ) : taskStatus === 'completed' ? (
                      <IconMap type="complete" size={12} />
                    ) : taskStatus === 'awaiting-approval' ? (
                      <IconMap type="eye" size={12} />
                    ) : ''}
                  </button>
                  <span className={cn(
                    "text-sm truncate",
                    taskStatus === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                  )}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {task.points}p
                  </span>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full border',
                    getStatusColor(taskStatus)
                  )}>
                    {taskStatus === 'completed' && 'Fullført'}
                    {taskStatus === 'pending' && 'Venter'}
                    {taskStatus === 'awaiting-approval' && 'Venter godkjenning'}
                  </span>
                </div>
              </div>
            )
          })}
          
          {userTasks.length > 3 && (
            <div className="text-center">
              <span className="text-xs text-gray-500">
                +{userTasks.length - 3} flere oppgaver
              </span>
            </div>
          )}
          
          {userTasks.length === 0 && (
            <div className="text-center py-4">
              <span className="text-sm text-gray-500">
                Ingen oppgaver i dag
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FamilyMemberCard