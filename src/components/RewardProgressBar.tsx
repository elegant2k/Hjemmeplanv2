import React from 'react'

interface RewardProgressBarProps {
  currentProgress: number
  targetCost: number
  progressType: 'points' | 'allowance'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showAmount?: boolean
  className?: string
}

const RewardProgressBar: React.FC<RewardProgressBarProps> = ({
  currentProgress,
  targetCost,
  progressType,
  size = 'md',
  showLabel = true,
  showAmount = true,
  className = ''
}) => {
  // Calculate progress percentage
  const progress = Math.min((currentProgress / targetCost) * 100, 100)
  const remaining = Math.max(targetCost - currentProgress, 0)
  
  // Get size classes
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }
  
  // Get text size classes
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  
  // Get appropriate colors based on progress
  const getColors = () => {
    if (progress >= 100) return {
      bg: 'bg-green-100',
      fill: 'bg-green-500',
      text: 'text-green-700',
      border: 'border-green-200'
    }
    
    if (progress >= 75) return {
      bg: 'bg-blue-100',
      fill: 'bg-blue-500',
      text: 'text-blue-700',
      border: 'border-blue-200'
    }
    
    if (progress >= 50) return {
      bg: 'bg-yellow-100',
      fill: 'bg-yellow-500',
      text: 'text-yellow-700',
      border: 'border-yellow-200'
    }
    
    if (progress >= 25) return {
      bg: 'bg-orange-100',
      fill: 'bg-orange-500',
      text: 'text-orange-700',
      border: 'border-orange-200'
    }
    
    return {
      bg: 'bg-gray-100',
      fill: 'bg-gray-500',
      text: 'text-gray-700',
      border: 'border-gray-200'
    }
  }
  
  const colors = getColors()
  const currency = progressType === 'allowance' ? 'kr' : ''
  const label = progressType === 'points' ? 'poeng' : 'kroner'

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Header with labels and amounts */}
      {(showLabel || showAmount) && (
        <div className="flex justify-between items-center">
          {showLabel && (
            <span className={`font-medium ${colors.text} ${textSizeClasses[size]}`}>
              {progressType === 'points' ? '🎯' : '💰'} Fremgang mot belønning
            </span>
          )}
          {showAmount && (
            <span className={`${colors.text} ${textSizeClasses[size]}`}>
              {currentProgress.toLocaleString()} / {targetCost.toLocaleString()} {currency} {label}
            </span>
          )}
        </div>
      )}
      
      {/* Progress bar */}
      <div className={`relative w-full rounded-full ${colors.bg} border ${colors.border} ${sizeClasses[size]}`}>
        <div 
          className={`absolute top-0 left-0 ${colors.fill} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
        
        {/* Gradient overlay for visual appeal */}
        <div 
          className={`absolute top-0 left-0 bg-gradient-to-r from-transparent to-white/20 ${sizeClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Bottom details */}
      {showAmount && (
        <div className="flex justify-between items-center">
          <span className={`${textSizeClasses[size]} text-gray-600`}>
            {progress >= 100 ? '🎉 Kan innløses!' : `${remaining.toLocaleString()} ${currency} ${label} igjen`}
          </span>
          <span className={`${textSizeClasses[size]} font-medium ${colors.text}`}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )
}

export default RewardProgressBar 