import React, { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useFamilyPoints } from '@/hooks/useFamilyPoints'
import FamilyPointsDisplay from '@/components/FamilyPointsDisplay'
import FamilyGoalDialog from '@/components/FamilyGoalDialog'
import EmptyState from '@/components/EmptyState'
import type { FamilyGoal } from '@/models'

const FamilyGoalsPage: React.FC = () => {
  const { currentUser } = useUser()
  const { 
    familyPoints, 
    familyGoals, 
    isLoading: familyPointsLoading, 
    error: familyPointsError,
    completeGoal,
    deleteGoal 
  } = useFamilyPoints()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<FamilyGoal | undefined>()
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Filter goals based on current filter
  const filteredGoals = familyGoals?.filter(goal => {
    switch (filter) {
      case 'active':
        return !goal.isCompleted && goal.isActive
      case 'completed':
        return goal.isCompleted
      default:
        return true
    }
  }) || []

  // Handle creating new goal
  const handleCreateGoal = () => {
    setEditingGoal(undefined)
    setIsDialogOpen(true)
  }

  // Handle editing goal
  const handleEditGoal = (goal: FamilyGoal) => {
    setEditingGoal(goal)
    setIsDialogOpen(true)
  }

  // Handle completing goal
  const handleCompleteGoal = async (goal: FamilyGoal) => {
    if (!familyPoints || familyPoints.totalPoints < goal.targetPoints) {
      return
    }

    try {
      await completeGoal(goal.id, goal.targetPoints)
    } catch (error) {
      console.error('Error completing goal:', error)
    }
  }

  // Handle deleting goal
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette målet?')) {
      return
    }

    setIsDeleting(goalId)
    try {
      await deleteGoal(goalId)
    } catch (error) {
      console.error('Error deleting goal:', error)
    } finally {
      setIsDeleting(null)
    }
  }

  // Close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingGoal(undefined)
  }

  // Handle successful goal save
  const handleGoalSuccess = () => {
    // The hook will automatically refresh data
    handleCloseDialog()
  }

  if (familyPointsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="bg-gray-200 h-8 rounded w-1/3"></div>
          <div className="bg-gray-200 h-40 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-200 h-32 rounded"></div>
            <div className="bg-gray-200 h-32 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (familyPointsError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <span className="text-red-600 text-4xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kunne ikke laste familiemål</h2>
          <p className="text-gray-600">{familyPointsError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Familiemål</h1>
          <p className="text-gray-600 mt-1">
            Sett mål og spor fremgang mot familiebelønninger
          </p>
        </div>
        
        {currentUser?.role === 'parent' && (
          <button
            onClick={handleCreateGoal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            📝 Nytt mål
          </button>
        )}
      </div>

      {/* Family Points Summary */}
      <FamilyPointsDisplay 
        showGoals={false} 
        className="mb-8" 
      />

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Alle mål
            <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
              {familyGoals?.length || 0}
            </span>
          </button>
          
          <button
            onClick={() => setFilter('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Aktive
            <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
              {familyGoals?.filter(g => !g.isCompleted && g.isActive).length || 0}
            </span>
          </button>
          
          <button
            onClick={() => setFilter('completed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Fullførte
            <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
              {familyGoals?.filter(g => g.isCompleted).length || 0}
            </span>
          </button>
        </nav>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          type="tasks"
          title={
            filter === 'active' ? 'Ingen aktive familiemål' :
            filter === 'completed' ? 'Ingen fullførte familiemål' :
            'Ingen familiemål opprettet ennå'
          }
          description={
            filter === 'active' ? 'Opprett nye mål eller aktiver eksisterende mål for å komme i gang.' :
            filter === 'completed' ? 'Når familien oppnår sine mål, vil de vises her.' :
            'Opprett ditt første familiemål for å begynne å motivere familien mot felles belønninger.'
          }
          action={
            currentUser?.role === 'parent' && filter !== 'completed' ? {
              label: 'Opprett mål',
              onClick: handleCreateGoal
            } : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGoals.map(goal => {
            const progress = familyPoints ? 
              familyPoints.totalPoints >= goal.targetPoints ? 100 : 
              Math.min((familyPoints.totalPoints / goal.targetPoints) * 100, 100) : 0
            const isCompleted = goal.isCompleted || (familyPoints && familyPoints.totalPoints >= goal.targetPoints)
            const canComplete = familyPoints && familyPoints.totalPoints >= goal.targetPoints && !goal.isCompleted

            return (
              <div
                key={goal.id}
                className={`bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${
                  isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                {/* Goal Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {isCompleted ? '🏆' : '🎯'}
                    </span>
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        isCompleted ? 'text-green-800' : 'text-gray-900'
                      }`}>
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions Menu */}
                  {currentUser?.role === 'parent' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Rediger mål"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        disabled={isDeleting === goal.id}
                        className="text-gray-400 hover:text-red-600 p-1 disabled:opacity-50"
                        title="Slett mål"
                      >
                        {isDeleting === goal.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Fremgang</span>
                    <span className="text-sm text-gray-600">
                      {familyPoints ? familyPoints.totalPoints.toLocaleString('nb-NO') : 0} / {goal.targetPoints.toLocaleString('nb-NO')} ⭐
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-center mt-1">
                    <span className={`text-sm font-medium ${
                      isCompleted ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {isCompleted ? 'Fullført!' : `${Math.round(progress)}%`}
                    </span>
                  </div>
                </div>

                {/* Reward */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">🎁 Belønning</div>
                  <div className="text-sm text-gray-600">
                    {goal.rewardDescription}
                  </div>
                </div>

                {/* Actions */}
                {canComplete && currentUser?.role === 'parent' && (
                  <button
                    onClick={() => handleCompleteGoal(goal)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    🎉 Krev belønning
                  </button>
                )}

                {/* Status Badge */}
                {!goal.isActive && (
                  <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Inaktiv
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Goal Dialog */}
      <FamilyGoalDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        goal={editingGoal}
        onSuccess={handleGoalSuccess}
      />
    </div>
  )
}

export default FamilyGoalsPage 