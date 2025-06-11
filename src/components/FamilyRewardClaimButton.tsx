import React, { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useFamilyPoints } from '@/hooks/useFamilyPoints'
import FamilyRewardCelebration from './FamilyRewardCelebration'
import type { FamilyGoal } from '@/models'

interface FamilyRewardClaimButtonProps {
  goal: FamilyGoal
  currentPoints: number
  onClaim?: (goal: FamilyGoal) => void
  disabled?: boolean
  className?: string
}

const FamilyRewardClaimButton: React.FC<FamilyRewardClaimButtonProps> = ({
  goal,
  currentPoints,
  onClaim,
  disabled = false,
  className = ''
}) => {
  const { currentUser } = useUser()
  const { completeGoal } = useFamilyPoints()
  const [isClaimingReward, setIsClaimingReward] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  // Check if goal is claimable
  const isClaimable = currentPoints >= goal.targetPoints && goal.isActive && !goal.isCompleted
  const isCompleted = goal.isCompleted 
  const isDisabled = disabled || !isClaimable || isClaimingReward

  // Handle reward claiming
  const handleClaimReward = async () => {
    if (!isClaimable || isClaimingReward) return

    try {
      setIsClaimingReward(true)
      setClaimError(null)

      // Claim the reward
      await completeGoal(goal.id, goal.targetPoints)
      
      // Show celebration
      setShowCelebration(true)
      
      // Call callback if provided
      if (onClaim) {
        onClaim(goal)
      }

      // Hide celebration after animation
      setTimeout(() => {
        setShowCelebration(false)
      }, 4000)

    } catch (error) {
      console.error('Error claiming family reward:', error)
      setClaimError('Kunne ikke hente belønning. Prøv igjen.')
    } finally {
      setIsClaimingReward(false)
    }
  }

  // Get button text based on state
  const getButtonText = () => {
    if (isClaimingReward) return 'Henter belønning...'
    if (isCompleted) return 'Belønning hentet!'
    if (!isClaimable) return `Trenger ${goal.targetPoints - currentPoints} ⭐ til`
    return 'Hent belønning!'
  }

  // Get button style based on state
  const getButtonStyle = () => {
    const baseStyle = "px-4 py-2 font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
    
    if (isCompleted) {
      return `${baseStyle} bg-green-100 text-green-800 border-2 border-green-300 cursor-default`
    }
    
    if (isClaimable && !isDisabled) {
      return `${baseStyle} bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-2 border-orange-400 hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 shadow-lg hover:shadow-xl animate-pulse`
    }
    
    return `${baseStyle} bg-gray-100 text-gray-500 border-2 border-gray-200 cursor-not-allowed`
  }

  // Get icon based on state
  const getIcon = () => {
    if (isClaimingReward) return '⏳'
    if (isCompleted) return '✅'
    if (isClaimable) return '🎁'
    return '🔒'
  }

  return (
    <>
      <div className={`family-reward-claim-button ${className}`}>
        <button
          onClick={handleClaimReward}
          disabled={isDisabled}
          className={getButtonStyle()}
          title={
            isCompleted ? 'Belønning allerede hentet' :
            !isClaimable ? `Trenger ${goal.targetPoints - currentPoints} poeng til` :
            'Klikk for å hente belønning'
          }
        >
          <span className="text-lg">{getIcon()}</span>
          <span className="text-sm font-medium">{getButtonText()}</span>
        </button>

        {/* Progress indicator for non-claimable goals */}
        {!isClaimable && !isCompleted && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Fremdrift</span>
              <span>{Math.round((currentPoints / goal.targetPoints) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((currentPoints / goal.targetPoints) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              {currentPoints.toLocaleString('nb-NO')} / {goal.targetPoints.toLocaleString('nb-NO')} ⭐
            </div>
          </div>
        )}

        {/* Reward Details */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-900 mb-1">
            🎁 {goal.rewardDescription}
          </div>
          <div className="text-xs text-gray-600">
            Målpoeng: {goal.targetPoints.toLocaleString('nb-NO')} ⭐
          </div>

        </div>

        {/* Error Message */}
        {claimError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            {claimError}
          </div>
        )}

        {/* Success Message for completed goals */}
        {isCompleted && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            🎉 Gratulerer! Belønningen er hentet og klar til bruk.
          </div>
        )}
      </div>

      {/* Family Reward Celebration */}
      {showCelebration && (
        <FamilyRewardCelebration
          isVisible={showCelebration}
          goalTitle={goal.title}
          rewardDescription={goal.rewardDescription}
          pointsEarned={goal.targetPoints}
          participantCount={1} // Could be calculated from family size
          onComplete={() => setShowCelebration(false)}
          autoCloseDelay={4000}
        />
      )}
    </>
  )
}

export default FamilyRewardClaimButton 