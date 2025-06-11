import React from 'react'
import { useAuth } from '@/lib/auth'

const AdminPage: React.FC = () => {
  const { logout } = useAuth()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <button 
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Logg ut
        </button>
      </div>
      <p className="text-gray-600">Admin funksjonalitet kommer her...</p>
    </div>
  )
}

export default AdminPage