import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RewardCard from './RewardCard'
import EmptyState from './EmptyState'
import { rewardService } from '@/services'
import { useUser } from '@/contexts/UserContext'
import type { Reward } from '@/models'

interface RewardListProps {
  onCreateReward?: () => void
  onEditReward?: (reward: Reward) => void
  showCreateButton?: boolean
  compact?: boolean
  category?: Reward['category']
  isParent?: boolean
  userPoints?: number
  userAllowance?: number
}

interface UserProgress {
  totalPoints: number
  availablePoints: number
  totalAllowance: number
  availableAllowance: number
}

const RewardList: React.FC<RewardListProps> = ({
  onCreateReward,
  onEditReward,
  showCreateButton = true,
  compact = false,
  category,
  isParent = false,
  userPoints,
  userAllowance
}) => {
  const { currentFamily, currentUser } = useUser()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'affordable'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'cost-low' | 'cost-high' | 'category'>('newest')

  useEffect(() => {
    loadRewards()
    if (!isParent && currentUser && currentFamily) {
      loadUserProgress()
    }
  }, [currentFamily, currentUser, isParent])

  const loadRewards = async () => {
    if (!currentFamily) return

    try {
      setIsLoading(true)
      const familyRewards = await rewardService.getRewardsByFamily(currentFamily.id)
      setRewards(familyRewards)
    } catch (err: any) {
      console.error('Failed to load rewards:', err)
      setError('Kunne ikke laste belønninger')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProgress = async () => {
    if (!currentUser || !currentFamily) return

    try {
      const progress = await rewardService.getUserProgress(currentUser.id, currentFamily.id)
      setUserProgress(progress)
    } catch (err: any) {
      console.error('Failed to load user progress:', err)
    }
  }

  const handleRewardUpdate = (rewardId: string, isActive: boolean) => {
    setRewards(prev => 
      prev.map(reward => 
        reward.id === rewardId 
          ? { ...reward, isActive }
          : reward
      )
    )
  }

  const handleRewardDelete = (rewardId: string) => {
    setRewards(prev => prev.filter(reward => reward.id !== rewardId))
  }

  const handleRewardRedeem = async (reward: Reward) => {
    if (!currentUser) return

    try {
      await rewardService.redeemReward(currentUser.id, reward.id)
      // Reload user progress to update available points/allowance
      await loadUserProgress()
      alert(`🎉 Du har hentet belønningen: ${reward.title}!`)
    } catch (err: any) {
      console.error('Failed to redeem reward:', err)
      alert('Kunne ikke hente belønning: ' + err.message)
    }
  }

  const getFilteredAndSortedRewards = () => {
    let filtered = rewards

    // Apply category filter if specified
    if (category) {
      filtered = filtered.filter(reward => reward.category === category)
    }

    // Apply availability filter
    if (filter === 'available') {
      filtered = filtered.filter(reward => reward.isActive)
    } else if (filter === 'affordable' && userProgress) {
      filtered = filtered.filter(reward => {
        const canAffordPoints = userProgress.availablePoints >= reward.pointsCost
        const canAffordAllowance = !reward.allowanceCost || userProgress.availableAllowance >= reward.allowanceCost
        return reward.isActive && canAffordPoints && canAffordAllowance
      })
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'cost-low':
          return a.pointsCost - b.pointsCost
        case 'cost-high':
          return b.pointsCost - a.pointsCost
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

    return sorted
  }

  const getFilterOptions = () => {
    const options = [
      { value: 'all', label: 'Alle', count: rewards.length },
      { value: 'available', label: 'Tilgjengelige', count: rewards.filter(r => r.isActive).length }
    ]

    if (!isParent && userProgress) {
      const affordable = rewards.filter(reward => {
        const canAffordPoints = userProgress.availablePoints >= reward.pointsCost
        const canAffordAllowance = !reward.allowanceCost || userProgress.availableAllowance >= reward.allowanceCost
        return reward.isActive && canAffordPoints && canAffordAllowance
      }).length
      
      options.push({ value: 'affordable', label: 'Har råd til', count: affordable })
    }

    return options
  }

  const getCategoryIcon = (category: Reward['category']) => {
    switch (category) {
      case 'privilege': return '👑'
      case 'item': return '🎁'
      case 'activity': return '🎯'
      case 'allowance': return '💰'
      default: return '🏆'
    }
  }

  const groupedRewards = getFilteredAndSortedRewards()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">Laster belønninger...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadRewards} variant="outline">
              Prøv igjen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      {!compact && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                Belønninger
                {category && (
                  <span className="text-lg">
                    {getCategoryIcon(category)}
                  </span>
                )}
              </CardTitle>
              {showCreateButton && isParent && (
                <Button onClick={onCreateReward}>
                  Ny Belønning
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {/* User progress display for children */}
            {!isParent && userProgress && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Dine poeng</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Tilgjengelige poeng:</span>
                    <span className="font-medium ml-2">{userProgress.availablePoints}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Tilgjengelig ukelønn:</span>
                    <span className="font-medium ml-2">{userProgress.availableAllowance} kr</span>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and sorting */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Filter tabs */}
              <div className="flex gap-1">
                {getFilterOptions().map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value as any)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      filter === option.value
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>

              {/* Sort options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Nyeste først</option>
                <option value="cost-low">Lavest kostnad</option>
                <option value="cost-high">Høyest kostnad</option>
                <option value="category">Etter kategori</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards grid */}
      {groupedRewards.length === 0 ? (
        <EmptyState
          type="tasks"
          title="Ingen belønninger funnet"
          description={
            filter === 'affordable' 
              ? "Du har ikke råd til noen belønninger akkurat nå. Fullfør flere oppgaver for å tjene mer!"
              : filter === 'available'
              ? "Ingen aktive belønninger er tilgjengelige."
              : "Denne familien har ingen belønninger ennå."
          }
          icon="🏆"
          action={
            showCreateButton && isParent ? {
              label: "Opprett første belønning",
              onClick: () => onCreateReward?.()
            } : undefined
          }
        />
      ) : (
        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {groupedRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              canAfford={
                userProgress
                  ? userProgress.availablePoints >= reward.pointsCost &&
                    (!reward.allowanceCost || userProgress.availableAllowance >= reward.allowanceCost)
                  : true
              }
              userPoints={userProgress?.availablePoints || userPoints || 0}
              userAllowance={userProgress?.availableAllowance || userAllowance || 0}
              onEdit={onEditReward}
              onDelete={handleRewardDelete}
              onRedeem={handleRewardRedeem}
              onToggleActive={handleRewardUpdate}
              isParent={isParent}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RewardList 