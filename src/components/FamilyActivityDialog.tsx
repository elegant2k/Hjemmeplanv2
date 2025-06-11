import React from 'react'
import FamilyActivityForm from './FamilyActivityForm'
import type { Task } from '@/models'

interface FamilyActivityDialogProps {
  isOpen: boolean
  onClose: () => void
  activity?: Task
  onSuccess?: (activity: Task) => void
}

const FamilyActivityDialog: React.FC<FamilyActivityDialogProps> = ({
  isOpen,
  onClose,
  activity,
  onSuccess
}) => {
  if (!isOpen) return null

  const handleSuccess = (newActivity: Task) => {
    onSuccess?.(newActivity)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="sr-only">Lukk</span>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Form Content */}
          <FamilyActivityForm
            activity={activity}
            onSubmit={handleSuccess}
            onCancel={onClose}
            isDialog={true}
          />
        </div>
      </div>
    </div>
  )
}

export default FamilyActivityDialog 