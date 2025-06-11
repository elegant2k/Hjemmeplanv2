import React from 'react'
import { Button } from '@/components/ui/button'
import RewardForm from './RewardForm'
import type { Reward } from '@/models'

interface RewardDialogProps {
  isOpen: boolean
  onClose: () => void
  reward?: Reward
  onSuccess?: (reward: Reward) => void
}

const RewardDialog: React.FC<RewardDialogProps> = ({
  isOpen,
  onClose,
  reward,
  onSuccess
}) => {
  if (!isOpen) return null

  const handleSuccess = (savedReward: Reward) => {
    onSuccess?.(savedReward)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {reward ? 'Rediger Belønning' : 'Ny Belønning'}
            </h2>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="p-2 w-8 h-8"
            >
              ✕
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <RewardForm
            reward={reward}
            onSuccess={handleSuccess}
            onCancel={onClose}
            isDialog={true}
          />
        </div>
      </div>
    </div>
  )
}

export default RewardDialog 