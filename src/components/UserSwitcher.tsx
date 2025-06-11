import React, { useState } from 'react'
import { cn, getUserAvatarIcon } from '@/lib/utils'
import { IconMap } from '@/components/IconMap'
import PinDialog from './PinDialog'
import type { User } from '@/models'

interface UserSwitcherProps {
  users: User[]
  currentUser?: User
  onUserChange: (user: User) => void
  className?: string
}

const UserSwitcher: React.FC<UserSwitcherProps> = ({
  users,
  currentUser,
  onUserChange,
  className
}) => {
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleUserClick = (user: User) => {
    if (user.role === 'parent') {
      setSelectedUser(user)
      setShowPinDialog(true)
    } else {
      onUserChange(user)
    }
  }

  const handlePinSuccess = () => {
    if (selectedUser) {
      onUserChange(selectedUser)
    }
    setShowPinDialog(false)
    setSelectedUser(null)
  }

  const handlePinCancel = () => {
    setShowPinDialog(false)
    setSelectedUser(null)
  }

  const renderAvatar = (user: User) => {
    const iconType = getUserAvatarIcon(user)
    
    if (iconType) {
      return (
        <IconMap 
          type={iconType as any} 
          size={24} 
          className="text-gray-600"
        />
      )
    } else if (user.avatar) {
      // For other avatars, try to display normally
      return <span className="text-xl">{user.avatar}</span>
    } else {
      // Fallback to role-based icon
      return (
        <IconMap 
          type={user.role === 'parent' ? 'parent' : 'child'} 
          size={24} 
          className="text-gray-600"
        />
      )
    }
  }

  const getStatusColor = (user: User) => {
    if (currentUser?.id === user.id) {
      return 'ring-2 ring-blue-500 bg-blue-50'
    }
    return 'ring-1 ring-gray-200 hover:ring-gray-300 bg-white'
  }

  return (
    <>
      <div className={cn('flex flex-wrap gap-3', className)}>
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user)}
            className={cn(
              'flex flex-col items-center p-3 rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              getStatusColor(user)
            )}
          >
            {/* Avatar */}
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 transition-transform',
              currentUser?.id === user.id ? 'scale-110' : ''
            )}>
              {renderAvatar(user)}
            </div>

            {/* Name */}
            <div className="text-sm font-medium text-gray-900 mb-1">
              {user.name}
            </div>

            {/* Role indicator */}
            <div className={cn(
              'text-xs px-2 py-1 rounded-full flex items-center space-x-1',
              user.role === 'parent' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-green-100 text-green-700'
            )}>
              <IconMap 
                type={user.role === 'parent' ? 'lock' : 'child'} 
                size={12} 
              />
              <span>{user.role === 'parent' ? 'Forelder' : 'Barn'}</span>
            </div>

            {/* Active indicator */}
            {currentUser?.id === user.id && (
              <div className="mt-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* PIN Dialog */}
      {showPinDialog && selectedUser && (
        <PinDialog
          isOpen={showPinDialog}
          userName={selectedUser.name}
          onSuccess={handlePinSuccess}
          onCancel={handlePinCancel}
        />
      )}
    </>
  )
}

export default UserSwitcher