import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { allowanceService, type WeeklyAllowanceCalculation, type AllowancePayment } from '@/services/allowanceService'
import IconMap from '@/components/IconMap'

interface AllowanceHistoryProps {
  userId?: string
  limit?: number
  showPaymentActions?: boolean
  className?: string
}

const AllowanceHistory: React.FC<AllowanceHistoryProps> = ({
  userId,
  limit = 12,
  showPaymentActions = false,
  className = ''
}) => {
  const { currentUser, currentFamily } = useUser()
  const [history, setHistory] = useState<WeeklyAllowanceCalculation[]>([])
  const [payments, setPayments] = useState<AllowancePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  const targetUserId = userId || currentUser?.id

  // Load allowance history and payments
  const loadData = async () => {
    if (!targetUserId || !currentFamily) return

    setLoading(true)
    setError(null)
    
    try {
      const [historyData, paymentsData] = await Promise.all([
        allowanceService.getAllowanceHistory(targetUserId, limit),
        allowanceService.getPaymentsByUser(targetUserId)
      ])
      
      setHistory(historyData)
      setPayments(paymentsData)
    } catch (err) {
      console.error('Failed to load allowance data:', err)
      setError('Kunne ikke laste lommepenge-historikk')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [targetUserId, currentFamily, limit])

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

  // Get week key for comparison
  const getWeekKey = (weekStart: Date) => {
    return weekStart.toISOString().split('T')[0]
  }

  // Check if week has payment
  const getWeekPayment = (week: WeeklyAllowanceCalculation): AllowancePayment | undefined => {
    return payments.find(payment => 
      getWeekKey(payment.weekStart) === getWeekKey(week.weekStart)
    )
  }

  // Calculate monthly totals
  const getMonthlyTotals = () => {
    const monthlyData: { [key: string]: { earned: number; paid: number; pending: number } } = {}
    
    history.forEach(week => {
      const monthKey = `${week.weekStart.getFullYear()}-${week.weekStart.getMonth()}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { earned: 0, paid: 0, pending: 0 }
      }
      
      monthlyData[monthKey].earned += week.totalEarned
      monthlyData[monthKey].paid += week.totalPaid
      monthlyData[monthKey].pending += week.totalPending
    })
    
    return monthlyData
  }

  // Create payment request
  const requestPayment = async (week: WeeklyAllowanceCalculation) => {
    try {
      if (!currentFamily) return
      
      const completionIds = week.completions.map(c => c.completion.id)
      
      await allowanceService.createPayment({
        userId: targetUserId!,
        familyId: currentFamily.id,
        amount: week.totalPending,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        taskCompletions: completionIds,
        paidAt: new Date(),
        paidBy: '', // To be set when actually paid
        status: 'pending',
        notes: `Automatisk forespørsel for uke ${formatWeekRange(week.weekStart, week.weekEnd)}`
      })
      
      await loadData() // Refresh data
    } catch (err) {
      console.error('Failed to request payment:', err)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border rounded">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center py-8">
          <IconMap type="warning" size={48} className="mx-auto block mb-2 text-yellow-500" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Prøv igjen
          </button>
        </div>
      </div>
    )
  }

  const monthlyTotals = getMonthlyTotals()

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
          <IconMap type="chart" size={24} />
          <span>Lommepenge-historikk</span>
        </h2>
        <button
          onClick={loadData}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Oppdater"
        >
          <IconMap type="refresh" size={20} />
        </button>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(history.reduce((sum, week) => sum + week.totalEarned, 0))}
          </div>
          <div className="text-sm text-green-700">Total opptjent</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(history.reduce((sum, week) => sum + week.totalPending, 0))}
          </div>
          <div className="text-sm text-blue-700">Venter utbetaling</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {formatCurrency(history.reduce((sum, week) => sum + week.totalPaid, 0))}
          </div>
          <div className="text-sm text-gray-700">Totalt utbetalt</div>
        </div>
      </div>

      {/* Weekly history */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Ukentlig oversikt ({history.length} uker)
        </h3>
        
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((week, index) => {
              const weekPayment = getWeekPayment(week)
              const isCurrentWeek = index === 0
              const weekKey = getWeekKey(week.weekStart)
              const isExpanded = selectedWeek === weekKey
              
              return (
                <div 
                  key={weekKey}
                  className={`border rounded-lg overflow-hidden ${
                    isCurrentWeek ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {/* Week summary */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedWeek(isExpanded ? null : weekKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">
                            {formatWeekRange(week.weekStart, week.weekEnd)}
                            {isCurrentWeek && (
                              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Denne uken
                              </span>
                            )}
                          </h4>
                          
                          {weekPayment && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              weekPayment.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : weekPayment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {weekPayment.status === 'paid' ? 'Utbetalt' : 
                               weekPayment.status === 'pending' ? 'Venter betaling' : 'Kansellert'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>{week.completions.length} oppgaver</span>
                          <span>Opptjent: {formatCurrency(week.totalEarned)}</span>
                          {week.totalPending > 0 && (
                            <span className="text-blue-600">
                              Venter: {formatCurrency(week.totalPending)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Payment actions */}
                        {showPaymentActions && week.totalPending > 0 && !weekPayment && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              requestPayment(week)
                            }}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Be om utbetaling
                          </button>
                        )}
                        
                        <span className="text-gray-400">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <h5 className="font-medium text-gray-900 mb-3">
                        Oppgaver ({week.completions.length})
                      </h5>
                      
                      {week.completions.length > 0 ? (
                        <div className="space-y-2">
                          {week.completions.map((completion) => (
                            <div 
                              key={completion.completion.id}
                              className="flex items-center justify-between p-3 bg-white rounded border"
                            >
                              <div>
                                <div className="font-medium text-gray-900">
                                  {completion.task.title}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {new Date(completion.completion.completedAt).toLocaleDateString('no-NO')}
                                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
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
                              </div>
                              <div className="font-bold text-gray-900">
                                {formatCurrency(completion.allowanceAmount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          Ingen oppgaver med lommepenger denne uken
                        </p>
                      )}
                      
                      {/* Payment details */}
                      {weekPayment && (
                        <div className="mt-4 p-3 bg-blue-50 rounded border">
                          <h6 className="font-medium text-blue-900 mb-2">Betalingsinformasjon</h6>
                          <div className="text-sm text-blue-800">
                            <div>Beløp: {formatCurrency(weekPayment.amount)}</div>
                            <div>Status: {weekPayment.status === 'paid' ? 'Utbetalt' : 
                                                weekPayment.status === 'pending' ? 'Venter' : 'Kansellert'}</div>
                            {weekPayment.paidBy && (
                              <div>Utbetalt av: {weekPayment.paidBy}</div>
                            )}
                            {weekPayment.notes && (
                              <div className="mt-2">Notater: {weekPayment.notes}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <IconMap type="chart" size={48} className="mx-auto block mb-2" />
            <p>Ingen lommepenge-historikk ennå</p>
            <p className="text-sm mt-1">Fullfør oppgaver som gir lommepenger for å starte!</p>
          </div>
        )}
      </div>

      {/* Total pending payments callout */}
      {history.reduce((sum, week) => sum + week.totalPending, 0) > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <IconMap type="warning" size={20} className="text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-800">
                Venter utbetaling: {formatCurrency(history.reduce((sum, week) => sum + week.totalPending, 0))}
              </h4>
              <p className="text-sm text-yellow-700">
                Du har godkjente oppgaver som venter på utbetaling
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AllowanceHistory 