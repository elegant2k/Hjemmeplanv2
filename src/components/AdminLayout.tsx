import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom'
import PINEntryDialog from './PINEntryDialog'
import IconMap from '@/components/IconMap'

interface AdminLayoutProps {
  children?: React.ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPINDialog, setShowPINDialog] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null)
  const [timeUntilTimeout, setTimeUntilTimeout] = useState<number>(0)

  const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds
  const WARNING_TIME = 5 * 60 * 1000 // Show warning 5 minutes before timeout

  // Admin navigation items
  const adminNavItems = [
    { path: '/admin', label: 'Oversikt', icon: 'chart', exact: true },
    { path: '/admin/family', label: 'Familie', icon: 'family' },
    { path: '/admin/tasks', label: 'Oppgaver', icon: 'tasks' },
    { path: '/admin/rewards', label: 'Belønninger', icon: 'gift' },
    { path: '/admin/allowance', label: 'Lommepenge', icon: 'money' },
    { path: '/admin/reports', label: 'Rapporter', icon: 'chart' },
    { path: '/admin/system', label: 'System', icon: 'settings' }
  ]

  // Check if current user is parent
  const isParent = currentUser?.role === 'parent' && currentUser?.pin

  // Initialize authentication check
  useEffect(() => {
    if (!isParent) {
      navigate('/', { replace: true })
      return
    }

    // Check if already authenticated (from sessionStorage for security)
    const authData = sessionStorage.getItem('admin_auth')
    if (authData) {
      try {
        const { timestamp, userId } = JSON.parse(authData)
        const elapsed = Date.now() - timestamp
        
        if (elapsed < SESSION_DURATION && userId === currentUser?.id) {
          setIsAuthenticated(true)
          startSessionTimer(timestamp)
        } else {
          // Session expired
          sessionStorage.removeItem('admin_auth')
          setShowPINDialog(true)
        }
      } catch {
        sessionStorage.removeItem('admin_auth')
        setShowPINDialog(true)
      }
    } else {
      setShowPINDialog(true)
    }
  }, [currentUser, isParent, navigate])

  // Session timer management
  const startSessionTimer = (startTime?: number) => {
    const sessionStart = startTime || Date.now()
    
    const updateTimer = () => {
      const elapsed = Date.now() - sessionStart
      const remaining = SESSION_DURATION - elapsed
      
      if (remaining <= 0) {
        // Session expired
        handleSessionExpired()
      } else {
        setTimeUntilTimeout(remaining)
        if (remaining <= WARNING_TIME) {
          // Show warning
        }
      }
    }

    // Update immediately
    updateTimer()
    
    // Update every minute
    const interval = setInterval(updateTimer, 60000)
    setSessionTimeout(interval)

    return () => clearInterval(interval)
  }

  // Handle successful PIN verification
  const handlePINVerified = () => {
    setIsAuthenticated(true)
    setShowPINDialog(false)
    
    // Store authentication state
    const authData = {
      timestamp: Date.now(),
      userId: currentUser?.id
    }
    sessionStorage.setItem('admin_auth', JSON.stringify(authData))
    
    // Start session timer
    startSessionTimer()
  }

  // Handle PIN dialog cancellation
  const handlePINCancel = () => {
    setShowPINDialog(false)
    navigate('/', { replace: true })
  }

  // Handle session expiration
  const handleSessionExpired = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_auth')
    if (sessionTimeout) {
      clearInterval(sessionTimeout)
      setSessionTimeout(null)
    }
    navigate('/', { replace: true })
  }

  // Extend session
  const extendSession = () => {
    if (!isAuthenticated) return
    
    const authData = {
      timestamp: Date.now(),
      userId: currentUser?.id
    }
    sessionStorage.setItem('admin_auth', JSON.stringify(authData))
    
    // Restart timer
    if (sessionTimeout) {
      clearInterval(sessionTimeout)
    }
    startSessionTimer()
  }

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_auth')
    if (sessionTimeout) {
      clearInterval(sessionTimeout)
      setSessionTimeout(null)
    }
    navigate('/', { replace: true })
  }

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimeout) {
        clearInterval(sessionTimeout)
      }
    }
  }, [sessionTimeout])

  // Show PIN dialog if not authenticated
  if (!isAuthenticated || showPINDialog) {
    return (
      <PINEntryDialog
        isOpen={showPINDialog || !isAuthenticated}
        onPINVerified={handlePINVerified}
        onCancel={handlePINCancel}
        title="Administrasjon"
        subtitle="Skriv inn PIN-kode for å få tilgang til administrative funksjoner"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <IconMap type="settings" size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Administrasjon</h1>
                <p className="text-xs text-gray-500">Familie: {currentUser?.familyId}</p>
              </div>
            </div>

            {/* Session Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* Session Timer */}
              {timeUntilTimeout <= WARNING_TIME && timeUntilTimeout > 0 && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-orange-600">⏰</span>
                  <span className="text-orange-600">
                    Sesjonen utløper om {formatTimeRemaining(timeUntilTimeout)}
                  </span>
                  <button
                    onClick={extendSession}
                    className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
                  >
                    Forleng
                  </button>
                </div>
              )}

              {/* User Info */}
              <div className="text-sm text-gray-600">
                Innlogget som: <span className="font-medium">{currentUser?.name}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Logg ut
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow p-4">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Navigasjon</h2>
              <ul className="space-y-1">
                {adminNavItems.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path)
                    
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <IconMap type={item.icon as any} size={18} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              
              {/* Back to App */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link
                  to="/"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <IconMap type="home" size={18} />
                  <span>Tilbake til appen</span>
                </Link>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow">
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>

      {/* Session Extension Modal */}
      {timeUntilTimeout > 0 && timeUntilTimeout <= 60000 && ( // Last minute warning
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sesjonen utløper snart
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Admin-sesjonen utløper om {formatTimeRemaining(timeUntilTimeout)}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Logg ut
                </button>
                <button
                  onClick={extendSession}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Forleng sesjon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLayout 