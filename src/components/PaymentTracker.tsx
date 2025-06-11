import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { allowanceService, type AllowancePayment, type WeeklyAllowanceCalculation } from '@/services/allowanceService'
import { userService } from '@/services/userService'
import type { User } from '@/models'

interface PaymentTrackerProps {
  className?: string
}

const PaymentTracker: React.FC<PaymentTrackerProps> = ({ className = '' }) => {
  const { currentUser, currentFamily } = useUser()
  const [familyMembers, setFamilyMembers] = useState<User[]>([])
  const [pendingPayments, setPendingPayments] = useState<AllowancePayment[]>([])
  const [weeklyData, setWeeklyData] = useState<{ [userId: string]: WeeklyAllowanceCalculation }>({})
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  // Load family data and pending payments
  const loadData = async () => {
    if (!currentFamily) return

    setLoading(true)
    try {
      // Get family members with allowance enabled
      const members = await userService.getFamilyMembers(currentFamily.id)
      const allowanceEnabledMembers = members.filter(member => member.allowanceEnabled)
      setFamilyMembers(allowanceEnabledMembers)

      // Get pending payments
      const payments = await allowanceService.getPayments(currentFamily.id)
      const pending = payments.filter(payment => payment.status === 'pending')
      setPendingPayments(pending)

      // Get current week data for each member
      const weeklyDataMap: { [userId: string]: WeeklyAllowanceCalculation } = {}
      for (const member of allowanceEnabledMembers) {
        const weekData = await allowanceService.calculateCurrentWeekAllowance(member.id)
        weeklyDataMap[member.id] = weekData
      }
      setWeeklyData(weeklyDataMap)
    } catch (error) {
      console.error('Failed to load payment data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentFamily])

  // Mark payment as paid
  const markPaymentAsPaid = async (paymentId: string) => {
    if (!currentUser) return

    setProcessingPayment(paymentId)
    try {
      await allowanceService.markPaymentAsPaid(paymentId, currentUser.id)
      await loadData() // Refresh data
    } catch (error) {
      console.error('Failed to mark payment as paid:', error)
    } finally {
      setProcessingPayment(null)
    }
  }

  // Create payment for a user's current week
  const createWeeklyPayment = async (userId: string) => {
    if (!currentFamily) return

    const weekData = weeklyData[userId]
    if (!weekData || weekData.totalPending <= 0) return

    try {
      const completionIds = weekData.completions
        .filter(c => c.completion.status === 'approved')
        .map(c => c.completion.id)

      await allowanceService.createPayment({
        userId,
        familyId: currentFamily.id,
        amount: weekData.totalPending,
        weekStart: weekData.weekStart,
        weekEnd: weekData.weekEnd,
        taskCompletions: completionIds,
        paidAt: new Date(),
        paidBy: currentUser?.id || '',
        status: 'paid',
        notes: 'Direkte utbetaling fra foreldersektor'
      })

      await loadData() // Refresh data
    } catch (error) {
      console.error('Failed to create payment:', error)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(0)} kr`
  }

  // Format date range
  const formatWeekRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })
    const endStr = end.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })
    return `${startStr} - ${endStr}`
  }

  // Get member name
  const getMemberName = (userId: string) => {
    const member = familyMembers.find(m => m.id === userId)
    return member ? member.name : 'Ukjent bruker'
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalPendingAmount = Object.values(weeklyData).reduce((sum, week) => sum + week.totalPending, 0)

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
          <span>💳</span>
          <span>Lommepenge-utbetalinger</span>
        </h2>
        <button
          onClick={loadData}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          title="Oppdater"
        >
          🔄
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalPendingAmount)}
          </div>
          <div className="text-sm text-blue-700">Total å utbetale</div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {pendingPayments.length}
          </div>
          <div className="text-sm text-yellow-700">Ventende forespørsler</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {familyMembers.length}
          </div>
          <div className="text-sm text-green-700">Aktive medlemmer</div>
        </div>
      </div>

      {/* Current week summary for each member */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Denne ukens utbetalinger</h3>
        
        {familyMembers.length > 0 ? (
          <div className="space-y-4">
            {familyMembers.map(member => {
              const weekData = weeklyData[member.id]
              if (!weekData) return null

              return (
                <div key={member.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          member.role === 'parent' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {member.role === 'parent' ? 'Forelder' : 'Barn'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        <span>{weekData.completions.length} godkjente oppgaver</span>
                        <span className="mx-2">•</span>
                        <span>{formatWeekRange(weekData.weekStart, weekData.weekEnd)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(weekData.totalPending)}
                        </div>
                        <div className="text-sm text-gray-600">Å utbetale</div>
                      </div>
                      
                      {weekData.totalPending > 0 && (
                        <button
                          onClick={() => createWeeklyPayment(member.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Betal ut
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Show completed tasks */}
                  {weekData.completions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {weekData.completions.slice(0, 4).map(completion => (
                          <div key={completion.completion.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{completion.task.title}</span>
                            <span className="font-medium">{formatCurrency(completion.allowanceAmount)}</span>
                          </div>
                        ))}
                        {weekData.completions.length > 4 && (
                          <div className="text-sm text-gray-500 col-span-full">
                            +{weekData.completions.length - 4} flere oppgaver
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">👨‍👩‍👧‍👦</span>
            <p>Ingen familiemedlemmer med lommepenger aktivert</p>
          </div>
        )}
      </div>

      {/* Pending payment requests */}
      {pendingPayments.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ventende forespørsler ({pendingPayments.length})
          </h3>
          
          <div className="space-y-3">
            {pendingPayments.map(payment => (
              <div key={payment.id} className="border rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">
                        {getMemberName(payment.userId)}
                      </h4>
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        Venter betaling
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mt-1">
                      <span>{formatWeekRange(payment.weekStart, payment.weekEnd)}</span>
                      <span className="mx-2">•</span>
                      <span>{payment.taskCompletions.length} oppgaver</span>
                    </div>
                    
                    {payment.notes && (
                      <div className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Notater:</span> {payment.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Forespurt {payment.paidAt.toLocaleDateString('no-NO')}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => markPaymentAsPaid(payment.id)}
                      disabled={processingPayment === payment.id}
                      className={`px-4 py-2 rounded-lg text-white ${
                        processingPayment === payment.id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {processingPayment === payment.id ? 'Behandler...' : 'Marker som betalt'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No pending payments message */}
      {pendingPayments.length === 0 && totalPendingAmount === 0 && (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-2">✅</span>
          <p>Ingen ventende utbetalinger</p>
          <p className="text-sm mt-1">Alle lommepenger er oppdaterte!</p>
        </div>
      )}
    </div>
  )
}

export default PaymentTracker 