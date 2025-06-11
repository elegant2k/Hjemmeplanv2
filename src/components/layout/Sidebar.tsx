import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUser } from '@/contexts/UserContext'
import IconMap from '@/components/IconMap'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation()
  const { currentUser, currentFamily } = useUser()

  const navItems = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: 'home',
      description: 'Familie oversikt' 
    },
    { 
      path: '/tasks', 
      label: 'Oppgaver', 
      icon: 'tasks',
      description: 'Håndter oppgaver' 
    },
    { 
      path: '/rewards', 
      label: 'Belønninger', 
      icon: 'gift',
      description: 'Se belønninger' 
    },
    { 
      path: '/admin', 
      label: 'Administrasjon', 
      icon: 'settings',
      description: 'Foreldre innstillinger' 
    }
  ]

  const handleNavClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FT</span>
            </div>
            <span className="font-semibold text-gray-900">
              {currentFamily?.name || 'Familie Todo'}
            </span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <IconMap type="close" size={16} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          <div className="px-3">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Navigasjon
            </p>
          </div>
          
          <div className="mt-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  'group flex items-center px-3 py-2 mx-3 text-sm font-medium rounded-md transition-colors',
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <IconMap type={item.icon as any} size={18} className="mr-3" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {currentUser?.avatar ? (
                <span className="text-lg">{currentUser.avatar}</span>
              ) : (
                <IconMap type="user" size={20} className="text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {currentUser?.name || 'Gjest'}
              </p>
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                <IconMap 
                  type={currentUser?.role === 'parent' ? 'parent' : 'child'} 
                  size={12}
                />
                <span>{currentUser?.role === 'parent' ? 'Forelder' : 'Barn'}</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar