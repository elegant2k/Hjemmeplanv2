import React, { useState } from 'react'
import { useCelebrations } from '@/hooks/useCelebrations'
import { userService } from '@/services/userService'
import type { Reward } from '@/models'

interface RewardClaimButtonProps {
  reward: Reward
  userId: string
  className?: string
  onClaimSuccess?: (rewardId: string) => void
  onClaimError?: (error: string) => void
}

const RewardClaimButton: React.FC<RewardClaimButtonProps> = ({
  reward,
  userId,
  className = '',
  onClaimSuccess,
  onClaimError
}) => {
  const { claimReward } = useCelebrations()
  const [isLoading, setIsLoading] = useState(false)
  const [userProgress, setUserProgress] = useState<any>(null)

  // Load user progress on mount
  React.useEffect(() => {
    const loadProgress = async () => {
      try {
        const progress = await userService.getUserProgress(userId)
        setUserProgress(progress)
      } catch (error) {
        console.error('Error loading user progress:', error)
      }
    }
    loadProgress()
  }, [userId])

  if (!userProgress) {
    return (
      <div className="w-full p-3 bg-gray-100 rounded-lg text-center">
        <span className="text-gray-500">Laster...</span>
      </div>
    )
  }

  const canAffordPoints = reward.pointsCost === 0 || userProgress.points >= reward.pointsCost
  const canAffordAllowance = (reward.allowanceCost ?? 0) === 0 || userProgress.allowance >= (reward.allowanceCost ?? 0)
  const canAfford = canAffordPoints && canAffordAllowance

  const handleClaim = async () => {
    if (!canAfford || isLoading) return

    setIsLoading(true)
    try {
      await claimReward(reward.id)
      onClaimSuccess?.(reward.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunne ikke innløse belønning'
      onClaimError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Innløser...</span>
        </div>
      )
    }

    if (!canAfford) {
      const missingPoints = Math.max(0, reward.pointsCost - userProgress.points)
      const missingAllowance = Math.max(0, (reward.allowanceCost ?? 0) - userProgress.allowance)
      
      let missingText = ''
      if (missingPoints > 0 && missingAllowance > 0) {
        missingText = `Trenger ${missingPoints} poeng og ${missingAllowance} kr til`
      } else if (missingPoints > 0) {
        missingText = `Trenger ${missingPoints} poeng til`
      } else if (missingAllowance > 0) {
        missingText = `Trenger ${missingAllowance} kr til`
      }

      return (
        <div className="text-center">
          <div className="text-lg font-bold">💸 Ikke råd</div>
          <div className="text-xs opacity-75">{missingText}</div>
        </div>
      )
    }

    return (
      <div className="text-center">
        <div className="text-lg font-bold">🎁 Innløs belønning</div>
        <div className="text-xs opacity-90">
          {reward.pointsCost > 0 && `${reward.pointsCost} poeng`}
          {reward.pointsCost > 0 && (reward.allowanceCost ?? 0) > 0 && ' + '}
          {(reward.allowanceCost ?? 0) > 0 && `${reward.allowanceCost} kr`}
          {reward.pointsCost === 0 && (reward.allowanceCost ?? 0) === 0 && 'Gratis!'}
        </div>
      </div>
    )
  }

  const getButtonClassName = () => {
    const baseClass = `w-full p-4 rounded-xl font-semibold transition-all duration-200 ${className}`
    
    if (isLoading) {
      return `${baseClass} bg-blue-400 text-white cursor-wait`
    }
    
    if (!canAfford) {
      return `${baseClass} bg-gray-200 text-gray-500 cursor-not-allowed`
    }
    
    return `${baseClass} bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white cursor-pointer hover:scale-105 shadow-lg hover:shadow-xl`
  }

  return (
    <button
      onClick={handleClaim}
      disabled={!canAfford || isLoading}
      className={getButtonClassName()}
      title={
        canAfford 
          ? `Innløs ${reward.title}` 
          : `Du trenger ${Math.max(0, reward.pointsCost - userProgress.points)} poeng${(reward.allowanceCost ?? 0) > 0 ? ` og ${Math.max(0, (reward.allowanceCost ?? 0) - userProgress.allowance)} kr` : ''} til for å innløse denne belønningen`
      }
    >
      {getButtonContent()}
    </button>
  )
}

export default RewardClaimButton 