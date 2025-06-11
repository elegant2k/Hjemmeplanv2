import { storage } from '@/lib/storage'
import type { FamilyPointsTotal, FamilyActivity, FamilyGoal, Task, User } from '@/models'

const STORAGE_KEYS = {
  FAMILY_POINTS: 'family_points',
  FAMILY_ACTIVITIES: 'family_activities', 
  FAMILY_GOALS: 'family_goals'
} as const

export class FamilyPointsServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'FamilyPointsServiceError'
  }
}

class FamilyPointsService {
  /**
   * Get family points total for a family
   */
  async getFamilyPoints(familyId: string): Promise<FamilyPointsTotal> {
    try {
      const familyPoints = storage.getItem<FamilyPointsTotal[]>(STORAGE_KEYS.FAMILY_POINTS) || []
      let points = familyPoints.find(fp => fp.familyId === familyId)
      
      if (!points) {
        // Create initial family points record
        points = {
          id: crypto.randomUUID(),
          familyId,
          totalPoints: 0,
          lastUpdated: new Date()
        }
        familyPoints.push(points)
        storage.setItem(STORAGE_KEYS.FAMILY_POINTS, familyPoints)
      }
      
      return points
    } catch (error) {
      throw new FamilyPointsServiceError('Failed to get family points', 'GET_POINTS_ERROR')
    }
  }

  /**
   * Add points for a completed family activity
   */
  async addPointsForActivity(
    familyId: string, 
    taskId: string, 
    participants: string[], 
    pointsEarned: number,
    createdBy: string
  ): Promise<FamilyActivity> {
    try {
      if (participants.length === 0) {
        throw new FamilyPointsServiceError('At least one participant is required', 'NO_PARTICIPANTS')
      }

      // Create activity record
      const activity: FamilyActivity = {
        id: crypto.randomUUID(),
        taskId,
        familyId,
        completedAt: new Date(),
        participants: [...participants],
        pointsEarned,
        createdBy
      }

      // Save activity
      const activities = storage.getItem<FamilyActivity[]>(STORAGE_KEYS.FAMILY_ACTIVITIES) || []
      activities.push(activity)
      storage.setItem(STORAGE_KEYS.FAMILY_ACTIVITIES, activities)

      // Update family points total
      await this.updateFamilyPointsTotal(familyId, pointsEarned)

      return activity
    } catch (error) {
      if (error instanceof FamilyPointsServiceError) throw error
      throw new FamilyPointsServiceError('Failed to add points for activity', 'ADD_POINTS_ERROR')
    }
  }

  /**
   * Update family points total
   */
  private async updateFamilyPointsTotal(familyId: string, pointsToAdd: number): Promise<void> {
    const familyPoints = storage.getItem<FamilyPointsTotal[]>(STORAGE_KEYS.FAMILY_POINTS) || []
    let points = familyPoints.find(fp => fp.familyId === familyId)

    if (points) {
      points.totalPoints += pointsToAdd
      points.lastUpdated = new Date()
    } else {
      points = {
        id: crypto.randomUUID(),
        familyId,
        totalPoints: pointsToAdd,
        lastUpdated: new Date()
      }
      familyPoints.push(points)
    }

    storage.setItem(STORAGE_KEYS.FAMILY_POINTS, familyPoints)
  }

  /**
   * Get family activities history
   */
  async getFamilyActivities(familyId: string, limit?: number): Promise<FamilyActivity[]> {
    try {
      const activities = storage.getItem<FamilyActivity[]>(STORAGE_KEYS.FAMILY_ACTIVITIES) || []
      const familyActivities = activities
        .filter(activity => activity.familyId === familyId)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

      return limit ? familyActivities.slice(0, limit) : familyActivities
    } catch (error) {
      throw new FamilyPointsServiceError('Failed to get family activities', 'GET_ACTIVITIES_ERROR')
    }
  }

  /**
   * Create a new family goal
   */
  async createFamilyGoal(goal: Omit<FamilyGoal, 'id' | 'createdAt'>): Promise<FamilyGoal> {
    try {
      const newGoal: FamilyGoal = {
        ...goal,
        id: crypto.randomUUID(),
        createdAt: new Date()
      }

      const goals = storage.getItem<FamilyGoal[]>(STORAGE_KEYS.FAMILY_GOALS) || []
      goals.push(newGoal)
      storage.setItem(STORAGE_KEYS.FAMILY_GOALS, goals)

      return newGoal
    } catch (error) {
      throw new FamilyPointsServiceError('Failed to create family goal', 'CREATE_GOAL_ERROR')
    }
  }

  /**
   * Get family goals
   */
  async getFamilyGoals(familyId: string): Promise<FamilyGoal[]> {
    try {
      const goals = storage.getItem<FamilyGoal[]>(STORAGE_KEYS.FAMILY_GOALS) || []
      return goals
        .filter(goal => goal.familyId === familyId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      throw new FamilyPointsServiceError('Failed to get family goals', 'GET_GOALS_ERROR')
    }
  }

  /**
   * Update family goal
   */
  async updateFamilyGoal(goalId: string, updates: Partial<Omit<FamilyGoal, 'id' | 'familyId' | 'createdAt'>>): Promise<FamilyGoal> {
    try {
      const goals = storage.getItem<FamilyGoal[]>(STORAGE_KEYS.FAMILY_GOALS) || []
      const goalIndex = goals.findIndex(goal => goal.id === goalId)

      if (goalIndex === -1) {
        throw new FamilyPointsServiceError('Goal not found', 'GOAL_NOT_FOUND')
      }

      goals[goalIndex] = { ...goals[goalIndex], ...updates }
      storage.setItem(STORAGE_KEYS.FAMILY_GOALS, goals)

      return goals[goalIndex]
    } catch (error) {
      if (error instanceof FamilyPointsServiceError) throw error
      throw new FamilyPointsServiceError('Failed to update family goal', 'UPDATE_GOAL_ERROR')
    }
  }

  /**
   * Mark family goal as completed
   */
  async completeGoal(goalId: string, pointsSpent: number): Promise<FamilyGoal> {
    try {
      const goals = storage.getItem<FamilyGoal[]>(STORAGE_KEYS.FAMILY_GOALS) || []
      const goal = goals.find(g => g.id === goalId)

      if (!goal) {
        throw new FamilyPointsServiceError('Goal not found', 'GOAL_NOT_FOUND')
      }

      if (goal.isCompleted) {
        throw new FamilyPointsServiceError('Goal already completed', 'GOAL_ALREADY_COMPLETED')
      }

      const familyPoints = await this.getFamilyPoints(goal.familyId)
      
      if (familyPoints.totalPoints < pointsSpent) {
        throw new FamilyPointsServiceError('Insufficient family points', 'INSUFFICIENT_POINTS')
      }

      // Update goal
      goal.isCompleted = true
      goal.completedAt = new Date()

      // Deduct points
      await this.updateFamilyPointsTotal(goal.familyId, -pointsSpent)

      storage.setItem(STORAGE_KEYS.FAMILY_GOALS, goals)

      return goal
    } catch (error) {
      if (error instanceof FamilyPointsServiceError) throw error
      throw new FamilyPointsServiceError('Failed to complete goal', 'COMPLETE_GOAL_ERROR')
    }
  }

  /**
   * Delete family goal
   */
  async deleteFamilyGoal(goalId: string): Promise<boolean> {
    try {
      const goals = storage.getItem<FamilyGoal[]>(STORAGE_KEYS.FAMILY_GOALS) || []
      const filteredGoals = goals.filter(goal => goal.id !== goalId)

      if (filteredGoals.length === goals.length) {
        return false // Goal not found
      }

      storage.setItem(STORAGE_KEYS.FAMILY_GOALS, filteredGoals)
      return true
    } catch (error) {
      throw new FamilyPointsServiceError('Failed to delete family goal', 'DELETE_GOAL_ERROR')
    }
  }

  /**
   * Calculate current progress toward active goals
   */
  async getCurrentProgress(familyId: string): Promise<{
    familyPoints: FamilyPointsTotal
    activeGoals: Array<FamilyGoal & { progressPercentage: number }>
    completedGoals: FamilyGoal[]
  }> {
    try {
      const familyPoints = await this.getFamilyPoints(familyId)
      const goals = await this.getFamilyGoals(familyId)

      const activeGoals = goals
        .filter(goal => goal.isActive && !goal.isCompleted)
        .map(goal => ({
          ...goal,
          progressPercentage: Math.min(100, (familyPoints.totalPoints / goal.targetPoints) * 100)
        }))

      const completedGoals = goals.filter(goal => goal.isCompleted)

      return {
        familyPoints,
        activeGoals,
        completedGoals
      }
    } catch (error) {
      throw new FamilyPointsServiceError('Failed to calculate progress', 'PROGRESS_ERROR')
    }
  }

  /**
   * Get participation statistics for family activities
   */
  async getParticipationStats(familyId: string, timeframe?: { from: Date; to: Date }): Promise<{
    totalActivities: number
    participationByUser: Record<string, number>
    averageParticipants: number
    mostActiveParticipant: string | null
  }> {
    try {
      let activities = await this.getFamilyActivities(familyId)

      if (timeframe) {
        activities = activities.filter(activity => {
          const activityDate = new Date(activity.completedAt)
          return activityDate >= timeframe.from && activityDate <= timeframe.to
        })
      }

      const participationByUser: Record<string, number> = {}
      let totalParticipants = 0

      activities.forEach(activity => {
        totalParticipants += activity.participants.length
        activity.participants.forEach(userId => {
          participationByUser[userId] = (participationByUser[userId] || 0) + 1
        })
      })

      const averageParticipants = activities.length > 0 ? totalParticipants / activities.length : 0
      
      let mostActiveParticipant: string | null = null
      let maxParticipations = 0
      
      Object.entries(participationByUser).forEach(([userId, count]) => {
        if (count > maxParticipations) {
          maxParticipations = count
          mostActiveParticipant = userId
        }
      })

      return {
        totalActivities: activities.length,
        participationByUser,
        averageParticipants,
        mostActiveParticipant
      }
    } catch (error) {
      throw new FamilyPointsServiceError('Failed to get participation stats', 'STATS_ERROR')
    }
  }

  /**
   * Check if a family activity can be completed (enough participants)
   */
  canCompleteActivity(task: Task, participantCount: number): boolean {
    if (!task.isFamily) return true
    if (!task.requiredParticipants) return participantCount > 0
    return participantCount >= task.requiredParticipants
  }

  /**
   * Get family leaderboard (families ranked by total points)
   */
  async getFamilyLeaderboard(): Promise<Array<FamilyPointsTotal & { rank: number }>> {
    try {
      const allFamilyPoints = storage.getItem<FamilyPointsTotal[]>(STORAGE_KEYS.FAMILY_POINTS) || []
      
      return allFamilyPoints
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((family, index) => ({
          ...family,
          rank: index + 1
        }))
    } catch (error) {
      throw new FamilyPointsServiceError('Failed to get leaderboard', 'LEADERBOARD_ERROR')
    }
  }
}

export const familyPointsService = new FamilyPointsService() 