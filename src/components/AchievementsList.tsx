import React, { useState } from 'react'
import { useCelebrations } from '@/hooks/useCelebrations'
import type { Achievement, ClaimedReward } from '@/services/rewardClaimingService'

interface AchievementsListProps {
  userId?: string
  className?: string
  showClaimedRewards?: boolean
  maxItems?: number
}

const AchievementsList: React.FC<AchievementsListProps> = ({
  userId,
  className = '',
  showClaimedRewards = true,
  maxItems = 10
}) => {
  const { achievements, claimedRewards, isLoading } = useCelebrations()
  const [activeTab, setActiveTab] = useState<'achievements' | 'rewards'>('achievements')

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Laster prestasjoner...</p>
        </div>
      </div>
    )
  }

  const displayedAchievements = achievements.slice(0, maxItems)
  const displayedClaimedRewards = claimedRewards.slice(0, maxItems)

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const getAchievementBadgeColor = (type: string) => {
    switch (type) {
      case 'streak_milestone':
        return 'bg-gradient-to-r from-orange-400 to-red-500'
      case 'reward_claimed':
        return 'bg-gradient-to-r from-purple-400 to-pink-500'
      case 'task_completion':
        return 'bg-gradient-to-r from-green-400 to-blue-500'
      case 'perfect_week':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500'
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600'
    }
  }

  const getRewardStatusColor = (status: string) => {
    switch (status) {
      case 'claimed':
        return 'bg-blue-100 text-blue-800'
      case 'redeemed':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRewardStatusText = (status: string) => {
    switch (status) {
      case 'claimed':
        return 'Innløst'
      case 'redeemed':
        return 'Innfridd'
      case 'expired':
        return 'Utløpt'
      default:
        return status
    }
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          🏆 Prestasjoner og belønninger
        </h3>
        
        {/* Tabs */}
        {showClaimedRewards && (
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'achievements'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏆 Prestasjoner ({achievements.length})
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'rewards'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎁 Belønninger ({claimedRewards.length})
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Achievements Tab */}
        {(!showClaimedRewards || activeTab === 'achievements') && (
          <div className="space-y-4">
            {displayedAchievements.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎯</div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  Ingen prestasjoner ennå
                </h4>
                <p className="text-gray-500">
                  Fullfør oppgaver og bygg streaks for å låse opp prestasjoner!
                </p>
              </div>
            ) : (
              displayedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {/* Achievement Badge */}
                  <div className={`w-12 h-12 rounded-full ${getAchievementBadgeColor(achievement.type)} flex items-center justify-center text-white text-xl flex-shrink-0`}>
                    {achievement.icon}
                  </div>
                  
                  {/* Achievement Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {achievement.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📅 {formatDate(achievement.achievedAt)}</span>
                      {achievement.pointsAwarded > 0 && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          +{achievement.pointsAwarded} poeng
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {achievements.length > maxItems && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  Viser {maxItems} av {achievements.length} prestasjoner
                </p>
              </div>
            )}
          </div>
        )}

        {/* Claimed Rewards Tab */}
        {showClaimedRewards && activeTab === 'rewards' && (
          <div className="space-y-4">
            {displayedClaimedRewards.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎁</div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                  Ingen belønninger innløst ennå
                </h4>
                <p className="text-gray-500">
                  Samle poeng og innløs belønninger for å se dem her!
                </p>
              </div>
            ) : (
              displayedClaimedRewards.map((claimedReward) => (
                <div
                  key={claimedReward.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  {/* Reward Icon */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                    🎁
                  </div>
                  
                  {/* Reward Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        Belønning innløst
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRewardStatusColor(claimedReward.status)}`}>
                        {getRewardStatusText(claimedReward.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      <span>📅 {formatDate(claimedReward.claimedAt)}</span>
                      <span>💰 {claimedReward.pointsCost} poeng</span>
                      {claimedReward.allowanceCost && (
                        <span>💵 {claimedReward.allowanceCost} kr</span>
                      )}
                    </div>
                    
                    {claimedReward.redemptionCode && (
                      <div className="bg-white border border-gray-200 rounded-lg p-2 mt-2">
                        <p className="text-xs text-gray-600 mb-1">Innløsningskode:</p>
                        <code className="font-mono text-sm font-bold text-blue-600">
                          {claimedReward.redemptionCode}
                        </code>
                      </div>
                    )}
                    
                    {claimedReward.expiresAt && new Date(claimedReward.expiresAt) > new Date() && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⏰ Utløper {formatDate(claimedReward.expiresAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {claimedRewards.length > maxItems && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  Viser {maxItems} av {claimedRewards.length} belønninger
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AchievementsList 