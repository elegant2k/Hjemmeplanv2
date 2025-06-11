import React, { useState, useEffect } from 'react'
import { useCelebrations } from '@/hooks/useCelebrations'
import CelebrationModal from './CelebrationModal'
import type { CelebrationEvent } from '@/services/rewardClaimingService'

interface CelebrationManagerProps {
  children: React.ReactNode
}

const CelebrationManager: React.FC<CelebrationManagerProps> = ({ children }) => {
  const { 
    pendingCelebrations, 
    markCelebrationShown,
    checkStreakMilestones 
  } = useCelebrations()
  
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationEvent | null>(null)
  const [celebrationQueue, setCelebrationQueue] = useState<CelebrationEvent[]>([])
  const [isShowingCelebration, setIsShowingCelebration] = useState(false)

  // Update celebration queue when pending celebrations change
  useEffect(() => {
    setCelebrationQueue(pendingCelebrations)
  }, [pendingCelebrations])

  // Auto-trigger next celebration when queue changes and no celebration is currently showing
  useEffect(() => {
    if (celebrationQueue.length > 0 && !isShowingCelebration && !currentCelebration) {
      showNextCelebration()
    }
  }, [celebrationQueue, isShowingCelebration, currentCelebration])

  // Check for streak milestones periodically
  useEffect(() => {
    const checkMilestones = async () => {
      try {
        await checkStreakMilestones()
      } catch (error) {
        console.error('Error checking milestones:', error)
      }
    }

    // Check immediately and then every 5 minutes
    checkMilestones()
    const interval = setInterval(checkMilestones, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [checkStreakMilestones])

  const showNextCelebration = () => {
    if (celebrationQueue.length > 0) {
      const nextCelebration = celebrationQueue[0]
      setCurrentCelebration(nextCelebration)
      setIsShowingCelebration(true)
      
      // Remove from queue
      setCelebrationQueue(prev => prev.slice(1))
    }
  }

  const handleCelebrationClose = async () => {
    if (currentCelebration) {
      try {
        await markCelebrationShown(currentCelebration.id)
      } catch (error) {
        console.error('Error marking celebration as shown:', error)
      }
    }
    
    setIsShowingCelebration(false)
    setCurrentCelebration(null)
    
    // Show next celebration after a short delay
    setTimeout(() => {
      showNextCelebration()
    }, 1000)
  }

  // Trigger celebration manually (can be called from other components)
  const triggerCelebration = (celebration: CelebrationEvent) => {
    setCelebrationQueue(prev => [...prev, celebration])
  }

  // Expose trigger function globally for other components to use
  useEffect(() => {
    // @ts-ignore - Adding to window for global access
    window.triggerCelebration = triggerCelebration
    
    return () => {
      // @ts-ignore - Cleanup
      delete window.triggerCelebration
    }
  }, [])

  return (
    <>
      {children}
      
      {/* Celebration Modal */}
      {currentCelebration && (
        <CelebrationModal
          isOpen={isShowingCelebration}
          onClose={handleCelebrationClose}
          celebrationType={currentCelebration.type}
          title={currentCelebration.title}
          message={currentCelebration.message}
          points={currentCelebration.points}
          icon={currentCelebration.icon}
          autoCloseDelay={6000} // 6 seconds auto-close
        />
      )}
      
      {/* Queue indicator (for debugging - can be removed in production) */}
      {import.meta.env.DEV && celebrationQueue.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-40">
          🎉 {celebrationQueue.length} feiring{celebrationQueue.length !== 1 ? 'er' : ''} i kø
        </div>
      )}
    </>
  )
}

export default CelebrationManager

// Global type definition for the window object
declare global {
  interface Window {
    triggerCelebration?: (celebration: CelebrationEvent) => void
  }
} 