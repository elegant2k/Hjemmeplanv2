import React, { useState } from 'react'
import { useUser } from '@/contexts/UserContext'

interface BackupData {
  familyId: string
  exportDate: string
  version: string
  data: {
    family: any
    users: any[]
    tasks: any[]
    completions: any[]
    rewards: any[]
    streaks: any[]
    settings: any
  }
}

interface ActivityReport {
  period: string
  familyStats: {
    totalTasks: number
    completedTasks: number
    familyPoints: number
    activeMembers: number
  }
  memberStats: Array<{
    userId: string
    name: string
    tasksCompleted: number
    pointsEarned: number
    streakDays: number
    rewardsClaimed: number
  }>
  taskStats: Array<{
    taskId: string
    title: string
    completionRate: number
    averagePoints: number
    totalCompletions: number
  }>
}

const DataManagement: React.FC = () => {
  const { currentUser } = useUser()
  const [activeTab, setActiveTab] = useState<'backup' | 'reports' | 'maintenance'>('backup')
  const [loading, setLoading] = useState(false)
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [reportData, setReportData] = useState<ActivityReport | null>(null)

  // Backup operations
  const exportData = async () => {
    setLoading(true)
    try {
      const familyId = currentUser?.familyId
      if (!familyId) {
        throw new Error('Ingen familie-ID funnet')
      }

      // Gather all data from localStorage
      const backupData: BackupData = {
        familyId,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        data: {
          family: JSON.parse(localStorage.getItem(`family_${familyId}`) || 'null'),
          users: JSON.parse(localStorage.getItem(`users_${familyId}`) || '[]'),
          tasks: JSON.parse(localStorage.getItem(`tasks_${familyId}`) || '[]'),
          completions: JSON.parse(localStorage.getItem(`completions_${familyId}`) || '[]'),
          rewards: JSON.parse(localStorage.getItem(`rewards_${familyId}`) || '[]'),
          streaks: JSON.parse(localStorage.getItem(`streaks_${familyId}`) || '[]'),
          settings: JSON.parse(localStorage.getItem(`settings_${familyId}`) || '{}')
        }
      }

      // Create and download backup file
      const dataStr = JSON.stringify(backupData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `hjemmeplan_backup_${familyId}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert('Backup exportert successfully!')
    } catch (error) {
      console.error('Feil ved eksport:', error)
      alert('Feil ved eksport av data')
    } finally {
      setLoading(false)
    }
  }

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      const backupData: BackupData = JSON.parse(text)

      // Validate backup data
      if (!backupData.familyId || !backupData.data) {
        throw new Error('Ugyldig backup fil')
      }

      // Confirm import
      const confirm = window.confirm(
        `Er du sikker på at du vil importere data fra ${backupData.exportDate}?\n\nDette vil overskrive alle eksisterende data!`
      )
      if (!confirm) return

      // Import data to localStorage
      const { familyId, data } = backupData
      
      if (data.family) {
        localStorage.setItem(`family_${familyId}`, JSON.stringify(data.family))
      }
      if (data.users) {
        localStorage.setItem(`users_${familyId}`, JSON.stringify(data.users))
      }
      if (data.tasks) {
        localStorage.setItem(`tasks_${familyId}`, JSON.stringify(data.tasks))
      }
      if (data.completions) {
        localStorage.setItem(`completions_${familyId}`, JSON.stringify(data.completions))
      }
      if (data.rewards) {
        localStorage.setItem(`rewards_${familyId}`, JSON.stringify(data.rewards))
      }
      if (data.streaks) {
        localStorage.setItem(`streaks_${familyId}`, JSON.stringify(data.streaks))
      }
      if (data.settings) {
        localStorage.setItem(`settings_${familyId}`, JSON.stringify(data.settings))
      }

      alert('Data importert successfully! Siden vil lastes på nytt.')
      window.location.reload()
    } catch (error) {
      console.error('Feil ved import:', error)
      alert('Feil ved import av data. Sjekk at filen er gyldig.')
    } finally {
      setLoading(false)
    }
  }

  const clearAllData = async () => {
    const familyId = currentUser?.familyId
    if (!familyId) return

    const confirm = window.confirm(
      'ADVARSEL: Dette vil slette ALL data for familien!\n\nEr du helt sikker? Denne handlingen kan ikke angres.'
    )
    if (!confirm) return

    const doubleConfirm = window.confirm('Siste sjanse! Er du HELT sikker på at du vil slette alt?')
    if (!doubleConfirm) return

    setLoading(true)
    try {
      // Remove all family data from localStorage
      const keys = Object.keys(localStorage).filter(key => key.includes(familyId))
      keys.forEach(key => localStorage.removeItem(key))

      alert('Alle data er slettet. Siden vil lastes på nytt.')
      window.location.reload()
    } catch (error) {
      console.error('Feil ved sletting:', error)
      alert('Feil ved sletting av data')
    } finally {
      setLoading(false)
    }
  }

  // Reporting operations
  const generateReport = async () => {
    setLoading(true)
    try {
      const familyId = currentUser?.familyId
      if (!familyId) return

      // Calculate date range based on period
      const now = new Date()
      let startDate: Date
      
      switch (reportPeriod) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      // Get data from localStorage
      const users = JSON.parse(localStorage.getItem(`users_${familyId}`) || '[]')
      const tasks = JSON.parse(localStorage.getItem(`tasks_${familyId}`) || '[]')
      const completions = JSON.parse(localStorage.getItem(`completions_${familyId}`) || '[]')
      const rewards = JSON.parse(localStorage.getItem(`rewards_${familyId}`) || '[]')

      // Filter completions for the period
      const periodCompletions = completions.filter((completion: any) => {
        const completionDate = new Date(completion.completedAt)
        return completionDate >= startDate && completionDate <= now
      })

      // Calculate family stats
      const familyStats = {
        totalTasks: tasks.length,
        completedTasks: periodCompletions.length,
        familyPoints: periodCompletions.reduce((sum: number, completion: any) => 
          sum + (completion.pointsEarned || 0), 0),
        activeMembers: users.filter((user: any) => user.isActive).length
      }

      // Calculate member stats
      const memberStats = users.map((user: any) => {
        const userCompletions = periodCompletions.filter((completion: any) => 
          completion.userId === user.id)
        
        return {
          userId: user.id,
          name: user.name,
          tasksCompleted: userCompletions.length,
          pointsEarned: userCompletions.reduce((sum: number, completion: any) => 
            sum + (completion.pointsEarned || 0), 0),
          streakDays: user.currentStreak || 0,
          rewardsClaimed: rewards.filter((reward: any) => 
            reward.claimedBy === user.id && 
            new Date(reward.claimedAt) >= startDate).length
        }
      })

      // Calculate task stats
      const taskStats = tasks.map((task: any) => {
        const taskCompletions = periodCompletions.filter((completion: any) => 
          completion.taskId === task.id)
        
        return {
          taskId: task.id,
          title: task.title,
          completionRate: tasks.length > 0 ? (taskCompletions.length / tasks.length) * 100 : 0,
          averagePoints: taskCompletions.length > 0 
            ? taskCompletions.reduce((sum: number, completion: any) => 
                sum + (completion.pointsEarned || 0), 0) / taskCompletions.length 
            : 0,
          totalCompletions: taskCompletions.length
        }
      })

      const report: ActivityReport = {
        period: `${startDate.toLocaleDateString('no-NO')} - ${now.toLocaleDateString('no-NO')}`,
        familyStats,
        memberStats,
        taskStats
      }

      setReportData(report)
    } catch (error) {
      console.error('Feil ved generering av rapport:', error)
      alert('Feil ved generering av rapport')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    if (!reportData) return

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `aktivitetsrapport_${reportPeriod}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const tabs = [
    { id: 'backup', label: 'Backup & Gjenoppretting', icon: '💾' },
    { id: 'reports', label: 'Aktivitetsrapporter', icon: '📊' },
    { id: 'maintenance', label: 'Vedlikehold', icon: '🔧' }
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Dataadministrasjon
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Håndter backup, gjenoppretting og rapporter for familiedata
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Export Data */}
          <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Eksporter familiedata
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  Last ned en komplett sikkerhetskopi av alle familiedata inkludert oppgaver, fullføringer, 
                  poeng, belønninger og innstillinger.
                </p>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Alle familiemedlemmer og innstillinger</li>
                  <li>• Oppgaver og fullføringshistorikk</li>
                  <li>• Poeng, streaks og belønninger</li>
                  <li>• Systeminnstillinger og preferanser</li>
                </ul>
              </div>
              <button
                onClick={exportData}
                disabled={loading}
                className="ml-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>💾</span>
                <span>{loading ? 'Eksporterer...' : 'Last ned backup'}</span>
              </button>
            </div>
          </div>

          {/* Import Data */}
          <div className="border border-green-200 rounded-lg p-6 bg-green-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  Importer familiedata
                </h3>
                <p className="text-green-700 text-sm mb-4">
                  Gjenopprett data fra en tidligere sikkerhetskopi. Dette vil overskrive alle 
                  eksisterende data.
                </p>
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm font-medium">
                    ⚠️ Advarsel: Alle eksisterende data vil bli erstattet!
                  </p>
                </div>
              </div>
              <div className="ml-4">
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  disabled={loading}
                  className="hidden"
                  id="backup-file"
                />
                <label
                  htmlFor="backup-file"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer inline-flex items-center space-x-2"
                >
                  <span>📁</span>
                  <span>{loading ? 'Importerer...' : 'Velg backup fil'}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Controls */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Generer aktivitetsrapport
            </h3>
            
            <div className="flex items-center space-x-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tidsperiode
                </label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="week">Siste uke</option>
                  <option value="month">Siste måned</option>
                  <option value="quarter">Siste kvartal</option>
                  <option value="year">Siste år</option>
                </select>
              </div>
              
              <div className="flex-1"></div>
              
              <button
                onClick={generateReport}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>📊</span>
                <span>{loading ? 'Genererer...' : 'Generer rapport'}</span>
              </button>
            </div>
          </div>

          {/* Report Display */}
          {reportData && (
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Aktivitetsrapport - {reportData.period}
                </h3>
                <button
                  onClick={exportReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center space-x-2"
                >
                  <span>💾</span>
                  <span>Eksporter rapport</span>
                </button>
              </div>

              {/* Family Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.familyStats.completedTasks}
                  </div>
                  <div className="text-sm text-blue-700">Fullførte oppgaver</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.familyStats.familyPoints}
                  </div>
                  <div className="text-sm text-green-700">Totale poeng</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.familyStats.activeMembers}
                  </div>
                  <div className="text-sm text-purple-700">Aktive medlemmer</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {reportData.familyStats.totalTasks}
                  </div>
                  <div className="text-sm text-orange-700">Totale oppgaver</div>
                </div>
              </div>

              {/* Member Stats */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Medlemsstatistikk</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2">Navn</th>
                        <th className="text-right py-2">Oppgaver</th>
                        <th className="text-right py-2">Poeng</th>
                        <th className="text-right py-2">Streak</th>
                        <th className="text-right py-2">Belønninger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.memberStats.map((member) => (
                        <tr key={member.userId} className="border-b border-gray-100">
                          <td className="py-2 font-medium">{member.name}</td>
                          <td className="text-right py-2">{member.tasksCompleted}</td>
                          <td className="text-right py-2">{member.pointsEarned}</td>
                          <td className="text-right py-2">{member.streakDays} dager</td>
                          <td className="text-right py-2">{member.rewardsClaimed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Task Stats */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Oppgavestatistikk</h4>
                <div className="space-y-2">
                  {reportData.taskStats.slice(0, 5).map((task) => (
                    <div key={task.taskId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{task.title}</span>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{task.totalCompletions} fullføringer</span>
                        <span>{task.completionRate.toFixed(1)}% rate</span>
                        <span>{task.averagePoints.toFixed(0)} gj.snitt poeng</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Data Cleanup */}
          <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
            <h3 className="text-lg font-medium text-orange-900 mb-4">
              Datavedlikehold
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Rydd opp i gamle data</h4>
                  <p className="text-sm text-gray-600">Slett fullføringer og data eldre enn 1 år</p>
                </div>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
                  Rydd opp
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Optimaliser lagring</h4>
                  <p className="text-sm text-gray-600">Komprimer og reorganiser data for bedre ytelse</p>
                </div>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
                  Optimaliser
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border border-red-200 rounded-lg p-6 bg-red-50">
            <h3 className="text-lg font-medium text-red-900 mb-4">
              Farlig sone
            </h3>
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 mb-2">Slett alle data</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Dette vil permanent slette ALL data for familien. Denne handlingen kan ikke angres.
                  </p>
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                    <p className="text-red-800 text-sm font-medium">
                      ⚠️ ADVARSEL: Denne handlingen kan ikke angres!
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearAllData}
                  disabled={loading}
                  className="ml-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Sletter...' : 'Slett alle data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataManagement 