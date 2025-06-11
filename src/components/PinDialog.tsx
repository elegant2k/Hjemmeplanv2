import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { IconMap } from '@/components/IconMap'
import { useUser } from '@/contexts/UserContext'

interface PinDialogProps {
  isOpen: boolean
  userName: string
  onSuccess: () => void
  onCancel: () => void
  maxAttempts?: number
}

const PinDialog: React.FC<PinDialogProps> = ({
  isOpen,
  userName,
  onSuccess,
  onCancel,
  maxAttempts = 3
}) => {
  const [pin, setPin] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { authenticateParent } = useUser()

  const numpadButtons = [
    '1', '2', '3',
    '4', '5', '6', 
    '7', '8', '9',
    '🔄', '0', '⌫'
  ]

  useEffect(() => {
    if (isOpen) {
      setPin('')
      setError('')
      setAttempts(0)
    }
  }, [isOpen])

  const handleNumberClick = (value: string) => {
    if (isLoading) return

    if (value === '⌫') {
      setPin(prev => prev.slice(0, -1))
      setError('')
    } else if (value === '🔄') {
      setPin('')
      setError('')
    } else if (value.match(/\d/) && pin.length < 4) {
      const newPin = pin + value
      setPin(newPin)
      setError('')
      
      // Auto-verify when 4 digits are entered
      if (newPin.length === 4) {
        verifyPin(newPin)
      }
    }
  }

  const verifyPin = async (pinToVerify: string) => {
    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    if (authenticateParent(pinToVerify)) {
      setIsLoading(false)
      onSuccess()
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPin('')
      setIsLoading(false)

      if (newAttempts >= maxAttempts) {
        setError(`For mange forsøk. Prøv igjen senere.`)
        setTimeout(() => {
          onCancel()
        }, 2000)
      } else {
        setError(`Feil PIN. ${maxAttempts - newAttempts} forsøk igjen.`)
      }
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key >= '0' && event.key <= '9') {
      handleNumberClick(event.key)
    } else if (event.key === 'Backspace') {
      handleNumberClick('⌫')
    } else if (event.key === 'Enter' && pin.length === 4) {
      verifyPin(pin)
    } else if (event.key === 'Escape') {
      onCancel()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6"
        onKeyDown={handleKeyPress}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconMap type="lock" size={32} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Skriv inn PIN
          </h2>
          <p className="text-gray-600">
            Logg inn som <span className="font-medium">{userName}</span>
          </p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center space-x-3 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                'w-4 h-4 rounded-full border-2 transition-all',
                index < pin.length 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'border-gray-300',
                isLoading && index < pin.length && 'animate-pulse'
              )}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center space-x-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Verifiserer...</span>
            </div>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {numpadButtons.map((button) => (
            <button
              key={button}
              onClick={() => handleNumberClick(button)}
              disabled={isLoading || (attempts >= maxAttempts)}
              className={cn(
                'h-12 rounded-lg font-semibold text-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500',
                button === '🔄' || button === '⌫'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200',
                (isLoading || (attempts >= maxAttempts)) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {button}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            onClick={() => verifyPin(pin)}
            disabled={pin.length !== 4 || isLoading || (attempts >= maxAttempts)}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Venter...' : 'Logg inn'}
          </button>
        </div>

        {/* Help text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Demo PIN: 1234 • {attempts}/{maxAttempts} forsøk brukt
          </p>
        </div>
      </div>
    </div>
  )
}

export default PinDialog