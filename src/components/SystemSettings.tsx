import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import HolidayForm from './HolidayForm'
import IconMap from '@/components/IconMap'

interface SystemSettingsData {
  // App Behavior
  darkMode: boolean
  language: 'no' | 'en'
  timezone: string
  notifications: {
    enabled: boolean
    dailyReminders: boolean
    taskCompletions: boolean
    streakReminders: boolean
    familyGoals: boolean
  }
  
  // Task Settings
  defaultPointsPerTask: number
  maxDailyTasks: number
  weekendTasksEnabled: boolean
  streakResetTime: string
  
  // Family Settings
  allowChildTaskCreation: boolean
  requireParentApproval: boolean
  parentalControlLevel: 'strict' | 'moderate' | 'relaxed'
  
  // Holidays and Special Dates
  holidays: HolidayDate[]
  schoolHolidays: SchoolHoliday[]
  customDates: CustomDate[]
}

interface HolidayDate {
  id: string
  name: string
  date: string
  recurring: boolean
  skipTasks: boolean
  description?: string
}

interface SchoolHoliday {
  id: string
  name: string
  startDate: string
  endDate: string
  year: number
  skipTasks: boolean
}

interface CustomDate {
  id: string
  name: string
  date: string
  type: 'birthday' | 'anniversary' | 'special' | 'vacation'
  skipTasks: boolean
  description?: string
}

const SystemSettings: React.FC = () => {
  const { currentUser } = useUser()
  const [settings, setSettings] = useState<SystemSettingsData>({
    darkMode: false,
    language: 'no',
    timezone: 'Europe/Oslo',
    notifications: {
      enabled: true,
      dailyReminders: true,
      taskCompletions: true,
      streakReminders: true,
      familyGoals: true
    },
    defaultPointsPerTask: 10,
    maxDailyTasks: 5,
    weekendTasksEnabled: true,
    streakResetTime: '06:00',
    allowChildTaskCreation: false,
    requireParentApproval: true,
    parentalControlLevel: 'moderate',
    holidays: [],
    schoolHolidays: [],
    customDates: []
  })
  
  const [activeTab, setActiveTab] = useState<'general' | 'tasks' | 'family' | 'dates'>('general')
  const [loading, setLoading] = useState(false)
  const [showHolidayForm, setShowHolidayForm] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<HolidayDate | null>(null)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(`settings_${currentUser?.familyId}`)
    if (savedSettings) {
      try {
        setSettings({ ...settings, ...JSON.parse(savedSettings) })
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [currentUser])

  // Save settings to localStorage
  const saveSettings = async () => {
    setLoading(true)
    try {
      localStorage.setItem(`settings_${currentUser?.familyId}`, JSON.stringify(settings))
      // Here you would also sync with backend
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Default Norwegian holidays
  const defaultNorwegianHolidays: Omit<HolidayDate, 'id'>[] = [
    { name: 'Nyttårsdag', date: '01-01', recurring: true, skipTasks: true },
    { name: 'Skjærtorsdag', date: '2024-03-28', recurring: false, skipTasks: true },
    { name: 'Langfredag', date: '2024-03-29', recurring: false, skipTasks: true },
    { name: 'Første påskedag', date: '2024-03-31', recurring: false, skipTasks: true },
    { name: 'Andre påskedag', date: '2024-04-01', recurring: false, skipTasks: true },
    { name: 'Arbeidernes dag', date: '05-01', recurring: true, skipTasks: false },
    { name: 'Grunnlovsdag', date: '05-17', recurring: true, skipTasks: true },
    { name: 'Kristi himmelfartsdag', date: '2024-05-09', recurring: false, skipTasks: true },
    { name: 'Første pinsedag', date: '2024-05-19', recurring: false, skipTasks: true },
    { name: 'Andre pinsedag', date: '2024-05-20', recurring: false, skipTasks: true },
    { name: 'Julaften', date: '12-24', recurring: true, skipTasks: true },
    { name: 'Første juledag', date: '12-25', recurring: true, skipTasks: true },
    { name: 'Andre juledag', date: '12-26', recurring: true, skipTasks: true },
    { name: 'Nyttårsaften', date: '12-31', recurring: true, skipTasks: true }
  ]

  // Add default holidays
  const addDefaultHolidays = () => {
    const newHolidays = defaultNorwegianHolidays.map(holiday => ({
      ...holiday,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }))
    setSettings(prev => ({
      ...prev,
      holidays: [...prev.holidays, ...newHolidays]
    }))
  }

  // Add custom holiday
  const addHoliday = (holiday: Omit<HolidayDate, 'id'>) => {
    const newHoliday = {
      ...holiday,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    setSettings(prev => ({
      ...prev,
      holidays: [...prev.holidays, newHoliday]
    }))
  }

  // Remove holiday
  const removeHoliday = (id: string) => {
    setSettings(prev => ({
      ...prev,
      holidays: prev.holidays.filter(h => h.id !== id)
    }))
  }

  const tabs = [
    { id: 'general', label: 'Generelt', icon: 'settings' },
    { id: 'tasks', label: 'Oppgaver', icon: 'tasks' },
    { id: 'family', label: 'Familie', icon: 'user' },
    { id: 'dates', label: 'Datoer & Helligdager', icon: 'calendar' }
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Systeminnstillinger
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Konfigurer applikasjonens oppførsel og preferanser
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
            <IconMap type={tab.icon as any} size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Språk
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value as 'no' | 'en' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="no">Norsk</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tidssone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="Europe/Oslo">Oslo (UTC+1)</option>
                <option value="Europe/London">London (UTC+0)</option>
                <option value="America/New_York">New York (UTC-5)</option>
                <option value="Asia/Tokyo">Tokyo (UTC+9)</option>
              </select>
            </div>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Mørk modus</h4>
              <p className="text-sm text-gray-600">Bytt til mørkt tema for bedre visning i mørke miljøer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => setSettings(prev => ({ ...prev, darkMode: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Notifications */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Varsler</h4>
            <div className="space-y-3">
              {Object.entries({
                enabled: 'Aktiver varsler',
                dailyReminders: 'Daglige påminnelser',
                taskCompletions: 'Oppgavefullføringer',
                streakReminders: 'Streak påminnelser',
                familyGoals: 'Familiemål oppdateringer'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications[key as keyof typeof settings.notifications]}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        [key]: e.target.checked
                      }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task Settings */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard poeng per oppgave
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.defaultPointsPerTask}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultPointsPerTask: parseInt(e.target.value) || 10 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Max Daily Tasks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maks oppgaver per dag
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxDailyTasks}
                onChange={(e) => setSettings(prev => ({ ...prev, maxDailyTasks: parseInt(e.target.value) || 5 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Streak Reset Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Streak tilbakestillingstid
              </label>
              <input
                type="time"
                value={settings.streakResetTime}
                onChange={(e) => setSettings(prev => ({ ...prev, streakResetTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <p className="text-xs text-gray-500 mt-1">Når skal streaks tilbakestilles?</p>
            </div>
          </div>

          {/* Weekend Tasks */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Helgeoppgaver</h4>
              <p className="text-sm text-gray-600">Aktiver oppgaver i helger</p>
            </div>
            <input
              type="checkbox"
              checked={settings.weekendTasksEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, weekendTasksEnabled: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      )}

      {/* Family Settings */}
      {activeTab === 'family' && (
        <div className="space-y-6">
          {/* Parental Control Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Foreldrekontrollnivå
            </label>
            <div className="space-y-2">
              {[
                { value: 'strict', label: 'Streng', desc: 'Alle handlinger krever foreldregodkjenning' },
                { value: 'moderate', label: 'Moderat', desc: 'Balanse mellom frihet og kontroll' },
                { value: 'relaxed', label: 'Avslappet', desc: 'Barn kan utføre de fleste handlinger selv' }
              ].map((level) => (
                <label key={level.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="parentalControl"
                    value={level.value}
                    checked={settings.parentalControlLevel === level.value}
                    onChange={(e) => setSettings(prev => ({ ...prev, parentalControlLevel: e.target.value as any }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{level.label}</div>
                    <div className="text-xs text-gray-600">{level.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Child Task Creation */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Barn kan opprette oppgaver</h4>
              <p className="text-sm text-gray-600">La barn foreslå egne oppgaver</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowChildTaskCreation}
              onChange={(e) => setSettings(prev => ({ ...prev, allowChildTaskCreation: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          {/* Require Parent Approval */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Krev foreldregodkjenning</h4>
              <p className="text-sm text-gray-600">Alle oppgavefullføringer må godkjennes</p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireParentApproval}
              onChange={(e) => setSettings(prev => ({ ...prev, requireParentApproval: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      )}

      {/* Dates & Holidays */}
      {activeTab === 'dates' && (
        <div className="space-y-6">
          {/* Add Default Holidays */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-blue-900">Norske helligdager</h4>
              <p className="text-sm text-blue-700">Legg til alle norske helligdager automatisk</p>
            </div>
            <button
              onClick={addDefaultHolidays}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Legg til alle
            </button>
          </div>

          {/* Custom Holiday Form */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Egendefinerte helligdager</h4>
              <button
                onClick={() => setShowHolidayForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                + Legg til helligdag
              </button>
            </div>

            {/* Holiday List */}
            {settings.holidays.length > 0 ? (
              <div className="space-y-2">
                {settings.holidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{holiday.name}</span>
                        <span className="text-sm text-gray-600">{holiday.date}</span>
                        {holiday.skipTasks && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                            Hopper over oppgaver
                          </span>
                        )}
                        {holiday.recurring && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Årlig
                          </span>
                        )}
                      </div>
                      {holiday.description && (
                        <p className="text-sm text-gray-600 mt-1">{holiday.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeHoliday(holiday.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Slett helligdag"
                    >
                      <IconMap type="delete" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <IconMap type="calendar" size={48} className="mx-auto block mb-2" />
                <p>Ingen helligdager lagt til ennå</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Lagrer...</span>
            </>
          ) : (
            <>
              <IconMap type="save" size={16} />
              <span>Lagre innstillinger</span>
            </>
          )}
        </button>
      </div>

      {/* Holiday Form Modal */}
      <HolidayForm
        isOpen={showHolidayForm}
        onClose={() => {
          setShowHolidayForm(false)
          setEditingHoliday(null)
        }}
        onSave={addHoliday}
        editingHoliday={editingHoliday}
      />
    </div>
  )
}

export default SystemSettings 