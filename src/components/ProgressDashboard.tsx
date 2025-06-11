import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useStreaks } from '@/hooks/useStreaks'
import { rewardService, userService } from '@/services'
import RewardMilestoneCard from './RewardMilestoneCard'
import StreakMilestoneCard, { defaultStreakMilestones } from './StreakMilestoneCard'
import type { Reward, User, Streak } from '@/models'

interface ProgressDashboardProps {
  userId?: string
  className?: string
}

interface UserProgress {
  points: number
  allowance: number
  totalTasksCompleted: number
  activeStreaks: number
  longestStreak: number
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  userId,
  className = ''
}) => {
  const { currentUser, availableUsers } = useUser()
  const { streaks, isLoading } = useStreaks()
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userProgress, setUserProgress] = useState<UserProgress>({
    points: 0,
    allowance: 0,
    totalTasksCompleted: 0,
    activeStreaks: 0,
    longestStreak: 0
  })
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([])
  const [userStreaks, setUserStreaks] = useState<Streak[]>([])
  const [activeTab, setActiveTab] = useState<'rewards' | 'streaks'>('rewards')
  
  const targetUserId = userId || currentUser?.id
  const isParent = currentUser?.role === 'parent'

  useEffect(() => {
    if (targetUserId) {
      const user = availableUsers.find(u => u.id === targetUserId)
      setSelectedUser(user || null)
    }
  }, [targetUserId, availableUsers])

  useEffect(() => {
    if (!selectedUser) return

    const loadData = async () => {
      try {
        // Load user progress
        const progress = await userService.getUserProgress(selectedUser.id)
        setUserProgress(progress)

        // Load available rewards
        const rewards = await rewardService.getRewardsByFamily(selectedUser.familyId)
        const activeRewards = rewards.filter(r => r.isActive)
        setAvailableRewards(activeRewards)

        // Filter streaks for this user
        const userStreakData = streaks.filter(s => s.userId === selectedUser.id)
        setUserStreaks(userStreakData)
      } catch (error) {
        console.error('Error loading progress data:', error)
      }
    }

    loadData()
  }, [selectedUser, streaks])

  const handleRewardRedeem = async (rewardId: string) => {
    if (!selectedUser) return

    try {
      await rewardService.redeemReward(rewardId, selectedUser.id)
      // Reload user progress to reflect the redemption
      const progress = await userService.getUserProgress(selectedUser.id)
      setUserProgress(progress)
      alert('🎉 Belønning innløst! Gratulerer!')
    } catch (error) {
      console.error('Error redeeming reward:', error)
      alert('❌ Kunne ikke innløse belønning. Prøv igjen.')
    }
  }

  const handleStreakCelebrate = (milestoneId: string) => {
    // Add celebratory animation or sound effect here
    alert('🎉 Feiring! Du er fantastisk!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Laster fremgang...</p>
        </div>
      </div>
    )
  }

  if (!selectedUser) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Ingen bruker valgt</p>
      </div>
    )
  }

  // Filter rewards that user can almost afford (within 80% of target)
  const nearlyAffordableRewards = availableRewards.filter(reward => {
    const pointsProgress = reward.pointsCost > 0 ? (userProgress.points / reward.pointsCost) : 1
    const allowanceProgress = (reward.allowanceCost ?? 0) > 0 ? (userProgress.allowance / (reward.allowanceCost ?? 0)) : 1
    const overallProgress = Math.min(pointsProgress, allowanceProgress)
    return overallProgress >= 0.5 && overallProgress < 1
  })

  // Get streak milestones with current progress
  const streakMilestonesWithProgress = defaultStreakMilestones.map(milestone => {
    const relevantStreaks = userStreaks.filter(s => s.isActive)
    const maxCurrentStreak = relevantStreaks.length > 0 
      ? Math.max(...relevantStreaks.map(s => s.currentStreak))
      : 0
    
    return {
      ...milestone,
      isAchieved: maxCurrentStreak >= milestone.targetStreak,
      achievedAt: maxCurrentStreak >= milestone.targetStreak ? new Date() : undefined
    }
  })

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with user info */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">{selectedUser.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
              <p className="text-gray-600 text-sm">Fremgangsrapport</p>
            </div>
          </div>
          
          {/* Quick stats */}
          <div className="flex space-x-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{userProgress.points.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Poeng</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{userProgress.allowance.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Lommepenger</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{userProgress.activeStreaks}</p>
              <p className="text-xs text-gray-600">Aktive streaks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            activeTab === 'rewards'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🎁 Belønninger ({availableRewards.length})
        </button>
        <button
          onClick={() => setActiveTab('streaks')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            activeTab === 'streaks'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔥 Streak milepæler ({userProgress.activeStreaks})
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          {/* Nearly affordable rewards */}
          {nearlyAffordableRewards.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                ⚡ Nesten innen rekkevidde
                <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  {nearlyAffordableRewards.length}
                </span>
              </h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {nearlyAffordableRewards.map(reward => (
                  <RewardMilestoneCard
                    key={reward.id}
                    reward={reward}
                    userPoints={userProgress.points}
                    userAllowance={userProgress.allowance}
                    onRedeem={handleRewardRedeem}
                    showProgress={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All available rewards */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              🎯 Alle tilgjengelige belønninger
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {availableRewards.length}
              </span>
            </h4>
            
            {availableRewards.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <span className="text-4xl mb-2 block">🎁</span>
                <p className="text-gray-600">Ingen aktive belønninger</p>
                {isParent && (
                  <p className="text-sm text-gray-500 mt-1">
                    Opprett belønninger i administrasjonspanelet
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableRewards.map(reward => (
                  <RewardMilestoneCard
                    key={reward.id}
                    reward={reward}
                    userPoints={userProgress.points}
                    userAllowance={userProgress.allowance}
                    onRedeem={handleRewardRedeem}
                    showProgress={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'streaks' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              🏆 Streak milepæler
              <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {streakMilestonesWithProgress.filter(m => m.isAchieved).length} / {streakMilestonesWithProgress.length}
              </span>
            </h4>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {streakMilestonesWithProgress.map(milestone => (
                <StreakMilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  currentStreak={userProgress.longestStreak}
                  isActive={userProgress.activeStreaks > 0}
                  onCelebrate={handleStreakCelebrate}
                />
              ))}
            </div>
          </div>

          {/* Streak summary */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <h5 className="font-semibold text-orange-800 mb-2">🔥 Din streak oversikt</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-orange-600">{userProgress.activeStreaks}</p>
                <p className="text-xs text-orange-700">Aktive streaks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{userProgress.longestStreak}</p>
                <p className="text-xs text-red-700">Lengste streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{userProgress.totalTasksCompleted}</p>
                <p className="text-xs text-yellow-700">Oppgaver fullført</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {streakMilestonesWithProgress.filter(m => m.isAchieved).length}
                </p>
                <p className="text-xs text-green-700">Milepæler oppnådd</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressDashboard 