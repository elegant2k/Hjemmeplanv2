import { storage } from '@/lib/storage'
import type { Streak } from '@/models'
import type { HolidayException } from './streakService'

const STORAGE_KEYS = {
  STREAKS: 'streaks',
  HOLIDAYS: 'streak_holidays',
  STREAK_HISTORY: 'streak_history',
  STREAK_METADATA: 'streak_metadata'
} as const

export interface StreakHistory {
  id: string
  userId: string
  taskId: string
  familyId: string
  streakValue: number
  date: Date
  type: 'gained' | 'lost' | 'milestone'
  metadata?: {
    milestone?: number
    reason?: string
  }
}

export interface StreakMetadata {
  familyId: string
  lastDailyCheck: Date
  totalStreaksCreated: number
  totalMilestonesReached: number
  createdAt: Date
  updatedAt: Date
}

class StreakStorage {
  /**
   * Enhanced streak storage with data integrity checks
   */
  async saveStreak(streak: Streak): Promise<void> {
    try {
      const streaks = await this.getAllStreaks()
      const existingIndex = streaks.findIndex(s => s.id === streak.id)
      
      if (existingIndex >= 0) {
        // Update existing streak and record history if current streak changed
        const oldStreak = streaks[existingIndex]
        if (oldStreak.currentStreak !== streak.currentStreak) {
          await this.recordStreakHistory({
            id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: streak.userId,
            taskId: streak.taskId,
            familyId: streak.familyId,
            streakValue: streak.currentStreak,
            date: new Date(),
            type: streak.currentStreak > oldStreak.currentStreak ? 'gained' : 'lost'
          })
        }
        
        streaks[existingIndex] = streak
      } else {
        // Add new streak
        streaks.push(streak)
        await this.recordStreakHistory({
          id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: streak.userId,
          taskId: streak.taskId,
          familyId: streak.familyId,
          streakValue: streak.currentStreak,
          date: new Date(),
          type: 'gained'
        })
      }
      
      storage.setItem(STORAGE_KEYS.STREAKS, streaks)
      await this.updateMetadata(streak.familyId)
    } catch (error) {
      throw new Error(`Failed to save streak: ${error}`)
    }
  }

  /**
   * Get all streaks with optional filtering
   */
  async getAllStreaks(filters?: {
    familyId?: string
    userId?: string
    taskId?: string
    isActive?: boolean
  }): Promise<Streak[]> {
    try {
      let streaks = storage.getItem<Streak[]>(STORAGE_KEYS.STREAKS) || []
      
      if (filters) {
        if (filters.familyId) {
          streaks = streaks.filter(s => s.familyId === filters.familyId)
        }
        if (filters.userId) {
          streaks = streaks.filter(s => s.userId === filters.userId)
        }
        if (filters.taskId) {
          streaks = streaks.filter(s => s.taskId === filters.taskId)
        }
        if (filters.isActive !== undefined) {
          streaks = streaks.filter(s => s.isActive === filters.isActive)
        }
      }
      
      return streaks
    } catch (error) {
      throw new Error(`Failed to get streaks: ${error}`)
    }
  }

  /**
   * Save multiple streaks in batch for better performance
   */
  async saveStreaks(streaks: Streak[]): Promise<void> {
    try {
      const existingStreaks = storage.getItem<Streak[]>(STORAGE_KEYS.STREAKS) || []
      const streakMap = new Map(existingStreaks.map(s => [s.id, s]))
      
      // Update or add each streak
      for (const streak of streaks) {
        const existing = streakMap.get(streak.id)
        if (existing && existing.currentStreak !== streak.currentStreak) {
          // Record history for changed streaks
          await this.recordStreakHistory({
            id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: streak.userId,
            taskId: streak.taskId,
            familyId: streak.familyId,
            streakValue: streak.currentStreak,
            date: new Date(),
            type: streak.currentStreak > existing.currentStreak ? 'gained' : 'lost'
          })
        }
        streakMap.set(streak.id, streak)
      }
      
      storage.setItem(STORAGE_KEYS.STREAKS, Array.from(streakMap.values()))
      
      // Update metadata for all affected families
      const familyIds = [...new Set(streaks.map(s => s.familyId))]
      for (const familyId of familyIds) {
        await this.updateMetadata(familyId)
      }
    } catch (error) {
      throw new Error(`Failed to save streaks batch: ${error}`)
    }
  }

  /**
   * Delete a streak and its history
   */
  async deleteStreak(streakId: string): Promise<boolean> {
    try {
      const streaks = storage.getItem<Streak[]>(STORAGE_KEYS.STREAKS) || []
      const filteredStreaks = streaks.filter(s => s.id !== streakId)
      
      if (filteredStreaks.length === streaks.length) {
        return false // Streak not found
      }
      
      storage.setItem(STORAGE_KEYS.STREAKS, filteredStreaks)
      
      // Also remove related history
      const history = storage.getItem<StreakHistory[]>(STORAGE_KEYS.STREAK_HISTORY) || []
      const filteredHistory = history.filter(h => h.id !== streakId)
      storage.setItem(STORAGE_KEYS.STREAK_HISTORY, filteredHistory)
      
      return true
    } catch (error) {
      throw new Error(`Failed to delete streak: ${error}`)
    }
  }

  /**
   * Record streak history events
   */
  async recordStreakHistory(historyEntry: StreakHistory): Promise<void> {
    try {
      const history = storage.getItem<StreakHistory[]>(STORAGE_KEYS.STREAK_HISTORY) || []
      history.push(historyEntry)
      
      // Keep only last 1000 entries to prevent storage bloat
      if (history.length > 1000) {
        history.splice(0, history.length - 1000)
      }
      
      storage.setItem(STORAGE_KEYS.STREAK_HISTORY, history)
    } catch (error) {
      throw new Error(`Failed to record streak history: ${error}`)
    }
  }

  /**
   * Get streak history for a user or task
   */
  async getStreakHistory(filters: {
    userId?: string
    taskId?: string
    familyId?: string
    limit?: number
  }): Promise<StreakHistory[]> {
    try {
      let history = storage.getItem<StreakHistory[]>(STORAGE_KEYS.STREAK_HISTORY) || []
      
      if (filters.familyId) {
        history = history.filter(h => h.familyId === filters.familyId)
      }
      if (filters.userId) {
        history = history.filter(h => h.userId === filters.userId)
      }
      if (filters.taskId) {
        history = history.filter(h => h.taskId === filters.taskId)
      }
      
      // Sort by date, most recent first
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      if (filters.limit) {
        history = history.slice(0, filters.limit)
      }
      
      return history
    } catch (error) {
      throw new Error(`Failed to get streak history: ${error}`)
    }
  }

  /**
   * Holiday exception storage operations
   */
  async saveHolidayException(holiday: HolidayException): Promise<void> {
    try {
      const holidays = storage.getItem<HolidayException[]>(STORAGE_KEYS.HOLIDAYS) || []
      const existingIndex = holidays.findIndex(h => h.id === holiday.id)
      
      if (existingIndex >= 0) {
        holidays[existingIndex] = holiday
      } else {
        holidays.push(holiday)
      }
      
      storage.setItem(STORAGE_KEYS.HOLIDAYS, holidays)
    } catch (error) {
      throw new Error(`Failed to save holiday exception: ${error}`)
    }
  }

  async getHolidayExceptions(familyId: string): Promise<HolidayException[]> {
    try {
      const holidays = storage.getItem<HolidayException[]>(STORAGE_KEYS.HOLIDAYS) || []
      return holidays.filter(h => h.familyId === familyId)
    } catch (error) {
      throw new Error(`Failed to get holiday exceptions: ${error}`)
    }
  }

  async deleteHolidayException(holidayId: string): Promise<boolean> {
    try {
      const holidays = storage.getItem<HolidayException[]>(STORAGE_KEYS.HOLIDAYS) || []
      const filteredHolidays = holidays.filter(h => h.id !== holidayId)
      
      if (filteredHolidays.length === holidays.length) {
        return false // Holiday not found
      }
      
      storage.setItem(STORAGE_KEYS.HOLIDAYS, filteredHolidays)
      return true
    } catch (error) {
      throw new Error(`Failed to delete holiday exception: ${error}`)
    }
  }

  /**
   * Metadata management
   */
  async updateMetadata(familyId: string): Promise<void> {
    try {
      const metadata = storage.getItem<StreakMetadata[]>(STORAGE_KEYS.STREAK_METADATA) || []
      const existingIndex = metadata.findIndex(m => m.familyId === familyId)
      
      const streaks = await this.getAllStreaks({ familyId })
      const history = await this.getStreakHistory({ familyId })
      const milestones = history.filter(h => h.type === 'milestone').length
      
      const updatedMetadata: StreakMetadata = {
        familyId,
        lastDailyCheck: new Date(),
        totalStreaksCreated: streaks.length,
        totalMilestonesReached: milestones,
        createdAt: existingIndex >= 0 ? metadata[existingIndex].createdAt : new Date(),
        updatedAt: new Date()
      }
      
      if (existingIndex >= 0) {
        metadata[existingIndex] = updatedMetadata
      } else {
        metadata.push(updatedMetadata)
      }
      
      storage.setItem(STORAGE_KEYS.STREAK_METADATA, metadata)
    } catch (error) {
      throw new Error(`Failed to update metadata: ${error}`)
    }
  }

  async getMetadata(familyId: string): Promise<StreakMetadata | null> {
    try {
      const metadata = storage.getItem<StreakMetadata[]>(STORAGE_KEYS.STREAK_METADATA) || []
      return metadata.find(m => m.familyId === familyId) || null
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error}`)
    }
  }

  /**
   * Data integrity and cleanup operations
   */
  async validateDataIntegrity(familyId: string): Promise<{
    valid: boolean
    issues: string[]
    fixed: number
  }> {
    try {
      const issues: string[] = []
      let fixed = 0
      
      // Check for orphaned streaks (no valid user/task references)
      const streaks = await this.getAllStreaks({ familyId })
      const validStreaks = streaks.filter(streak => {
        if (!streak.userId || !streak.taskId || !streak.familyId) {
          issues.push(`Invalid streak ${streak.id}: missing required fields`)
          return false
        }
        return true
      })
      
      if (validStreaks.length !== streaks.length) {
        storage.setItem(STORAGE_KEYS.STREAKS, validStreaks)
        fixed += streaks.length - validStreaks.length
      }
      
      // Check for orphaned history entries
      const history = await this.getStreakHistory({ familyId })
      const validStreakIds = new Set(validStreaks.map(s => s.id))
      const validHistory = history.filter(h => {
        const streakExists = validStreaks.some(s => s.userId === h.userId && s.taskId === h.taskId)
        if (!streakExists) {
          issues.push(`Orphaned history entry for user ${h.userId}, task ${h.taskId}`)
          return false
        }
        return true
      })
      
      if (validHistory.length !== history.length) {
        storage.setItem(STORAGE_KEYS.STREAK_HISTORY, validHistory)
        fixed += history.length - validHistory.length
      }
      
      return {
        valid: issues.length === 0,
        issues,
        fixed
      }
    } catch (error) {
      throw new Error(`Failed to validate data integrity: ${error}`)
    }
  }

  /**
   * Export family streak data for backup
   */
  async exportFamilyData(familyId: string): Promise<{
    streaks: Streak[]
    holidays: HolidayException[]
    history: StreakHistory[]
    metadata: StreakMetadata | null
    exportedAt: Date
  }> {
    try {
      const [streaks, holidays, history, metadata] = await Promise.all([
        this.getAllStreaks({ familyId }),
        this.getHolidayExceptions(familyId),
        this.getStreakHistory({ familyId }),
        this.getMetadata(familyId)
      ])
      
      return {
        streaks,
        holidays,
        history,
        metadata,
        exportedAt: new Date()
      }
    } catch (error) {
      throw new Error(`Failed to export family data: ${error}`)
    }
  }
}

export const streakStorage = new StreakStorage() 