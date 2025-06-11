import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn, getUserAvatarIcon } from '@/lib/utils'
import { useUser } from '@/contexts/UserContext'
import IconMap from '@/components/IconMap'
import UserSwitcher from '@/components/UserSwitcher'
import type { User } from '@/models'

interface HeaderProps {
  familyName?: string
}

const Header: React.FC<HeaderProps> = ({ familyName }) => {
  const location = useLocation()
  const { currentUser, currentFamily, availableUsers, setCurrentUser } = useUser()
  const [showUserSwitcher, setShowUserSwitcher] = useState(false)
  
  const displayFamilyName = familyName || currentFamily?.name || 'Familie Todo App'

  // Helper function to render avatars properly
  const renderAvatar = (user: User | null | undefined, size: number = 16) => {
    if (!user) {
      return <IconMap type="user" size={size} className="text-gray-600" />
    }
    
    const iconType = getUserAvatarIcon(user)
    
    if (iconType) {
      return (
        <IconMap 
          type={iconType as any} 
          size={size} 
          className="text-gray-600"
        />
      )
    } else if (user.avatar) {
      // For other avatars, try to display normally
      return <span className="text-sm">{user.avatar}</span>
    } else {
      // Fallback to role-based icon
      return (
        <IconMap 
          type={user.role === 'parent' ? 'parent' : 'child'} 
          size={size} 
          className="text-gray-600"
        />
      )
    }
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'home' },
    { path: '/tasks', label: 'Oppgaver', icon: 'tasks' },
    { path: '/rewards', label: 'Belønninger', icon: 'gift' },
    { path: '/admin', label: 'Admin', icon: 'settings' }
  ]

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Family Name & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FT</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
              {displayFamilyName}
            </h1>
            <h1 className="text-lg font-bold text-gray-900 sm:hidden">
              FT
            </h1>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                )}
              >
                <IconMap type={item.icon as any} size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Current User Display */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowUserSwitcher(!showUserSwitcher)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {renderAvatar(currentUser, 16)}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser?.name || 'Gjest'}
                </p>
                <p className="text-xs text-gray-500 flex items-center space-x-1">
                  <IconMap type="switch" size={12} />
                  <span>Klikk for å bytte</span>
                </p>
              </div>
            </button>
            
            {/* User Switcher Dropdown */}
            {showUserSwitcher && (
              <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border p-4 z-50">
                <UserSwitcher
                  users={availableUsers}
                  currentUser={currentUser || undefined}
                  onUserChange={(user) => {
                    setCurrentUser(user)
                    setShowUserSwitcher(false)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t bg-gray-50">
        <nav className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center px-3 py-2 text-xs font-medium transition-colors',
                location.pathname === item.path
                  ? 'text-blue-700'
                  : 'text-gray-500'
              )}
            >
              <IconMap type={item.icon as any} size={18} className="mb-1" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Header