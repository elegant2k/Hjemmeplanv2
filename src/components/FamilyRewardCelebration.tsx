import React, { useEffect, useState } from 'react'

interface FamilyRewardCelebrationProps {
  isVisible: boolean
  goalTitle: string
  rewardDescription: string
  pointsEarned: number
  participantCount: number
  onComplete: () => void
  autoCloseDelay?: number
}

const FamilyRewardCelebration: React.FC<FamilyRewardCelebrationProps> = ({
  isVisible,
  goalTitle,
  rewardDescription,
  pointsEarned,
  participantCount,
  onComplete,
  autoCloseDelay = 5000
}) => {
  const [animationPhase, setAnimationPhase] = useState<'entrance' | 'display' | 'exit'>('entrance')

  useEffect(() => {
    if (!isVisible) return

    const phases = [
      { phase: 'entrance', duration: 800 },
      { phase: 'display', duration: autoCloseDelay - 1600 },
      { phase: 'exit', duration: 800 }
    ]

    let timeoutId: number

    const runPhase = (index: number) => {
      if (index >= phases.length) {
        onComplete()
        return
      }

      const currentPhase = phases[index]
      setAnimationPhase(currentPhase.phase as any)

      timeoutId = setTimeout(() => {
        runPhase(index + 1)
      }, currentPhase.duration)
    }

    runPhase(0)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isVisible, autoCloseDelay, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          animationPhase === 'entrance' ? 'opacity-0' : 
          animationPhase === 'display' ? 'opacity-60' : 
          'opacity-0'
        }`}
      />

      {/* Main celebration content */}
      <div className={`relative z-10 max-w-md mx-4 transition-all duration-700 ${
        animationPhase === 'entrance' ? 'scale-50 opacity-0 rotate-12' :
        animationPhase === 'display' ? 'scale-100 opacity-100 rotate-0' :
        'scale-110 opacity-0 -rotate-6'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with animated background */}
          <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-6 text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-90 animate-pulse"></div>
            
            {/* Floating celebration icons */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute text-2xl animate-bounce`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  {['🎉', '🎊', '⭐', '🏆', '🎁', '✨'][i % 6]}
                </div>
              ))}
            </div>

            <div className="relative z-10 text-center">
              <div className="text-4xl mb-2 animate-bounce">🏆</div>
              <h2 className="text-xl font-bold mb-1">Familiebelønning hentet!</h2>
              <p className="text-yellow-100 text-sm">Gratulerer med denne prestasjonen!</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
            {/* Goal Title */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                "{goalTitle}"
              </h3>
              <div className="text-sm text-gray-600">
                Målet er nådd!
              </div>
            </div>

            {/* Reward Description */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎁</span>
                <div>
                  <div className="font-medium text-yellow-900">Din belønning:</div>
                  <div className="text-yellow-800">{rewardDescription}</div>
                </div>
              </div>
            </div>

            {/* Achievement Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {pointsEarned.toLocaleString('nb-NO')}
                </div>
                <div className="text-xs text-blue-800">Familiepoeng opptjent</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">{participantCount}</div>
                <div className="text-xs text-green-800">Deltakere involvert</div>
              </div>
            </div>

            {/* Action Message */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-3">
                🎊 Hele familien har jobbet sammen for å nå dette målet!
              </div>
              
              {/* Progress indication */}
              <div className="flex justify-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                      animationPhase === 'display' ? 'bg-yellow-400' : 'bg-gray-300'
                    }`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Auto-close progress bar */}
          {animationPhase === 'display' && (
            <div className="h-1 bg-gray-200">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all ease-linear"
                style={{ 
                  width: '100%',
                  animation: `shrink ${autoCloseDelay - 1600}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Celebration particles */}
      <div className="absolute inset-0 pointer-events-none">
        {animationPhase === 'display' && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          >
            <div className="w-2 h-2 bg-yellow-400 rounded-full opacity-60"></div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `
      }} />
    </div>
  )
}

export default FamilyRewardCelebration 