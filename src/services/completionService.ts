import type { TaskCompletion } from '@/models'
import { storage } from '@/lib/storage'
import { streakService } from './streakService'

const STORAGE_KEY = 'completions'

export class CompletionServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'CompletionServiceError'
  }
}

interface CompletionFilters {
  taskId?: string
  userId?: string
  familyId?: string
  status?: TaskCompletion['status']
  dateRange?: {
    start: Date
    end: Date
  }
}

class CompletionService {
  async getCompletions(): Promise<TaskCompletion[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      return storage.getItem<TaskCompletion[]>(STORAGE_KEY) || []
    } catch (error) {
      throw new CompletionServiceError('Failed to retrieve completions', 'GET_COMPLETIONS_ERROR')
    }
  }

  async getCompletionsByTask(taskId: string): Promise<TaskCompletion[]> {
    try {
      if (!taskId) {
        throw new CompletionServiceError('Task ID is required', 'INVALID_TASK_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 80))
      const completions = storage.getItem<TaskCompletion[]>(STORAGE_KEY) || []
      return completions.filter(completion => completion.taskId === taskId)
    } catch (error) {
      if (error instanceof CompletionServiceError) throw error
      throw new CompletionServiceError('Failed to retrieve task completions', 'GET_TASK_COMPLETIONS_ERROR')
    }
  }

  async getCompletionsByUser(userId: string): Promise<TaskCompletion[]> {
    try {
      if (!userId) {
        throw new CompletionServiceError('User ID is required', 'INVALID_USER_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 80))
      const completions = storage.getItem<TaskCompletion[]>(STORAGE_KEY) || []
      return completions.filter(completion => completion.userId === userId)
    } catch (error) {
      if (error instanceof CompletionServiceError) throw error
      throw new CompletionServiceError('Failed to retrieve user completions', 'GET_USER_COMPLETIONS_ERROR')
    }
  }

  async getPendingCompletions(familyId: string): Promise<TaskCompletion[]> {
    try {
      if (!familyId) {
        throw new CompletionServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      const completions = storage.getItem<TaskCompletion[]>(STORAGE_KEY) || []
      return completions.filter(completion => 
        completion.familyId === familyId && completion.status === 'pending'
      )
    } catch (error) {
      if (error instanceof CompletionServiceError) throw error
      throw new CompletionServiceError('Failed to retrieve pending completions', 'GET_PENDING_COMPLETIONS_ERROR')
    }
  }

  async getFilteredCompletions(filters: CompletionFilters): Promise<TaskCompletion[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      let completions = storage.getItem<TaskCompletion[]>(STORAGE_KEY) || []

      if (filters.taskId) {
        completions = completions.filter(c => c.taskId === filters.taskId)
      }

      if (filters.userId) {
        completions = completions.filter(c => c.userId === filters.userId)
      }

      if (filters.familyId) {
        completions = completions.filter(c => c.familyId === filters.familyId)
      }

      if (filters.status) {
        completions = completions.filter(c => c.status === filters.status)
      }

      if (filters.dateRange) {
        completions = completions.filter(c => {
          const completionDate = new Date(c.completedAt)
          return completionDate >= filters.dateRange!.start && completionDate <= filters.dateRange!.end
        })
      }

      return completions
    } catch (error) {
      if (error instanceof CompletionServiceError) throw error
      throw new CompletionServiceError('Failed to filter completions', 'FILTER_COMPLETIONS_ERROR')
    }
  }

  async createCompletion(completionData: Omit<TaskCompletion, 'id'>): Promise<TaskCompletion> {
    try {
      // Validation
      if (!completionData.taskId) {
        throw new CompletionServiceError('Task ID is required', 'INVALID_TASK_ID')
      }

      if (!completionData.userId) {
        throw new CompletionServiceError('User ID is required', 'INVALID_USER_ID')
      }

      if (!completionData.familyId) {
        throw new CompletionServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      if (completionData.pointsAwarded < 0) {
        throw new CompletionServiceError('Points awarded cannot be negative', 'INVALID_POINTS')
      }

      // Basic validation - task and user IDs should be provided
      // More detailed validation can be added later without circular dependency
      if (!completionData.taskId || !completionData.userId) {
        throw new CompletionServiceError(
          'Task ID and User ID are required for completion', 
          'INVALID_COMPLETION'
        )
      }

      // Check for duplicate pending completions
      const existingPending = await this.getCompletionsByTask(completionData.taskId)
      const hasPendingCompletion = existingPending.some(c => 
        c.userId === completionData.userId && c.status === 'pending'
      )

      if (hasPendingCompletion) {
        throw new CompletionServiceError(
          'User already has a pending completion for this task', 
          'DUPLICATE_PENDING_COMPLETION'
        )
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      
      const newCompletion: TaskCompletion = {
        ...completionData,
        id: crypto.randomUUID(),
      }

      const completions = storage.getItem<TaskCompletion[]>(STORAGE_KEY) || []
      const updatedCompletions = [...completions, newCompletion]
      const success = storage.setItem(STORAGE_KEY, updatedCompletions)

      if (!success) {
        throw new CompletionServiceError('Failed to save completion', 'STORAGE_ERROR')
      }

      return newCompletion
    } catch (error) {
      if (error instanceof CompletionServiceError) throw error
      throw new CompletionServiceError('Failed to create completion', 'CREATE_COMPLETION_ERROR')
    }
  }

  async approveCompletion(id: string, approvedBy: string, notes?: string): Promise<TaskCompletion | null> {
    try {
      if (!id || !approvedBy) {
        throw new CompletionServiceError('Completion ID and approver ID are required', 'INVALID_APPROVAL_DATA')
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      
      const completions = storage.getItem<TaskCompletion[]>(STORAGE_KEY) || []
      const completionIndex = completions.findIndex(completion => completion.id === id)
      
      if (completionIndex === -1) {
        return null
      }

      const completion = completions[completionIndex]
      
      if (completion.status !== 'pending') {
        throw new CompletionServiceError('Only pending completions can be approved', 'INVALID_STATUS')
      }

      completions[completionIndex] = {
        ...completion,
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        notes: notes || completion.notes
      }

      const success = storage.setItem(STORAGE_KEY, completions)
      if (!success) {
        throw new CompletionServiceError('Failed to approve completion', 'STORAGE_ERROR')
      }

      const updatedCompletion = completions[completionIndex]

      return updatedCompletion
    } catch (error) {
      if (error instanceof CompletionServiceError) throw error
      throw new CompletionServiceError('Failed to approve completion', 'APPROVE_COMPLETION_ERROR')
    }
  }

  /**
   * Approve completion and trigger streak update
   * This method handles the integration between completion approval and streak calculation
   */
  async approveCompletionWithStreakUpdate(
    id: string, 
    approvedBy: string, 
    taskFrequency: string,
    familyId: string,
    notes?: string
  ): Promise<{completion: TaskCompletion | null, streak?: any}> {
    try {
      const updatedCompletion = await this.approveCompletion(id, approvedBy, notes)
      
      if (!updatedCompletion) {
        return { completion: null }
      }

      // Update streak after successful approval
      try {
        // Import streakService here to avoid circular dependency
        const { streakService } = await import('./streakService')
        const updatedStreak = await streakService.updateStreak(
          updatedCompletion.userId,
          updatedCompletion.taskId,
          taskFrequency,
          familyId
        )
        
        return { 
          completion: updatedCompletion,
          streak: updatedStreak
        }
      } catch (streakError) {
        // Log streak error but don't fail the completion approval
        console.error('Failed to update streak after approval:', streakError)
        return { completion: updatedCompletion }
      }
    } catch (error) {
      if (error instanceof CompletionServiceError) throw error
      throw new CompletionServiceError('Failed to approve completion with streak update', 'APPROVE_WITH_STREAK_ERROR')
    }
  }

  async rejectCompletion(id: string, rejectedBy: string, reason?: string): Promise<TaskCompletion | null> {
    try {
      if (!id || !rejectedBy) {
        throw new CompletionServiceError('Completion ID and rejector ID are required', 'INVALID_REJECTION_DATA')
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      
      const completions = storage.getItem<TaskCompletion[]>(STORAGE_KEY) || []
      const completionIndex = completions.findIndex(completion => completion.id === id)
      
      if (completionIndex === -1) {
        return null
      }

      const completion = completions[completionIndex]
      
      if (completion.status !== 'pending') {
        throw new CompletionServiceError('Only pending completions can be rejected', 'INVALID_STATUS')
      }

      completions[completionIndex] = {
        ...completion,
        status: 'rejected',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        notes: reason || completion.notes
      }

      const success = storage.setItem(STORAGE_KEY, completions)
      if (!success) {
        throw new CompletionServiceError('Failed to reject completion', 'STORAGE_ERROR')
      }

      return completions[completionIndex]
    } catch (error) {
      if (error instanceof CompletionServiceError) throw error
      throw new CompletionServiceError('Failed to reject completion', 'REJECT_COMPLETION_ERROR')
    }
  }

  async getCompletionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TaskCompletion[]> {
    try {
      if (!userId) {
        throw new CompletionServiceError('User ID is required', 'INVALID_USER_ID')
      }

      return this.getFilteredCompletions({
        userId,
        status: 'approved',
        dateRange: { start: startDate, end: endDate }
      })
    } catch (error) {
      if (error instanceof CompletionServiceError) throw error
      throw new CompletionServiceError('Failed to get completions by date range', 'GET_DATE_RANGE_ERROR')
    }
  }

  async getCompletionStats(userId: string, familyId?: string): Promise<{
    total: number
    approved: number
    pending: number
    rejected: number
    totalPoints: number
    totalAllowance: number
  }> {
    try {
      if (!userId) {
        throw new CompletionServiceError('User ID is required', 'INVALID_USER_ID')
      }

      const filters: CompletionFilters = { userId }
      if (familyId) filters.familyId = familyId

      const completions = await this.getFilteredCompletions(filters)

      const stats = {
        total: completions.length,
        approved: completions.filter(c => c.status === 'approved').length,
        pending: completions.filter(c => c.status === 'pending').length,
        rejected: completions.filter(c => c.status === 'rejected').length,
        totalPoints: completions
          .filter(c => c.status === 'approved')
          .reduce((sum, c) => sum + c.pointsAwarded, 0),
        totalAllowance: completions
          .filter(c => c.status === 'approved' && c.allowanceAwarded)
          .reduce((sum, c) => sum + (c.allowanceAwarded || 0), 0)
      }

      return stats
    } catch (error) {
      if (error instanceof CompletionServiceError) throw error
      throw new CompletionServiceError('Failed to get completion stats', 'GET_STATS_ERROR')
    }
  }

  async validateCompletionWorkflow(completionId: string, action: 'approve' | 'reject', userId: string): Promise<{
    valid: boolean
    reason?: string
  }> {
    try {
      const completions = storage.getItem<TaskCompletion[]>(STORAGE_KEY) || []
      const completion = completions.find(c => c.id === completionId)

      if (!completion) {
        return { valid: false, reason: 'Completion not found' }
      }

      if (completion.status !== 'pending') {
        return { valid: false, reason: 'Completion is not pending' }
      }

      if (completion.userId === userId) {
        return { valid: false, reason: 'Cannot approve/reject own completion' }
      }

      // Additional business rules could be added here
      // e.g., only parents can approve completions

      return { valid: true }
    } catch (error) {
      throw new CompletionServiceError('Failed to validate completion workflow', 'VALIDATE_WORKFLOW_ERROR')
    }
  }
}

export const completionService = new CompletionService()