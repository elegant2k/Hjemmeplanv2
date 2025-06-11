import React, { useState, useEffect } from 'react'
import { useStreaks } from '@/hooks/useStreaks'
import { useUser } from '@/contexts/UserContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { HolidayException } from '@/services/streakService'

interface StreakSettingsProps {
  className?: string
}

const StreakSettings: React.FC<StreakSettingsProps> = ({ className = '' }) => {
  const { currentUser, currentFamily } = useUser()
  const { holidays, isLoading, error, addHoliday, removeHoliday, performDailyCheck } = useStreaks()
  const [showAddHoliday, setShowAddHoliday] = useState(false)
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
    affectsAllTasks: true,
    userId: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastDailyCheck, setLastDailyCheck] = useState<{
    updated: number
    deactivated: number
    errors: string[]
  } | null>(null)

  const isParent = currentUser?.role === 'parent'

  useEffect(() => {
    // Load last daily check result from localStorage
    const stored = localStorage.getItem('last-daily-check')
    if (stored) {
      try {
        setLastDailyCheck(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to load daily check result:', error)
      }
    }
  }, [])

  const handleAddHoliday = async () => {
    if (!currentFamily || !newHoliday.name || !newHoliday.date) return

    try {
      setIsProcessing(true)
      await addHoliday({
        familyId: currentFamily.id,
        name: newHoliday.name,
        date: new Date(newHoliday.date),
        affectsAllTasks: newHoliday.affectsAllTasks,
        userId: newHoliday.affectsAllTasks ? undefined : newHoliday.userId || undefined
      })

      // Reset form
      setNewHoliday({
        name: '',
        date: '',
        affectsAllTasks: true,
        userId: ''
      })
      setShowAddHoliday(false)
    } catch (err) {
      console.error('Failed to add holiday:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveHoliday = async (holidayId: string) => {
    try {
      setIsProcessing(true)
      await removeHoliday(holidayId)
    } catch (err) {
      console.error('Failed to remove holiday:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDailyCheck = async () => {
    if (!currentFamily) return

    try {
      setIsProcessing(true)
      const result = await performDailyCheck()
      setLastDailyCheck(result)
      
      // Save result to localStorage
      localStorage.setItem('last-daily-check', JSON.stringify(result))
    } catch (err) {
      console.error('Failed to perform daily check:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (!isParent) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-gray-500 text-sm text-center">
            Kun foreldre kan endre streak-innstillinger
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <span className="text-xl mr-2">⚙️</span>
          Streak Innstillinger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Check Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Daglig Streak-sjekk</h3>
            <button
              onClick={handleDailyCheck}
              disabled={isProcessing}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? 'Sjekker...' : 'Kjør sjekk'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Oppdater streak-status for alle familiemedlemmer
          </p>
          {lastDailyCheck && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="text-green-600">✅ Oppdatert: {lastDailyCheck.updated} streaks</div>
              <div className="text-orange-600">⏸️ Deaktivert: {lastDailyCheck.deactivated} streaks</div>
              {lastDailyCheck.errors.length > 0 && (
                <div className="text-red-600">❌ Feil: {lastDailyCheck.errors.length}</div>
              )}
            </div>
          )}
        </div>

        {/* Holiday Exceptions Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Helligdag-unntak</h3>
            <button
              onClick={() => setShowAddHoliday(!showAddHoliday)}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              {showAddHoliday ? 'Avbryt' : 'Legg til'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Legg til datoer som ikke skal bryte streaks (ferier, sykdom, etc.)
          </p>

          {/* Add Holiday Form */}
          {showAddHoliday && (
            <div className="p-4 border border-gray-200 rounded-lg mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Navn
                </label>
                <input
                  type="text"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  placeholder="f.eks. Juleferie, Sykdom"
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dato
                </label>
                <input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="affects-all"
                  checked={newHoliday.affectsAllTasks}
                  onChange={(e) => setNewHoliday({ ...newHoliday, affectsAllTasks: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="affects-all" className="text-sm text-gray-700">
                  Gjelder alle oppgaver
                </label>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleAddHoliday}
                  disabled={isProcessing || !newHoliday.name || !newHoliday.date}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Legger til...' : 'Legg til'}
                </button>
                <button
                  onClick={() => setShowAddHoliday(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {/* Holiday List */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <span className="text-sm text-gray-600 mt-2">Laster helligdager...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">
              Feil ved lasting: {error}
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">
              Ingen helligdager lagt til ennå
            </div>
          ) : (
            <div className="space-y-2">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {holiday.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(holiday.date)} • {holiday.affectsAllTasks ? 'Alle oppgaver' : 'Spesifikke oppgaver'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveHoliday(holiday.id)}
                    disabled={isProcessing}
                    className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                  >
                    Slett
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 text-sm mb-1">ℹ️ Om Streak-systemet</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Daglige oppgaver: 2 dagers utsettelse</li>
            <li>• Ukentlige oppgaver: 10 dagers utsettelse</li>
            <li>• Månedlige oppgaver: 35 dagers utsettelse</li>
            <li>• Helligdager gir ekstra utsettelse</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default StreakSettings 