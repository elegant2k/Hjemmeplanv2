import React, { useEffect, useState } from 'react'

interface CelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  celebrationType: 'reward' | 'streak' | 'milestone' | 'achievement'
  title: string
  message: string
  points?: number
  icon?: string
  autoCloseDelay?: number
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  celebrationType,
  title,
  message,
  points,
  icon,
  autoCloseDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setShowConfetti(true)
      
      // Auto-close after delay
      const timer = setTimeout(() => {
        handleClose()
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      setShowConfetti(false)
    }
  }, [isOpen, autoCloseDelay])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      setShowConfetti(false)
      onClose()
    }, 300) // Wait for animation to complete
  }

  const getCelebrationConfig = () => {
    switch (celebrationType) {
      case 'reward':
        return {
          bgGradient: 'from-purple-400 via-pink-500 to-red-500',
          textColor: 'text-white',
          borderColor: 'border-purple-300',
          defaultIcon: '🎁',
          animation: 'animate-bounce'
        }
      case 'streak':
        return {
          bgGradient: 'from-orange-400 via-red-500 to-yellow-500',
          textColor: 'text-white',
          borderColor: 'border-orange-300',
          defaultIcon: '🔥',
          animation: 'animate-pulse'
        }
      case 'milestone':
        return {
          bgGradient: 'from-yellow-400 via-orange-500 to-red-500',
          textColor: 'text-white',
          borderColor: 'border-yellow-300',
          defaultIcon: '🏆',
          animation: 'animate-bounce'
        }
      case 'achievement':
        return {
          bgGradient: 'from-green-400 via-blue-500 to-purple-600',
          textColor: 'text-white',
          borderColor: 'border-green-300',
          defaultIcon: '⭐',
          animation: 'animate-pulse'
        }
      default:
        return {
          bgGradient: 'from-blue-400 via-purple-500 to-pink-500',
          textColor: 'text-white',
          borderColor: 'border-blue-300',
          defaultIcon: '🎉',
          animation: 'animate-bounce'
        }
    }
  }

  const config = getCelebrationConfig()
  const celebrationIcon = icon || config.defaultIcon

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      >
        {/* Modal */}
        <div 
          className={`relative bg-gradient-to-br ${config.bgGradient} rounded-3xl border-4 ${config.borderColor} shadow-2xl p-8 max-w-md mx-4 text-center transform transition-all duration-300 ${
            isVisible ? 'scale-100 rotate-0' : 'scale-50 rotate-12'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 bg-white opacity-80 animate-ping`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Celebration Icon */}
          <div className={`text-8xl mb-4 ${config.animation}`}>
            {celebrationIcon}
          </div>

          {/* Title */}
          <h2 className={`text-3xl font-bold mb-3 ${config.textColor} drop-shadow-lg`}>
            {title}
          </h2>

          {/* Message */}
          <p className={`text-lg mb-4 ${config.textColor} drop-shadow-md opacity-90`}>
            {message}
          </p>

          {/* Points awarded */}
          {points && points > 0 && (
            <div className={`mb-6 p-3 bg-white bg-opacity-20 rounded-xl border border-white border-opacity-30`}>
              <p className={`text-sm ${config.textColor} opacity-90 mb-1`}>Poeng tildelt:</p>
              <p className={`text-2xl font-bold ${config.textColor} drop-shadow-lg`}>
                +{points.toLocaleString()} 🎯
              </p>
            </div>
          )}

          {/* Motivational message */}
          <div className={`mb-6 p-3 bg-white bg-opacity-20 rounded-xl border border-white border-opacity-30`}>
            <p className={`text-sm ${config.textColor} italic drop-shadow-md`}>
              {celebrationType === 'reward' && "Du har jobbet hardt for dette! Nyt belønningen din! 🌟"}
              {celebrationType === 'streak' && "Fantastisk streak! Du er på rett vei! 🚀"}
              {celebrationType === 'milestone' && "En stor milepæl er nådd! Du er utrolig! 💪"}
              {celebrationType === 'achievement' && "Imponerende prestasjon! Fortsett det gode arbeidet! ✨"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleClose}
              className={`px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 ${config.textColor} font-semibold rounded-xl border border-white border-opacity-30 transition-all duration-200 hover:scale-105 backdrop-blur-sm drop-shadow-lg`}
            >
              🎉 Takk!
            </button>
            
            <button
              onClick={() => {
                // Share celebration functionality could be added here
                navigator.share && navigator.share({
                  title: 'Min prestasjon!',
                  text: `${title}: ${message}`,
                  url: window.location.href
                }).catch(err => console.log('Error sharing:', err))
              }}
              className={`px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 ${config.textColor} font-semibold rounded-xl border border-white border-opacity-30 transition-all duration-200 hover:scale-105 backdrop-blur-sm drop-shadow-lg`}
            >
              📸 Del
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className={`absolute top-4 right-4 w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 ${config.textColor} rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm`}
          >
            ✕
          </button>

          {/* Progress indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {Array.from({ length: Math.ceil(autoCloseDelay / 1000) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full bg-white bg-opacity-60 animate-pulse`}
                  style={{
                    animationDelay: `${i * 1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CelebrationModal 