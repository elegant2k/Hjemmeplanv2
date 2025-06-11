import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/contexts/UserContext'
import { familyPointsService } from '@/services/familyPointsService'
import type { FamilyPointsTotal, FamilyActivity, FamilyGoal } from '@/models'

interface UseFamilyPointsReturn {
  familyPoints: FamilyPointsTotal | null
  familyActivities: FamilyActivity[]
  familyGoals: FamilyGoal[]
  activeGoals: Array<FamilyGoal & { progressPercentage: number }>
  completedGoals: FamilyGoal[]
  isLoading: boolean
  error: string | null
  
  // Actions
  addPointsForActivity: (taskId: string, participants: string[], pointsEarned: number) => Promise<FamilyActivity>
  createGoal: (goal: Omit<FamilyGoal, 'id' | 'familyId' | 'createdAt'>) => Promise<FamilyGoal>
  updateGoal: (goalId: string, updates: Partial<Omit<FamilyGoal, 'id' | 'familyId' | 'createdAt'>>) => Promise<FamilyGoal>
  completeGoal: (goalId: string, pointsSpent: number) => Promise<FamilyGoal>
  deleteGoal: (goalId: string) => Promise<boolean>
  canCompleteActivity: (taskId: string, participantCount: number) => boolean
  getParticipationStats: (timeframe?: { from: Date; to: Date }) => Promise<any>
  refreshData: () => Promise<void>
}

export const useFamilyPoints = (): UseFamilyPointsReturn => {
  const { currentUser } = useUser()
  const [familyPoints, setFamilyPoints] = useState<FamilyPointsTotal | null>(null)
  const [familyActivities, setFamilyActivities] = useState<FamilyActivity[]>([])
  const [familyGoals, setFamilyGoals] = useState<FamilyGoal[]>([])
  const [activeGoals, setActiveGoals] = useState<Array<FamilyGoal & { progressPercentage: number }>>([])
  const [completedGoals, setCompletedGoals] = useState<FamilyGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load family data
  const loadData = useCallback(async () => {
    if (!currentUser?.familyId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const [points, activities, progress] = await Promise.all([
        familyPointsService.getFamilyPoints(currentUser.familyId),
        familyPointsService.getFamilyActivities(currentUser.familyId, 50), // Last 50 activities
        familyPointsService.getCurrentProgress(currentUser.familyId)
      ])

      setFamilyPoints(points)
      setFamilyActivities(activities)
      setFamilyGoals([...progress.activeGoals, ...progress.completedGoals])
      setActiveGoals(progress.activeGoals)
      setCompletedGoals(progress.completedGoals)
    } catch (err) {
      console.error('Error loading family points data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load family data')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.familyId])

  // Load data on mount and user change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Add points for activity
  const addPointsForActivity = useCallback(async (
    taskId: string, 
    participants: string[], 
    pointsEarned: number
  ): Promise<FamilyActivity> => {
    if (!currentUser?.familyId) {
      throw new Error('No family selected')
    }

    try {
      const activity = await familyPointsService.addPointsForActivity(
        currentUser.familyId,
        taskId,
        participants,
        pointsEarned,
        currentUser.id
      )

      // Refresh data to get updated points and activities
      await loadData()

      return activity
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add points'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [currentUser?.familyId, currentUser?.id, loadData])

  // Create goal
  const createGoal = useCallback(async (
    goal: Omit<FamilyGoal, 'id' | 'familyId' | 'createdAt'>
  ): Promise<FamilyGoal> => {
    if (!currentUser?.familyId) {
      throw new Error('No family selected')
    }

    try {
      const newGoal = await familyPointsService.createFamilyGoal({
        ...goal,
        familyId: currentUser.familyId,
        createdBy: currentUser.id
      })

      // Refresh data
      await loadData()

      return newGoal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create goal'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [currentUser?.familyId, currentUser?.id, loadData])

  // Update goal
  const updateGoal = useCallback(async (
    goalId: string, 
    updates: Partial<Omit<FamilyGoal, 'id' | 'familyId' | 'createdAt'>>
  ): Promise<FamilyGoal> => {
    try {
      const updatedGoal = await familyPointsService.updateFamilyGoal(goalId, updates)
      
      // Refresh data
      await loadData()

      return updatedGoal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update goal'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [loadData])

  // Complete goal
  const completeGoal = useCallback(async (goalId: string, pointsSpent: number): Promise<FamilyGoal> => {
    try {
      const completedGoal = await familyPointsService.completeGoal(goalId, pointsSpent)
      
      // Refresh data
      await loadData()

      return completedGoal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete goal'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [loadData])

  // Delete goal
  const deleteGoal = useCallback(async (goalId: string): Promise<boolean> => {
    try {
      const success = await familyPointsService.deleteFamilyGoal(goalId)
      
      if (success) {
        // Refresh data
        await loadData()
      }

      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete goal'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [loadData])

  // Check if activity can be completed
  const canCompleteActivity = useCallback((taskId: string, participantCount: number): boolean => {
    // This would need the task data - for now return a simple check
    return participantCount > 0
  }, [])

  // Get participation stats
  const getParticipationStats = useCallback(async (timeframe?: { from: Date; to: Date }) => {
    if (!currentUser?.familyId) {
      throw new Error('No family selected')
    }

    try {
      return await familyPointsService.getParticipationStats(currentUser.familyId, timeframe)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get participation stats'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [currentUser?.familyId])

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  return {
    familyPoints,
    familyActivities,
    familyGoals,
    activeGoals,
    completedGoals,
    isLoading,
    error,
    addPointsForActivity,
    createGoal,
    updateGoal,
    completeGoal,
    deleteGoal,
    canCompleteActivity,
    getParticipationStats,
    refreshData
  }
} 