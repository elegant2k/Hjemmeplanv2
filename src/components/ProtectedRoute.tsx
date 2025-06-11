import React, { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import PinDialog from './PinDialog'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, isParentAuthenticated } = useUser()
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  // Check if current user is a parent and authenticated
  if (currentUser?.role === 'parent' && isParentAuthenticated) {
    return <>{children}</>
  }

  // Show access denied for children
  if (currentUser?.role === 'child') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Adgang nektet
          </h2>
          <p className="text-gray-600 mb-6">
            Denne siden krever foreldre tilgang. Spør en forelder om hjelp.
          </p>
          <p className="text-sm text-gray-500">
            Bytter til en forelder-konto i øvre høyre hjørne for å få tilgang.
          </p>
        </div>
      </div>
    )
  }

  // Parent not authenticated - show pin entry
  if (currentUser?.role === 'parent' && !isParentAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            PIN påkrevd
          </h2>
          <p className="text-gray-600 mb-6">
            Skriv inn PIN for å få tilgang til admin-panelet.
          </p>
          <button
            onClick={() => setShowPinDialog(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Skriv inn PIN
          </button>
          
          {accessDenied && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">PIN ikke korrekt. Prøv igjen.</p>
            </div>
          )}
        </div>
        
        <PinDialog
          isOpen={showPinDialog}
          userName={currentUser?.name || 'Forelder'}
          onSuccess={() => {
            setShowPinDialog(false)
            setAccessDenied(false)
          }}
          onCancel={() => {
            setShowPinDialog(false)
            setAccessDenied(true)
          }}
        />
      </div>
    )
  }

  // Fallback for unexpected states
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Laster...
        </h2>
        <p className="text-gray-600">
          Setter opp bruker tilgang...
        </p>
      </div>
    </div>
  )
}

export default ProtectedRoute