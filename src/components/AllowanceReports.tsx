import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { allowanceService, type WeeklyAllowanceCalculation } from '@/services/allowanceService'
import { userService } from '@/services/userService'
import type { User } from '@/models'

interface AllowanceReportsProps {
  className?: string
}

interface FamilyReportData {
  totalEarned: number
  totalPaid: number
  totalPending: number
  memberReports: Array<{
    user: User
    weeklyData: WeeklyAllowanceCalculation[]
    monthlyTotal: number
    avgWeekly: number
  }>
}

interface ReportPeriod {
  label: string
  weeks: number
  months?: number
}

const AllowanceReports: React.FC<AllowanceReportsProps> = ({ className = '' }) => {
  const { currentFamily } = useUser()
  const [reportData, setReportData] = useState<FamilyReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>({ label: 'Siste 4 uker', weeks: 4 })
  const [selectedUser, setSelectedUser] = useState<string>('all')

  const reportPeriods: ReportPeriod[] = [
    { label: 'Siste 2 uker', weeks: 2 },
    { label: 'Siste 4 uker', weeks: 4 },
    { label: 'Siste 8 uker', weeks: 8 },
    { label: 'Siste 3 måneder', weeks: 12, months: 3 },
    { label: 'Siste 6 måneder', weeks: 26, months: 6 }
  ]

  // Load report data
  const loadReportData = async () => {
    if (!currentFamily) return

    setLoading(true)
    try {
      // Get family members with allowance enabled
      const allMembers = await userService.getUsersByFamily(currentFamily.id)
      const allowanceMembers = allMembers.filter(member => member.allowanceEnabled)

      if (allowanceMembers.length === 0) {
        setReportData({
          totalEarned: 0,
          totalPaid: 0,
          totalPending: 0,
          memberReports: []
        })
        return
      }

      // Get historical data for each member
      const memberReports = await Promise.all(
        allowanceMembers.map(async (user) => {
          const weeklyData = await allowanceService.getAllowanceHistory(user.id, selectedPeriod.weeks)
          const monthlyTotal = weeklyData.reduce((sum, week) => sum + week.totalEarned, 0)
          const avgWeekly = weeklyData.length > 0 ? monthlyTotal / weeklyData.length : 0

          return {
            user,
            weeklyData,
            monthlyTotal,
            avgWeekly
          }
        })
      )

      // Calculate totals
      const totalEarned = memberReports.reduce((sum, report) => sum + report.monthlyTotal, 0)
      const totalPaid = memberReports.reduce((sum, report) => 
        sum + report.weeklyData.reduce((weekSum, week) => weekSum + week.totalPaid, 0), 0
      )
      const totalPending = memberReports.reduce((sum, report) => 
        sum + report.weeklyData.reduce((weekSum, week) => weekSum + week.totalPending, 0), 0
      )

      setReportData({
        totalEarned,
        totalPaid,
        totalPending,
        memberReports
      })
    } catch (error) {
      console.error('Failed to load report data:', error)
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [currentFamily, selectedPeriod])

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(0)} kr`
  }

  // Generate CSV export
  const exportToCSV = () => {
    if (!reportData) return

    const csvData = []
    csvData.push(['Navn', 'Periode', 'Total opptjent', 'Utbetalt', 'Venter', 'Gjennomsnitt per uke'])

    reportData.memberReports.forEach(report => {
      csvData.push([
        report.user.name,
        selectedPeriod.label,
        report.monthlyTotal.toString(),
        report.weeklyData.reduce((sum, week) => sum + week.totalPaid, 0).toString(),
        report.weeklyData.reduce((sum, week) => sum + week.totalPending, 0).toString(),
        report.avgWeekly.toFixed(0)
      ])
    })

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `lommepenge_rapport_${selectedPeriod.label.toLowerCase().replace(/\s+/g, '_')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Get filtered member reports
  const getFilteredReports = () => {
    if (!reportData) return []
    if (selectedUser === 'all') return reportData.memberReports
    return reportData.memberReports.filter(report => report.user.id === selectedUser)
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center py-8">
          <span className="text-4xl block mb-2">📊</span>
          <p className="text-gray-500">Kunne ikke laste rapportdata</p>
          <button
            onClick={loadReportData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Prøv igjen
          </button>
        </div>
      </div>
    )
  }

  const filteredReports = getFilteredReports()

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
          <span>📊</span>
          <span>Lommepenge-rapporter</span>
        </h2>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            📥 Eksporter CSV
          </button>
          <button
            onClick={loadReportData}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Oppdater"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tidsperiode
          </label>
          <select
            value={selectedPeriod.label}
            onChange={(e) => {
              const period = reportPeriods.find(p => p.label === e.target.value)
              if (period) setSelectedPeriod(period)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            {reportPeriods.map(period => (
              <option key={period.label} value={period.label}>
                {period.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Familiemedlem
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Alle medlemmer</option>
            {reportData.memberReports.map(report => (
              <option key={report.user.id} value={report.user.id}>
                {report.user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(selectedUser === 'all' ? reportData.totalEarned : 
              filteredReports.reduce((sum, report) => sum + report.monthlyTotal, 0))}
          </div>
          <div className="text-sm text-green-700">Total opptjent ({selectedPeriod.label})</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(selectedUser === 'all' ? reportData.totalPending : 
              filteredReports.reduce((sum, report) => 
                sum + report.weeklyData.reduce((weekSum, week) => weekSum + week.totalPending, 0), 0))}
          </div>
          <div className="text-sm text-blue-700">Venter utbetaling</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {formatCurrency(selectedUser === 'all' ? reportData.totalPaid : 
              filteredReports.reduce((sum, report) => 
                sum + report.weeklyData.reduce((weekSum, week) => weekSum + week.totalPaid, 0), 0))}
          </div>
          <div className="text-sm text-gray-700">Allerede utbetalt</div>
        </div>
      </div>

      {/* Member reports */}
      <div className="space-y-6">
        {filteredReports.map(report => (
          <div key={report.user.id} className="border rounded-lg overflow-hidden">
            {/* Member header */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">{report.user.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    report.user.role === 'parent' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {report.user.role === 'parent' ? 'Forelder' : 'Barn'}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(report.monthlyTotal)}
                  </div>
                  <div className="text-sm text-gray-600">
                    ∅ {formatCurrency(report.avgWeekly)}/uke
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly breakdown */}
            <div className="p-6">
              {report.weeklyData.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Ukentlig fordeling ({report.weeklyData.length} uker)
                  </h4>
                  
                  <div className="grid gap-3">
                    {report.weeklyData.slice(0, 8).map((week, index) => {
                      const weekStart = week.weekStart.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })
                      const weekEnd = week.weekEnd.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium text-gray-900">
                              {weekStart} - {weekEnd}
                              {index === 0 && (
                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  Denne uken
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {week.completions.length} oppgaver
                              {week.totalPending > 0 && (
                                <span className="ml-2 text-blue-600">
                                  • {formatCurrency(week.totalPending)} venter
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-bold text-gray-900">
                              {formatCurrency(week.totalEarned)}
                            </div>
                            {week.totalEarned > 0 && (
                              <div className="text-sm text-gray-600">
                                ∅ {formatCurrency(week.totalEarned / Math.max(week.completions.length, 1))}/oppgave
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    
                    {report.weeklyData.length > 8 && (
                      <div className="text-center py-2 text-gray-500 text-sm">
                        +{report.weeklyData.length - 8} flere uker
                      </div>
                    )}
                  </div>
                  
                  {/* Top tasks for this member */}
                  <div className="mt-6">
                    <h5 className="font-medium text-gray-900 mb-3">Mest lønnsomme oppgaver</h5>
                    
                    {(() => {
                      // Aggregate tasks across all weeks
                      const taskMap = new Map<string, { title: string, count: number, totalAmount: number }>()
                      
                      report.weeklyData.forEach(week => {
                        week.completions.forEach(completion => {
                          const existing = taskMap.get(completion.task.id)
                          if (existing) {
                            existing.count += 1
                            existing.totalAmount += completion.allowanceAmount
                          } else {
                            taskMap.set(completion.task.id, {
                              title: completion.task.title,
                              count: 1,
                              totalAmount: completion.allowanceAmount
                            })
                          }
                        })
                      })
                      
                      const topTasks = Array.from(taskMap.values())
                        .sort((a, b) => b.totalAmount - a.totalAmount)
                        .slice(0, 5)
                      
                      return topTasks.length > 0 ? (
                        <div className="grid gap-2">
                          {topTasks.map((task, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">
                                {task.title} ({task.count}x)
                              </span>
                              <span className="font-medium">
                                {formatCurrency(task.totalAmount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Ingen oppgaver med lommepenger</p>
                      )
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-2xl block mb-2">📝</span>
                  <p>Ingen lommepenge-aktivitet i denne perioden</p>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl block mb-2">👥</span>
            <p>Ingen data tilgjengelig for valgte kriterier</p>
            <p className="text-sm mt-1">Prøv å justere tidsperiode eller brukerfilter</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AllowanceReports 