import React, { useState } from 'react'

interface HolidayDate {
  id: string
  name: string
  date: string
  recurring: boolean
  skipTasks: boolean
  description?: string
}

interface HolidayFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (holiday: Omit<HolidayDate, 'id'>) => void
  editingHoliday?: HolidayDate | null
}

const HolidayForm: React.FC<HolidayFormProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHoliday
}) => {
  const [formData, setFormData] = useState({
    name: editingHoliday?.name || '',
    date: editingHoliday?.date || '',
    recurring: editingHoliday?.recurring || false,
    skipTasks: editingHoliday?.skipTasks || false,
    description: editingHoliday?.description || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Navn er påkrevd'
    }

    if (!formData.date.trim()) {
      newErrors.date = 'Dato er påkrevd'
    } else {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}-\d{2}$/
      if (!dateRegex.test(formData.date)) {
        newErrors.date = 'Ugyldig datoformat (bruk YYYY-MM-DD eller MM-DD)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    onSave({
      name: formData.name.trim(),
      date: formData.date.trim(),
      recurring: formData.recurring,
      skipTasks: formData.skipTasks,
      description: formData.description.trim() || undefined
    })

    // Reset form
    setFormData({
      name: '',
      date: '',
      recurring: false,
      skipTasks: false,
      description: ''
    })
    setErrors({})
    onClose()
  }

  const handleCancel = () => {
    setFormData({
      name: editingHoliday?.name || '',
      date: editingHoliday?.date || '',
      recurring: editingHoliday?.recurring || false,
      skipTasks: editingHoliday?.skipTasks || false,
      description: editingHoliday?.description || ''
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingHoliday ? 'Rediger helligdag' : 'Legg til helligdag'}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Navn *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.name 
                    ? 'border-red-300 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200'
                }`}
                placeholder="f.eks. Kristi himmelfartsdag"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dato *
              </label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.date 
                    ? 'border-red-300 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200'
                }`}
                placeholder="YYYY-MM-DD eller MM-DD"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bruk MM-DD for årlig gjentagelse, eller YYYY-MM-DD for spesifikk dato
              </p>
              {errors.date && (
                <p className="text-sm text-red-600 mt-1">{errors.date}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beskrivelse (valgfritt)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Kort beskrivelse av helligdagen..."
              />
            </div>

            {/* Recurring */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.recurring}
                onChange={(e) => setFormData(prev => ({ ...prev, recurring: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="recurring" className="text-sm text-gray-700">
                Årlig gjentagelse
              </label>
            </div>

            {/* Skip Tasks */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="skipTasks"
                checked={formData.skipTasks}
                onChange={(e) => setFormData(prev => ({ ...prev, skipTasks: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="skipTasks" className="text-sm text-gray-700">
                Hopp over oppgaver denne dagen
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingHoliday ? 'Oppdater helligdag' : 'Legg til helligdag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HolidayForm 