import React, { useState, useRef, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'

interface PINEntryDialogProps {
  isOpen: boolean
  onPINVerified: () => void
  onCancel: () => void
  title?: string
  subtitle?: string
  maxAttempts?: number
}

const PINEntryDialog: React.FC<PINEntryDialogProps> = ({
  isOpen,
  onPINVerified,
  onCancel,
  title = 'Foreldretilgang kreves',
  subtitle = 'Skriv inn PIN-kode for å fortsette',
  maxAttempts = 3
}) => {
  const { currentUser } = useUser()
  const [pin, setPIN] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeLeft, setBlockTimeLeft] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const PIN_LENGTH = 4
  const BLOCK_DURATION = 60 // seconds

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPIN('')
      setError('')
      setAttempts(0)
      setIsBlocked(false)
      setBlockTimeLeft(0)
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [isOpen])

  // Block timer countdown
  useEffect(() => {
    let interval: number
    if (isBlocked && blockTimeLeft > 0) {
      interval = setInterval(() => {
        setBlockTimeLeft(prev => {
          if (prev <= 1) {
            setIsBlocked(false)
            setAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isBlocked, blockTimeLeft])

  // Handle PIN input change
  const handlePINChange = (index: number, value: string) => {
    if (isBlocked || isVerifying) return

    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newPIN = pin.split('')
    newPIN[index] = value
    const updatedPIN = newPIN.join('').slice(0, PIN_LENGTH)
    setPIN(updatedPIN)

    // Auto-focus next input
    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when PIN is complete
    if (updatedPIN.length === PIN_LENGTH) {
      setTimeout(() => verifyPIN(updatedPIN), 100)
    }
  }

  // Handle key events
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (isBlocked || isVerifying) return

    if (e.key === 'Backspace') {
      e.preventDefault()
      const newPIN = pin.split('')
      
      if (newPIN[index]) {
        // Clear current digit
        newPIN[index] = ''
      } else if (index > 0) {
        // Move to previous digit and clear it
        newPIN[index - 1] = ''
        inputRefs.current[index - 1]?.focus()
      }
      
      setPIN(newPIN.join(''))
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    } else if (e.key === 'Enter' && pin.length === PIN_LENGTH) {
      verifyPIN(pin)
    }
  }

  // Verify PIN against current user
  const verifyPIN = async (pinToVerify: string) => {
    if (!currentUser || !currentUser.pin || isBlocked) return

    setIsVerifying(true)
    setError('')

    try {
      // Simulate verification delay for security
      await new Promise(resolve => setTimeout(resolve, 500))

      if (pinToVerify === currentUser.pin) {
        onPINVerified()
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        
        if (newAttempts >= maxAttempts) {
          setIsBlocked(true)
          setBlockTimeLeft(BLOCK_DURATION)
          setError(`For mange feil forsøk. Prøv igjen om ${BLOCK_DURATION} sekunder.`)
        } else {
          setError(`Feil PIN-kode. ${maxAttempts - newAttempts} forsøk igjen.`)
        }
        
        // Clear PIN
        setPIN('')
        setTimeout(() => {
          inputRefs.current[0]?.focus()
        }, 100)
      }
    } catch (error) {
      console.error('PIN verification error:', error)
      setError('En feil oppstod under verifikasjon.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
    if (pastedData.length > 0) {
      setPIN(pastedData)
      if (pastedData.length === PIN_LENGTH) {
        setTimeout(() => verifyPIN(pastedData), 100)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel} />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>

        {/* PIN Input */}
        <div className="mb-6">
          <div className="flex space-x-3 justify-center mb-4" onPaste={handlePaste}>
            {Array.from({ length: PIN_LENGTH }).map((_, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="password"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={pin[index] || ''}
                onChange={e => handlePINChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                disabled={isBlocked || isVerifying}
                className={`w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg transition-colors ${
                  isBlocked ? 'bg-red-50 border-red-300 text-red-500' :
                  error ? 'border-red-300 focus:border-red-500' :
                  'border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                autoComplete="off"
              />
            ))}
          </div>

          {/* Progress indicators */}
          <div className="flex space-x-1 justify-center mb-4">
            {Array.from({ length: PIN_LENGTH }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  pin[index] ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Block Timer */}
        {isBlocked && blockTimeLeft > 0 && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-orange-500">⏰</span>
              <p className="text-sm text-orange-800">
                Blokkert i {blockTimeLeft} sekunder
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isVerifying && (
          <div className="mb-4 flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Verifiserer...</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={isVerifying}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            onClick={() => pin.length === PIN_LENGTH && verifyPIN(pin)}
            disabled={pin.length !== PIN_LENGTH || isBlocked || isVerifying}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifiserer...' : 'Bekreft'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Bare foreldre med PIN-kode kan få tilgang til administrasjon
          </p>
        </div>
      </div>
    </div>
  )
}

export default PINEntryDialog 