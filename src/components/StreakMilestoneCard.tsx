import React from 'react'
import StreakProgressBar from './StreakProgressBar'

interface StreakMilestone {
  id: string
  title: string
  description: string
  targetStreak: number
  rewardPoints?: number
  icon: string
  color: string
  isAchieved: boolean
  achievedAt?: Date
}

interface StreakMilestoneCardProps {
  milestone: StreakMilestone
  currentStreak: number
  taskTitle?: string
  isActive: boolean
  onCelebrate?: (milestoneId: string) => void
  compact?: boolean
  className?: string
}

const StreakMilestoneCard: React.FC<StreakMilestoneCardProps> = ({
  milestone,
  currentStreak,
  taskTitle,
  isActive,
  onCelebrate,
  compact = false,
  className = ''
}) => {
  const progress = Math.min((currentStreak / milestone.targetStreak) * 100, 100)
  const streaksRemaining = Math.max(milestone.targetStreak - currentStreak, 0)
  
  // Get color configuration based on milestone color
  const getColorConfig = (color: string) => {
    switch (color) {
      case 'bronze':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-800',
          button: 'bg-amber-600 hover:bg-amber-700'
        }
      case 'silver':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-800',
          button: 'bg-gray-600 hover:bg-gray-700'
        }
      case 'gold':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-800',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'platinum':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-300',
          text: 'text-indigo-700',
          badge: 'bg-indigo-100 text-indigo-800',
          button: 'bg-indigo-600 hover:bg-indigo-700'
        }
      case 'diamond':
        return {
          bg: 'bg-cyan-50',
          border: 'border-cyan-300',
          text: 'text-cyan-700',
          badge: 'bg-cyan-100 text-cyan-800',
          button: 'bg-cyan-600 hover:bg-cyan-700'
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }
  
  const colorConfig = getColorConfig(milestone.color)
  
  const handleCelebrate = () => {
    if (milestone.isAchieved && onCelebrate) {
      onCelebrate(milestone.id)
    }
  }

  return (
    <div className={`
      relative border-2 rounded-lg transition-all duration-200 hover:shadow-md
      ${colorConfig.bg} ${colorConfig.border}
      ${milestone.isAchieved ? 'ring-2 ring-green-300 ring-opacity-50' : ''}
      ${!isActive ? 'opacity-60' : ''}
      ${compact ? 'p-3' : 'p-4'}
      ${className}
    `}>
      {/* Achievement overlay */}
      {milestone.isAchieved && (
        <div className="absolute top-2 right-2">
          <span className="text-2xl animate-pulse">🏆</span>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{milestone.icon}</span>
          <div>
            <h4 className={`font-semibold ${colorConfig.text} ${compact ? 'text-sm' : 'text-base'}`}>
              {milestone.title}
            </h4>
            {!compact && (
              <span className={`text-xs px-2 py-1 rounded-full ${colorConfig.badge}`}>
                {milestone.targetStreak} dager
              </span>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex flex-col items-end space-y-1">
          {milestone.isAchieved ? (
            <span className="text-green-600 text-sm font-medium">✅ Oppnådd</span>
          ) : (
            <span className="text-gray-600 text-sm">{Math.round(progress)}%</span>
          )}
          {!isActive && (
            <span className="text-gray-500 text-xs">Inaktiv streak</span>
          )}
        </div>
      </div>
      
      {/* Task context */}
      {taskTitle && !compact && (
        <p className="text-gray-600 text-xs mb-2">
          📋 For oppgave: {taskTitle}
        </p>
      )}
      
      {/* Description */}
      {!compact && milestone.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {milestone.description}
        </p>
      )}
      
      {/* Progress */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">🔥 Streak fremgang:</span>
          <span className={`font-medium ${milestone.isAchieved ? 'text-green-600' : colorConfig.text}`}>
            {currentStreak} / {milestone.targetStreak} dager
          </span>
        </div>
        
        <StreakProgressBar
          currentStreak={currentStreak}
          targetMilestone={milestone.targetStreak}
          isActive={isActive}
          size={compact ? 'sm' : 'md'}
          showLabel={false}
        />
      </div>
      
      {/* Reward points */}
      {milestone.rewardPoints && (
        <div className="flex justify-between items-center text-sm mb-3">
          <span className="text-gray-600">🎯 Belønning:</span>
          <span className="font-medium text-blue-600">
            +{milestone.rewardPoints.toLocaleString()} poeng
          </span>
        </div>
      )}
      
      {/* Status message */}
      <div className="text-center">
        {milestone.isAchieved ? (
          <div className="space-y-2">
            <p className="text-green-600 font-medium text-sm">
              🎉 Gratulerer! Milepæl oppnådd!
            </p>
            {milestone.achievedAt && (
              <p className="text-gray-500 text-xs">
                Oppnådd {milestone.achievedAt.toLocaleDateString('nb-NO')}
              </p>
            )}
            {onCelebrate && (
              <button
                onClick={handleCelebrate}
                className={`
                  px-3 py-1 rounded-md text-white font-medium text-sm
                  transition-all duration-200 hover:shadow-md
                  ${colorConfig.button}
                `}
              >
                ✨ Feir igjen!
              </button>
            )}
          </div>
        ) : isActive ? (
          <p className="text-gray-600 text-sm">
            {streaksRemaining === 0 
              ? '🎯 Du er så nære målet!' 
              : `⚡ ${streaksRemaining} dager igjen!`
            }
          </p>
        ) : (
          <p className="text-gray-500 text-sm">
            ⏸️ Start streak for å jobbe mot denne milepælen
          </p>
        )}
      </div>
    </div>
  )
}

// Default milestones configuration
export const defaultStreakMilestones: StreakMilestone[] = [
  {
    id: 'starter',
    title: 'Starter',
    description: 'Første streak på 3 dager i rad',
    targetStreak: 3,
    rewardPoints: 10,
    icon: '🌱',
    color: 'bronze',
    isAchieved: false
  },
  {
    id: 'consistent',
    title: 'Konsistent',
    description: 'Hold en uke i strekk',
    targetStreak: 7,
    rewardPoints: 25,
    icon: '🔥',
    color: 'silver',
    isAchieved: false
  },
  {
    id: 'dedicated',
    title: 'Dedikert',
    description: 'To uker på rad - imponerende!',
    targetStreak: 14,
    rewardPoints: 50,
    icon: '⭐',
    color: 'gold',
    isAchieved: false
  },
  {
    id: 'champion',
    title: 'Mester',
    description: 'En hel måned av disiplin',
    targetStreak: 30,
    rewardPoints: 100,
    icon: '🏆',
    color: 'platinum',
    isAchieved: false
  },
  {
    id: 'legend',
    title: 'Legende',
    description: 'To måneder - du er utrolig!',
    targetStreak: 60,
    rewardPoints: 250,
    icon: '👑',
    color: 'diamond',
    isAchieved: false
  }
]

export default StreakMilestoneCard 