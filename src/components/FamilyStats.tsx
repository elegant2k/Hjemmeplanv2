import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { IconMap } from '@/components/IconMap'
import type { Task, TaskCompletion, Streak, User } from '@/models'

interface FamilyStatsProps {
  users: User[]
  tasks: Task[]
  completions: TaskCompletion[]
  streaks: Streak[]
  timeRange?: 'today' | 'week' | 'month' | 'all'
}

const FamilyStats: React.FC<FamilyStatsProps> = ({
  tasks,
  completions,
  streaks,
  timeRange = 'today'
}) => {
  // Calculate date range for filtering
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (timeRange) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) }
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        return { start: monthStart, end: monthEnd }
      default:
        return { start: new Date(0), end: new Date() }
    }
  }

  const { start, end } = getDateRange()

  // Filter completions by date range
  const filteredCompletions = completions.filter(completion => {
    const completionDate = new Date(completion.completedAt)
    return completionDate >= start && completionDate < end
  })

  // Calculate family statistics
  const totalTasks = tasks.filter(task => task.isActive).length
  const completedTasks = filteredCompletions.filter(c => c.status === 'approved').length
  const pendingApproval = filteredCompletions.filter(c => c.status === 'pending').length
  const totalPoints = filteredCompletions.reduce((sum, c) => sum + c.pointsAwarded, 0)
  
  // Calculate completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  // Find longest current streak
  const activeStreaks = streaks.filter(s => s.isActive)
  const longestStreak = activeStreaks.length > 0 ? Math.max(...activeStreaks.map(s => s.currentStreak)) : 0
  
  // Calculate family performance level
  const getPerformanceLevel = (rate: number) => {
    if (rate >= 90) return { level: 'Utmerket', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (rate >= 70) return { level: 'Bra', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    if (rate >= 50) return { level: 'OK', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { level: 'Trenger forbedring', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const performance = getPerformanceLevel(completionRate)

  // Animation styles for progress bars
  const progressBarStyle = (percentage: number) => ({
    width: `${percentage}%`,
    transition: 'width 1s ease-in-out'
  })

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'today': return 'i dag'
      case 'week': return 'denne uken'
      case 'month': return 'denne måneden'
      default: return 'totalt'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Completion Rate */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Fullføringsgrad {getTimeRangeLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className={`text-2xl font-bold ${performance.color}`}>
                {completionRate}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${performance.bgColor.replace('bg-', 'bg-opacity-60 bg-')}`}
                  style={progressBarStyle(completionRate)}
                />
              </div>
              <div className={`text-xs mt-1 ${performance.color}`}>
                {performance.level}
              </div>
            </div>
            <div className="text-2xl">
              {completionRate >= 90 ? (
                <IconMap type="trophy" size={28} className="text-yellow-500" />
              ) : completionRate >= 70 ? (
                <IconMap type="target" size={28} className="text-blue-500" />
              ) : completionRate >= 50 ? (
                <IconMap type="fire" size={28} className="text-orange-500" />
              ) : (
                <IconMap type="chart" size={28} className="text-gray-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Completed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Oppgaver fullført
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {completedTasks}
              </div>
              <div className="text-xs text-gray-500">
                av {totalTasks} {getTimeRangeLabel()}
              </div>
              {pendingApproval > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  +{pendingApproval} venter godkjenning
                </div>
              )}
            </div>
            <div className="text-2xl">
              <IconMap type="complete" size={28} className="text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Earned */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Poeng opptjent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {totalPoints}
              </div>
              <div className="text-xs text-gray-500">
                {getTimeRangeLabel()}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <IconMap type="target" size={12} className="inline mr-1" />
                {completedTasks > 0 ? Math.round(totalPoints / completedTasks) : 0} per oppgave
              </div>
            </div>
            <div className="text-2xl">
              <IconMap type="target" size={28} className="text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Lengste streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {longestStreak}
              </div>
              <div className="text-xs text-gray-500">
                dager på rad
              </div>
              {activeStreaks.length > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  {activeStreaks.length} aktive streaks
                </div>
              )}
            </div>
            <div className="text-2xl">
              <IconMap type="fire" size={28} className="text-orange-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FamilyStats