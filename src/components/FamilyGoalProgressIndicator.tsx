import React, { useEffect, useState } from 'react'
import { useFamilyPoints } from '@/hooks/useFamilyPoints'
import FamilyRewardClaimButton from './FamilyRewardClaimButton'
import type { FamilyGoal } from '@/models'

interface FamilyGoalProgressIndicatorProps {
  goal: FamilyGoal
  currentPoints: number
  animated?: boolean
  showClaimButton?: boolean
  onGoalUpdate?: (goal: FamilyGoal) => void
  className?: string
}

const FamilyGoalProgressIndicator: React.FC<FamilyGoalProgressIndicatorProps> = ({
  goal,
  currentPoints,
  animated = true,
  showClaimButton = true,
  onGoalUpdate,
  className = ''
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(goal.isCompleted)
  const [showCelebration, setShowCelebration] = useState(false)

  // Calculate progress percentage
  const progressPercentage = Math.min((currentPoints / goal.targetPoints) * 100, 100)
  const isReachable = currentPoints >= goal.targetPoints && !goal.isCompleted

  // Animate progress bar
  useEffect(() => {
    if (!animated) {
      setAnimatedProgress(progressPercentage)
      return
    }

    let animationFrame: number
    const startProgress = animatedProgress
    const targetProgress = progressPercentage
    const duration = 1500 // 1.5 seconds
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      
      const currentProgress = startProgress + (targetProgress - startProgress) * easedProgress
      setAnimatedProgress(currentProgress)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [progressPercentage, animated])

  // Trigger celebration when goal becomes reachable
  useEffect(() => {
    if (isReachable && !isCompleted && !showCelebration) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }, [isReachable, isCompleted])

  // Handle goal completion
  const handleGoalClaimed = (claimedGoal: FamilyGoal) => {
    setIsCompleted(true)
    if (onGoalUpdate) {
      onGoalUpdate(claimedGoal)
    }
  }

  // Get progress bar colors based on status
  const getProgressColors = () => {
    if (goal.isCompleted) {
      return 'from-green-400 to-green-600'
    } else if (isReachable) {
      return 'from-yellow-400 via-orange-500 to-red-500'
    } else if (progressPercentage >= 75) {
      return 'from-orange-400 to-orange-600'
    } else if (progressPercentage >= 50) {
      return 'from-blue-400 to-blue-600'
    } else if (progressPercentage >= 25) {
      return 'from-indigo-400 to-indigo-600'
    } else {
      return 'from-gray-400 to-gray-600'
    }
  }

  // Get status message
  const getStatusMessage = () => {
    if (goal.isCompleted) {
      return '✅ Belønning hentet!'
    } else if (isReachable) {
      return '🎉 Målet er nådd! Hent belønningen!'
    } else if (progressPercentage >= 90) {
      return '🔥 Nesten i mål!'
    } else if (progressPercentage >= 75) {
      return '💪 Flott fremgang!'
    } else if (progressPercentage >= 50) {
      return '📈 Godt i gang!'
    } else if (progressPercentage >= 25) {
      return '🌱 På rett vei!'
    } else {
      return '🎯 La oss komme i gang!'
    }
  }

  return (
    <div className={`family-goal-progress-indicator ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {/* Goal Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {goal.title}
            </h4>
            {goal.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {goal.description}
              </p>
            )}
          </div>
          
          {/* Goal Status Badge */}
          <div className={`px-2 py-1 text-xs font-medium rounded-full ml-3 ${
            goal.isCompleted ? 'bg-green-100 text-green-800' :
            isReachable ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
            'bg-gray-100 text-gray-600'
          }`}>
            {goal.isCompleted ? 'Fullført' : 
             isReachable ? 'Klar!' : 
             'Aktiv'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>{getStatusMessage()}</span>
            <span className="font-medium">
              {Math.round(animatedProgress)}%
            </span>
          </div>
          
          <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            {/* Background pattern for visual interest */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
            
            {/* Progress fill */}
            <div
              className={`h-full bg-gradient-to-r ${getProgressColors()} transition-all duration-500 relative overflow-hidden`}
              style={{ width: `${animatedProgress}%` }}
            >
              {/* Animated shine effect */}
              {animated && animatedProgress > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
              )}
              
              {/* Goal reached celebration effect */}
              {isReachable && !goal.isCompleted && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-500 opacity-50 animate-pulse"></div>
              )}
            </div>

            {/* Goal completion checkmark */}
            {goal.isCompleted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Points Display */}
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="text-gray-600">
            <span className="font-medium text-blue-600">
              {currentPoints.toLocaleString('nb-NO')}
            </span>
            <span className="text-gray-400"> / </span>
            <span className="font-medium">
              {goal.targetPoints.toLocaleString('nb-NO')}
            </span>
            <span className="ml-1">⭐</span>
          </div>
          
          <div className="text-xs text-gray-500">
            {goal.targetPoints - currentPoints > 0 ? (
              `${(goal.targetPoints - currentPoints).toLocaleString('nb-NO')} igjen`
            ) : (
              'Mål nådd!'
            )}
          </div>
        </div>

        {/* Reward Description */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🎁</span>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Belønning:</div>
              <div className="text-gray-700">{goal.rewardDescription}</div>
            </div>
          </div>
        </div>

        {/* Claim Button */}
        {showClaimButton && (
          <FamilyRewardClaimButton
            goal={goal}
            currentPoints={currentPoints}
            onClaim={handleGoalClaimed}
            className="w-full"
          />
        )}

        {/* Milestone indicators */}
        {!goal.isCompleted && (
          <div className="mt-3 flex justify-between text-xs text-gray-400">
            {[25, 50, 75, 100].map(milestone => (
              <div
                key={milestone}
                className={`text-center ${
                  animatedProgress >= milestone ? 'text-blue-600 font-medium' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                  animatedProgress >= milestone ? 'bg-blue-600' : 'bg-gray-300'
                }`}></div>
                <div>{milestone}%</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goal Achievement Notification */}
      {showCelebration && isReachable && !goal.isCompleted && (
        <div className="fixed top-4 right-4 z-40 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🎉</span>
            <div className="text-sm font-medium">
              Familiebelønning klar til å hentes!
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FamilyGoalProgressIndicator 