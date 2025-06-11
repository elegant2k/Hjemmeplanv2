import type { Streak } from '@/models'
import { storage } from '@/lib/storage'
import { completionService } from './completionService'

const STORAGE_KEY = 'streaks'

export class StreakServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'StreakServiceError'
  }
}

interface StreakFilters {
  userId?: string
  taskId?: string
  familyId?: string
  isActive?: boolean
}

export interface HolidayException {
  id: string
  familyId: string
  date: Date
  name: string
  affectsAllTasks: boolean
  taskIds?: string[]
  userId?: string
}

class StreakService {
  private readonly HOLIDAYS_KEY = 'streak_holidays'

  async getStreaks(): Promise<Streak[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      return storage.getItem<Streak[]>(STORAGE_KEY) || []
    } catch (error) {
      throw new StreakServiceError('Failed to retrieve streaks', 'GET_STREAKS_ERROR')
    }
  }

  async getStreaksByUser(userId: string): Promise<Streak[]> {
    try {
      if (!userId) {
        throw new StreakServiceError('User ID is required', 'INVALID_USER_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 80))
      const streaks = storage.getItem<Streak[]>(STORAGE_KEY) || []
      return streaks.filter(streak => streak.userId === userId)
    } catch (error) {
      if (error instanceof StreakServiceError) throw error
      throw new StreakServiceError('Failed to retrieve user streaks', 'GET_USER_STREAKS_ERROR')
    }
  }

  async getStreaksByTask(taskId: string): Promise<Streak[]> {
    try {
      if (!taskId) {
        throw new StreakServiceError('Task ID is required', 'INVALID_TASK_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 80))
      const streaks = storage.getItem<Streak[]>(STORAGE_KEY) || []
      return streaks.filter(streak => streak.taskId === taskId)
    } catch (error) {
      if (error instanceof StreakServiceError) throw error
      throw new StreakServiceError('Failed to retrieve task streaks', 'GET_TASK_STREAKS_ERROR')
    }
  }

  async getFilteredStreaks(filters: StreakFilters): Promise<Streak[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      let streaks = storage.getItem<Streak[]>(STORAGE_KEY) || []

      if (filters.userId) {
        streaks = streaks.filter(s => s.userId === filters.userId)
      }

      if (filters.taskId) {
        streaks = streaks.filter(s => s.taskId === filters.taskId)
      }

      if (filters.familyId) {
        streaks = streaks.filter(s => s.familyId === filters.familyId)
      }

      if (filters.isActive !== undefined) {
        streaks = streaks.filter(s => s.isActive === filters.isActive)
      }

      return streaks
    } catch (error) {
      if (error instanceof StreakServiceError) throw error
      throw new StreakServiceError('Failed to filter streaks', 'FILTER_STREAKS_ERROR')
    }
  }

  async calculateStreak(userId: string, taskId: string, taskFrequency: string, familyId: string): Promise<Streak> {
    try {
      if (!userId || !taskId || !taskFrequency || !familyId) {
        throw new StreakServiceError('User ID, Task ID, frequency, and family ID are required', 'INVALID_PARAMETERS')
      }

      // Get approved completions for this user and task
      const completions = await completionService.getFilteredCompletions({
        userId,
        taskId,
        status: 'approved'
      })

      // Sort completions by completion date
      const sortedCompletions = completions.sort((a, b) => 
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      )

      let currentStreak = 0
      let longestStreak = 0
      let lastCompletionDate: Date | null = null
      let streakStartDate: Date | null = null

      if (sortedCompletions.length === 0) {
        // No completions yet
        const newStreak: Streak = {
          id: `streak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          taskId,
          familyId,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletionDate: new Date(),
          isActive: true,
          startDate: new Date()
        }

        return newStreak
      }

      // Calculate streaks based on task frequency with improved logic
      let consecutiveDays = 1
      let tempStreak = 1
      
      for (let i = 0; i < sortedCompletions.length; i++) {
        const completion = sortedCompletions[i]
        const completionDate = this.normalizeDate(new Date(completion.completedAt))

        if (i === 0) {
          tempStreak = 1
          streakStartDate = completionDate
        } else {
          const prevCompletion = sortedCompletions[i - 1]
          const prevDate = this.normalizeDate(new Date(prevCompletion.completedAt))

          const isConsecutive = await this.isConsecutiveByFrequencyWithHolidays(
            prevDate, 
            completionDate, 
            taskFrequency, 
            familyId, 
            taskId, 
            userId
          )
          
          if (isConsecutive) {
            tempStreak++
          } else {
            // Streak broken, update longest and reset
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
            streakStartDate = completionDate
          }
        }

        lastCompletionDate = completionDate
        consecutiveDays = tempStreak
      }

      // Use enhanced logic to determine if streak is still active
      const isActive = lastCompletionDate 
        ? await this.isConsecutiveByFrequencyWithHolidays(lastCompletionDate, new Date(), taskFrequency, familyId, taskId, userId)
        : false

      if (isActive) {
        currentStreak = consecutiveDays
      } else {
        currentStreak = 0
      }

      longestStreak = Math.max(longestStreak, consecutiveDays)

      const streak: Streak = {
        id: `streak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        taskId,
        familyId,
        currentStreak,
        longestStreak,
        lastCompletionDate: lastCompletionDate || new Date(),
        isActive,
        startDate: streakStartDate || new Date()
      }

      return streak
    } catch (error) {
      if (error instanceof StreakServiceError) throw error
      throw new StreakServiceError('Failed to calculate streak', 'CALCULATE_STREAK_ERROR')
    }
  }

  async updateStreak(userId: string, taskId: string, taskFrequency: string, familyId: string): Promise<Streak> {
    try {
      const calculatedStreak = await this.calculateStreak(userId, taskId, taskFrequency, familyId)
      
      // Find existing streak
      const streaks = storage.getItem<Streak[]>(STORAGE_KEY) || []
      const existingIndex = streaks.findIndex(s => 
        s.userId === userId && s.taskId === taskId
      )

      if (existingIndex >= 0) {
        // Update existing streak but keep the original ID and startDate
        streaks[existingIndex] = {
          ...calculatedStreak,
          id: streaks[existingIndex].id,
          startDate: streaks[existingIndex].startDate
        }
      } else {
        // Add new streak
        streaks.push(calculatedStreak)
      }

      const success = storage.setItem(STORAGE_KEY, streaks)
      if (!success) {
        throw new StreakServiceError('Failed to save streak', 'STORAGE_ERROR')
      }

      return streaks[existingIndex >= 0 ? existingIndex : streaks.length - 1]
    } catch (error) {
      if (error instanceof StreakServiceError) throw error
      throw new StreakServiceError('Failed to update streak', 'UPDATE_STREAK_ERROR')
    }
  }

  async updateAllStreaksForUser(userId: string, userTasks: Array<{id: string, frequency: string, familyId: string}>): Promise<Streak[]> {
    try {
      if (!userId) {
        throw new StreakServiceError('User ID is required', 'INVALID_USER_ID')
      }

      if (!userTasks || userTasks.length === 0) {
        return []
      }

      const updatedStreaks: Streak[] = []

      for (const task of userTasks) {
        const streak = await this.updateStreak(userId, task.id, task.frequency, task.familyId)
        updatedStreaks.push(streak)
      }

      return updatedStreaks
    } catch (error) {
      if (error instanceof StreakServiceError) throw error
      throw new StreakServiceError('Failed to update user streaks', 'UPDATE_USER_STREAKS_ERROR')
    }
  }

  async getStreakStats(userId: string, familyId?: string): Promise<{
    totalActiveStreaks: number
    longestCurrentStreak: number
    longestOverallStreak: number
    averageStreakLength: number
  }> {
    try {
      if (!userId) {
        throw new StreakServiceError('User ID is required', 'INVALID_USER_ID')
      }

      const filters: StreakFilters = { userId }
      if (familyId) filters.familyId = familyId

      const streaks = await this.getFilteredStreaks(filters)

      const activeStreaks = streaks.filter(s => s.isActive && s.currentStreak > 0)
      const longestCurrentStreak = Math.max(...streaks.map(s => s.currentStreak), 0)
      const longestOverallStreak = Math.max(...streaks.map(s => s.longestStreak), 0)
      const averageStreakLength = streaks.length > 0 
        ? streaks.reduce((sum, s) => sum + s.longestStreak, 0) / streaks.length 
        : 0

      return {
        totalActiveStreaks: activeStreaks.length,
        longestCurrentStreak,
        longestOverallStreak,
        averageStreakLength: Math.round(averageStreakLength * 10) / 10
      }
    } catch (error) {
      if (error instanceof StreakServiceError) throw error
      throw new StreakServiceError('Failed to get streak stats', 'GET_STREAK_STATS_ERROR')
    }
  }

  private getFrequencyDays(frequency: string): number {
    switch (frequency) {
      case 'daily': return 1
      case 'weekly': return 7
      case 'monthly': return 30
      case 'once': return Infinity
      default: return 1
    }
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime())
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  }

  // Enhanced streak calculation that considers frequency patterns
  private isConsecutiveByFrequency(prevDate: Date, currentDate: Date, frequency: string): boolean {
    const daysDiff = this.getDaysDifference(prevDate, currentDate)
    
    switch (frequency) {
      case 'daily':
        // For daily tasks, allow up to 2 days gap (1 day grace period)
        return daysDiff <= 2
        
      case 'weekly':
        // For weekly tasks, check if they're in consecutive weeks
        // Allow up to 10 days gap (3 days grace period)
        return daysDiff <= 10
        
      case 'monthly':
        // For monthly tasks, check if they're in consecutive months
        // Allow up to 35 days gap (5 days grace period)
        return daysDiff <= 35
        
      case 'once':
        // One-time tasks don't have streaks
        return false
        
      default:
        return daysDiff <= 2
    }
  }

  // Helper to normalize dates for consistent comparison
  private normalizeDate(date: Date): Date {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  async resetStreak(userId: string, taskId: string): Promise<boolean> {
    try {
      if (!userId || !taskId) {
        throw new StreakServiceError('User ID and Task ID are required', 'INVALID_PARAMETERS')
      }

      const streaks = storage.getItem<Streak[]>(STORAGE_KEY) || []
      const streakIndex = streaks.findIndex(s => 
        s.userId === userId && s.taskId === taskId
      )

      if (streakIndex === -1) {
        return false
      }

      streaks[streakIndex] = {
        ...streaks[streakIndex],
        currentStreak: 0,
        isActive: false
      }

      const success = storage.setItem(STORAGE_KEY, streaks)
      if (!success) {
        throw new StreakServiceError('Failed to reset streak', 'STORAGE_ERROR')
      }

      return true
    } catch (error) {
      if (error instanceof StreakServiceError) throw error
      throw new StreakServiceError('Failed to reset streak', 'RESET_STREAK_ERROR')
    }
  }

  /**
   * Add a holiday/exception date that won't break streaks
   */
  async addHolidayException(exception: Omit<HolidayException, 'id'>): Promise<HolidayException> {
    try {
      const newException: HolidayException = {
        ...exception,
        id: `holiday-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      const holidays = storage.getItem<HolidayException[]>(this.HOLIDAYS_KEY) || []
      holidays.push(newException)
      
      const success = storage.setItem(this.HOLIDAYS_KEY, holidays)
      if (!success) {
        throw new StreakServiceError('Failed to save holiday exception', 'STORAGE_ERROR')
      }

      return newException
    } catch (error) {
      if (error instanceof StreakServiceError) throw error
      throw new StreakServiceError('Failed to add holiday exception', 'ADD_HOLIDAY_ERROR')
    }
  }

  /**
   * Get holiday exceptions for a family
   */
  async getHolidayExceptions(familyId: string): Promise<HolidayException[]> {
    try {
      const holidays = storage.getItem<HolidayException[]>(this.HOLIDAYS_KEY) || []
      return holidays.filter(h => h.familyId === familyId)
    } catch (error) {
      throw new StreakServiceError('Failed to get holiday exceptions', 'GET_HOLIDAYS_ERROR')
    }
  }

  /**
   * Remove a holiday exception
   */
  async removeHolidayException(holidayId: string): Promise<boolean> {
    try {
      const holidays = storage.getItem<HolidayException[]>(this.HOLIDAYS_KEY) || []
      const filteredHolidays = holidays.filter(h => h.id !== holidayId)
      
      if (filteredHolidays.length === holidays.length) {
        return false // Holiday not found
      }

      const success = storage.setItem(this.HOLIDAYS_KEY, filteredHolidays)
      return success
    } catch (error) {
      throw new StreakServiceError('Failed to remove holiday exception', 'REMOVE_HOLIDAY_ERROR')
    }
  }

  /**
   * Check if a date range contains any holiday exceptions for given task/user
   */
  private async hasHolidayException(
    startDate: Date, 
    endDate: Date, 
    familyId: string, 
    taskId?: string, 
    userId?: string
  ): Promise<boolean> {
    try {
      const holidays = await this.getHolidayExceptions(familyId)
      
      return holidays.some(holiday => {
        const holidayDate = new Date(holiday.date)
        const isInRange = holidayDate >= startDate && holidayDate <= endDate
        
        if (!isInRange) return false
        
        // Check if holiday applies to this task/user
        if (holiday.affectsAllTasks) return true
        if (holiday.taskIds && taskId && holiday.taskIds.includes(taskId)) return true
        if (holiday.userId && userId && holiday.userId === userId) return true
        
        return false
      })
    } catch (error) {
      // If we can't check holidays, don't break streak calculation
      console.error('Error checking holiday exceptions:', error)
      return false
    }
  }

  // Enhanced streak calculation that considers frequency patterns and holidays
  private async isConsecutiveByFrequencyWithHolidays(
    prevDate: Date, 
    currentDate: Date, 
    frequency: string, 
    familyId: string, 
    taskId?: string, 
    userId?: string
  ): Promise<boolean> {
    const daysDiff = this.getDaysDifference(prevDate, currentDate)
    
    // Check if there are any holiday exceptions in the gap
    const hasHoliday = await this.hasHolidayException(prevDate, currentDate, familyId, taskId, userId)
    
    switch (frequency) {
      case 'daily':
        // For daily tasks, allow up to 2 days gap (1 day grace period)
        // If there's a holiday, extend grace period by 1 day per holiday
        const dailyGracePeriod = hasHoliday ? 3 : 2
        return daysDiff <= dailyGracePeriod
        
      case 'weekly':
        // For weekly tasks, check if they're in consecutive weeks
        // Allow up to 10 days gap (3 days grace period)
        // If there's a holiday, extend grace period by 2 days
        const weeklyGracePeriod = hasHoliday ? 12 : 10
        return daysDiff <= weeklyGracePeriod
        
      case 'monthly':
        // For monthly tasks, check if they're in consecutive months
        // Allow up to 35 days gap (5 days grace period)
        // If there's a holiday, extend grace period by 3 days
        const monthlyGracePeriod = hasHoliday ? 38 : 35
        return daysDiff <= monthlyGracePeriod
        
      case 'once':
        // One-time tasks don't have streaks
        return false
        
      default:
        const defaultGracePeriod = hasHoliday ? 3 : 2
        return daysDiff <= defaultGracePeriod
    }
  }

  /**
   * Daily streak status check and update (simulates scheduled job)
   * This should be called once per day to update streak statuses
   */
  async performDailyStreakCheck(familyId: string): Promise<{
    updated: number
    deactivated: number
    errors: string[]
  }> {
    try {
      const allStreaks = await this.getFilteredStreaks({ familyId, isActive: true })
      const today = new Date()
      
      let updated = 0
      let deactivated = 0
      const errors: string[] = []
      
      for (const streak of allStreaks) {
        try {
          // Get the most recent completion for this streak
          const completions = await completionService.getFilteredCompletions({
            userId: streak.userId,
            taskId: streak.taskId,
            status: 'approved'
          })
          
          if (completions.length === 0) {
            continue // No completions, keep current state
          }
          
          // Sort by completion date to get the most recent
          const sortedCompletions = completions.sort((a, b) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          )
          
          const lastCompletion = sortedCompletions[0]
          const lastCompletionDate = new Date(lastCompletion.completedAt)
          
          // Check if streak should still be active based on current date
          // We need to get task frequency - this is a simplified check
          // In a real application, we'd fetch task details
          const daysSinceLastCompletion = this.getDaysDifference(lastCompletionDate, today)
          
          // Default frequency assumption for this check (could be improved by fetching task data)
          const maxGracePeriod = 3 // Conservative grace period
          
          if (daysSinceLastCompletion > maxGracePeriod && streak.isActive) {
            // Deactivate streak
            await this.resetStreak(streak.userId, streak.taskId)
            deactivated++
          } else {
            updated++
          }
          
        } catch (error) {
          errors.push(`Failed to check streak ${streak.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
      return { updated, deactivated, errors }
      
    } catch (error) {
      throw new StreakServiceError('Failed to perform daily streak check', 'DAILY_CHECK_ERROR')
    }
  }

  /**
   * Get streak summary for a user across all their active tasks
   */
  async getUserStreakSummary(userId: string, familyId: string): Promise<{
    totalActiveStreaks: number
    longestCurrentStreak: number
    streaksByTask: Array<{
      taskId: string
      currentStreak: number
      longestStreak: number
      isActive: boolean
      lastCompletionDate: Date
    }>
  }> {
    try {
      const userStreaks = await this.getFilteredStreaks({ userId, familyId })
      const activeStreaks = userStreaks.filter(s => s.isActive && s.currentStreak > 0)
      const longestCurrentStreak = Math.max(...userStreaks.map(s => s.currentStreak), 0)
      
      const streaksByTask = userStreaks.map(streak => ({
        taskId: streak.taskId,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        isActive: streak.isActive,
        lastCompletionDate: streak.lastCompletionDate
      }))
      
      return {
        totalActiveStreaks: activeStreaks.length,
        longestCurrentStreak,
        streaksByTask
      }
    } catch (error) {
      if (error instanceof StreakServiceError) throw error
      throw new StreakServiceError('Failed to get user streak summary', 'GET_USER_SUMMARY_ERROR')
    }
  }
}

export const streakService = new StreakService()