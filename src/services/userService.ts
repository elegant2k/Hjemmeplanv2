import type { User } from '@/models'
import { storage } from '@/lib/storage'

const STORAGE_KEY = 'users'

export class UserServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'UserServiceError'
  }
}

class UserService {
  async getUsers(): Promise<User[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      return storage.getItem<User[]>(STORAGE_KEY) || []
    } catch (error) {
      throw new UserServiceError('Failed to retrieve users', 'GET_USERS_ERROR')
    }
  }

  async getUsersByFamily(familyId: string): Promise<User[]> {
    try {
      if (!familyId) {
        throw new UserServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 80))
      const users = storage.getItem<User[]>(STORAGE_KEY) || []
      return users.filter(user => user.familyId === familyId)
    } catch (error) {
      if (error instanceof UserServiceError) throw error
      throw new UserServiceError('Failed to retrieve family users', 'GET_FAMILY_USERS_ERROR')
    }
  }

  async getUser(id: string): Promise<User | null> {
    try {
      if (!id) {
        throw new UserServiceError('User ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 50))
      const users = storage.getItem<User[]>(STORAGE_KEY) || []
      return users.find(user => user.id === id) || null
    } catch (error) {
      if (error instanceof UserServiceError) throw error
      throw new UserServiceError('Failed to retrieve user', 'GET_USER_ERROR')
    }
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      if (!userData.name?.trim()) {
        throw new UserServiceError('User name is required', 'INVALID_NAME')
      }

      if (!userData.familyId) {
        throw new UserServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      if (!['parent', 'child'].includes(userData.role)) {
        throw new UserServiceError('Invalid user role', 'INVALID_ROLE')
      }

      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Check for duplicate names within family
      const existingUsers = storage.getItem<User[]>(STORAGE_KEY) || []
      const familyUsers = existingUsers.filter(u => u.familyId === userData.familyId)
      
      if (familyUsers.some(u => u.name.toLowerCase() === userData.name.toLowerCase())) {
        throw new UserServiceError('User name already exists in family', 'DUPLICATE_NAME')
      }
      
      const newUser: User = {
        ...userData,
        id: crypto.randomUUID(),
      }

      const users = [...existingUsers, newUser]
      const success = storage.setItem(STORAGE_KEY, users)
      
      if (!success) {
        throw new UserServiceError('Failed to save user', 'STORAGE_ERROR')
      }

      return newUser
    } catch (error) {
      if (error instanceof UserServiceError) throw error
      throw new UserServiceError('Failed to create user', 'CREATE_USER_ERROR')
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      if (!id) {
        throw new UserServiceError('User ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      
      const users = storage.getItem<User[]>(STORAGE_KEY) || []
      const userIndex = users.findIndex(user => user.id === id)
      
      if (userIndex === -1) {
        return null
      }

      users[userIndex] = { ...users[userIndex], ...updates }
      const success = storage.setItem(STORAGE_KEY, users)
      
      if (!success) {
        throw new UserServiceError('Failed to update user', 'STORAGE_ERROR')
      }

      return users[userIndex]
    } catch (error) {
      if (error instanceof UserServiceError) throw error
      throw new UserServiceError('Failed to update user', 'UPDATE_USER_ERROR')
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new UserServiceError('User ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      
      const users = storage.getItem<User[]>(STORAGE_KEY) || []
      const filteredUsers = users.filter(user => user.id !== id)
      
      if (filteredUsers.length === users.length) {
        return false
      }

      const success = storage.setItem(STORAGE_KEY, filteredUsers)
      if (!success) {
        throw new UserServiceError('Failed to delete user', 'STORAGE_ERROR')
      }
      
      return true
    } catch (error) {
      if (error instanceof UserServiceError) throw error
      throw new UserServiceError('Failed to delete user', 'DELETE_USER_ERROR')
    }
  }

  async verifyPin(familyId: string, pin: string): Promise<User | null> {
    try {
      if (!familyId) {
        throw new UserServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      if (!pin) {
        throw new UserServiceError('PIN is required', 'INVALID_PIN')
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      
      const users = storage.getItem<User[]>(STORAGE_KEY) || []
      return users.find(user => 
        user.familyId === familyId && 
        user.role === 'parent' && 
        user.pin === pin
      ) || null
    } catch (error) {
      if (error instanceof UserServiceError) throw error
      throw new UserServiceError('Failed to verify PIN', 'VERIFY_PIN_ERROR')
    }
  }

  async getUserProgress(userId: string): Promise<{
    points: number
    allowance: number
    totalTasksCompleted: number
    activeStreaks: number
    longestStreak: number
  }> {
    try {
      if (!userId) {
        throw new UserServiceError('User ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 50))
      
      // This is a mock implementation - in a real app this would aggregate data from multiple sources
      // For now, return some reasonable default values
      return {
        points: Math.floor(Math.random() * 500) + 50, // Random points between 50-550
        allowance: Math.floor(Math.random() * 200) + 20, // Random allowance between 20-220
        totalTasksCompleted: Math.floor(Math.random() * 100) + 10, // Random completions
        activeStreaks: Math.floor(Math.random() * 5) + 1, // Random active streaks 1-5
        longestStreak: Math.floor(Math.random() * 30) + 5 // Random longest streak 5-35
      }
    } catch (error) {
      if (error instanceof UserServiceError) throw error
      throw new UserServiceError('Failed to get user progress', 'GET_PROGRESS_ERROR')
    }
  }

  async authenticateUser(familyId: string, name: string, pin?: string): Promise<User | null> {
    try {
      if (!familyId) {
        throw new UserServiceError('Family ID is required', 'INVALID_FAMILY_ID')
      }

      if (!name?.trim()) {
        throw new UserServiceError('User name is required', 'INVALID_NAME')
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      
      const users = storage.getItem<User[]>(STORAGE_KEY) || []
      const user = users.find(u => 
        u.familyId === familyId && 
        u.name.toLowerCase() === name.toLowerCase()
      )

      if (!user) {
        return null
      }

      // If user is a parent, PIN is required
      if (user.role === 'parent') {
        if (!pin || user.pin !== pin) {
          throw new UserServiceError('Invalid PIN for parent user', 'INVALID_PARENT_PIN')
        }
      }

      return user
    } catch (error) {
      if (error instanceof UserServiceError) throw error
      throw new UserServiceError('Failed to authenticate user', 'AUTHENTICATE_USER_ERROR')
    }
  }
}

export const userService = new UserService()