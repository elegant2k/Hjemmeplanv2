import { create } from 'zustand'
import type { User } from '@/models'

interface UserState {
  currentUser: User | null
  users: User[]
  
  // Actions
  setCurrentUser: (user: User | null) => void
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  getUsersByFamily: (familyId: string) => User[]
  getUserById: (id: string) => User | undefined
  verifyPin: (userId: string, pin: string) => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  users: [],

  setCurrentUser: (user) => set({ currentUser: user }),

  addUser: (userData) => {
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
    }
    
    set((state) => ({
      users: [...state.users, newUser]
    }))
  },

  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map((user) =>
        user.id === id ? { ...user, ...updates } : user
      ),
      currentUser: state.currentUser?.id === id 
        ? { ...state.currentUser, ...updates }
        : state.currentUser
    }))
  },

  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter((user) => user.id !== id),
      currentUser: state.currentUser?.id === id ? null : state.currentUser
    }))
  },

  getUsersByFamily: (familyId) => {
    return get().users.filter((user) => user.familyId === familyId)
  },

  getUserById: (id) => {
    return get().users.find((user) => user.id === id)
  },

  verifyPin: (userId, pin) => {
    const user = get().getUserById(userId)
    return user?.pin === pin
  }
}))