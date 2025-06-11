import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AuthContextType {
  isParentAuthenticated: boolean
  authenticateParent: (pin: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isParentAuthenticated, setIsParentAuthenticated] = useState(false)

  const authenticateParent = (pin: string): boolean => {
    if (pin === '1234') {
      setIsParentAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    setIsParentAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{
      isParentAuthenticated,
      authenticateParent,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}