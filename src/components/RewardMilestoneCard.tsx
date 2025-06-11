import React from 'react'
import { useUser } from '@/contexts/UserContext'
import { rewardService } from '@/services'
import RewardProgressBar from './RewardProgressBar'
import type { Reward } from '@/models'

interface RewardMilestoneCardProps {
  reward: Reward
  userPoints?: number
  userAllowance?: number
  onRedeem?: (rewardId: string) => void
  showProgress?: boolean
  compact?: boolean
  className?: string
}

const RewardMilestoneCard: React.FC<RewardMilestoneCardProps> = ({
  reward,
  userPoints = 0,
  userAllowance = 0,
  onRedeem,
  showProgress = true,
  compact = false,
  className = ''
}) => {
  const { currentUser } = useUser()
  const isChild = currentUser?.role === 'child'
  
  // Determine what type of cost this reward has
  const hasPointsCost = reward.pointsCost > 0
  const hasAllowanceCost = (reward.allowanceCost ?? 0) > 0
  const hasBothCosts = hasPointsCost && hasAllowanceCost
  
  // Check affordability
  const canAffordPoints = !hasPointsCost || userPoints >= reward.pointsCost
  const canAffordAllowance = !hasAllowanceCost || userAllowance >= (reward.allowanceCost ?? 0)
  const canAfford = canAffordPoints && canAffordAllowance
  
  // Get category styling
  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'privilege':
        return {
          icon: '👑',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700',
          badgeColor: 'bg-purple-100 text-purple-800'
        }
      case 'item':
        return {
          icon: '🎁',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          badgeColor: 'bg-blue-100 text-blue-800'
        }
      case 'activity':
        return {
          icon: '🎮',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          badgeColor: 'bg-green-100 text-green-800'
        }
      case 'allowance':
        return {
          icon: '💰',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          badgeColor: 'bg-yellow-100 text-yellow-800'
        }
      default:
        return {
          icon: '🎯',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          badgeColor: 'bg-gray-100 text-gray-800'
        }
    }
  }
  
  const categoryConfig = getCategoryConfig(reward.category)
  
  const handleRedeem = () => {
    if (canAfford && onRedeem) {
      onRedeem(reward.id)
    }
  }

  return (
    <div className={`
      border-2 rounded-lg transition-all duration-200 hover:shadow-md
      ${categoryConfig.bgColor} ${categoryConfig.borderColor}
      ${canAfford ? 'hover:scale-105' : 'opacity-75'}
      ${compact ? 'p-3' : 'p-4'}
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{categoryConfig.icon}</span>
          <div>
            <h4 className={`font-semibold ${categoryConfig.textColor} ${compact ? 'text-sm' : 'text-base'}`}>
              {reward.title}
            </h4>
            {!compact && (
              <span className={`text-xs px-2 py-1 rounded-full ${categoryConfig.badgeColor}`}>
                {reward.category}
              </span>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex flex-col items-end space-y-1">
          {canAfford && (
            <span className="text-green-600 text-sm font-medium">✅ Kan innløses</span>
          )}
          {!reward.isActive && (
            <span className="text-gray-500 text-xs">Inaktiv</span>
          )}
        </div>
      </div>
      
      {/* Description */}
      {!compact && reward.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {reward.description}
        </p>
      )}
      
      {/* Cost display */}
      <div className="space-y-2 mb-3">
        {hasPointsCost && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">🎯 Poeng kostnad:</span>
            <span className={`font-medium ${canAffordPoints ? 'text-green-600' : 'text-red-600'}`}>
              {reward.pointsCost.toLocaleString()} poeng
            </span>
          </div>
        )}
        
        {hasAllowanceCost && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">💰 Lommepenger kostnad:</span>
            <span className={`font-medium ${canAffordAllowance ? 'text-green-600' : 'text-red-600'}`}>
              {(reward.allowanceCost ?? 0).toLocaleString()} kr
            </span>
          </div>
        )}
      </div>
      
      {/* Progress bars */}
      {showProgress && (hasPointsCost || hasAllowanceCost) && (
        <div className="space-y-2 mb-3">
          {hasPointsCost && (
            <RewardProgressBar
              currentProgress={userPoints}
              targetCost={reward.pointsCost}
              progressType="points"
              size={compact ? 'sm' : 'md'}
              showLabel={!compact}
              showAmount={!compact}
            />
          )}
          
          {hasAllowanceCost && (
            <RewardProgressBar
              currentProgress={userAllowance}
              targetCost={reward.allowanceCost ?? 0}
              progressType="allowance"
              size={compact ? 'sm' : 'md'}
              showLabel={!compact}
              showAmount={!compact}
            />
          )}
        </div>
      )}
      
      {/* Action button */}
      {isChild && reward.isActive && (
        <button
          onClick={handleRedeem}
          disabled={!canAfford}
          className={`
            w-full py-2 px-4 rounded-md font-medium transition-all duration-200
            ${compact ? 'text-sm' : 'text-base'}
            ${canAfford 
              ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md' 
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }
          `}
        >
          {canAfford ? '🎉 Innløs belønning' : '⏳ Ikke nok poeng/penger'}
        </button>
      )}
      
      {/* Current balance display for reference */}
      {isChild && !compact && (showProgress || hasPointsCost || hasAllowanceCost) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Dine poeng:</span>
              <span className="font-medium">{userPoints.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Dine lommepenger:</span>
              <span className="font-medium">{userAllowance.toLocaleString()} kr</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RewardMilestoneCard 