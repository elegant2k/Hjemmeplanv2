import type { Family } from '@/models'
import { storage } from '@/lib/storage'

const STORAGE_KEY = 'families'

export class FamilyServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'FamilyServiceError'
  }
}

class FamilyService {
  async getFamilies(): Promise<Family[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100))
      return storage.getItem<Family[]>(STORAGE_KEY) || []
    } catch (error) {
      throw new FamilyServiceError('Failed to retrieve families', 'GET_FAMILIES_ERROR')
    }
  }

  async getFamily(id: string): Promise<Family | null> {
    try {
      if (!id) {
        throw new FamilyServiceError('Family ID is required', 'INVALID_ID')
      }
      
      await new Promise(resolve => setTimeout(resolve, 50))
      const families = storage.getItem<Family[]>(STORAGE_KEY) || []
      return families.find(family => family.id === id) || null
    } catch (error) {
      if (error instanceof FamilyServiceError) throw error
      throw new FamilyServiceError('Failed to retrieve family', 'GET_FAMILY_ERROR')
    }
  }

  async createFamily(familyData: Omit<Family, 'id' | 'createdAt'>): Promise<Family> {
    try {
      if (!familyData.name?.trim()) {
        throw new FamilyServiceError('Family name is required', 'INVALID_NAME')
      }

      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Check if family name already exists
      const existingFamilies = storage.getItem<Family[]>(STORAGE_KEY) || []
      if (existingFamilies.some(f => f.name.toLowerCase() === familyData.name.toLowerCase())) {
        throw new FamilyServiceError('Family name already exists', 'DUPLICATE_NAME')
      }
      
      const newFamily: Family = {
        ...familyData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }

      const families = [...existingFamilies, newFamily]
      const success = storage.setItem(STORAGE_KEY, families)
      
      if (!success) {
        throw new FamilyServiceError('Failed to save family', 'STORAGE_ERROR')
      }

      return newFamily
    } catch (error) {
      if (error instanceof FamilyServiceError) throw error
      throw new FamilyServiceError('Failed to create family', 'CREATE_FAMILY_ERROR')
    }
  }

  async joinFamily(familyCode: string, userName: string): Promise<Family | null> {
    try {
      if (!familyCode?.trim()) {
        throw new FamilyServiceError('Family code is required', 'INVALID_CODE')
      }
      
      if (!userName?.trim()) {
        throw new FamilyServiceError('User name is required', 'INVALID_USERNAME')
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      
      const families = storage.getItem<Family[]>(STORAGE_KEY) || []
      const family = families.find(f => f.name.toLowerCase() === familyCode.toLowerCase())
      
      if (!family) {
        return null // Family not found
      }

      // Update member count
      const updatedFamily = { ...family, memberCount: family.memberCount + 1 }
      const familyIndex = families.findIndex(f => f.id === family.id)
      families[familyIndex] = updatedFamily
      
      const success = storage.setItem(STORAGE_KEY, families)
      if (!success) {
        throw new FamilyServiceError('Failed to join family', 'STORAGE_ERROR')
      }

      return updatedFamily
    } catch (error) {
      if (error instanceof FamilyServiceError) throw error
      throw new FamilyServiceError('Failed to join family', 'JOIN_FAMILY_ERROR')
    }
  }

  async updateFamily(id: string, updates: Partial<Family>): Promise<Family | null> {
    try {
      if (!id) {
        throw new FamilyServiceError('Family ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      
      const families = storage.getItem<Family[]>(STORAGE_KEY) || []
      const familyIndex = families.findIndex(family => family.id === id)
      
      if (familyIndex === -1) {
        return null
      }

      families[familyIndex] = { ...families[familyIndex], ...updates }
      const success = storage.setItem(STORAGE_KEY, families)
      
      if (!success) {
        throw new FamilyServiceError('Failed to update family', 'STORAGE_ERROR')
      }

      return families[familyIndex]
    } catch (error) {
      if (error instanceof FamilyServiceError) throw error
      throw new FamilyServiceError('Failed to update family', 'UPDATE_FAMILY_ERROR')
    }
  }

  async deleteFamily(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new FamilyServiceError('Family ID is required', 'INVALID_ID')
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      
      const families = storage.getItem<Family[]>(STORAGE_KEY) || []
      const filteredFamilies = families.filter(family => family.id !== id)
      
      if (filteredFamilies.length === families.length) {
        return false // Family not found
      }

      const success = storage.setItem(STORAGE_KEY, filteredFamilies)
      if (!success) {
        throw new FamilyServiceError('Failed to delete family', 'STORAGE_ERROR')
      }
      
      return true
    } catch (error) {
      if (error instanceof FamilyServiceError) throw error
      throw new FamilyServiceError('Failed to delete family', 'DELETE_FAMILY_ERROR')
    }
  }
}

export const familyService = new FamilyService()