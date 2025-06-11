import React from 'react'
import { DataManagement } from '@/components'

const AdminData: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Dataadministrasjon
        </h1>
        <p className="text-gray-600 mt-1">
          Håndter backup, gjenoppretting, rapporter og vedlikehold av familiedata
        </p>
      </div>

      {/* Data Management Component */}
      <DataManagement />
    </div>
  )
}

export default AdminData 