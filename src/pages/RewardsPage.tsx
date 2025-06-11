import React, { useState } from 'react'
import RewardList from '@/components/RewardList'
import RewardDialog from '@/components/RewardDialog'
import { useUser } from '@/contexts/UserContext'
import type { Reward } from '@/models'

const RewardsPage: React.FC = () => {
  const { currentUser } = useUser()
  const [showDialog, setShowDialog] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | undefined>()

  const isParent = currentUser?.role === 'parent'

  const handleCreateReward = () => {
    setEditingReward(undefined)
    setShowDialog(true)
  }

  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward)
    setShowDialog(true)
  }

  const handleDialogClose = () => {
    setShowDialog(false)
    setEditingReward(undefined)
  }

  const handleRewardSuccess = (reward: Reward) => {
    // Refresh is handled by RewardList internally
    console.log('Reward saved:', reward)
  }

  return (
    <div className="p-6">
      <RewardList
        onCreateReward={handleCreateReward}
        onEditReward={handleEditReward}
        showCreateButton={isParent}
        isParent={isParent}
      />

      <RewardDialog
        isOpen={showDialog}
        onClose={handleDialogClose}
        reward={editingReward}
        onSuccess={handleRewardSuccess}
      />
    </div>
  )
}

export default RewardsPage