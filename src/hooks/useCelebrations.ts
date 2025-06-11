import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { rewardClaimingService } from '@/services/rewardClaimingService'
import type { CelebrationEvent, Achievement, ClaimedReward } from '@/services/rewardClaimingService'

interface UseCelebrationsReturn {
  pendingCelebrations: CelebrationEvent[]
  achievements: Achievement[]
  claimedRewards: ClaimedReward[]
  isLoading: boolean
  error: string | null
  showCelebration: (celebration: CelebrationEvent) => void
  markCelebrationShown: (celebrationId: string) => Promise<void>
  claimReward: (rewardId: string) => Promise<ClaimedReward>
  checkStreakMilestones: () => Promise<Achievement[]>
  refreshData: () => Promise<void>
}

export const useCelebrations = (): UseCelebrationsReturn => {
  const { currentUser } = useUser()
  const [pendingCelebrations, setPendingCelebrations] = useState<CelebrationEvent[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user data
  const loadData = useCallback(async () => {
    if (!currentUser?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const [celebrations, userAchievements, userClaimedRewards] = await Promise.all([
        rewardClaimingService.getPendingCelebrations(currentUser.id),
        rewardClaimingService.getUserAchievements(currentUser.id),
        rewardClaimingService.getClaimedRewards(currentUser.id)
      ])

      setPendingCelebrations(celebrations)
      setAchievements(userAchievements)
      setClaimedRewards(userClaimedRewards)
    } catch (err) {
      console.error('Error loading celebration data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.id])

  // Load data on mount and user change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-check for new celebrations every 30 seconds
  useEffect(() => {
    if (!currentUser?.id) return

    const interval = setInterval(async () => {
      try {
        const newCelebrations = await rewardClaimingService.getPendingCelebrations(currentUser.id)
        setPendingCelebrations(newCelebrations)
      } catch (err) {
        console.error('Error checking for new celebrations:', err)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [currentUser?.id])

  // Show celebration (this would trigger the modal)
  const showCelebration = useCallback((celebration: CelebrationEvent) => {
    // This is handled by the parent component that uses this hook
    // The celebration modal should be shown when this is called
  }, [])

  // Mark celebration as shown
  const markCelebrationShown = useCallback(async (celebrationId: string) => {
    try {
      await rewardClaimingService.markCelebrationShown(celebrationId)
      
      // Remove from pending celebrations
      setPendingCelebrations(prev => prev.filter(c => c.id !== celebrationId))
    } catch (err) {
      console.error('Error marking celebration as shown:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark celebration')
    }
  }, [])

  // Claim a reward
  const claimReward = useCallback(async (rewardId: string): Promise<ClaimedReward> => {
    if (!currentUser?.id) {
      throw new Error('No user logged in')
    }

    try {
      const claimedReward = await rewardClaimingService.claimReward(rewardId, currentUser.id)
      
      // Refresh data to get new celebrations and achievements
      await loadData()
      
      return claimedReward
    } catch (err) {
      console.error('Error claiming reward:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim reward'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [currentUser?.id, loadData])

  // Check for streak milestones
  const checkStreakMilestones = useCallback(async (): Promise<Achievement[]> => {
    if (!currentUser?.id) {
      return []
    }

    try {
      const newAchievements = await rewardClaimingService.checkStreakMilestones(currentUser.id)
      
      if (newAchievements.length > 0) {
        // Refresh data to get the new achievements and celebrations
        await loadData()
      }
      
      return newAchievements
    } catch (err) {
      console.error('Error checking streak milestones:', err)
      setError(err instanceof Error ? err.message : 'Failed to check milestones')
      return []
    }
  }, [currentUser?.id, loadData])

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  return {
    pendingCelebrations,
    achievements,
    claimedRewards,
    isLoading,
    error,
    showCelebration,
    markCelebrationShown,
    claimReward,
    checkStreakMilestones,
    refreshData
  }
} 