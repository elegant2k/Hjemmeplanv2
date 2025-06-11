import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { taskService } from '@/services/taskService'
import { useFamilyPoints } from '@/hooks/useFamilyPoints'
import { IconMap } from '@/components/IconMap'
import { Link } from 'react-router-dom'
import type { Task, User } from '@/models'

const AdminDashboard: React.FC = () => {
  const { availableUsers } = useUser()
  const { familyActivities, familyPoints, activeGoals } = useFamilyPoints()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)

  // Get current totals from familyPoints
  const totalPoints = familyPoints?.totalPoints || 0
  const currentGoal = activeGoals.length > 0 ? activeGoals[0] : null

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoadingTasks(true)
        const allTasks = await taskService.getTasks()
        setTasks(allTasks)
      } catch (error) {
        console.error('Error loading tasks:', error)
      } finally {
        setIsLoadingTasks(false)
      }
    }
    
    loadTasks()
  }, [])

  // Calculate statistics
  const familyMembers = availableUsers.filter((user: User) => user.role === 'child' || user.role === 'parent')
  const activeTasks = tasks.filter((task: Task) => task.assignedTo && task.isActive)
  
  // For completed tasks, we'll use family activities since tasks don't have completion status
  const completedToday = familyActivities.filter((activity: any) => {
    const today = new Date().toDateString()
    return new Date(activity.completedAt).toDateString() === today
  })

  // Quick stats for display
  const stats = [
    {
      title: 'Familiemedlemmer',
      value: familyMembers.length,
      iconType: 'family',
      description: 'Registrerte brukere',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Aktive oppgaver',
      value: activeTasks.length,
      iconType: 'tasks',
      description: 'Ventende oppgaver',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      title: 'Fullført i dag',
      value: completedToday.length,
      iconType: 'complete',
      description: 'Oppgaver fullført',
      color: 'bg-green-100 text-green-800'
    },
    {
      title: 'Familiepoeng',
      value: totalPoints,
      iconType: 'trophy',
      description: 'Totale poeng',
      color: 'bg-purple-100 text-purple-800'
    }
  ]

  // Quick actions
  const quickActions = [
    {
      title: 'Administrer familie',
      description: 'Rediger familieinnstillinger og grunnleggende informasjon',
      iconType: 'family',
      path: '/admin/family',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Behandle brukere',
      description: 'Legg til, rediger eller fjern familiemedlemmer',
      iconType: 'user',
      path: '/admin/users',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Systeminnstillinger',
      description: 'Konfigurer app-atferd og preferanser',
      iconType: 'settings',
      path: '/admin/settings',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Sikkerhetskopi og data',
      description: 'Eksporter, importer og administrer familiedata',
      iconType: 'save',
      path: '/admin/data',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Administrasjonsoversikt
        </h1>
        <p className="text-gray-600">
          Velkommen til administrasjonspanelet. Her kan du administrere familien og systeminnstillinger.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {stat.title}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${stat.color}`}>
                    {stat.description}
                  </span>
                </div>
              </div>
              <div className="text-3xl">
                <IconMap type={stat.iconType as any} size={28} className="text-gray-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hurtighandlinger</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${action.color}`}>
                  <IconMap type={action.iconType as any} size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {action.description}
                  </p>
                </div>
                <div className="text-gray-400">
                  <span className="text-lg">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <IconMap type="tasks" size={20} className="mr-2" />
            Nylige oppgaver
          </h3>
          
          {familyActivities.length > 0 ? (
            <div className="space-y-3">
              {familyActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Familieaktivitet</p>
                    <p className="text-xs text-gray-500">
                      Fullført: {new Date(activity.completedAt).toLocaleDateString('nb-NO')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {activity.pointsEarned} poeng
                    </span>
                    <IconMap type="complete" size={16} className="text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl mb-2 block">📝</span>
              <p className="text-gray-500">Ingen fullførte oppgaver ennå</p>
            </div>
          )}
        </div>

        {/* Family Points Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <IconMap type="chart" size={20} className="mr-2" />
            Aktivitetssammendrag
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Totale poeng:</span>
              <span className="text-lg font-semibold text-purple-600">{totalPoints}</span>
            </div>
            
            {currentGoal ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Nåværende mål:</span>
                  <span className="text-sm font-medium">{currentGoal.targetPoints} poeng</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((totalPoints / currentGoal.targetPoints) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{currentGoal.title}</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">Ingen aktive familiemål</p>
                <Link
                  to="/family-goals"
                  className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block"
                >
                  Opprett familiemål →
                </Link>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Familieaktiviteter:</span>
                <span className="text-sm font-medium">{familyActivities.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-500">●</span>
            <span className="text-sm text-gray-600">System status: Alle systemer fungerer normalt</span>
          </div>
          <div className="text-xs text-gray-500">
            Sist oppdatert: {new Date().toLocaleString('nb-NO')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard 