import React from 'react'
import { UserManagement } from '@/components'

const AdminUsers: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Brukeradministrasjon
        </h1>
        <p className="text-gray-600 mt-1">
          Administrer familiemedlemmer, roller og tilganger
        </p>
      </div>

      {/* User Management Component */}
      <UserManagement />
    </div>
  )
}

export default AdminUsers 