import React from 'react'
import { useFamilyPoints } from '@/hooks/useFamilyPoints'

interface FamilyPointsDisplayProps {
  showGoals?: boolean
  compact?: boolean
  className?: string
}

const FamilyPointsDisplay: React.FC<FamilyPointsDisplayProps> = ({
  showGoals = true,
  compact = false,
  className = ''
}) => {
  const { familyPoints, familyGoals, isLoading, error } = useFamilyPoints()

  // Format points with thousands separator
  const formatPoints = (points: number) => {
    return points.toLocaleString('nb-NO')
  }

  if (isLoading) {
    return (
      <div className={`family-points-display ${className}`}>
        <div className="animate-pulse">
          <div className="bg-gray-200 h-8 rounded mb-2"></div>
          <div className="bg-gray-200 h-4 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error || !familyPoints) {
    return (
      <div className={`family-points-display ${className}`}>
        <div className="text-center py-4">
          <span className="text-red-600">⚠️</span>
          <p className="text-red-800 text-sm mt-1">
            {error || 'Kunne ikke laste familiepoeng'}
          </p>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={`family-points-display compact ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {formatPoints(familyPoints.totalPoints)}
              </div>
              <div className="text-xs text-gray-500">Familiepoeng</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`family-points-display ${className}`}>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-blue-900">Familiepoeng</h3>
            <p className="text-blue-700">Oppnådd gjennom felles aktiviteter</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {formatPoints(familyPoints.totalPoints)} ⭐
            </div>
            <div className="text-sm text-blue-700">
              {familyPoints.currentGoal && familyPoints.currentGoal > 0 && (
                <>Mål: {formatPoints(familyPoints.currentGoal)}</>
              )}
            </div>
          </div>
        </div>

        {/* Goals Section */}
        {showGoals && familyGoals && familyGoals.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-blue-900">Familiemål</h4>
            
            {familyGoals.slice(0, 3).map((goal) => {
              const progress = familyPoints.totalPoints >= goal.targetPoints ? 100 : 
                Math.min((familyPoints.totalPoints / goal.targetPoints) * 100, 100)
              const isCompleted = goal.isCompleted || familyPoints.totalPoints >= goal.targetPoints
              
              return (
                <div key={goal.id} className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {isCompleted ? '🏆' : '🎯'}
                      </span>
                      <div>
                        <div className={`text-sm font-medium ${
                          isCompleted ? 'text-green-800' : 'text-gray-800'
                        }`}>
                          {goal.title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {goal.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        isCompleted ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {formatPoints(Math.min(familyPoints.totalPoints, goal.targetPoints))} / {formatPoints(goal.targetPoints)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isCompleted ? 'Fullført!' : `${Math.round(progress)}%`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Goal Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  {/* Reward Info */}
                  {goal.rewardDescription && (
                    <div className="mt-2 text-xs text-gray-600">
                      🎁 Belønning: {goal.rewardDescription}
                    </div>
                  )}
                </div>
              )
            })}
            
            {familyGoals.length > 3 && (
              <div className="text-center">
                <button className="text-blue-600 text-sm hover:text-blue-800 transition-colors">
                  Se alle {familyGoals.length} mål →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State for Goals */}
        {showGoals && (!familyGoals || familyGoals.length === 0) && (
          <div className="text-center py-4 border-t border-blue-200 mt-4">
            <p className="text-blue-700 text-sm">
              Ingen familiemål satt ennå
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Opprett mål for å motivere familien til å samle flere poeng sammen
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-200">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {familyGoals?.filter(g => g.isCompleted).length || 0}
            </div>
            <div className="text-xs text-blue-700">Mål oppnådd</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {familyGoals?.filter(g => !g.isCompleted).length || 0}
            </div>
            <div className="text-xs text-blue-700">Aktive mål</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FamilyPointsDisplay 