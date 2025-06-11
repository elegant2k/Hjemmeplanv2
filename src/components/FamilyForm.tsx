import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import type { Family } from '@/models'

interface FamilyFormProps {
  family?: Family | null
  onSave?: (family: Omit<Family, 'id'>) => void
  onCancel?: () => void
  isEditing?: boolean
  className?: string
}

interface FamilyFormData {
  name: string
  timezone: string
  language: 'nb' | 'en'
  allowWeekendTasks: boolean
  streakResetTime: string // HH:MM format
  defaultTaskPoints: number
  defaultAllowanceAmount: number
  currency: string
  parentalControlLevel: 'strict' | 'moderate' | 'relaxed'
  enableNotifications: boolean
  maxDailyTasks: number
}

const FamilyForm: React.FC<FamilyFormProps> = ({
  family,
  onSave,
  onCancel,
  isEditing = false,
  className = ''
}) => {
  const { currentUser } = useUser()
  const [formData, setFormData] = useState<FamilyFormData>({
    name: '',
    timezone: 'Europe/Oslo',
    language: 'nb',
    allowWeekendTasks: true,
    streakResetTime: '06:00',
    defaultTaskPoints: 10,
    defaultAllowanceAmount: 50,
    currency: 'NOK',
    parentalControlLevel: 'moderate',
    enableNotifications: true,
    maxDailyTasks: 5
  })

  const [errors, setErrors] = useState<Partial<FamilyFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Available options
  const timezones = [
    { value: 'Europe/Oslo', label: 'Norge (UTC+1)' },
    { value: 'Europe/Stockholm', label: 'Sverige (UTC+1)' },
    { value: 'Europe/Copenhagen', label: 'Danmark (UTC+1)' },
    { value: 'Europe/London', label: 'Storbritannia (UTC+0)' },
    { value: 'America/New_York', label: 'USA/Canada Øst (UTC-5)' },
    { value: 'America/Los_Angeles', label: 'USA/Canada Vest (UTC-8)' }
  ]

  const currencies = [
    { value: 'NOK', label: 'Norske kroner (NOK)' },
    { value: 'SEK', label: 'Svenska kronor (SEK)' },
    { value: 'DKK', label: 'Danske kroner (DKK)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'GBP', label: 'British Pound (GBP)' }
  ]

  // Initialize form with existing family data
  useEffect(() => {
    if (family) {
      setFormData(prev => ({
        ...prev,
        name: family.name || '',
        // Map other family properties if they exist
      }))
    }
  }, [family])

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<FamilyFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Familienavn er påkrevd'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Familienavn må være minst 2 tegn'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Familienavn kan ikke være mer enn 50 tegn'
    }

    if (formData.defaultTaskPoints < 1 || formData.defaultTaskPoints > 100) {
      newErrors.defaultTaskPoints = 'Standard poeng må være mellom 1 og 100'
    }

    if (formData.defaultAllowanceAmount < 0 || formData.defaultAllowanceAmount > 1000) {
      newErrors.defaultAllowanceAmount = 'Standard lommepenger må være mellom 0 og 1000'
    }

    if (formData.maxDailyTasks < 1 || formData.maxDailyTasks > 20) {
      newErrors.maxDailyTasks = 'Maksimale daglige oppgaver må være mellom 1 og 20'
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(formData.streakResetTime)) {
      newErrors.streakResetTime = 'Ugyldig tidsformat (bruk HH:MM)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const familyData: Omit<Family, 'id'> = {
        name: formData.name.trim(),
        memberCount: 0, // Will be calculated when members are added
        createdBy: currentUser?.id || '',
        createdAt: new Date()
      }

      onSave?.(familyData)
    } catch (error) {
      console.error('Error saving family:', error)
      setErrors({ name: 'En feil oppstod under lagring. Prøv igjen.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle input changes
  const handleInputChange = (field: keyof FamilyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Rediger familieinnstillinger' : 'Opprett ny familie'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isEditing 
              ? 'Oppdater familiens grunnleggende informasjon og innstillinger.'
              : 'Konfigurer din families grunnleggende informasjon og preferanser.'
            }
          </p>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Grunnleggende informasjon</h3>
          
          {/* Family Name */}
          <div>
            <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-1">
              Familienavn *
            </label>
            <input
              type="text"
              id="familyName"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.name 
                  ? 'border-red-300 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="f.eks. Familien Hansen"
              maxLength={50}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Tidssone
            </label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Språk
            </label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="nb">Norsk (Bokmål)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Task Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Oppgaveinnstillinger</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Default Task Points */}
            <div>
              <label htmlFor="defaultPoints" className="block text-sm font-medium text-gray-700 mb-1">
                Standard poeng per oppgave
              </label>
              <input
                type="number"
                id="defaultPoints"
                min="1"
                max="100"
                value={formData.defaultTaskPoints}
                onChange={(e) => handleInputChange('defaultTaskPoints', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.defaultTaskPoints 
                    ? 'border-red-300 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {errors.defaultTaskPoints && (
                <p className="text-sm text-red-600 mt-1">{errors.defaultTaskPoints}</p>
              )}
            </div>

            {/* Max Daily Tasks */}
            <div>
              <label htmlFor="maxDailyTasks" className="block text-sm font-medium text-gray-700 mb-1">
                Maks oppgaver per dag
              </label>
              <input
                type="number"
                id="maxDailyTasks"
                min="1"
                max="20"
                value={formData.maxDailyTasks}
                onChange={(e) => handleInputChange('maxDailyTasks', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.maxDailyTasks 
                    ? 'border-red-300 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200'
                }`}
              />
              {errors.maxDailyTasks && (
                <p className="text-sm text-red-600 mt-1">{errors.maxDailyTasks}</p>
              )}
            </div>
          </div>

          {/* Weekend Tasks Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowWeekendTasks"
              checked={formData.allowWeekendTasks}
              onChange={(e) => handleInputChange('allowWeekendTasks', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allowWeekendTasks" className="ml-2 block text-sm text-gray-700">
              Tillat oppgaver i helgene
            </label>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            <span className="ml-1">Avanserte innstillinger</span>
          </button>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Streak Reset Time */}
              <div>
                <label htmlFor="streakResetTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Streak tilbakestill tid
                </label>
                <input
                  type="time"
                  id="streakResetTime"
                  value={formData.streakResetTime}
                  onChange={(e) => handleInputChange('streakResetTime', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.streakResetTime 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.streakResetTime && (
                  <p className="text-sm text-red-600 mt-1">{errors.streakResetTime}</p>
                )}
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Valuta
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Allowance Amount */}
              <div>
                <label htmlFor="defaultAllowance" className="block text-sm font-medium text-gray-700 mb-1">
                  Standard lommepenger ({formData.currency})
                </label>
                <input
                  type="number"
                  id="defaultAllowance"
                  min="0"
                  max="1000"
                  value={formData.defaultAllowanceAmount}
                  onChange={(e) => handleInputChange('defaultAllowanceAmount', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.defaultAllowanceAmount 
                      ? 'border-red-300 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200'
                  }`}
                />
                {errors.defaultAllowanceAmount && (
                  <p className="text-sm text-red-600 mt-1">{errors.defaultAllowanceAmount}</p>
                )}
              </div>

              {/* Parental Control Level */}
              <div>
                <label htmlFor="parentalControl" className="block text-sm font-medium text-gray-700 mb-1">
                  Foreldrekontroll nivå
                </label>
                <select
                  id="parentalControl"
                  value={formData.parentalControlLevel}
                  onChange={(e) => handleInputChange('parentalControlLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="strict">Streng - Alle handlinger krever godkjenning</option>
                  <option value="moderate">Moderat - Viktige handlinger krever godkjenning</option>
                  <option value="relaxed">Avslappet - Minimal godkjenning påkrevd</option>
                </select>
              </div>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableNotifications"
                checked={formData.enableNotifications}
                onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableNotifications" className="ml-2 block text-sm text-gray-700">
                Aktiver varslinger
              </label>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Avbryt
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Lagrer...</span>
              </div>
            ) : (
              isEditing ? 'Oppdater familie' : 'Opprett familie'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Du kan endre disse innstillingene senere i administrasjonspanelet</li>
            <li>• Standard verdier brukes når du oppretter nye oppgaver</li>
            <li>• Tidssone påvirker når oppgaver fornyes og streaks tilbakestilles</li>
          </ul>
        </div>
      </form>
    </div>
  )
}

export default FamilyForm 