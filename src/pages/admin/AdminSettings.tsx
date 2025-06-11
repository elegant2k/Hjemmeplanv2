import React from 'react'
import { SystemSettings } from '@/components'

const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Systeminnstillinger
        </h1>
        <p className="text-gray-600 mt-1">
          Konfigurer applikasjonens oppførsel, preferanser og helligdager
        </p>
      </div>

      {/* System Settings Component */}
      <SystemSettings />
    </div>
  )
}

export default AdminSettings 