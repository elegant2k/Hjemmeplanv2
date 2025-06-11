import React from 'react'
import { FamilyForm } from '@/components'

const AdminFamily: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Familieinnstillinger
        </h1>
        <p className="text-gray-600 mt-1">
          Administrer familieinnstillinger og konfigurasjoner
        </p>
      </div>

      {/* Family Form Component */}
      <FamilyForm />
    </div>
  )
}

export default AdminFamily 