import React from 'react'
import FamilyGoalForm from './FamilyGoalForm'
import type { FamilyGoal } from '@/models'

interface FamilyGoalDialogProps {
  isOpen: boolean
  onClose: () => void
  goal?: FamilyGoal
  onSuccess?: (goal: FamilyGoal) => void
}

const FamilyGoalDialog: React.FC<FamilyGoalDialogProps> = ({
  isOpen,
  onClose,
  goal,
  onSuccess
}) => {
  if (!isOpen) return null

  const handleSuccess = (newGoal: FamilyGoal) => {
    onSuccess?.(newGoal)
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Lukk</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Form Content */}
          <FamilyGoalForm
            goal={goal}
            onSubmit={handleSuccess}
            onCancel={onClose}
            isDialog={true}
          />
        </div>
      </div>
    </div>
  )
}

export default FamilyGoalDialog 