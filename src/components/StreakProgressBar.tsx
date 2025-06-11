import React from 'react'

interface StreakProgressBarProps {
  currentStreak: number
  targetMilestone: number
  isActive: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const StreakProgressBar: React.FC<StreakProgressBarProps> = ({
  currentStreak,
  targetMilestone,
  isActive,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  // Calculate progress percentage
  const progress = Math.min((currentStreak / targetMilestone) * 100, 100)
  
  // Get appropriate colors based on activity and progress
  const getColors = () => {
    if (!isActive) return {
      bg: 'bg-gray-200',
      fill: 'bg-gray-400',
      text: 'text-gray-600'
    }
    
    if (progress >= 100) return {
      bg: 'bg-green-100',
      fill: 'bg-green-500',
      text: 'text-green-700'
    }
    
    if (progress >= 75) return {
      bg: 'bg-blue-100',
      fill: 'bg-blue-500',
      text: 'text-blue-700'
    }
    
    if (progress >= 50) return {
      bg: 'bg-yellow-100',
      fill: 'bg-yellow-500',
      text: 'text-yellow-700'
    }
    
    return {
      bg: 'bg-orange-100',
      fill: 'bg-orange-500',
      text: 'text-orange-700'
    }
  }
  
  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          height: 'h-2',
          text: 'text-xs',
          padding: 'px-2 py-1'
        }
      case 'lg':
        return {
          height: 'h-4',
          text: 'text-base',
          padding: 'px-4 py-2'
        }
      default:
        return {
          height: 'h-3',
          text: 'text-sm',
          padding: 'px-3 py-1'
        }
    }
  }
  
  const colors = getColors()
  const sizeClasses = getSizeClasses()
  
  // Generate milestone markers
  const milestoneMarkers = []
  const step = targetMilestone / 4 // Show 4 markers
  for (let i = 1; i < 4; i++) {
    const position = (step * i / targetMilestone) * 100
    milestoneMarkers.push(
      <div
        key={i}
        className="absolute top-0 bottom-0 w-px bg-white"
        style={{ left: `${position}%` }}
      />
    )
  }
  
  return (
    <div className={`space-y-1 ${className}`}>
      {/* Progress Bar */}
      <div className={`relative ${colors.bg} rounded-full ${sizeClasses.height} overflow-hidden`}>
        {/* Progress Fill */}
        <div
          className={`${colors.fill} ${sizeClasses.height} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
        
        {/* Milestone Markers */}
        {size !== 'sm' && milestoneMarkers}
        
        {/* Completion Icon */}
        {progress >= 100 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
      
      {/* Label and Stats */}
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className={`${colors.text} ${sizeClasses.text} font-medium`}>
            {currentStreak} / {targetMilestone} dager
          </div>
          <div className={`${colors.text} ${sizeClasses.text}`}>
            {progress.toFixed(0)}%
          </div>
        </div>
      )}
      
      {/* Status Indicator */}
      {showLabel && (
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-xs ${isActive ? 'text-green-600' : 'text-red-600'}`}>
            {isActive ? 'Aktiv streak' : 'Inaktiv streak'}
          </span>
          {!isActive && currentStreak > 0 && (
            <span className="text-xs text-gray-500">
              (siste: {currentStreak} dager)
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default StreakProgressBar 