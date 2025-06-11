import { completionService } from './completionService'
import { taskService } from './taskService'
import { storage } from '@/lib/storage'
import type { TaskCompletion, Task } from '@/models'

const ALLOWANCE_PAYMENTS_KEY = 'allowance_payments'

export interface AllowancePayment {
  id: string
  userId: string
  familyId: string
  amount: number
  weekStart: Date
  weekEnd: Date
  taskCompletions: string[] // Completion IDs
  paidAt: Date
  paidBy: string
  status: 'pending' | 'paid' | 'cancelled'
  notes?: string
}

export interface WeeklyAllowanceCalculation {
  userId: string
  weekStart: Date
  weekEnd: Date
  totalEarned: number
  totalPending: number
  totalPaid: number
  completions: Array<{
    completion: TaskCompletion
    task: Task
    allowanceAmount: number
  }>
}

export class AllowanceServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'AllowanceServiceError'
  }
}

class AllowanceService {
  // Calculate weekly allowance for a user
  async calculateWeeklyAllowance(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<WeeklyAllowanceCalculation> {
    try {
      if (!userId) {
        throw new AllowanceServiceError('User ID is required', 'INVALID_USER_ID')
      }

      // Get all completions for the user in the date range
      const allCompletions = await completionService.getCompletionsByUser(userId)
      
      const weekCompletions = allCompletions.filter(completion => {
        const completionDate = new Date(completion.completedAt)
        return completionDate >= startDate && completionDate <= endDate
      })

      // Get task details and calculate allowance
      const allowanceData: WeeklyAllowanceCalculation['completions'] = []
      let totalEarned = 0
      let totalPending = 0

      for (const completion of weekCompletions) {
        if (completion.allowanceAwarded && completion.allowanceAwarded > 0) {
          const task = await taskService.getTask(completion.taskId)
          if (task && task.allowanceEnabled) {
            allowanceData.push({
              completion,
              task,
              allowanceAmount: completion.allowanceAwarded
            })

            if (completion.status === 'approved') {
              totalEarned += completion.allowanceAwarded
              totalPending += completion.allowanceAwarded // Until payment tracking is implemented
            }
          }
        }
      }

      // Get payment information (TODO: implement proper payment tracking)
      const totalPaid = 0 // Placeholder

      return {
        userId,
        weekStart: startDate,
        weekEnd: endDate,
        totalEarned,
        totalPending: totalPending - totalPaid,
        totalPaid,
        completions: allowanceData.sort((a, b) => 
          new Date(b.completion.completedAt).getTime() - new Date(a.completion.completedAt).getTime()
        )
      }
    } catch (error) {
      if (error instanceof AllowanceServiceError) throw error
      throw new AllowanceServiceError('Failed to calculate weekly allowance', 'CALCULATION_ERROR')
    }
  }

  // Get current week dates (Monday to Sunday, Norwegian standard)
  getCurrentWeekDates(): { start: Date; end: Date } {
    const now = new Date()
    const currentDay = now.getDay()
    
    // Adjust to Monday as start of week
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - daysFromMonday)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    return { start: startOfWeek, end: endOfWeek }
  }

  // Get week dates with offset
  getWeekDates(weekOffset: number = 0): { start: Date; end: Date } {
    const { start, end } = this.getCurrentWeekDates()
    
    const offsetStart = new Date(start)
    offsetStart.setDate(start.getDate() + (weekOffset * 7))
    
    const offsetEnd = new Date(end)
    offsetEnd.setDate(end.getDate() + (weekOffset * 7))
    
    return { start: offsetStart, end: offsetEnd }
  }

  // Calculate allowance for current week
  async calculateCurrentWeekAllowance(userId: string): Promise<WeeklyAllowanceCalculation> {
    const { start, end } = this.getCurrentWeekDates()
    return this.calculateWeeklyAllowance(userId, start, end)
  }

  // Get monthly allowance summary
  async calculateMonthlyAllowance(userId: string, year: number, month: number) {
    try {
      const startDate = new Date(year, month - 1, 1) // month is 0-indexed
      const endDate = new Date(year, month, 0, 23, 59, 59, 999) // Last day of month

      const monthlyData = await this.calculateWeeklyAllowance(userId, startDate, endDate)
      
      // Group by weeks for monthly view
      const weeks: WeeklyAllowanceCalculation[] = []
      let currentWeekStart = new Date(startDate)
      
      while (currentWeekStart <= endDate) {
        const weekEnd = new Date(currentWeekStart)
        weekEnd.setDate(currentWeekStart.getDate() + 6)
        if (weekEnd > endDate) {
          weekEnd.setTime(endDate.getTime())
        }
        
        const weekData = await this.calculateWeeklyAllowance(userId, currentWeekStart, weekEnd)
        if (weekData.completions.length > 0) {
          weeks.push(weekData)
        }
        
        // Move to next week
        currentWeekStart = new Date(weekEnd)
        currentWeekStart.setDate(weekEnd.getDate() + 1)
      }
      
      return {
        month: month,
        year: year,
        totalEarned: monthlyData.totalEarned,
        totalPending: monthlyData.totalPending,
        totalPaid: monthlyData.totalPaid,
        weeks: weeks,
        completions: monthlyData.completions
      }
    } catch (error) {
      if (error instanceof AllowanceServiceError) throw error
      throw new AllowanceServiceError('Failed to calculate monthly allowance', 'MONTHLY_CALCULATION_ERROR')
    }
  }

  // Get allowance history for a user
  async getAllowanceHistory(userId: string, limit: number = 10): Promise<WeeklyAllowanceCalculation[]> {
    try {
      const history: WeeklyAllowanceCalculation[] = []
      const now = new Date()
      
      // Get last 'limit' weeks
      for (let i = 0; i < limit; i++) {
        const { start, end } = this.getWeekDates(-i)
        const weekData = await this.calculateWeeklyAllowance(userId, start, end)
        
        if (weekData.completions.length > 0 || i === 0) { // Always include current week
          history.push(weekData)
        }
      }
      
      return history
    } catch (error) {
      if (error instanceof AllowanceServiceError) throw error
      throw new AllowanceServiceError('Failed to get allowance history', 'HISTORY_ERROR')
    }
  }

  // Payment tracking methods (placeholder implementation)
  async createPayment(payment: Omit<AllowancePayment, 'id'>): Promise<AllowancePayment> {
    try {
      const newPayment: AllowancePayment = {
        ...payment,
        id: crypto.randomUUID()
      }

      const payments = storage.getItem<AllowancePayment[]>(ALLOWANCE_PAYMENTS_KEY) || []
      payments.push(newPayment)
      
      const success = storage.setItem(ALLOWANCE_PAYMENTS_KEY, payments)
      if (!success) {
        throw new AllowanceServiceError('Failed to save payment', 'STORAGE_ERROR')
      }

      return newPayment
    } catch (error) {
      if (error instanceof AllowanceServiceError) throw error
      throw new AllowanceServiceError('Failed to create payment', 'CREATE_PAYMENT_ERROR')
    }
  }

  async getPayments(familyId: string): Promise<AllowancePayment[]> {
    try {
      const payments = storage.getItem<AllowancePayment[]>(ALLOWANCE_PAYMENTS_KEY) || []
      return payments.filter(payment => payment.familyId === familyId)
    } catch (error) {
      throw new AllowanceServiceError('Failed to get payments', 'GET_PAYMENTS_ERROR')
    }
  }

  async getPaymentsByUser(userId: string): Promise<AllowancePayment[]> {
    try {
      const payments = storage.getItem<AllowancePayment[]>(ALLOWANCE_PAYMENTS_KEY) || []
      return payments.filter(payment => payment.userId === userId)
    } catch (error) {
      throw new AllowanceServiceError('Failed to get user payments', 'GET_USER_PAYMENTS_ERROR')
    }
  }

  async markPaymentAsPaid(paymentId: string, paidBy: string): Promise<AllowancePayment | null> {
    try {
      const payments = storage.getItem<AllowancePayment[]>(ALLOWANCE_PAYMENTS_KEY) || []
      const paymentIndex = payments.findIndex(p => p.id === paymentId)
      
      if (paymentIndex === -1) {
        return null
      }

      payments[paymentIndex] = {
        ...payments[paymentIndex],
        status: 'paid',
        paidAt: new Date(),
        paidBy
      }

      const success = storage.setItem(ALLOWANCE_PAYMENTS_KEY, payments)
      if (!success) {
        throw new AllowanceServiceError('Failed to update payment', 'STORAGE_ERROR')
      }

      return payments[paymentIndex]
    } catch (error) {
      if (error instanceof AllowanceServiceError) throw error
      throw new AllowanceServiceError('Failed to mark payment as paid', 'MARK_PAID_ERROR')
    }
  }

  // Family allowance overview
  async getFamilyAllowanceOverview(familyId: string): Promise<{
    totalWeeklyEarned: number
    totalWeeklyPending: number
    totalWeeklyPaid: number
    userSummaries: Array<{
      userId: string
      userName: string
      weeklyEarned: number
      weeklyPending: number
      weeklyPaid: number
    }>
  }> {
    try {
      // This would require user service integration to get family members
      // For now, return placeholder structure
      return {
        totalWeeklyEarned: 0,
        totalWeeklyPending: 0,
        totalWeeklyPaid: 0,
        userSummaries: []
      }
    } catch (error) {
      throw new AllowanceServiceError('Failed to get family overview', 'FAMILY_OVERVIEW_ERROR')
    }
  }

  // Validation helpers
  async validateTaskCompletion(taskId: string, userId: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      const task = await taskService.getTask(taskId)
      if (!task) {
        return { valid: false, reason: 'Task not found' }
      }

      if (!task.allowanceEnabled) {
        return { valid: false, reason: 'Task does not provide allowance' }
      }

      if (!task.allowanceAmount || task.allowanceAmount <= 0) {
        return { valid: false, reason: 'Task has no allowance amount set' }
      }

      if (task.assignedTo !== userId) {
        return { valid: false, reason: 'Task is not assigned to this user' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, reason: 'Error validating task completion' }
    }
  }
}

export const allowanceService = new AllowanceService()
export default allowanceService 