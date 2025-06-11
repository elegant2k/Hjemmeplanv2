import type { Reward } from '@/models'
import { storage } from '@/lib/storage'
import { completionService } from './completionService'

const STORAGE_KEY = 'rewards'
const USER_REWARDS_KEY = 'user_rewards'

export class RewardServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'RewardServiceError'
  }
}

interface RewardFilters {
  familyId?: string
  category?: Reward['category']
  isActive?: boolean
  maxCost?: number
  minCost?: number
}

interface UserReward {
  id: string
  userId: string
  rewardId: string
  familyId: string
  redeemedAt: Date
  pointsSpent: number
  allowanceSpent?: number
  status: 'redeemed' | 'fulfilled' | 'cancelled'
  notes?: string
}

interface UserProgress {
  userId: string
  familyId: string
  totalPoints: number
  availablePoints: number
  totalAllowance: number
  availableAllowance: number
  lifetimePointsEarned: number
  lifetimePointsSpent: number
}

class RewardService {
  async getRewards(): Promise<Reward[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      return storage.getItem<Reward[]>(STORAGE_KEY) || []
    } catch (error) {
      throw new RewardServiceError('Failed to retrieve rewards', 'GET_REWARDS_ERROR')
    }
  }

  async getRewardsByFamily(familyId: string): Promise<Reward[]> {
    try {
      if (!familyId) {
        throw new RewardServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 80))
      const rewards = storage.getItem<Reward[]>(STORAGE_KEY) || []
      return rewards.filter(reward => reward.familyId === familyId)
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to retrieve family rewards', 'GET_FAMILY_REWARDS_ERROR')
    }
  }

  async getFilteredRewards(filters: RewardFilters): Promise<Reward[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      let rewards = storage.getItem<Reward[]>(STORAGE_KEY) || []

      if (filters.familyId) {
        rewards = rewards.filter(r => r.familyId === filters.familyId)
      }

      if (filters.category) {
        rewards = rewards.filter(r => r.category === filters.category)
      }

      if (filters.isActive !== undefined) {
        rewards = rewards.filter(r => r.isActive === filters.isActive)
      }

      if (filters.maxCost !== undefined) {
        rewards = rewards.filter(r => r.pointsCost <= filters.maxCost!)
      }

      if (filters.minCost !== undefined) {
        rewards = rewards.filter(r => r.pointsCost >= filters.minCost!)
      }

      return rewards
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to filter rewards', 'FILTER_REWARDS_ERROR')
    }
  }

  async getReward(id: string): Promise<Reward | null> {
    try {
      if (!id) {
        throw new RewardServiceError('Reward ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 50))
      const rewards = storage.getItem<Reward[]>(STORAGE_KEY) || []
      return rewards.find(reward => reward.id === id) || null
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to retrieve reward', 'GET_REWARD_ERROR')
    }
  }

  async createReward(rewardData: Omit<Reward, 'id' | 'createdAt'>): Promise<Reward> {
    try {
      // Validation
      if (!rewardData.title?.trim()) {
        throw new RewardServiceError('Reward title is required', 'INVALID_TITLE')
      }

      if (!rewardData.familyId) {
        throw new RewardServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      if (!rewardData.createdBy) {
        throw new RewardServiceError('Creator ID is required', 'INVALID_CREATOR')
      }

      if (rewardData.pointsCost < 0) {
        throw new RewardServiceError('Points cost cannot be negative', 'INVALID_POINTS_COST')
      }

      if (rewardData.allowanceCost && rewardData.allowanceCost < 0) {
        throw new RewardServiceError('Allowance cost cannot be negative', 'INVALID_ALLOWANCE_COST')
      }

      if (!['privilege', 'item', 'activity', 'allowance'].includes(rewardData.category)) {
        throw new RewardServiceError('Invalid reward category', 'INVALID_CATEGORY')
      }

      await new Promise(resolve => setTimeout(resolve, 200))
      
      const newReward: Reward = {
        ...rewardData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }

      const rewards = storage.getItem<Reward[]>(STORAGE_KEY) || []
      const updatedRewards = [...rewards, newReward]
      const success = storage.setItem(STORAGE_KEY, updatedRewards)

      if (!success) {
        throw new RewardServiceError('Failed to save reward', 'STORAGE_ERROR')
      }

      return newReward
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to create reward', 'CREATE_REWARD_ERROR')
    }
  }

  async updateReward(id: string, updates: Partial<Reward>): Promise<Reward | null> {
    try {
      if (!id) {
        throw new RewardServiceError('Reward ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      
      const rewards = storage.getItem<Reward[]>(STORAGE_KEY) || []
      const rewardIndex = rewards.findIndex(reward => reward.id === id)
      
      if (rewardIndex === -1) {
        return null
      }

      rewards[rewardIndex] = { ...rewards[rewardIndex], ...updates }
      const success = storage.setItem(STORAGE_KEY, rewards)

      if (!success) {
        throw new RewardServiceError('Failed to update reward', 'STORAGE_ERROR')
      }

      return rewards[rewardIndex]
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to update reward', 'UPDATE_REWARD_ERROR')
    }
  }

  async deleteReward(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new RewardServiceError('Reward ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      
      const rewards = storage.getItem<Reward[]>(STORAGE_KEY) || []
      const filteredRewards = rewards.filter(reward => reward.id !== id)
      
      if (filteredRewards.length === rewards.length) {
        return false
      }

      const success = storage.setItem(STORAGE_KEY, filteredRewards)
      if (!success) {
        throw new RewardServiceError('Failed to delete reward', 'STORAGE_ERROR')
      }

      return true
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to delete reward', 'DELETE_REWARD_ERROR')
    }
  }

  async getUserProgress(userId: string, familyId: string): Promise<UserProgress> {
    try {
      if (!userId || !familyId) {
        throw new RewardServiceError('User ID and Family ID are required', 'INVALID_PARAMETERS')
      }

      // Get completion stats for points/allowance earned
      const completionStats = await completionService.getCompletionStats(userId, familyId)
      
      // Get user rewards to calculate points/allowance spent
      const userRewards = await this.getUserRewards(userId)
      const spentPoints = userRewards
        .filter(ur => ur.status === 'redeemed' || ur.status === 'fulfilled')
        .reduce((sum, ur) => sum + ur.pointsSpent, 0)
      
      const spentAllowance = userRewards
        .filter(ur => ur.status === 'redeemed' || ur.status === 'fulfilled')
        .reduce((sum, ur) => sum + (ur.allowanceSpent || 0), 0)

      const progress: UserProgress = {
        userId,
        familyId,
        totalPoints: completionStats.totalPoints,
        availablePoints: completionStats.totalPoints - spentPoints,
        totalAllowance: completionStats.totalAllowance,
        availableAllowance: completionStats.totalAllowance - spentAllowance,
        lifetimePointsEarned: completionStats.totalPoints,
        lifetimePointsSpent: spentPoints
      }

      return progress
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to get user progress', 'GET_USER_PROGRESS_ERROR')
    }
  }

  async redeemReward(userId: string, rewardId: string, notes?: string): Promise<UserReward> {
    try {
      if (!userId || !rewardId) {
        throw new RewardServiceError('User ID and Reward ID are required', 'INVALID_PARAMETERS')
      }

      // Get the reward
      const reward = await this.getReward(rewardId)
      if (!reward) {
        throw new RewardServiceError('Reward not found', 'REWARD_NOT_FOUND')
      }

      if (!reward.isActive) {
        throw new RewardServiceError('Reward is not active', 'REWARD_INACTIVE')
      }

      // Check user progress
      const userProgress = await this.getUserProgress(userId, reward.familyId)
      
      // Validate user has enough points/allowance
      if (userProgress.availablePoints < reward.pointsCost) {
        throw new RewardServiceError('Insufficient points', 'INSUFFICIENT_POINTS')
      }

      if (reward.allowanceCost && userProgress.availableAllowance < reward.allowanceCost) {
        throw new RewardServiceError('Insufficient allowance', 'INSUFFICIENT_ALLOWANCE')
      }

      await new Promise(resolve => setTimeout(resolve, 200))

      // Create user reward record
      const userReward: UserReward = {
        id: crypto.randomUUID(),
        userId,
        rewardId,
        familyId: reward.familyId,
        redeemedAt: new Date(),
        pointsSpent: reward.pointsCost,
        allowanceSpent: reward.allowanceCost,
        status: 'redeemed',
        notes
      }

      // Save user reward
      const userRewards = storage.getItem<UserReward[]>(USER_REWARDS_KEY) || []
      const updatedUserRewards = [...userRewards, userReward]
      const success = storage.setItem(USER_REWARDS_KEY, updatedUserRewards)

      if (!success) {
        throw new RewardServiceError('Failed to save reward redemption', 'STORAGE_ERROR')
      }

      return userReward
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to redeem reward', 'REDEEM_REWARD_ERROR')
    }
  }

  async getUserRewards(userId: string): Promise<UserReward[]> {
    try {
      if (!userId) {
        throw new RewardServiceError('User ID is required', 'INVALID_USER_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 80))
      const userRewards = storage.getItem<UserReward[]>(USER_REWARDS_KEY) || []
      return userRewards.filter(ur => ur.userId === userId)
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to get user rewards', 'GET_USER_REWARDS_ERROR')
    }
  }

  async updateUserRewardStatus(userRewardId: string, status: UserReward['status'], notes?: string): Promise<UserReward | null> {
    try {
      if (!userRewardId) {
        throw new RewardServiceError('User reward ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      
      const userRewards = storage.getItem<UserReward[]>(USER_REWARDS_KEY) || []
      const rewardIndex = userRewards.findIndex(ur => ur.id === userRewardId)
      
      if (rewardIndex === -1) {
        return null
      }

      userRewards[rewardIndex] = {
        ...userRewards[rewardIndex],
        status,
        notes: notes || userRewards[rewardIndex].notes
      }

      const success = storage.setItem(USER_REWARDS_KEY, userRewards)
      if (!success) {
        throw new RewardServiceError('Failed to update user reward status', 'STORAGE_ERROR')
      }

      return userRewards[rewardIndex]
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to update user reward status', 'UPDATE_USER_REWARD_ERROR')
    }
  }

  async getAvailableRewards(userId: string, familyId: string): Promise<Reward[]> {
    try {
      if (!userId || !familyId) {
        throw new RewardServiceError('User ID and Family ID are required', 'INVALID_PARAMETERS')
      }

      // Get user progress to check what they can afford
      const userProgress = await this.getUserProgress(userId, familyId)
      
      // Get all active family rewards
      const familyRewards = await this.getFilteredRewards({
        familyId,
        isActive: true
      })

      // Filter rewards user can afford
      const availableRewards = familyRewards.filter(reward => {
        const canAffordPoints = userProgress.availablePoints >= reward.pointsCost
        const canAffordAllowance = !reward.allowanceCost || 
          userProgress.availableAllowance >= reward.allowanceCost
        
        return canAffordPoints && canAffordAllowance
      })

      return availableRewards
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to get available rewards', 'GET_AVAILABLE_REWARDS_ERROR')
    }
  }

  async getRewardStats(familyId: string): Promise<{
    totalRewards: number
    activeRewards: number
    totalRedemptions: number
    mostPopularReward?: { reward: Reward; redemptions: number }
    totalPointsSpent: number
    totalAllowanceSpent: number
  }> {
    try {
      if (!familyId) {
        throw new RewardServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      const rewards = await this.getRewardsByFamily(familyId)
      const activeRewards = rewards.filter(r => r.isActive)
      
      const userRewards = storage.getItem<UserReward[]>(USER_REWARDS_KEY) || []
      const familyUserRewards = userRewards.filter(ur => ur.familyId === familyId)
      
      const redemptions = familyUserRewards.filter(ur => 
        ur.status === 'redeemed' || ur.status === 'fulfilled'
      )

      // Find most popular reward
      const rewardCounts = new Map<string, number>()
      redemptions.forEach(ur => {
        const count = rewardCounts.get(ur.rewardId) || 0
        rewardCounts.set(ur.rewardId, count + 1)
      })

      let mostPopularReward: { reward: Reward; redemptions: number } | undefined
      let maxRedemptions = 0

      for (const [rewardId, count] of rewardCounts.entries()) {
        if (count > maxRedemptions) {
          const reward = rewards.find(r => r.id === rewardId)
          if (reward) {
            mostPopularReward = { reward, redemptions: count }
            maxRedemptions = count
          }
        }
      }

      const totalPointsSpent = redemptions.reduce((sum, ur) => sum + ur.pointsSpent, 0)
      const totalAllowanceSpent = redemptions.reduce((sum, ur) => sum + (ur.allowanceSpent || 0), 0)

      return {
        totalRewards: rewards.length,
        activeRewards: activeRewards.length,
        totalRedemptions: redemptions.length,
        mostPopularReward,
        totalPointsSpent,
        totalAllowanceSpent
      }
    } catch (error) {
      if (error instanceof RewardServiceError) throw error
      throw new RewardServiceError('Failed to get reward stats', 'GET_REWARD_STATS_ERROR')
    }
  }
}

export const rewardService = new RewardService()