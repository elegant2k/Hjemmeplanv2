import { useState, useEffect, useCallback } from 'react'
import { streakService, type HolidayException } from '@/services'
import { useUser } from '@/contexts/UserContext'
import type { Streak } from '@/models'

interface UseStreaksReturn {
  streaks: Streak[]
  holidays: HolidayException[]
  isLoading: boolean
  error: string | null
  refreshStreaks: () => Promise<void>
  addHoliday: (holiday: Omit<HolidayException, 'id'>) => Promise<void>
  removeHoliday: (holidayId: string) => Promise<void>
  performDailyCheck: () => Promise<{ updated: number; deactivated: number; errors: string[] }>
  getUserSummary: (userId: string) => Promise<any>
}

export const useStreaks = (): UseStreaksReturn => {
  const { currentFamily } = useUser()
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [holidays, setHolidays] = useState<HolidayException[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshStreaks = useCallback(async () => {
    if (!currentFamily) return

    try {
      setIsLoading(true)
      setError(null)
      
      const [streaksData, holidaysData] = await Promise.all([
        streakService.getFilteredStreaks({ familyId: currentFamily.id }),
        streakService.getHolidayExceptions(currentFamily.id)
      ])
      
      setStreaks(streaksData)
      setHolidays(holidaysData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streaks')
    } finally {
      setIsLoading(false)
    }
  }, [currentFamily])

  const addHoliday = useCallback(async (holiday: Omit<HolidayException, 'id'>) => {
    try {
      setError(null)
      await streakService.addHolidayException(holiday)
      await refreshStreaks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add holiday')
      throw err
    }
  }, [refreshStreaks])

  const removeHoliday = useCallback(async (holidayId: string) => {
    try {
      setError(null)
      await streakService.removeHolidayException(holidayId)
      await refreshStreaks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove holiday')
      throw err
    }
  }, [refreshStreaks])

  const performDailyCheck = useCallback(async () => {
    if (!currentFamily) {
      throw new Error('No family selected')
    }

    try {
      setError(null)
      const result = await streakService.performDailyStreakCheck(currentFamily.id)
      await refreshStreaks()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform daily check')
      throw err
    }
  }, [currentFamily, refreshStreaks])

  const getUserSummary = useCallback(async (userId: string) => {
    if (!currentFamily) {
      throw new Error('No family selected')
    }

    try {
      setError(null)
      return await streakService.getUserStreakSummary(userId, currentFamily.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get user summary')
      throw err
    }
  }, [currentFamily])

  useEffect(() => {
    refreshStreaks()
  }, [refreshStreaks])

  return {
    streaks,
    holidays,
    isLoading,
    error,
    refreshStreaks,
    addHoliday,
    removeHoliday,
    performDailyCheck,
    getUserSummary
  }
} 