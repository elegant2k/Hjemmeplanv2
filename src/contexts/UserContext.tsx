import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User, Family } from '@/models'

interface UserContextType {
  currentUser: User | null
  currentFamily: Family | null
  availableUsers: User[]
  isParentAuthenticated: boolean
  
  // Actions
  setCurrentUser: (user: User) => void
  setCurrentFamily: (family: Family) => void
  authenticateParent: (pin: string) => boolean
  logout: () => void
  logoutParent: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

// Mock data - will be replaced with actual data from services
const mockFamily: Family = {
  id: 'family-1',
  name: 'Testfamilien',
  memberCount: 4,
  createdBy: 'user-1',
  createdAt: new Date('2024-01-01')
}

const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Mamma',
    role: 'parent',
    age: 35,
    avatar: '👩',
    familyId: 'family-1',
    pin: '1234',
    allowanceEnabled: true
  },
  {
    id: 'user-2', 
    name: 'Pappa',
    role: 'parent',
    age: 37,
    avatar: '👨',
    familyId: 'family-1',
    pin: '1234',
    allowanceEnabled: true
  },
  {
    id: 'user-3',
    name: 'Emma',
    role: 'child',
    age: 12,
    avatar: '👧',
    familyId: 'family-1',
    allowanceEnabled: true
  },
  {
    id: 'user-4',
    name: 'Lucas',
    role: 'child', 
    age: 8,
    avatar: '👦',
    familyId: 'family-1',
    allowanceEnabled: true
  }
]

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null)
  const [currentFamily, setCurrentFamilyState] = useState<Family | null>(mockFamily)
  const [availableUsers] = useState<User[]>(mockUsers)
  const [isParentAuthenticated, setIsParentAuthenticated] = useState(false)

  // Initialize with first child user by default
  useEffect(() => {
    if (availableUsers.length > 0 && !currentUser) {
      const firstChild = availableUsers.find(user => user.role === 'child')
      if (firstChild) {
        setCurrentUserState(firstChild)
      }
    }
  }, [availableUsers, currentUser])

  // Persist user state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
    }
  }, [currentUser])

  useEffect(() => {
    if (currentFamily) {
      localStorage.setItem('currentFamily', JSON.stringify(currentFamily))
    }
  }, [currentFamily])

  // Load user state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    const savedFamily = localStorage.getItem('currentFamily')
    
    if (savedFamily) {
      try {
        const family = JSON.parse(savedFamily)
        setCurrentFamilyState(family)
      } catch (error) {
        console.error('Error parsing saved family:', error)
      }
    }

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setCurrentUserState(user)
      } catch (error) {
        console.error('Error parsing saved user:', error)
      }
    }
  }, [])

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user)
    
    // If switching to a child, clear parent authentication
    if (user.role === 'child') {
      setIsParentAuthenticated(false)
    }
  }

  const setCurrentFamily = (family: Family) => {
    setCurrentFamilyState(family)
    
    // Reset current user when family changes
    const firstChild = availableUsers.find(user => user.role === 'child')
    if (firstChild) {
      setCurrentUserState(firstChild)
    }
    
    // Clear parent authentication
    setIsParentAuthenticated(false)
  }

  const authenticateParent = (pin: string): boolean => {
    // Mock PIN verification - replace with actual auth service
    const correctPin = '1234'
    
    if (pin === correctPin) {
      setIsParentAuthenticated(true)
      return true
    }
    
    return false
  }

  const logout = () => {
    setCurrentUserState(null)
    setIsParentAuthenticated(false)
    localStorage.removeItem('currentUser')
  }

  const logoutParent = () => {
    setIsParentAuthenticated(false)
    
    // Switch back to a child user if current user is parent
    if (currentUser?.role === 'parent') {
      const firstChild = availableUsers.find(user => user.role === 'child')
      if (firstChild) {
        setCurrentUserState(firstChild)
      }
    }
  }

  const value: UserContextType = {
    currentUser,
    currentFamily,
    availableUsers,
    isParentAuthenticated,
    setCurrentUser,
    setCurrentFamily,
    authenticateParent,
    logout,
    logoutParent
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = (): UserContextType => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export default UserContext