import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { allowanceService, type WeeklyAllowanceCalculation } from '@/services/allowanceService'

interface AllowanceSummaryProps {
  userId?: string
  weekOffset?: number // 0 = current week, -1 = last week, etc.
  showControls?: boolean
  className?: string
}

const AllowanceSummary: React.FC<AllowanceSummaryProps> = ({
  userId,
  weekOffset = 0,
  showControls = true,
  className = ''
}) => {
  const { currentUser, currentFamily } = useUser()
  const [summary, setSummary] = useState<WeeklyAllowanceCalculation | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(weekOffset)

  const targetUserId = userId || currentUser?.id

  // Calculate weekly allowance from service
  const loadAllowanceData = async () => {
    if (!targetUserId || !currentFamily) return

    setLoading(true)
    try {
      const { start, end } = allowanceService.getWeekDates(currentWeekOffset)
      const weeklyData = await allowanceService.calculateWeeklyAllowance(targetUserId, start, end)
      setSummary(weeklyData)
    } catch (error) {
      console.error('Failed to load allowance data:', error)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllowanceData()
  }, [targetUserId, currentFamily, currentWeekOffset])

  // Navigation handlers
  const goToPreviousWeek = () => {
    setCurrentWeekOffset(prev => prev - 1)
  }

  const goToNextWeek = () => {
    setCurrentWeekOffset(prev => prev + 1)
  }

  const goToCurrentWeek = () => {
    setCurrentWeekOffset(0)
  }

  // Refresh data
  const refreshData = () => {
    loadAllowanceData()
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(0)} kr`
  }

  // Format date range
  const formatWeekRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })
    const endStr = end.toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center py-8">
          <span className="text-4xl block mb-2">💰</span>
          <p className="text-gray-500">Kunne ikke laste lommepenge-oversikt</p>
          <button
            onClick={refreshData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Prøv igjen
          </button>
        </div>
      </div>
    )
  }

  const isCurrentWeek = currentWeekOffset === 0

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <span>💰</span>
            <span>Lommepenger</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {formatWeekRange(summary.weekStart, summary.weekEnd)}
            {isCurrentWeek && ' (denne uken)'}
          </p>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Forrige uke"
            >
              ←
            </button>
            
            {!isCurrentWeek && (
              <button
                onClick={goToCurrentWeek}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
              >
                Denne uken
              </button>
            )}
            
            {currentWeekOffset < 0 && (
              <button
                onClick={goToNextWeek}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Neste uke"
              >
                →
              </button>
            )}
            
            <button
              onClick={refreshData}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Oppdater"
            >
              🔄
            </button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalEarned)}
          </div>
          <div className="text-sm text-green-700">Opptjent total</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.totalPending)}
          </div>
          <div className="text-sm text-blue-700">Venter utbetaling</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {formatCurrency(summary.totalPaid)}
          </div>
          <div className="text-sm text-gray-700">Allerede utbetalt</div>
        </div>
      </div>

      {/* Completed tasks with allowance */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Oppgaver med lommepenger ({summary.completions.length})
        </h3>
        
        {summary.completions.length > 0 ? (
          <div className="space-y-3">
            {summary.completions.map((completion) => (
              <div 
                key={completion.completion.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">
                      {completion.task.title}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      completion.completion.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : completion.completion.status === 'pending'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {completion.completion.status === 'approved' ? 'Godkjent' : 
                       completion.completion.status === 'pending' ? 'Venter' : 'Avvist'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Fullført {new Date(completion.completion.completedAt).toLocaleDateString('no-NO')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {formatCurrency(completion.allowanceAmount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">💸</span>
            <p>Ingen oppgaver med lommepenger denne uken</p>
            <p className="text-sm mt-1">Fullfør oppgaver som gir lommepenger for å tjene!</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {isCurrentWeek && summary.totalPending > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium text-blue-900">
                Venter utbetaling: {formatCurrency(summary.totalPending)}
              </h4>
              <p className="text-sm text-blue-700">
                Be foreldrene dine om å utbetale lommepengene
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Send påminnelse
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AllowanceSummary 