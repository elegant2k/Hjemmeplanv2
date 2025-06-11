import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useFamilyPoints } from '@/hooks/useFamilyPoints'
import { userService } from '@/services/userService'
import { taskService } from '@/services/taskService'
import type { Task, User } from '@/models'

interface FamilyActivityFormProps {
  activity?: Task // For editing existing activities
  onSubmit?: (activity: Task) => void
  onCancel?: () => void
  isDialog?: boolean
  className?: string
}

const FamilyActivityForm: React.FC<FamilyActivityFormProps> = ({
  activity,
  onSubmit,
  onCancel,
  isDialog = false,
  className = ''
}) => {
  const { currentUser } = useUser()
  const { refreshData } = useFamilyPoints()
  const [familyMembers, setFamilyMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: activity?.title || '',
    description: activity?.description || '',
    points: activity?.points || 50,
    frequency: activity?.frequency || 'weekly' as const,
    requiredParticipants: activity?.requiredParticipants || 2,
    isActive: activity?.isActive ?? true
  })

  // Load family members on mount
  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (!currentUser?.familyId) return

      try {
        const allUsers = await userService.getUsers()
        const familyUsers = allUsers.filter(user => user.familyId === currentUser.familyId)
        setFamilyMembers(familyUsers)
      } catch (err) {
        console.error('Error loading family members:', err)
        setError('Kunne ikke laste familiemedlemmer')
      }
    }

    loadFamilyMembers()
  }, [currentUser?.familyId])

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  // Validate form data
  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return 'Aktivitetsnavn er påkrevd'
    }
    if (!formData.description.trim()) {
      return 'Beskrivelse er påkrevd'
    }
    if (formData.points < 1 || formData.points > 500) {
      return 'Poeng må være mellom 1 og 500'
    }
    if (formData.requiredParticipants < 1 || formData.requiredParticipants > familyMembers.length) {
      return `Minimum deltakere må være mellom 1 og ${familyMembers.length}`
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
      let result: Task

      if (activity) {
        // Editing existing activity
        result = await taskService.updateTask(activity.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          points: formData.points,
          frequency: formData.frequency,
          requiredParticipants: formData.requiredParticipants,
          isActive: formData.isActive,
          isFamily: true
        })
      } else {
        // Creating new activity
        result = await taskService.createTask({
          familyId: currentUser.familyId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          assignedTo: currentUser.familyId, // Special assignment for family activities
          frequency: formData.frequency,
          points: formData.points,
          allowanceAmount: 0, // Family activities don't give allowance
          allowanceEnabled: false,
          isActive: formData.isActive,
          createdBy: currentUser.id,
          isFamily: true,
          requiredParticipants: formData.requiredParticipants
        })
      }

      // Refresh family points data
      await refreshData()

      // Call success callback
      onSubmit?.(result)

      // Reset form if creating new activity
      if (!activity) {
        setFormData({
          title: '',
          description: '',
          points: 50,
          frequency: 'weekly',
          requiredParticipants: 2,
          isActive: true
        })
      }
    } catch (err) {
      console.error('Error saving family activity:', err)
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre aktivitet')
    } finally {
      setIsLoading(false)
    }
  }

  // Get frequency display text
  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Daglig'
      case 'weekly': return 'Ukentlig'
      case 'monthly': return 'Månedlig'
      case 'once': return 'Engangs'
      default: return freq
    }
  }

  return (
    <div className={`family-activity-form ${className}`}>
      <div className={isDialog ? 'p-6' : 'max-w-2xl mx-auto p-6'}>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {activity ? 'Rediger familieaktivitet' : 'Ny familieaktivitet'}
          </h2>
          <p className="text-gray-600 mt-2">
            Opprett aktiviteter som hele familien kan delta i sammen for å tjene familiepoeng.
          </p>
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
          {/* Activity Name */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Aktivitetsnavn *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="F.eks. Familiekvelder, Felles trening, Matlaging sammen"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Beskrivelse *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Beskriv hva aktiviteten innebærer og hvordan familien kan delta sammen"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Points and Frequency Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Points */}
            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
                Familiepoeng *
              </label>
              <input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
                min="1"
                max="500"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Poeng som familien får for å fullføre aktiviteten sammen
              </p>
            </div>

            {/* Frequency */}
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                Frekvens *
              </label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="once">Engangs</option>
                <option value="weekly">Ukentlig</option>
                <option value="monthly">Månedlig</option>
                <option value="daily">Daglig</option>
              </select>
            </div>
          </div>

          {/* Required Participants */}
          <div>
            <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum antall deltakere *
            </label>
            <div className="flex items-center space-x-4">
              <input
                id="participants"
                type="range"
                min="1"
                max={familyMembers.length || 4}
                value={formData.requiredParticipants}
                onChange={(e) => handleChange('requiredParticipants', parseInt(e.target.value))}
                className="flex-1"
                disabled={isLoading}
              />
              <div className="bg-blue-50 px-3 py-2 rounded-md border min-w-[80px] text-center">
                <span className="text-blue-600 font-medium">
                  {formData.requiredParticipants} / {familyMembers.length}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Hvor mange familiemedlemmer som må delta for å fullføre aktiviteten
            </p>
          </div>

          {/* Preview Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">📋 Forhåndsvisning</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Aktivitet:</strong> {formData.title || 'Aktivitetsnavn'}</div>
              <div><strong>Frekvens:</strong> {getFrequencyText(formData.frequency)}</div>
              <div><strong>Familiepoeng:</strong> {formData.points} poeng</div>
              <div><strong>Minimum deltakere:</strong> {formData.requiredParticipants} personer</div>
              <div><strong>Status:</strong> {formData.isActive ? '✅ Aktiv' : '⏸️ Inaktiv'}</div>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Aktiv aktivitet
              </label>
              <p className="text-sm text-gray-500">
                Kun aktive aktiviteter vises i familieaktivitetslisten
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
                activity ? 'Oppdater aktivitet' : 'Opprett aktivitet'
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

export default FamilyActivityForm 