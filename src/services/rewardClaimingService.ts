import { storage } from '@/lib/storage'
import { rewardService } from './rewardService'
import { userService } from './userService'
import { streakService } from './streakService'
import type { Reward, User, Streak } from '@/models'

const STORAGE_KEYS = {
  CLAIMED_REWARDS: 'claimed_rewards',
  ACHIEVEMENT_HISTORY: 'achievement_history',
  CELEBRATION_QUEUE: 'celebration_queue'
} as const

export interface ClaimedReward {
  id: string
  rewardId: string
  userId: string
  familyId: string
  claimedAt: Date
  pointsCost: number
  allowanceCost?: number
  status: 'claimed' | 'redeemed' | 'expired'
  redemptionCode?: string
  expiresAt?: Date
}

export interface Achievement {
  id: string
  userId: string
  familyId: string
  type: 'streak_milestone' | 'reward_claimed' | 'task_completion' | 'perfect_week'
  title: string
  description: string
  icon: string
  pointsAwarded: number
  achievedAt: Date
  metadata?: Record<string, any>
}

export interface CelebrationEvent {
  id: string
  userId: string
  type: 'reward' | 'streak' | 'milestone' | 'achievement'
  title: string
  message: string
  points?: number
  icon?: string
  triggerAt: Date
  isShown: boolean
}

export class RewardClaimingServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'RewardClaimingServiceError'
  }
}

class RewardClaimingService {
  /**
   * Claim a reward for a user
   */
  async claimReward(rewardId: string, userId: string): Promise<ClaimedReward> {
    try {
      // Get reward details
      const reward = await rewardService.getReward(rewardId)
      if (!reward) {
        throw new RewardClaimingServiceError('Reward not found', 'REWARD_NOT_FOUND')
      }

      if (!reward.isActive) {
        throw new RewardClaimingServiceError('Reward is not active', 'REWARD_INACTIVE')
      }

      // Get user details
      const user = await userService.getUser(userId)
      if (!user) {
        throw new RewardClaimingServiceError('User not found', 'USER_NOT_FOUND')
      }

      // Get user progress to check affordability
      const userProgress = await userService.getUserProgress(userId)
      
      // Check if user can afford the reward
      const canAffordPoints = reward.pointsCost === 0 || userProgress.points >= reward.pointsCost
      const canAffordAllowance = (reward.allowanceCost ?? 0) === 0 || userProgress.allowance >= (reward.allowanceCost ?? 0)
      
      if (!canAffordPoints || !canAffordAllowance) {
        throw new RewardClaimingServiceError('Insufficient points or allowance', 'INSUFFICIENT_FUNDS')
      }

      // Create claimed reward record
      const claimedReward: ClaimedReward = {
        id: crypto.randomUUID(),
        rewardId: reward.id,
        userId: user.id,
        familyId: user.familyId,
        claimedAt: new Date(),
        pointsCost: reward.pointsCost,
        allowanceCost: reward.allowanceCost,
        status: 'claimed',
        redemptionCode: this.generateRedemptionCode(),
        expiresAt: reward.category === 'privilege' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined // 7 days for privileges
      }

      // Save claimed reward
      const claimedRewards = storage.getItem<ClaimedReward[]>(STORAGE_KEYS.CLAIMED_REWARDS) || []
      claimedRewards.push(claimedReward)
      storage.setItem(STORAGE_KEYS.CLAIMED_REWARDS, claimedRewards)

      // Create achievement record
      const achievement: Achievement = {
        id: crypto.randomUUID(),
        userId: user.id,
        familyId: user.familyId,
        type: 'reward_claimed',
        title: `Belønning innløst: ${reward.title}`,
        description: `Du innløste ${reward.title} for ${reward.pointsCost} poeng${reward.allowanceCost ? ` og ${reward.allowanceCost} kr` : ''}`,
        icon: this.getCategoryIcon(reward.category),
        pointsAwarded: 0, // No bonus points for claiming
        achievedAt: new Date(),
        metadata: {
          rewardId: reward.id,
          rewardTitle: reward.title,
          rewardCategory: reward.category,
          claimedRewardId: claimedReward.id
        }
      }

      await this.recordAchievement(achievement)

      // Create celebration event
      const celebration: CelebrationEvent = {
        id: crypto.randomUUID(),
        userId: user.id,
        type: 'reward',
        title: 'Belønning innløst! 🎁',
        message: `Du har innløst "${reward.title}"! ${reward.description || ''}`,
        points: 0,
        icon: this.getCategoryIcon(reward.category),
        triggerAt: new Date(),
        isShown: false
      }

      await this.scheduleCelebration(celebration)

      return claimedReward
    } catch (error) {
      if (error instanceof RewardClaimingServiceError) throw error
      throw new RewardClaimingServiceError('Failed to claim reward', 'CLAIM_ERROR')
    }
  }

  /**
   * Check for and trigger streak milestone achievements
   */
  async checkStreakMilestones(userId: string): Promise<Achievement[]> {
    try {
      const allStreaks = await streakService.getStreaks()
      const userStreaks = allStreaks.filter(s => s.userId === userId)
      const achievements: Achievement[] = []

      const milestones = [
        { streak: 3, title: 'Starter', icon: '🌱', points: 10 },
        { streak: 7, title: 'Konsistent', icon: '🔥', points: 25 },
        { streak: 14, title: 'Dedikert', icon: '⭐', points: 50 },
        { streak: 30, title: 'Mester', icon: '🏆', points: 100 },
        { streak: 60, title: 'Legende', icon: '👑', points: 250 }
      ]

      for (const userStreak of userStreaks) {
        if (!userStreak.isActive) continue

        for (const milestone of milestones) {
          if (userStreak.currentStreak >= milestone.streak) {
            // Check if this milestone was already achieved
            const existingAchievements = await this.getUserAchievements(userId)
            const alreadyAchieved = existingAchievements.some(a => 
              a.type === 'streak_milestone' && 
              a.metadata?.streakValue === milestone.streak &&
              a.metadata?.taskId === userStreak.taskId
            )

            if (!alreadyAchieved) {
              const achievement: Achievement = {
                id: crypto.randomUUID(),
                userId: userId,
                familyId: userStreak.familyId,
                type: 'streak_milestone',
                title: `Streak milepæl: ${milestone.title}`,
                description: `Du nådde ${milestone.streak} dager i rad på en oppgave!`,
                icon: milestone.icon,
                pointsAwarded: milestone.points,
                achievedAt: new Date(),
                metadata: {
                  streakValue: milestone.streak,
                  taskId: userStreak.taskId,
                  streakId: userStreak.id
                }
              }

              await this.recordAchievement(achievement)
              achievements.push(achievement)

              // Schedule celebration
              const celebration: CelebrationEvent = {
                id: crypto.randomUUID(),
                userId: userId,
                type: 'milestone',
                title: `${milestone.title} milepæl! ${milestone.icon}`,
                message: `Du har nådd ${milestone.streak} dager i rad! Fantastisk jobbet!`,
                points: milestone.points,
                icon: milestone.icon,
                triggerAt: new Date(),
                isShown: false
              }

              await this.scheduleCelebration(celebration)
            }
          }
        }
      }

      return achievements
    } catch (error) {
      throw new RewardClaimingServiceError('Failed to check streak milestones', 'MILESTONE_CHECK_ERROR')
    }
  }

  /**
   * Get user's claimed rewards
   */
  async getClaimedRewards(userId: string): Promise<ClaimedReward[]> {
    try {
      const claimedRewards = storage.getItem<ClaimedReward[]>(STORAGE_KEYS.CLAIMED_REWARDS) || []
      return claimedRewards.filter(cr => cr.userId === userId)
    } catch (error) {
      throw new RewardClaimingServiceError('Failed to get claimed rewards', 'GET_CLAIMED_ERROR')
    }
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const achievements = storage.getItem<Achievement[]>(STORAGE_KEYS.ACHIEVEMENT_HISTORY) || []
      return achievements.filter(a => a.userId === userId).sort((a, b) => 
        new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
      )
    } catch (error) {
      throw new RewardClaimingServiceError('Failed to get achievements', 'GET_ACHIEVEMENTS_ERROR')
    }
  }

  /**
   * Get pending celebrations for a user
   */
  async getPendingCelebrations(userId: string): Promise<CelebrationEvent[]> {
    try {
      const celebrations = storage.getItem<CelebrationEvent[]>(STORAGE_KEYS.CELEBRATION_QUEUE) || []
      return celebrations.filter(c => c.userId === userId && !c.isShown)
    } catch (error) {
      throw new RewardClaimingServiceError('Failed to get celebrations', 'GET_CELEBRATIONS_ERROR')
    }
  }

  /**
   * Mark celebration as shown
   */
  async markCelebrationShown(celebrationId: string): Promise<void> {
    try {
      const celebrations = storage.getItem<CelebrationEvent[]>(STORAGE_KEYS.CELEBRATION_QUEUE) || []
      const celebration = celebrations.find(c => c.id === celebrationId)
      
      if (celebration) {
        celebration.isShown = true
        storage.setItem(STORAGE_KEYS.CELEBRATION_QUEUE, celebrations)
      }
    } catch (error) {
      throw new RewardClaimingServiceError('Failed to mark celebration', 'MARK_CELEBRATION_ERROR')
    }
  }

  /**
   * Record an achievement
   */
  private async recordAchievement(achievement: Achievement): Promise<void> {
    const achievements = storage.getItem<Achievement[]>(STORAGE_KEYS.ACHIEVEMENT_HISTORY) || []
    achievements.push(achievement)
    storage.setItem(STORAGE_KEYS.ACHIEVEMENT_HISTORY, achievements)
  }

  /**
   * Schedule a celebration
   */
  private async scheduleCelebration(celebration: CelebrationEvent): Promise<void> {
    const celebrations = storage.getItem<CelebrationEvent[]>(STORAGE_KEYS.CELEBRATION_QUEUE) || []
    celebrations.push(celebration)
    storage.setItem(STORAGE_KEYS.CELEBRATION_QUEUE, celebrations)
  }

  /**
   * Generate a unique redemption code
   */
  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Get icon for reward category
   */
  private getCategoryIcon(category: string): string {
    switch (category) {
      case 'privilege': return '👑'
      case 'item': return '🎁'
      case 'activity': return '🎮'
      case 'allowance': return '💰'
      default: return '🎯'
    }
  }

  /**
   * Check if reward has expired (for privileges)
   */
  isRewardExpired(claimedReward: ClaimedReward): boolean {
    if (!claimedReward.expiresAt) return false
    return new Date() > new Date(claimedReward.expiresAt)
  }

  /**
   * Mark reward as redeemed
   */
  async markRewardRedeemed(claimedRewardId: string): Promise<boolean> {
    try {
      const claimedRewards = storage.getItem<ClaimedReward[]>(STORAGE_KEYS.CLAIMED_REWARDS) || []
      const reward = claimedRewards.find(cr => cr.id === claimedRewardId)
      
      if (reward && reward.status === 'claimed') {
        reward.status = 'redeemed'
        storage.setItem(STORAGE_KEYS.CLAIMED_REWARDS, claimedRewards)
        return true
      }
      
      return false
    } catch (error) {
      throw new RewardClaimingServiceError('Failed to mark reward as redeemed', 'REDEEM_ERROR')
    }
  }
}

export const rewardClaimingService = new RewardClaimingService() 