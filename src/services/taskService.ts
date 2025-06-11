import type { Task } from '@/models'
import { storage } from '@/lib/storage'

const STORAGE_KEY = 'tasks'

export class TaskServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'TaskServiceError'
  }
}

interface TaskFilters {
  assignedTo?: string
  familyId?: string
  isActive?: boolean
  frequency?: Task['frequency']
  dateRange?: {
    start: Date
    end: Date
  }
}

class TaskService {
  async getTasks(): Promise<Task[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      return storage.getItem<Task[]>(STORAGE_KEY) || []
    } catch (error) {
      throw new TaskServiceError('Failed to retrieve tasks', 'GET_TASKS_ERROR')
    }
  }

  async getTasksByFamily(familyId: string): Promise<Task[]> {
    try {
      if (!familyId) {
        throw new TaskServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 80))
      const tasks = storage.getItem<Task[]>(STORAGE_KEY) || []
      return tasks.filter(task => task.familyId === familyId)
    } catch (error) {
      if (error instanceof TaskServiceError) throw error
      throw new TaskServiceError('Failed to retrieve family tasks', 'GET_FAMILY_TASKS_ERROR')
    }
  }

  async getTasksByUser(userId: string, includeInactive = false): Promise<Task[]> {
    try {
      if (!userId) {
        throw new TaskServiceError('User ID is required', 'INVALID_USER_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 80))
      const tasks = storage.getItem<Task[]>(STORAGE_KEY) || []
      return tasks.filter(task => 
        task.assignedTo === userId && 
        (includeInactive || task.isActive)
      )
    } catch (error) {
      if (error instanceof TaskServiceError) throw error
      throw new TaskServiceError('Failed to retrieve user tasks', 'GET_USER_TASKS_ERROR')
    }
  }

  async getFilteredTasks(filters: TaskFilters): Promise<Task[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      let tasks = storage.getItem<Task[]>(STORAGE_KEY) || []

      if (filters.familyId) {
        tasks = tasks.filter(task => task.familyId === filters.familyId)
      }

      if (filters.assignedTo) {
        tasks = tasks.filter(task => task.assignedTo === filters.assignedTo)
      }

      if (filters.isActive !== undefined) {
        tasks = tasks.filter(task => task.isActive === filters.isActive)
      }

      if (filters.frequency) {
        tasks = tasks.filter(task => task.frequency === filters.frequency)
      }

      if (filters.dateRange) {
        tasks = tasks.filter(task => {
          const taskDate = new Date(task.createdAt)
          return taskDate >= filters.dateRange!.start && taskDate <= filters.dateRange!.end
        })
      }

      return tasks
    } catch (error) {
      if (error instanceof TaskServiceError) throw error
      throw new TaskServiceError('Failed to filter tasks', 'FILTER_TASKS_ERROR')
    }
  }

  async getTask(id: string): Promise<Task | null> {
    try {
      if (!id) {
        throw new TaskServiceError('Task ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 50))
      const tasks = storage.getItem<Task[]>(STORAGE_KEY) || []
      return tasks.find(task => task.id === id) || null
    } catch (error) {
      if (error instanceof TaskServiceError) throw error
      throw new TaskServiceError('Failed to retrieve task', 'GET_TASK_ERROR')
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    try {
      // Validation
      if (!taskData.title?.trim()) {
        throw new TaskServiceError('Task title is required', 'INVALID_TITLE')
      }

      if (!taskData.familyId) {
        throw new TaskServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      if (!taskData.assignedTo) {
        throw new TaskServiceError('Task must be assigned to a user', 'INVALID_ASSIGNMENT')
      }

      if (!taskData.createdBy) {
        throw new TaskServiceError('Creator ID is required', 'INVALID_CREATOR')
      }

      if (taskData.points < 0) {
        throw new TaskServiceError('Points cannot be negative', 'INVALID_POINTS')
      }

      if (!['daily', 'weekly', 'monthly', 'once'].includes(taskData.frequency)) {
        throw new TaskServiceError('Invalid frequency', 'INVALID_FREQUENCY')
      }

      await new Promise(resolve => setTimeout(resolve, 200))
      
      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }

      const tasks = storage.getItem<Task[]>(STORAGE_KEY) || []
      const updatedTasks = [...tasks, newTask]
      const success = storage.setItem(STORAGE_KEY, updatedTasks)

      if (!success) {
        throw new TaskServiceError('Failed to save task', 'STORAGE_ERROR')
      }

      return newTask
    } catch (error) {
      if (error instanceof TaskServiceError) throw error
      throw new TaskServiceError('Failed to create task', 'CREATE_TASK_ERROR')
    }
  }

  async assignTask(taskId: string, userId: string, assignedBy: string): Promise<Task | null> {
    try {
      if (!taskId || !userId || !assignedBy) {
        throw new TaskServiceError('Task ID, user ID, and assigner ID are required', 'INVALID_ASSIGNMENT_DATA')
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      
      const tasks = storage.getItem<Task[]>(STORAGE_KEY) || []
      const taskIndex = tasks.findIndex(task => task.id === taskId)
      
      if (taskIndex === -1) {
        return null
      }

      tasks[taskIndex] = { 
        ...tasks[taskIndex], 
        assignedTo: userId,
        // Note: We could add assignedBy and assignedAt fields to Task model
      }

      const success = storage.setItem(STORAGE_KEY, tasks)
      if (!success) {
        throw new TaskServiceError('Failed to assign task', 'STORAGE_ERROR')
      }

      return tasks[taskIndex]
    } catch (error) {
      if (error instanceof TaskServiceError) throw error
      throw new TaskServiceError('Failed to assign task', 'ASSIGN_TASK_ERROR')
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      if (!id) {
        throw new TaskServiceError('Task ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      
      const tasks = storage.getItem<Task[]>(STORAGE_KEY) || []
      const taskIndex = tasks.findIndex(task => task.id === id)
      
      if (taskIndex === -1) {
        return null
      }

      tasks[taskIndex] = { ...tasks[taskIndex], ...updates }
      const success = storage.setItem(STORAGE_KEY, tasks)

      if (!success) {
        throw new TaskServiceError('Failed to update task', 'STORAGE_ERROR')
      }

      return tasks[taskIndex]
    } catch (error) {
      if (error instanceof TaskServiceError) throw error
      throw new TaskServiceError('Failed to update task', 'UPDATE_TASK_ERROR')
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new TaskServiceError('Task ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      
      const tasks = storage.getItem<Task[]>(STORAGE_KEY) || []
      const filteredTasks = tasks.filter(task => task.id !== id)
      
      if (filteredTasks.length === tasks.length) {
        return false
      }

      const success = storage.setItem(STORAGE_KEY, filteredTasks)
      if (!success) {
        throw new TaskServiceError('Failed to delete task', 'STORAGE_ERROR')
      }

      return true
    } catch (error) {
      if (error instanceof TaskServiceError) throw error
      throw new TaskServiceError('Failed to delete task', 'DELETE_TASK_ERROR')
    }
  }

  async toggleTaskActive(id: string): Promise<Task | null> {
    try {
      const task = await this.getTask(id)
      if (!task) return null

      return this.updateTask(id, { isActive: !task.isActive })
    } catch (error) {
      if (error instanceof TaskServiceError) throw error
      throw new TaskServiceError('Failed to toggle task status', 'TOGGLE_TASK_ERROR')
    }
  }

  async getRecurringTasks(familyId: string): Promise<Task[]> {
    try {
      if (!familyId) {
        throw new TaskServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      return this.getFilteredTasks({
        familyId,
        isActive: true
      }).then(tasks => 
        tasks.filter(task => task.frequency !== 'once')
      )
    } catch (error) {
      if (error instanceof TaskServiceError) throw error
      throw new TaskServiceError('Failed to get recurring tasks', 'GET_RECURRING_TASKS_ERROR')
    }
  }

  async validateTaskCompletion(taskId: string, userId: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      const task = await this.getTask(taskId)
      
      if (!task) {
        return { valid: false, reason: 'Task not found' }
      }

      if (!task.isActive) {
        return { valid: false, reason: 'Task is inactive' }
      }

      if (task.assignedTo !== userId) {
        return { valid: false, reason: 'Task not assigned to this user' }
      }

      // Additional validation logic for recurring tasks could go here
      // e.g., checking if task was already completed today for daily tasks

      return { valid: true }
    } catch (error) {
      throw new TaskServiceError('Failed to validate task completion', 'VALIDATE_COMPLETION_ERROR')
    }
  }
}

export const taskService = new TaskService()