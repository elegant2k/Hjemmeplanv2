import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useFamilyPoints } from '@/hooks/useFamilyPoints'
import { taskService } from '@/services/taskService'
import FamilyActivityDialog from '@/components/FamilyActivityDialog'
import EmptyState from '@/components/EmptyState'
import type { Task } from '@/models'

const FamilyActivitiesPage: React.FC = () => {
  const { currentUser } = useUser()
  const { familyPoints, isLoading: familyPointsLoading, error: familyPointsError } = useFamilyPoints()
  const [familyActivities, setFamilyActivities] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Task | undefined>(undefined)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')

  // Load family activities
  useEffect(() => {
    const loadFamilyActivities = async () => {
      if (!currentUser?.familyId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const allTasks = await taskService.getTasks()
        const familyTasks = allTasks.filter(task => 
          task.familyId === currentUser.familyId && task.isFamily
        )

        setFamilyActivities(familyTasks)
      } catch (err) {
        console.error('Error loading family activities:', err)
        setError('Kunne ikke laste familieaktiviteter')
      } finally {
        setIsLoading(false)
      }
    }

    loadFamilyActivities()
  }, [currentUser?.familyId])

  // Handle creating new activity
  const handleCreateActivity = () => {
    setEditingActivity(undefined)
    setIsDialogOpen(true)
  }

  // Handle editing activity
  const handleEditActivity = (activity: Task) => {
    setEditingActivity(activity)
    setIsDialogOpen(true)
  }

  // Handle dialog success
  const handleDialogSuccess = async (activity: Task) => {
    // Refresh activities list
    const allTasks = await taskService.getTasks()
    const familyTasks = allTasks.filter(task => 
      task.familyId === currentUser?.familyId && task.isFamily
    )
    setFamilyActivities(familyTasks)
  }

  // Handle activity toggle
  const handleToggleActivity = async (activity: Task) => {
    try {
      await taskService.updateTask(activity.id, {
        isActive: !activity.isActive
      })

      // Update local state
      setFamilyActivities(prev =>
        prev.map(a => a.id === activity.id ? { ...a, isActive: !a.isActive } : a)
      )
    } catch (err) {
      console.error('Error toggling activity:', err)
      setError('Kunne ikke oppdatere aktivitet')
    }
  }

  // Handle activity deletion
  const handleDeleteActivity = async (activity: Task) => {
    if (!confirm(`Er du sikker på at du vil slette "${activity.title}"?`)) {
      return
    }

    try {
      await taskService.deleteTask(activity.id)

      // Update local state
      setFamilyActivities(prev => prev.filter(a => a.id !== activity.id))
    } catch (err) {
      console.error('Error deleting activity:', err)
      setError('Kunne ikke slette aktivitet')
    }
  }

  // Filter activities
  const filteredActivities = familyActivities.filter(activity => {
    switch (filter) {
      case 'active': return activity.isActive
      case 'inactive': return !activity.isActive
      default: return true
    }
  })

  // Get frequency display text
  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Daglig'
      case 'weekly': return 'Ukentlig'
      case 'monthly': return 'Månedlig'
      case 'once': return 'Engangs'
      default: return freq
    }
  }

  // Get frequency color
  const getFrequencyColor = (freq: string) => {
    switch (freq) {
      case 'daily': return 'bg-green-100 text-green-800'
      case 'weekly': return 'bg-blue-100 text-blue-800'
      case 'monthly': return 'bg-purple-100 text-purple-800'
      case 'once': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Laster familieaktiviteter...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Familieaktiviteter</h1>
            <p className="text-gray-600 mt-2">
              Opprett og administrer aktiviteter som hele familien kan delta i sammen
            </p>
          </div>
          
          {currentUser?.role === 'parent' && (
            <button
              onClick={handleCreateActivity}
              className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              + Ny aktivitet
            </button>
          )}
        </div>

        {/* Family Points Summary */}
        {familyPoints && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">Familiepoeng</h3>
                <p className="text-blue-700">Totalt opptjent gjennom familieaktiviteter</p>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {familyPoints.totalPoints} ⭐
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'active', label: 'Aktive', count: familyActivities.filter(a => a.isActive).length },
              { key: 'inactive', label: 'Inaktive', count: familyActivities.filter(a => !a.isActive).length },
              { key: 'all', label: 'Alle', count: familyActivities.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <EmptyState
          type="tasks"
          title={
            filter === 'active' ? 'Ingen aktive familieaktiviteter' :
            filter === 'inactive' ? 'Ingen inaktive familieaktiviteter' :
            'Ingen familieaktiviteter opprettet ennå'
          }
          description={
            filter === 'active' ? 'Aktiver eksisterende aktiviteter eller opprett nye for å komme i gang.' :
            filter === 'inactive' ? 'Alle familieaktiviteter er aktive for øyeblikket.' :
            'Opprett din første familieaktivitet for å begynne å samle familiepoeng sammen.'
          }
          action={
            currentUser?.role === 'parent' && filter !== 'inactive' ? {
              label: 'Opprett aktivitet',
              onClick: handleCreateActivity
            } : undefined
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map(activity => (
            <div
              key={activity.id}
              className={`bg-white border rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md ${
                !activity.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Activity Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    {activity.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFrequencyColor(activity.frequency)}`}>
                    {getFrequencyText(activity.frequency)}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {activity.description}
                </p>

                {/* Activity Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">{activity.points}</div>
                    <div className="text-xs text-blue-700">Familiepoeng</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{activity.requiredParticipants || 1}</div>
                    <div className="text-xs text-green-700">Min. deltakere</div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`flex items-center text-sm ${
                    activity.isActive ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      activity.isActive ? 'bg-green-400' : 'bg-gray-400'
                    }`}></span>
                    {activity.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>

                {/* Action Buttons */}
                {currentUser?.role === 'parent' && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEditActivity(activity)}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      ✏️ Rediger
                    </button>
                    <button
                      onClick={() => handleToggleActivity(activity)}
                      className={`flex-1 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        activity.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:ring-yellow-500'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                      }`}
                    >
                      {activity.isActive ? '⏸️ Deaktiver' : '▶️ Aktiver'}
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(activity)}
                      className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    >
                      🗑️ Slett
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <FamilyActivityDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        activity={editingActivity}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}

export default FamilyActivitiesPage 