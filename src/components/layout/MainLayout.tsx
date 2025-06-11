import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { UserProvider } from '@/contexts/UserContext'

interface MainLayoutProps {
  familyName?: string
  showSidebar?: boolean
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  familyName = 'Familie Todo App',
  showSidebar = false 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }


  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <Header familyName={familyName} />

        {/* Main content area */}
        <div className="flex-1 flex">
          {/* Sidebar - conditionally rendered */}
          {showSidebar && (
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={handleSidebarClose}
            />
          )}

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </UserProvider>
  )
}

export default MainLayout