import React, { useState, useEffect } from 'react'
import { useStreaks } from '@/hooks/useStreaks'
import { useUser } from '@/contexts/UserContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { Streak, Task, User } from '@/models'

interface StreakDisplayProps {
  userId?: string
  taskId?: string
  showHistory?: boolean
  compact?: boolean
  className?: string
}

interface StreakStats {
  totalActiveStreaks: number
  longestCurrentStreak: number
  streaksByTask: Array<{
    taskId: string
    taskTitle?: string
    currentStreak: number
    longestStreak: number
    isActive: boolean
    lastCompletionDate: Date
    frequency?: string
  }>
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  userId,
  taskId,
  showHistory = false,
  compact = false,
  className = ''
}) => {
  const { currentUser, currentFamily } = useUser()
  const { streaks, isLoading, error, getUserSummary } = useStreaks()
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])

  // Determine which user's streaks to show
  const targetUserId = userId || currentUser?.id

  useEffect(() => {
    const loadData = async () => {
      if (!targetUserId || !currentFamily) return

      try {
        // Load user streak summary
        const summary = await getUserSummary(targetUserId)
        setStreakStats(summary)

        // Load task data for context (simplified - in real app would come from taskService)
        const storedTasks = localStorage.getItem('tasks')
        if (storedTasks) {
          const allTasks: Task[] = JSON.parse(storedTasks)
          setTasks(allTasks.filter(t => t.familyId === currentFamily.id))
        }
      } catch (err) {
        console.error('Failed to load streak data:', err)
      }
    }

    loadData()
  }, [targetUserId, currentFamily, getUserSummary])

  const getTaskTitle = (taskId: string): string => {
    const task = tasks.find(t => t.id === taskId)
    return task?.title || `Oppgave ${taskId}`
  }

  const getStreakIcon = (streak: number): string => {
    if (streak === 0) return '⭕'
    if (streak < 3) return '🔥'
    if (streak < 7) return '🚀'
    if (streak < 14) return '⭐'
    if (streak < 30) return '🏆'
    return '👑'
  }

  const getStreakColor = (isActive: boolean, streak: number): string => {
    if (!isActive) return 'text-gray-500'
    if (streak === 0) return 'text-gray-600'
    if (streak < 3) return 'text-orange-600'
    if (streak < 7) return 'text-red-600'
    if (streak < 14) return 'text-purple-600'
    if (streak < 30) return 'text-blue-600'
    return 'text-yellow-600'
  }

  const formatDaysAgo = (date: Date): string => {
    const now = new Date()
    const diffTime = now.getTime() - new Date(date).getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'i dag'
    if (diffDays === 1) return 'i går'
    return `${diffDays} dager siden`
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Laster streaks...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-red-600 text-sm">
            Feil ved lasting av streaks: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!streakStats) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-gray-500 text-sm text-center">
            Ingen streak-data tilgjengelig
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter streaks if specific taskId is provided
  const displayStreaks = taskId 
    ? streakStats.streaksByTask.filter(s => s.taskId === taskId)
    : streakStats.streaksByTask

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <span className="text-lg">
          {getStreakIcon(streakStats.longestCurrentStreak)}
        </span>
        <span className={`font-bold ${getStreakColor(true, streakStats.longestCurrentStreak)}`}>
          {streakStats.longestCurrentStreak}
        </span>
        <span className="text-xs text-gray-500">
          streak{streakStats.longestCurrentStreak !== 1 ? 's' : ''}
        </span>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <span className="text-xl mr-2">🔥</span>
          Streak Oversikt
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {streakStats.totalActiveStreaks}
            </div>
            <div className="text-xs text-gray-600">Aktive streaks</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {streakStats.longestCurrentStreak}
            </div>
            <div className="text-xs text-gray-600">Lengste streak</div>
          </div>
        </div>

        {/* Individual Task Streaks */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-sm">Oppgave-streaks:</h4>
          {displayStreaks.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">
              Ingen streaks funnet
            </div>
          ) : (
            displayStreaks.map((streak) => (
              <div
                key={streak.taskId}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {getStreakIcon(streak.currentStreak)}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {getTaskTitle(streak.taskId)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Sist: {formatDaysAgo(streak.lastCompletionDate)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getStreakColor(streak.isActive, streak.currentStreak)}`}>
                    {streak.currentStreak}
                    {!streak.isActive && (
                      <span className="text-xs text-gray-400 ml-1">(inaktiv)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Best: {streak.longestStreak}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Streak History (if enabled) */}
        {showHistory && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 text-sm mb-2">Streak Historie:</h4>
            <div className="text-sm text-gray-500">
              Detaljert historikk kommer snart...
            </div>
          </div>
        )}

        {/* Motivational Messages */}
        {streakStats.longestCurrentStreak > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              {streakStats.longestCurrentStreak >= 7 ? 
                "🎉 Fantastisk! Du har holdt streaken din i over en uke!" :
                streakStats.longestCurrentStreak >= 3 ? 
                "💪 Flott! Du bygger gode vaner!" :
                "🌟 Bra start! Fortsett slik!"
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StreakDisplay 