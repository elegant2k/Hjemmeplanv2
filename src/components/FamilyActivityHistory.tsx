import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useFamilyPoints } from '@/hooks/useFamilyPoints'
import { taskService } from '@/services/taskService'
import ParticipationTracker from './ParticipationTracker'
import EmptyState from './EmptyState'
import type { FamilyActivity, Task } from '@/models'

interface FamilyActivityHistoryProps {
  maxItems?: number
  showPointsTotal?: boolean
  className?: string
}

interface ActivityWithTask extends FamilyActivity {
  task?: Task
}

const FamilyActivityHistory: React.FC<FamilyActivityHistoryProps> = ({
  maxItems = 20,
  showPointsTotal = true,
  className = ''
}) => {
  const { currentUser } = useUser()
  const { familyActivities, isLoading: activitiesLoading, error: activitiesError } = useFamilyPoints()
  const [activitiesWithTasks, setActivitiesWithTasks] = useState<ActivityWithTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all')

  // Load task details for activities
  useEffect(() => {
    const loadTaskDetails = async () => {
      if (!familyActivities || familyActivities.length === 0) {
        setActivitiesWithTasks([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Get unique task IDs
        const taskIds = [...new Set(familyActivities.map(activity => activity.taskId))]
        
        // Load all tasks
        const tasks = await Promise.all(
          taskIds.map(async (taskId) => {
            try {
              return await taskService.getTask(taskId)
            } catch (error) {
              console.error(`Error loading task ${taskId}:`, error)
              return null
            }
          })
        )

        // Create lookup map
        const taskMap = new Map()
        tasks.filter(Boolean).forEach(task => {
          if (task) taskMap.set(task.id, task)
        })

        // Merge activities with task data
        const enrichedActivities = familyActivities.map(activity => ({
          ...activity,
          task: taskMap.get(activity.taskId)
        }))

        setActivitiesWithTasks(enrichedActivities)
      } catch (error) {
        console.error('Error loading task details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTaskDetails()
  }, [familyActivities])

  // Filter activities by time range
  const getFilteredActivities = () => {
    if (!activitiesWithTasks) return []

    const now = new Date()
    let startDate: Date

    switch (filter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        return activitiesWithTasks.slice(0, maxItems)
    }

    return activitiesWithTasks
      .filter(activity => new Date(activity.completedAt) >= startDate)
      .slice(0, maxItems)
  }

  const filteredActivities = getFilteredActivities()

  // Calculate total points for filtered activities
  const totalPoints = filteredActivities.reduce((sum, activity) => sum + activity.pointsEarned, 0)

  // Format date
  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('nb-NO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format time ago
  const formatTimeAgo = (date: Date | string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffInMs = now.getTime() - activityDate.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) {
      return 'Nå nettopp'
    } else if (diffInHours < 24) {
      return `${diffInHours} timer siden`
    } else if (diffInDays === 1) {
      return 'I går'
    } else if (diffInDays < 7) {
      return `${diffInDays} dager siden`
    } else {
      return formatDate(date)
    }
  }

  if (activitiesLoading || isLoading) {
    return (
      <div className={`family-activity-history ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-6 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-20 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (activitiesError) {
    return (
      <div className={`family-activity-history ${className}`}>
        <div className="text-center py-8">
          <span className="text-red-600 text-2xl mb-2 block">⚠️</span>
          <p className="text-red-800">{activitiesError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`family-activity-history ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Aktivitetshistorikk</h3>
          <p className="text-sm text-gray-600">
            Oversikt over fullførte familieaktiviteter
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'Alle' },
            { key: 'week', label: 'Uke' },
            { key: 'month', label: 'Måned' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Points Summary */}
      {showPointsTotal && filteredActivities.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-900">
                Familiepoeng opptjent ({filter === 'all' ? 'totalt' : filter === 'week' ? 'denne uken' : 'denne måneden'})
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Fra {filteredActivities.length} aktivitet{filteredActivities.length !== 1 ? 'er' : ''}
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {totalPoints.toLocaleString('nb-NO')} ⭐
            </div>
          </div>
        </div>
      )}

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <EmptyState
          type="tasks"
          title="Ingen aktiviteter funnet"
          description={
            filter === 'week' ? 'Ingen familieaktiviteter fullført denne uken.' :
            filter === 'month' ? 'Ingen familieaktiviteter fullført denne måneden.' :
            'Ingen familieaktiviteter fullført ennå. Start med å fullføre familieoppgaver for å se historikk her.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Activity Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-xl">🏠</span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {activity.task?.title || 'Ukjent aktivitet'}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatTimeAgo(activity.completedAt)}</span>
                        <span>•</span>
                        <span className="font-medium text-blue-600">
                          +{activity.pointsEarned} ⭐
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Task Description */}
                  {activity.task?.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {activity.task.description}
                    </p>
                  )}

                  {/* Participation Tracker */}
                  <ParticipationTracker
                    activity={activity}
                    participants={activity.participants}
                    editable={false}
                    maxDisplay={3}
                    className="mb-2"
                  />
                </div>

                {/* Activity Date */}
                <div className="text-right ml-4">
                  <div className="text-xs text-gray-500">
                    {formatDate(activity.completedAt)}
                  </div>
                  {activity.task?.isFamily && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      Familieaktivitet
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Stats */}
              {activity.task?.requiredParticipants && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Krevde minimum {activity.task.requiredParticipants} deltaker{activity.task.requiredParticipants !== 1 ? 'e' : ''}
                    </span>
                    <span>
                      {activity.participants.length >= activity.task.requiredParticipants ? '✅ Oppfylt' : '⚠️ Ikke oppfylt'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Load More Message */}
          {activitiesWithTasks.length > filteredActivities.length && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                Viser {filteredActivities.length} av {activitiesWithTasks.length} aktiviteter
              </p>
              {filter === 'all' && activitiesWithTasks.length > maxItems && (
                <p className="text-xs text-gray-400 mt-1">
                  Juster maxItems for å vise flere
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FamilyActivityHistory 