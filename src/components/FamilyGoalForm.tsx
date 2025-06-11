import React, { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useFamilyPoints } from '@/hooks/useFamilyPoints'
import type { FamilyGoal } from '@/models'

interface FamilyGoalFormProps {
  goal?: FamilyGoal
  onSubmit?: (goal: FamilyGoal) => void
  onCancel?: () => void
  isDialog?: boolean
  className?: string
}

const FamilyGoalForm: React.FC<FamilyGoalFormProps> = ({
  goal,
  onSubmit,
  onCancel,
  isDialog = false,
  className = ''
}) => {
  const { currentUser } = useUser()
  const { createGoal, updateGoal, familyPoints } = useFamilyPoints()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    targetPoints: goal?.targetPoints || 100,
    rewardDescription: goal?.rewardDescription || '',
    isActive: goal?.isActive ?? true
  })

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  // Validate form data
  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return 'Måltittel er påkrevd'
    }
    if (!formData.rewardDescription.trim()) {
      return 'Belønningsbeskrivelse er påkrevd'
    }
    if (formData.targetPoints < 1 || formData.targetPoints > 10000) {
      return 'Målpoeng må være mellom 1 og 10 000'
    }
    if (familyPoints && formData.targetPoints <= familyPoints.totalPoints) {
      return 'Målpoeng må være høyere enn nåværende familiepoeng'
    }
    return null
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser?.familyId) {
      setError('Ingen familie valgt')
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let result: FamilyGoal

      if (goal) {
        // Editing existing goal
        result = await updateGoal(goal.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          targetPoints: formData.targetPoints,
          rewardDescription: formData.rewardDescription.trim(),
          isActive: formData.isActive
        })
      } else {
        // Creating new goal
        result = await createGoal({
          title: formData.title.trim(),
          description: formData.description.trim(),
          targetPoints: formData.targetPoints,
          rewardDescription: formData.rewardDescription.trim(),
          isActive: formData.isActive,
          isCompleted: false,
          createdBy: currentUser.id
        })
      }

      // Call success callback
      onSubmit?.(result)

      // Reset form if creating new goal
      if (!goal) {
        setFormData({
          title: '',
          description: '',
          targetPoints: 100,
          rewardDescription: '',
          isActive: true
        })
      }
    } catch (err) {
      console.error('Error saving family goal:', err)
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre mål')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`family-goal-form ${className}`}>
      <div className={isDialog ? 'p-6' : 'max-w-2xl mx-auto p-6'}>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {goal ? 'Rediger familiemål' : 'Nytt familiemål'}
          </h2>
          <p className="text-gray-600 mt-2">
            Sett mål for familiepoeng og definer belønninger som motiverer hele familien.
          </p>
          {familyPoints && (
            <div className="mt-3 text-sm text-blue-600">
              Nåværende familiepoeng: <strong>{familyPoints.totalPoints.toLocaleString('nb-NO')} ⭐</strong>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Måltittel *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="F.eks. Tur til Tusenfryd, Familiekino, Middag ute"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Beskrivelse
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Utdyp målet og hva som gjør det spesielt for familien"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Target Points */}
          <div>
            <label htmlFor="targetPoints" className="block text-sm font-medium text-gray-700 mb-2">
              Målpoeng *
            </label>
            <input
              id="targetPoints"
              type="number"
              value={formData.targetPoints}
              onChange={(e) => handleChange('targetPoints', parseInt(e.target.value) || 0)}
              min="1"
              max="10000"
              step="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Antall familiepoeng som trengs for å oppnå målet
            </p>
          </div>

          {/* Reward Description */}
          <div>
            <label htmlFor="rewardDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Belønning *
            </label>
            <textarea
              id="rewardDescription"
              value={formData.rewardDescription}
              onChange={(e) => handleChange('rewardDescription', e.target.value)}
              placeholder="Beskriv belønningen familien får når målet er nådd"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Progress Preview */}
          {familyPoints && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">📊 Fremgangsforhåndsvisning</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Nåværende poeng:</span>
                  <span className="font-medium">{familyPoints.totalPoints.toLocaleString('nb-NO')} ⭐</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Målpoeng:</span>
                  <span className="font-medium text-blue-600">{formData.targetPoints.toLocaleString('nb-NO')} ⭐</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Poeng igjen:</span>
                  <span className={`font-medium ${
                    formData.targetPoints <= familyPoints.totalPoints ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {Math.max(0, formData.targetPoints - familyPoints.totalPoints).toLocaleString('nb-NO')} ⭐
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((familyPoints.totalPoints / formData.targetPoints) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  {Math.round((familyPoints.totalPoints / formData.targetPoints) * 100)}% fullført
                </div>
              </div>
            </div>
          )}

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Aktivt mål
              </label>
              <p className="text-sm text-gray-500">
                Kun aktive mål vises i familiemål-listen
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('isActive', !formData.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isActive ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              disabled={isLoading}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  formData.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Lagrer...
                </span>
              ) : (
                goal ? 'Oppdater mål' : 'Opprett mål'
              )}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 sm:flex-none bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                Avbryt
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default FamilyGoalForm 