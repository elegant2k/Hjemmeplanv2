import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import FamilyMemberCard from '@/components/FamilyMemberCard'
import FamilyStats from '@/components/FamilyStats'
import TimeRangeFilter from '@/components/TimeRangeFilter'
import type { TimeRange } from '@/components/TimeRangeFilter'
import QuickActions from '@/components/QuickActions'
import EmptyState from '@/components/EmptyState'
import ApprovalDialog from '@/components/ApprovalDialog'
import NotificationSystem, { useNotifications } from '@/components/NotificationSystem'
import IconMap from '@/components/IconMap'
import { completionService } from '@/services/completionService'
import type { Task, TaskCompletion, Streak, User } from '@/models'
import { cn, getUserAvatarIcon } from '@/lib/utils'

const Dashboard: React.FC = () => {
  const { currentUser, currentFamily, availableUsers } = useUser()
  const { notifications, removeNotification, showSuccess, showError } = useNotifications()
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('today')
  const [selectedCompletion, setSelectedCompletion] = useState<{
    completion: TaskCompletion
    task: Task
    user: any
  } | null>(null)
  
  // Load saved filter state from localStorage
  useEffect(() => {
    const savedRange = localStorage.getItem('dashboard-time-range') as TimeRange
    if (savedRange && ['today', 'week', 'month', 'all'].includes(savedRange)) {
      setSelectedTimeRange(savedRange)
    }
  }, [])

  // Save filter state to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-time-range', selectedTimeRange)
  }, [selectedTimeRange])
  
  // Mock data - will be replaced with actual service calls
  const [tasks] = useState<Task[]>([
    {
      id: 'task-1',
      familyId: 'family-1',
      title: 'Rydde rommet',
      description: 'Rydde og organisere rommet sitt',
      assignedTo: 'user-3', // Emma
      frequency: 'daily',
      points: 10,
      allowanceAmount: 5,
      allowanceEnabled: true,
      isActive: true,
      createdBy: 'user-1',
      createdAt: new Date()
    },
    {
      id: 'task-2',
      familyId: 'family-1', 
      title: 'Hjelpe til med middag',
      assignedTo: 'user-4', // Lucas
      frequency: 'daily',
      points: 15,
      allowanceEnabled: false,
      isActive: true,
      createdBy: 'user-1',
      createdAt: new Date()
    },
    {
      id: 'task-3',
      familyId: 'family-1',
      title: 'Lekser',
      assignedTo: 'user-3', // Emma
      frequency: 'daily',
      points: 20,
      allowanceEnabled: false,
      isActive: true,
      createdBy: 'user-1',
      createdAt: new Date()
    },
    {
      id: 'task-4',
      familyId: 'family-1',
      title: 'Ta ut søppel',
      assignedTo: 'user-1', // Mamma
      frequency: 'weekly',
      points: 25,
      allowanceEnabled: false,
      isActive: true,
      createdBy: 'user-2',
      createdAt: new Date()
    }
  ])

  const [completions, setCompletions] = useState<TaskCompletion[]>([
    {
      id: 'completion-1',
      taskId: 'task-1',
      userId: 'user-3',
      familyId: 'family-1',
      completedAt: new Date(),
      status: 'pending',
      pointsAwarded: 10,
      allowanceAwarded: 5
    }
  ])

  const [streaks] = useState<Streak[]>([
    {
      id: 'streak-1',
      userId: 'user-3',
      taskId: 'task-1',
      familyId: 'family-1',
      currentStreak: 5,
      longestStreak: 8,
      lastCompletionDate: new Date(),
      isActive: true,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ])

  // Load completions from service
  const loadCompletions = async () => {
    try {
      const allCompletions = await completionService.getCompletions()
      setCompletions(allCompletions)
    } catch (error) {
      console.error('Failed to load completions:', error)
    }
  }

  // Load completions on mount and when family changes
  useEffect(() => {
    if (currentFamily) {
      loadCompletions()
    }
  }, [currentFamily])

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    console.log(`Task ${taskId} toggled to: ${completed}`)
    // TODO: Implement actual task completion logic
  }

  const handleCompletionUpdate = () => {
    // Force refresh of data - in a real app this would refresh from backend
    console.log('Completion updated - refreshing data')
    loadCompletions()
    showSuccess('Oppgave markert som fullført!', 'Venter på godkjenning fra foreldre.')
  }

  const handleApprovalClick = (completion: TaskCompletion) => {
    const task = tasks.find(t => t.id === completion.taskId)
    const user = availableUsers.find(u => u.id === completion.userId)
    
    if (task && user) {
      setSelectedCompletion({ completion, task, user })
    }
  }

  const handleApprovalSuccess = (updatedCompletion: TaskCompletion) => {
    setCompletions(prev => 
      prev.map(c => c.id === updatedCompletion.id ? updatedCompletion : c)
    )
    
    const task = tasks.find(t => t.id === updatedCompletion.taskId)
    const user = availableUsers.find(u => u.id === updatedCompletion.userId)
    
    if (updatedCompletion.status === 'approved') {
      showSuccess('Oppgave godkjent!', `${user?.name} har fått ${updatedCompletion.pointsAwarded} poeng${updatedCompletion.allowanceAwarded ? ` og ${updatedCompletion.allowanceAwarded} kr` : ''}.`)
    } else if (updatedCompletion.status === 'rejected') {
      showError('Oppgave avvist', `${task?.title} er sendt tilbake til ${user?.name}.`)
    }
    
    setSelectedCompletion(null)
  }

  const handleQuickActions = {
    addTask: () => {
      console.log('Add new task')
      // TODO: Navigate to task creation form
    },
    markAllComplete: () => {
      console.log('Mark all tasks complete')
      // TODO: Implement mark all complete logic
    },
    refresh: async () => {
      console.log('Refreshing dashboard data...')
      // TODO: Implement data refresh logic
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    },
    viewReports: () => {
      console.log('View reports')
      // TODO: Navigate to reports page
    }
  }

  // Check if family is in onboarding state (no members or no tasks)
  const isOnboarding = availableUsers.length === 0 || tasks.length === 0

  // Helper function to render avatars properly
  const renderAvatar = (user: User, size: number = 20) => {
    const iconType = getUserAvatarIcon(user)
    
    if (iconType) {
      return (
        <IconMap 
          type={iconType as any} 
          size={size} 
          className="text-gray-600"
        />
      )
    } else if (user.avatar) {
      // For other avatars, try to display normally
      return <span className="text-lg">{user.avatar}</span>
    } else {
      // Fallback to user icon
      return <IconMap type="user" size={size} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              Oversikt over {currentFamily?.name || 'familien'} og dagens oppgaver
            </p>
          </div>
          
          {/* Time Range Filter */}
          <TimeRangeFilter
            selectedRange={selectedTimeRange}
            onRangeChange={setSelectedTimeRange}
            className="shrink-0"
          />
        </div>
      </div>

      {/* Family Statistics */}
      <FamilyStats
        users={availableUsers}
        tasks={tasks}
        completions={completions}
        streaks={streaks}
        timeRange={selectedTimeRange}
      />

      {/* Pending Completions Section for Parents */}
      {currentUser?.role === 'parent' && completions.filter(c => c.status === 'pending').length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
            <IconMap type="eye" size={24} className="mr-2" />
            Venter på godkjenning ({completions.filter(c => c.status === 'pending').length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completions
              .filter(c => c.status === 'pending')
              .map(completion => {
                const task = tasks.find(t => t.id === completion.taskId)
                const user = availableUsers.find(u => u.id === completion.userId)
                
                if (!task || !user) return null
                
                return (
                  <div
                    key={completion.id}
                    className="bg-white rounded-lg border border-blue-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleApprovalClick(completion)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {renderAvatar(user, 20)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600">{user.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fullført:</span>
                        <span className="text-gray-900">
                          {new Date(completion.completedAt).toLocaleDateString('no-NO')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Poeng:</span>
                        <span className="font-medium text-green-600">{completion.pointsAwarded}</span>
                      </div>
                      {completion.allowanceAwarded && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Lommepenger:</span>
                          <span className="font-medium text-green-600">{completion.allowanceAwarded} kr</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-blue-600 font-medium">Klikk for å godkjenne</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {currentUser && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {renderAvatar(currentUser, 20)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 flex items-center">
                  Velkommen, {currentUser.name}! <IconMap type="wave" size={16} className="ml-1" />
                </p>
                <p className="text-xs text-gray-600">
                  {currentUser.role === 'parent' ? 'Forelder' : 'Barn'} • 
                  {currentUser.role === 'child' && ' Husk å fullføre oppgavene dine!'}
                  {currentUser.role === 'parent' && ' Sjekk familiens fremgang'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <QuickActions
          onAddTask={handleQuickActions.addTask}
          onMarkAllComplete={handleQuickActions.markAllComplete}
          onRefresh={handleQuickActions.refresh}
          onViewReports={handleQuickActions.viewReports}
          isParent={currentUser?.role === 'parent'}
        />
      </div>
      
      {/* Family Members Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Familiemedlemmer ({availableUsers.length})
        </h2>
        
        {/* Responsive Grid: 1 column on mobile, 2 on tablet, 3-4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {availableUsers.map((user) => (
            <FamilyMemberCard
              key={user.id}
              user={user}
              tasks={tasks}
              completions={completions}
              streaks={streaks}
              onTaskToggle={handleTaskToggle}
              onCompletionUpdate={handleCompletionUpdate}
              isActive={currentUser?.id === user.id}
              onClick={() => console.log('Clicked user:', user.name)}
              className="min-h-[300px]" // Consistent card height
            />
          ))}
        </div>
        
        {/* Empty states */}
        {isOnboarding ? (
          <EmptyState
            type="onboarding"
            action={{
              label: 'Kom i gang',
              onClick: () => console.log('Start onboarding')
            }}
            secondaryAction={{
              label: 'Se demo',
              onClick: () => console.log('Show demo')
            }}
          />
        ) : availableUsers.length === 0 ? (
          <EmptyState
            type="family"
            action={{
              label: 'Legg til familiemedlem',
              onClick: () => console.log('Add family member')
            }}
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            type="tasks"
            action={{
              label: 'Opprett første oppgave',
              onClick: handleQuickActions.addTask
            }}
          />
        ) : null}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <IconMap type="complete" size={24} className="text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Fullførte oppgaver</h3>
              <p className="text-3xl font-bold text-green-600">12</p>
              <p className="text-sm text-gray-500">I dag</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <IconMap type="target" size={24} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Poeng opptjent</h3>
              <p className="text-3xl font-bold text-blue-600">285</p>
              <p className="text-sm text-gray-500">Denne uken</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <IconMap type="fire" size={24} className="text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Streak rekord</h3>
              <p className="text-3xl font-bold text-orange-600">7</p>
              <p className="text-sm text-gray-500">Dager på rad</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Dialog */}
      {selectedCompletion && (
        <ApprovalDialog
          completion={selectedCompletion.completion}
          task={selectedCompletion.task}
          assignedUser={selectedCompletion.user}
          onApprove={handleApprovalSuccess}
          onReject={handleApprovalSuccess}
          onClose={() => setSelectedCompletion(null)}
          isOpen={!!selectedCompletion}
        />
      )}

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}

export default Dashboard