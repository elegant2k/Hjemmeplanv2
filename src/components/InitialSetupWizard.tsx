import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import FamilyForm from './FamilyForm'
import { useUser } from '@/contexts/UserContext'
import type { Family, User } from '@/models'
import { userService, familyService } from '@/services'
import IconMap from './IconMap'

interface WizardStep {
  id: string
  title: string
  description: string
  completed: boolean
}

interface ParentSetupData {
  name: string
  email: string
  pin: string
  confirmPin: string
  role: 'parent' | 'guardian'
}

interface ChildSetupData {
  name: string
  age: number
  avatar: string
  allowance: boolean
}

const InitialSetupWizard: React.FC = () => {
  const navigate = useNavigate()
  const { setCurrentUser } = useUser()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [familyData, setFamilyData] = useState<Omit<Family, 'id'> | null>(null)
  const [parentData, setParentData] = useState<ParentSetupData>({
    name: '',
    email: '',
    pin: '',
    confirmPin: '',
    role: 'parent'
  })
  const [children, setChildren] = useState<ChildSetupData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Velkommen til Hjemmeplan',
      description: 'La oss sette opp familiens profil og oppgaver',
      completed: false
    },
    {
      id: 'family',
      title: 'Familie-informasjon',
      description: 'Konfigurer familiens grunnleggende innstillinger',
      completed: !!familyData
    },
    {
      id: 'parent',
      title: 'Forelder/foresatt',
      description: 'Opprett din administratorkonto',
      completed: parentData.name && parentData.pin && parentData.confirmPin
    },
    {
      id: 'children',
      title: 'Familiemedlemmer',
      description: 'Legg til barn og andre familiemedlemmer',
      completed: children.length > 0
    },
    {
      id: 'complete',
      title: 'Ferdig!',
      description: 'Din familie er klar til å bruke Hjemmeplan',
      completed: false
    }
  ]

  // Available avatars for children
  const avatars = [
    '👦', '👧', '🧒', '👶', '🐶', '🐱', '🦄', '🌟', 
    '🚀', '⚽', '🎨', '📚', '🎮', '🎵', '🌈', '🦸'
  ]

  // Handle family form save
  const handleFamilySave = useCallback((family: Omit<Family, 'id'>) => {
    setFamilyData(family)
    setCurrentStep(2) // Move to parent setup
  }, [])

  // Validate parent setup
  const validateParentData = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!parentData.name.trim()) {
      newErrors.parentName = 'Navn er påkrevd'
    }

    if (!parentData.email.trim()) {
      newErrors.parentEmail = 'E-post er påkrevd'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentData.email)) {
      newErrors.parentEmail = 'Ugyldig e-postadresse'
    }

    if (!parentData.pin) {
      newErrors.parentPin = 'PIN er påkrevd'
    } else if (parentData.pin.length !== 4 || !/^\d{4}$/.test(parentData.pin)) {
      newErrors.parentPin = 'PIN må være 4 siffer'
    }

    if (parentData.pin !== parentData.confirmPin) {
      newErrors.confirmPin = 'PIN-kodene stemmer ikke overens'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Add a new child
  const addChild = () => {
    setChildren(prev => [...prev, {
      name: '',
      age: 8,
      avatar: avatars[0],
      allowance: true
    }])
  }

  // Remove a child
  const removeChild = (index: number) => {
    setChildren(prev => prev.filter((_, i) => i !== index))
  }

  // Update child data
  const updateChild = (index: number, field: keyof ChildSetupData, value: any) => {
    setChildren(prev => prev.map((child, i) => 
      i === index ? { ...child, [field]: value } : child
    ))
  }

  // Complete setup
  const completeSetup = async () => {
    if (!familyData) return

    setIsSubmitting(true)

    try {
      // 1. Create family
      const newFamily = await familyService.create(familyData)

      // 2. Create parent user
      const parentUser: Omit<User, 'id'> = {
        name: parentData.name.trim(),
        email: parentData.email.trim(),
        role: parentData.role,
        isActive: true,
        pin: parentData.pin,
        avatar: '👨‍💼', // Default parent avatar
        pointsEarned: 0,
        completedTasks: 0,
        currentStreak: 0,
        longestStreak: 0,
        joinedAt: new Date(),
        familyId: newFamily.id
      }

      const createdParent = await userService.create(parentUser)
      setCurrentUser(createdParent)

      // 3. Create children
      for (const child of children) {
        if (child.name.trim()) {
          const childUser: Omit<User, 'id'> = {
            name: child.name.trim(),
            email: '', // Children don't need email
            role: 'child',
            isActive: true,
            pin: '', // Children don't have PIN
            avatar: child.avatar,
            pointsEarned: 0,
            completedTasks: 0,
            currentStreak: 0,
            longestStreak: 0,
            joinedAt: new Date(),
            familyId: newFamily.id
          }

          await userService.create(childUser)
        }
      }

      // 4. Update family member count
      await familyService.update(newFamily.id, {
        memberCount: 1 + children.filter(c => c.name.trim()).length
      })

      setCurrentStep(4) // Move to completion step

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/')
      }, 2000)

    } catch (error) {
      console.error('Error completing setup:', error)
      setErrors({ general: 'En feil oppstod under opprettelse. Prøv igjen.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle next step
  const handleNext = () => {
    if (currentStep === 2) { // Parent setup validation
      if (!validateParentData()) return
    }
    
    if (currentStep === 3) { // Complete setup
      completeSetup()
      return
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Progress Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Familie Oppsett</h1>
            <span className="text-blue-200">
              Steg {currentStep + 1} av {steps.length}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-blue-500 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Welcome Step */}
          {currentStep === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Velkommen til Hjemmeplan!
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Vi hjelper familier med å organisere oppgaver, belønninger og familietid. 
                La oss sette opp din familie på bare få minutter.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl mb-2">
                    <IconMap type="tasks" size={28} className="text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Oppgaver</h3>
                  <p className="text-sm text-gray-600">
                    Organiser hverdagsoppgaver og følg fremgang
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl mb-2">
                    <IconMap type="trophy" size={28} className="text-green-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Belønninger</h3>
                  <p className="text-sm text-gray-600">
                    Opptjen poeng og lommepenger for fullførte oppgaver
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-3xl mb-2">👨‍👩‍👧‍👦</div>
                  <h3 className="font-semibold text-gray-900">Familie</h3>
                  <p className="text-sm text-gray-600">
                    Samarbeid og feir suksesser sammen
                  </p>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Kom i gang 🚀
              </button>
            </div>
          )}

          {/* Family Setup Step */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 mb-6">
                {steps[currentStep].description}
              </p>

              <FamilyForm
                onSave={handleFamilySave}
                className="border-0 shadow-none"
              />
            </div>
          )}

          {/* Parent Setup Step */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 mb-6">
                Som forelder/foresatt har du administratortilgang til å administrere oppgaver og godkjenne fullføringer.
              </p>

              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fullt navn *
                  </label>
                  <input
                    type="text"
                    value={parentData.name}
                    onChange={(e) => setParentData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      errors.parentName 
                        ? 'border-red-300 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-blue-200'
                    }`}
                    placeholder="f.eks. Kari Hansen"
                  />
                  {errors.parentName && (
                    <p className="text-sm text-red-600 mt-1">{errors.parentName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-postadresse *
                  </label>
                  <input
                    type="email"
                    value={parentData.email}
                    onChange={(e) => setParentData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      errors.parentEmail 
                        ? 'border-red-300 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-blue-200'
                    }`}
                    placeholder="kari@example.com"
                  />
                  {errors.parentEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.parentEmail}</p>
                  )}
                </div>

                {/* PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Administratar PIN (4 siffer) *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={parentData.pin}
                    onChange={(e) => setParentData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      errors.parentPin 
                        ? 'border-red-300 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-blue-200'
                    }`}
                    placeholder="••••"
                  />
                  {errors.parentPin && (
                    <p className="text-sm text-red-600 mt-1">{errors.parentPin}</p>
                  )}
                </div>

                {/* Confirm PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bekreft PIN *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={parentData.confirmPin}
                    onChange={(e) => setParentData(prev => ({ ...prev, confirmPin: e.target.value.replace(/\D/g, '') }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      errors.confirmPin 
                        ? 'border-red-300 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-blue-200'
                    }`}
                    placeholder="••••"
                  />
                  {errors.confirmPin && (
                    <p className="text-sm text-red-600 mt-1">{errors.confirmPin}</p>
                  )}
                </div>

                {/* Role */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rolle i familien
                  </label>
                  <select
                    value={parentData.role}
                    onChange={(e) => setParentData(prev => ({ ...prev, role: e.target.value as 'parent' | 'guardian' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="parent">Forelder</option>
                    <option value="guardian">Foresatt/verge</option>
                  </select>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">🔒 Sikkerhet:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• PIN-koden brukes for å godkjenne oppgaver og endre innstillinger</li>
                  <li>• Velg en PIN som er lett å huske, men vanskelig for barn å gjette</li>
                  <li>• Du kan endre PIN-koden senere i innstillingene</li>
                </ul>
              </div>
            </div>
          )}

          {/* Children Setup Step */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 mb-6">
                Legg til barna og andre familiemedlemmer som skal bruke appen.
              </p>

              <div className="space-y-4 mb-6">
                {children.map((child, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Familiemedlem {index + 1}
                      </h4>
                      <button
                        onClick={() => removeChild(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Fjern
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Navn
                        </label>
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => updateChild(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="f.eks. Emma"
                        />
                      </div>

                      {/* Age */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alder
                        </label>
                        <input
                          type="number"
                          min="3"
                          max="25"
                          value={child.age}
                          onChange={(e) => updateChild(index, 'age', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>

                      {/* Avatar */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Avatar
                        </label>
                        <div className="grid grid-cols-8 gap-1">
                          {avatars.map((avatar) => (
                            <button
                              key={avatar}
                              type="button"
                              onClick={() => updateChild(index, 'avatar', avatar)}
                              className={`p-2 text-xl rounded hover:bg-blue-100 transition-colors ${
                                child.avatar === avatar ? 'bg-blue-100 ring-2 ring-blue-300' : ''
                              }`}
                            >
                              {avatar}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addChild}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                + Legg til familiemedlem
              </button>

              {children.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    💡 Du kan legge til familiemedlemmer senere i administrasjonspanelet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Completion Step */}
          {currentStep === 4 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Gratulerer!
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Din familie er nå klar til å bruke Hjemmeplan. Du blir automatisk 
                sendt til oversikten om et øyeblikk.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-green-900 mb-3">Neste steg:</h3>
                <ul className="text-sm text-green-800 space-y-2 text-left">
                  <li>• Opprett oppgaver for familiemedlemmene</li>
                  <li>• Sett opp belønninger og mål</li>
                  <li>• Begynn å spore fremgang og feire suksesser!</li>
                </ul>
              </div>

              <div className="flex items-center justify-center mt-6 space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        {currentStep > 0 && currentStep < 4 && (
          <div className="bg-gray-50 px-6 py-4 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Tilbake
            </button>

            <button
              onClick={handleNext}
              disabled={isSubmitting || (currentStep === 1 && !familyData)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Oppretter...</span>
                </div>
              ) : currentStep === 3 ? (
                'Fullfør oppsett'
              ) : (
                'Neste →'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default InitialSetupWizard 