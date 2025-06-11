import { create } from 'zustand'
import type { Family } from '@/models'

interface FamilyState {
  currentFamily: Family | null
  families: Family[]
  
  // Actions
  setCurrentFamily: (family: Family | null) => void
  addFamily: (family: Omit<Family, 'id' | 'createdAt'>) => void
  updateFamily: (id: string, updates: Partial<Family>) => void
  deleteFamily: (id: string) => void
  getFamilyById: (id: string) => Family | undefined
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  currentFamily: null,
  families: [],

  setCurrentFamily: (family) => set({ currentFamily: family }),

  addFamily: (familyData) => {
    const newFamily: Family = {
      ...familyData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }
    
    set((state) => ({
      families: [...state.families, newFamily],
      currentFamily: newFamily
    }))
  },

  updateFamily: (id, updates) => {
    set((state) => ({
      families: state.families.map((family) =>
        family.id === id ? { ...family, ...updates } : family
      ),
      currentFamily: state.currentFamily?.id === id 
        ? { ...state.currentFamily, ...updates }
        : state.currentFamily
    }))
  },

  deleteFamily: (id) => {
    set((state) => ({
      families: state.families.filter((family) => family.id !== id),
      currentFamily: state.currentFamily?.id === id ? null : state.currentFamily
    }))
  },

  getFamilyById: (id) => {
    return get().families.find((family) => family.id === id)
  }
}))