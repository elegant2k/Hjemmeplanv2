import React, { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import StreakDisplay from '@/components/StreakDisplay'
import StreakSettings from '@/components/StreakSettings'

const StreaksPage: React.FC = () => {
  const { currentUser, availableUsers } = useUser()
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '')
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview')

  const isParent = currentUser?.role === 'parent'

  // Get family members for display
  const familyMembers = availableUsers.filter(user => user.role === 'child')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Streaks</h1>
          <p className="text-gray-600 mt-1">
            Se streak-fremgang og administrer innstillinger
          </p>
        </div>
        
        {isParent && (
          <div className="flex space-x-2 mt-4 md:mt-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm rounded ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Oversikt
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-sm rounded ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Innstillinger
            </button>
          </div>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* User Selection (for parents) */}
          {isParent && familyMembers.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Velg familiemedlem
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedUserId(currentUser?.id || '')}
                  className={`px-4 py-2 text-sm rounded ${
                    selectedUserId === currentUser?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Mine streaks
                </button>
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedUserId(member.id)}
                    className={`px-4 py-2 text-sm rounded ${
                      selectedUserId === member.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Streak Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Streak Display */}
            <StreakDisplay
              userId={selectedUserId}
              showHistory={true}
              className="lg:col-span-2"
            />
          </div>

          {/* Family Overview (for parents) */}
          {isParent && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Familieoversikt
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[currentUser, ...familyMembers].filter(Boolean).map((member) => (
                  <div
                    key={member!.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {member!.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900 text-sm">
                          {member!.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member!.role === 'parent' ? 'Forelder' : 'Barn'}
                        </div>
                      </div>
                    </div>
                    
                    <StreakDisplay
                      userId={member!.id}
                      compact={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips and Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              💡 Tips for å bygge streaks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h3 className="font-medium mb-2">🎯 Start smått</h3>
                <p>Begynn med enkle oppgaver du kan gjøre hver dag</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">📅 Vær konsekvent</h3>
                <p>Konsistens er viktigere enn perfeksjon</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">🏆 Feir suksessene</h3>
                <p>Anerkjenn dine fremskritt, uansett hvor små</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">🔄 Kom tilbake</h3>
                <p>Hvis du bryter en streak, start på nytt dagen etter</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Settings Tab */
        <StreakSettings />
      )}
    </div>
  )
}

export default StreaksPage 