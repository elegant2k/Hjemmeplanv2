import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { userService } from '@/services/userService'
import type { User } from '@/models'

interface AllowanceConfig {
  defaultTaskAllowance: number
  weeklyAllowanceLimit: number
  autoPayoutEnabled: boolean
  paymentMethod: 'manual' | 'automatic' | 'request'
  paymentDay: number // 0-6, Sunday = 0
  parentApprovalRequired: boolean
  allowanceCalculationMethod: 'per_task' | 'accumulated' | 'tiered'
  bonusMultipliers: {
    streak: number
    familyActivity: number
    difficulty: number
  }
  notifications: {
    paymentReminders: boolean
    weeklyReports: boolean
    completionAlerts: boolean
  }
}

interface AllowanceSettingsProps {
  className?: string
}

const AllowanceSettings: React.FC<AllowanceSettingsProps> = ({ className = '' }) => {
  const { currentFamily, currentUser } = useUser()
  const [familyMembers, setFamilyMembers] = useState<User[]>([])
  const [config, setConfig] = useState<AllowanceConfig>({
    defaultTaskAllowance: 10,
    weeklyAllowanceLimit: 200,
    autoPayoutEnabled: false,
    paymentMethod: 'manual',
    paymentDay: 0, // Sunday
    parentApprovalRequired: true,
    allowanceCalculationMethod: 'per_task',
    bonusMultipliers: {
      streak: 1.2,
      familyActivity: 1.5,
      difficulty: 1.3
    },
    notifications: {
      paymentReminders: true,
      weeklyReports: true,
      completionAlerts: true
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'general' | 'members' | 'payments' | 'notifications'>('general')

  // Load data
  const loadData = async () => {
    if (!currentFamily) return

    setLoading(true)
    try {
      const members = await userService.getUsersByFamily(currentFamily.id)
      setFamilyMembers(members)

      // Load config from localStorage (in real app, this would be from a service)
      const savedConfig = localStorage.getItem(`allowance_config_${currentFamily.id}`)
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig))
      }
    } catch (error) {
      console.error('Failed to load allowance settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentFamily])

  // Save config
  const saveConfig = async () => {
    if (!currentFamily) return

    setSaving(true)
    try {
      // Save to localStorage (in real app, this would be a service call)
      localStorage.setItem(`allowance_config_${currentFamily.id}`, JSON.stringify(config))
      
      // Show success message
      alert('Innstillinger lagret!')
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('Kunne ikke lagre innstillinger')
    } finally {
      setSaving(false)
    }
  }

  // Toggle member allowance
  const toggleMemberAllowance = async (memberId: string, enabled: boolean) => {
    try {
      await userService.updateUser(memberId, { allowanceEnabled: enabled })
      await loadData() // Refresh
    } catch (error) {
      console.error('Failed to update member allowance:', error)
    }
  }

  // Get day name
  const getDayName = (dayIndex: number) => {
    const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']
    return days[dayIndex]
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
          <span>⚙️</span>
          <span>Lommepenge-innstillinger</span>
        </h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6">
          {[
            { id: 'general', label: 'Generelt', icon: '🎛️' },
            { id: 'members', label: 'Medlemmer', icon: '👥' },
            { id: 'payments', label: 'Utbetalinger', icon: '💳' },
            { id: 'notifications', label: 'Varsler', icon: '🔔' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* General Settings */}
        {selectedTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Grunnleggende innstillinger</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard lommepenger per oppgave (kr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={config.defaultTaskAllowance}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      defaultTaskAllowance: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Standardbeløp når du oppretter nye oppgaver
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ukentlig grense (kr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={config.weeklyAllowanceLimit}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      weeklyAllowanceLimit: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maksimum lommepenger per uke per person
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beregningsmetode
                  </label>
                  <select
                    value={config.allowanceCalculationMethod}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      allowanceCalculationMethod: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="per_task">Per oppgave</option>
                    <option value="accumulated">Akkumulert</option>
                    <option value="tiered">Trappetrinn</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Hvordan lommepenger beregnes
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.parentApprovalRequired}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        parentApprovalRequired: e.target.checked 
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Krev foreldregodkjenning
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1 ml-6">
                    Oppgaver må godkjennes før lommepenger tildeles
                  </p>
                </div>
              </div>
            </div>

            {/* Bonus Multipliers */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Bonusmultiplikatorer</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Streak-bonus
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.1"
                    value={config.bonusMultipliers.streak}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      bonusMultipliers: {
                        ...prev.bonusMultipliers,
                        streak: parseFloat(e.target.value) || 1
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">x {config.bonusMultipliers.streak}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Familieaktivitet-bonus
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.1"
                    value={config.bonusMultipliers.familyActivity}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      bonusMultipliers: {
                        ...prev.bonusMultipliers,
                        familyActivity: parseFloat(e.target.value) || 1
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">x {config.bonusMultipliers.familyActivity}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vanskelighetsgrad-bonus
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    step="0.1"
                    value={config.bonusMultipliers.difficulty}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      bonusMultipliers: {
                        ...prev.bonusMultipliers,
                        difficulty: parseFloat(e.target.value) || 1
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">x {config.bonusMultipliers.difficulty}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Members Settings */}
        {selectedTab === 'members' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Familiemedlemmer</h3>
              
              <div className="space-y-3">
                {familyMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-500">
                          {member.role === 'parent' ? 'Forelder' : 'Barn'}
                          {member.age && ` • ${member.age} år`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Lommepenger</p>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={member.allowanceEnabled}
                            onChange={(e) => toggleMemberAllowance(member.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm">
                            {member.allowanceEnabled ? 'Aktivert' : 'Deaktivert'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {familyMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl block mb-2">👨‍👩‍👧‍👦</span>
                  <p>Ingen familiemedlemmer funnet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {selectedTab === 'payments' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Utbetalingsinnstillinger</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utbetalingsmetode
                  </label>
                  <select
                    value={config.paymentMethod}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      paymentMethod: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="manual">Manuell</option>
                    <option value="automatic">Automatisk</option>
                    <option value="request">På forespørsel</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Hvordan utbetalinger håndteres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utbetalingsdag
                  </label>
                  <select
                    value={config.paymentDay}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      paymentDay: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 7 }, (_, i) => (
                      <option key={i} value={i}>{getDayName(i)}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Dag i uken for automatiske utbetalinger
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.autoPayoutEnabled}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        autoPayoutEnabled: e.target.checked 
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Aktiver automatisk utbetaling
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1 ml-6">
                    Utbetalinger skjer automatisk på den valgte dagen
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Settings */}
        {selectedTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Varslingsinnstillinger</h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.notifications.paymentReminders}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      notifications: {
                        ...prev.notifications,
                        paymentReminders: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Utbetalingspåminnelser
                    </span>
                    <p className="text-sm text-gray-500">
                      Varsle om ventende utbetalinger
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.notifications.weeklyReports}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      notifications: {
                        ...prev.notifications,
                        weeklyReports: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Ukentlige rapporter
                    </span>
                    <p className="text-sm text-gray-500">
                      Send ukentlig sammendrag av lommepenger
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.notifications.completionAlerts}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      notifications: {
                        ...prev.notifications,
                        completionAlerts: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Fullføringsvarsel
                    </span>
                    <p className="text-sm text-gray-500">
                      Varsle når oppgaver med lommepenger fullføres
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end">
          <button
            onClick={saveConfig}
            disabled={saving}
            className={`px-6 py-2 rounded-lg text-white font-medium ${
              saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Lagrer...' : 'Lagre innstillinger'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AllowanceSettings 