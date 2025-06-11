import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { useUser } from '@/contexts/UserContext'
import { taskTemplateService, type TaskTemplate } from '@/services/taskTemplateService'
import type { Task } from '@/models'

interface TaskFormProps {
  initialData?: Task
  familyId: string
  onSubmit: (task: Omit<Task, 'id'>) => void
  onCancel: () => void
  isEdit?: boolean
}

interface TaskFormData {
  title: string
  description: string
  assignedTo: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'once'
  points: number
  allowanceAmount: number
  allowanceEnabled: boolean
  isActive: boolean
}

const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  familyId,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const { availableUsers, currentUser } = useUser()
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    assignedTo: initialData?.assignedTo || '',
    frequency: initialData?.frequency || 'daily',
    points: initialData?.points || 10,
    allowanceAmount: initialData?.allowanceAmount || 0,
    allowanceEnabled: initialData?.allowanceEnabled || false,
    isActive: initialData?.isActive ?? true
  })

  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({})
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateCategory, setTemplateCategory] = useState<TaskTemplate['category'] | 'all'>('all')
  const [templateSearch, setTemplateSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Only show family members that can be assigned tasks (all users)
  const assignableUsers = availableUsers

  useEffect(() => {
    // Auto-select first available user if none selected
    if (!formData.assignedTo && assignableUsers.length > 0) {
      setFormData(prev => ({ ...prev, assignedTo: assignableUsers[0].id }))
    }
  }, [assignableUsers, formData.assignedTo])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Oppgavetittel er påkrevd'
    } else if (formData.title.length < 3) {
      newErrors.title = 'Tittel må være minst 3 tegn'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Tittel kan ikke være lengre enn 100 tegn'
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Beskrivelse kan ikke være lengre enn 500 tegn'
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Du må velge hvem som skal utføre oppgaven'
    }

    if (formData.points < 1) {
      newErrors.points = 'Poeng må være minst 1'
    } else if (formData.points > 1000) {
      newErrors.points = 'Poeng kan ikke være mer enn 1000'
    }

    if (formData.allowanceEnabled && formData.allowanceAmount < 0) {
      newErrors.allowanceAmount = 'Lommepenger kan ikke være negativt'
    } else if (formData.allowanceAmount > 1000) {
      newErrors.allowanceAmount = 'Lommepenger kan ikke være mer enn 1000 kr'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const taskData: Omit<Task, 'id'> = {
        familyId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedTo: formData.assignedTo,
        frequency: formData.frequency,
        points: formData.points,
        allowanceAmount: formData.allowanceEnabled ? formData.allowanceAmount : undefined,
        allowanceEnabled: formData.allowanceEnabled,
        isActive: formData.isActive,
        createdBy: currentUser?.id || 'unknown',
        createdAt: initialData?.createdAt || new Date()
      }

      await onSubmit(taskData)
    } catch (error) {
      console.error('Error submitting task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUserDisplayName = (userId: string): string => {
    const user = assignableUsers.find(u => u.id === userId)
    return user ? `${user.name} (${user.role === 'parent' ? 'Forelder' : 'Barn'})` : userId
  }

  const frequencyOptions = [
    { value: 'daily', label: 'Daglig', description: 'Oppgaven gjentas hver dag' },
    { value: 'weekly', label: 'Ukentlig', description: 'Oppgaven gjentas hver uke' },
    { value: 'monthly', label: 'Månedlig', description: 'Oppgaven gjentas hver måned' },
    { value: 'once', label: 'Engangs', description: 'Oppgaven gjøres bare én gang' }
  ] as const

  // Template handling
  const applyTemplate = (template: TaskTemplate) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      frequency: template.suggestedFrequency,
      points: template.suggestedPoints,
      allowanceAmount: template.suggestedAllowance || 0,
      allowanceEnabled: !!template.suggestedAllowance
    }))
    setSelectedTemplate(template)
    setShowTemplates(false)
  }

  const getFilteredTemplates = () => {
    let templates = templateSearch 
      ? taskTemplateService.searchTemplates(templateSearch)
      : taskTemplateService.getTemplates()
    
    if (templateCategory !== 'all') {
      templates = templates.filter(t => t.category === templateCategory)
    }
    
    return templates
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📝</span>
          <span>{isEdit ? 'Rediger oppgave' : 'Ny oppgave'}</span>
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Template Selector */}
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Velg fra mal (valgfritt)
                </label>
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showTemplates ? 'Skjul maler' : 'Vis maler'}
                </button>
              </div>
              
              {selectedTemplate && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-blue-900">
                        Bruker mal: {selectedTemplate.title}
                      </span>
                      <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {taskTemplateService.getCategoryLabel(selectedTemplate.category)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(null)
                        setFormData(prev => ({
                          ...prev,
                          title: '',
                          description: '',
                          points: 10,
                          allowanceAmount: 0,
                          allowanceEnabled: false,
                          frequency: 'daily'
                        }))
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ✕ Fjern mal
                    </button>
                  </div>
                </div>
              )}

              {showTemplates && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {/* Template filters */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <input
                      type="text"
                      placeholder="Søk etter oppgaver..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <select
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">Alle kategorier</option>
                      {taskTemplateService.getCategories().map(category => (
                        <option key={category} value={category}>
                          {taskTemplateService.getCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Template grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {getFilteredTemplates().map(template => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className="text-left p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-white transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {template.title}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                {taskTemplateService.getCategoryLabel(template.category)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {template.suggestedPoints} poeng
                              </span>
                              {template.suggestedAllowance && (
                                <span className="text-xs text-green-600">
                                  {template.suggestedAllowance} kr
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {getFilteredTemplates().length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-4">
                      Ingen maler funnet som matcher søket
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Oppgavetittel *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                errors.title ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="f.eks. Rydde rommet"
              maxLength={100}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Beskrivelse (valgfritt)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                errors.description ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="Beskriv hva som skal gjøres..."
              maxLength={500}
            />
            <div className="mt-1 text-xs text-gray-500">
              {formData.description.length}/500 tegn
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Assignment */}
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
              Tildel til *
            </label>
            <select
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                errors.assignedTo ? 'border-red-300' : 'border-gray-300'
              )}
            >
              <option value="">Velg familiemedlem</option>
              {assignableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserDisplayName(user.id)}
                </option>
              ))}
            </select>
            {errors.assignedTo && (
              <p className="mt-1 text-sm text-red-600">{errors.assignedTo}</p>
            )}
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Hvor ofte *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {frequencyOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'relative flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50',
                    formData.frequency === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={formData.frequency === option.value}
                    onChange={(e) => handleInputChange('frequency', e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Points */}
          <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
              Poeng belønning *
            </label>
            <div className="relative">
              <input
                id="points"
                type="number"
                min="1"
                max="1000"
                value={formData.points}
                onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 0)}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.points ? 'border-red-300' : 'border-gray-300'
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">poeng</span>
              </div>
            </div>
            {errors.points && (
              <p className="mt-1 text-sm text-red-600">{errors.points}</p>
            )}
          </div>

          {/* Allowance */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                id="allowanceEnabled"
                type="checkbox"
                checked={formData.allowanceEnabled}
                onChange={(e) => handleInputChange('allowanceEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="allowanceEnabled" className="ml-2 text-sm font-medium text-gray-700">
                Gi lommepenger for denne oppgaven
              </label>
            </div>

            {formData.allowanceEnabled && (
              <div>
                <label htmlFor="allowanceAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Lommepenger beløp
                </label>
                <div className="relative">
                  <input
                    id="allowanceAmount"
                    type="number"
                    min="0"
                    max="1000"
                    step="0.50"
                    value={formData.allowanceAmount}
                    onChange={(e) => handleInputChange('allowanceAmount', parseFloat(e.target.value) || 0)}
                    className={cn(
                      'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      errors.allowanceAmount ? 'border-red-300' : 'border-gray-300'
                    )}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">kr</span>
                  </div>
                </div>
                {errors.allowanceAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.allowanceAmount}</p>
                )}
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
              Oppgaven er aktiv
            </label>
            <div className="ml-2 text-xs text-gray-500">
              (Inaktive oppgaver vises ikke i listen)
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Lagrer...</span>
              </div>
            ) : (
              isEdit ? 'Oppdater oppgave' : 'Opprett oppgave'
            )}
          </button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default TaskForm