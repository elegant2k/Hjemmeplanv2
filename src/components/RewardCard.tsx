import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import IconMap from '@/components/IconMap'
import { rewardService } from '@/services'
import type { Reward } from '@/models'

interface RewardCardProps {
  reward: Reward
  canAfford?: boolean
  userPoints?: number
  userAllowance?: number
  onEdit?: (reward: Reward) => void
  onDelete?: (rewardId: string) => void
  onRedeem?: (reward: Reward) => void
  onToggleActive?: (rewardId: string, isActive: boolean) => void
  isParent?: boolean
  showActions?: boolean
  compact?: boolean
}

const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  canAfford = true,
  userPoints = 0,
  userAllowance = 0,
  onEdit,
  onDelete,
  onRedeem,
  onToggleActive,
  isParent = false,
  showActions = true,
  compact = false
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const getCategoryIcon = (category: Reward['category']) => {
    switch (category) {
      case 'privilege': return 'trophy'
      case 'item': return 'gift'
      case 'activity': return 'target'
      case 'allowance': return 'dollar'
      default: return 'award'
    }
  }

  const getCategoryLabel = (category: Reward['category']) => {
    const labels = {
      privilege: 'Privilegium',
      item: 'Gjenstand',
      activity: 'Aktivitet',
      allowance: 'Ukelønn'
    }
    return labels[category]
  }

  const getCategoryColor = (category: Reward['category']) => {
    switch (category) {
      case 'privilege': return 'bg-purple-100 text-purple-800'
      case 'item': return 'bg-blue-100 text-blue-800'
      case 'activity': return 'bg-green-100 text-green-800'
      case 'allowance': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCost = () => {
    const costs = []
    if (reward.pointsCost > 0) {
      costs.push(`${reward.pointsCost} poeng`)
    }
    if (reward.allowanceCost && reward.allowanceCost > 0) {
      costs.push(`${reward.allowanceCost} kr`)
    }
    return costs.join(' + ') || 'Gratis'
  }

  const handleToggleActive = async () => {
    if (!onToggleActive) return
    
    setIsLoading(true)
    try {
      await rewardService.updateReward(reward.id, { isActive: !reward.isActive })
      onToggleActive(reward.id, !reward.isActive)
    } catch (error) {
      console.error('Failed to toggle reward active status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !confirm('Er du sikker på at du vil slette denne belønningen?')) return
    
    setIsLoading(true)
    try {
      await rewardService.deleteReward(reward.id)
      onDelete(reward.id)
    } catch (error) {
      console.error('Failed to delete reward:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeem = () => {
    if (onRedeem && canAfford) {
      onRedeem(reward)
    }
  }

  const canAffordPoints = userPoints >= reward.pointsCost
  const canAffordAllowance = !reward.allowanceCost || userAllowance >= reward.allowanceCost
  const isAffordable = canAffordPoints && canAffordAllowance

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date))
  }

  return (
    <Card className={`${compact ? 'p-3' : ''} ${!reward.isActive ? 'opacity-75' : ''} ${!isAffordable && !isParent ? 'opacity-50' : ''}`}>
      <CardHeader className={compact ? 'p-0 pb-2' : 'pb-2'}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center">
              <IconMap type={getCategoryIcon(reward.category)} size={compact ? 24 : 32} />
            </div>
            <div className="flex-1">
              <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
                {reward.title}
              </h3>
              {!compact && reward.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {reward.description}
                </p>
              )}
            </div>
          </div>
          
          {!reward.isActive && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              Inaktiv
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className={compact ? 'p-0' : 'pt-0'}>
        <div className="space-y-3">
          {/* Cost and category info */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(reward.category)}`}>
              {getCategoryLabel(reward.category)}
            </span>
            <span className="text-sm font-medium text-green-600">
              {formatCost()}
            </span>
          </div>

          {/* Affordability indicator for children */}
          {!isParent && (
            <div className="text-xs space-y-1">
              <div className={`flex items-center gap-1 ${canAffordPoints ? 'text-green-600' : 'text-red-600'}`}>
                <IconMap 
                  type={canAffordPoints ? 'complete' : 'rejected'} 
                  size={12} 
                  className={canAffordPoints ? 'text-green-600' : 'text-red-600'} 
                />
                <span>Poeng: {userPoints}/{reward.pointsCost}</span>
              </div>
              {reward.allowanceCost && (
                <div className={`flex items-center gap-1 ${canAffordAllowance ? 'text-green-600' : 'text-red-600'}`}>
                  <IconMap 
                    type={canAffordAllowance ? 'complete' : 'rejected'} 
                    size={12} 
                    className={canAffordAllowance ? 'text-green-600' : 'text-red-600'} 
                  />
                  <span>Ukelønn: {userAllowance}/{reward.allowanceCost} kr</span>
                </div>
              )}
            </div>
          )}

          {/* Creation info */}
          {!compact && (
            <div className="text-xs text-gray-500">
              Opprettet {formatDate(reward.createdAt)}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              {/* Child actions */}
              {!isParent && reward.isActive && (
                <Button
                  onClick={handleRedeem}
                  disabled={!isAffordable || isLoading}
                  className={`flex-1 ${isAffordable ? '' : 'opacity-50 cursor-not-allowed'}`}
                  size="sm"
                >
                  {isAffordable ? 'Hent Belønning' : 'Ikke råd'}
                </Button>
              )}

              {/* Parent actions */}
              {isParent && (
                <>
                  <Button
                    onClick={() => onEdit?.(reward)}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    Rediger
                  </Button>
                  
                  <Button
                    onClick={handleToggleActive}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className={reward.isActive ? 'text-orange-600' : 'text-green-600'}
                  >
                    {reward.isActive ? 'Deaktiver' : 'Aktiver'}
                  </Button>
                  
                  <Button
                    onClick={handleDelete}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Slett
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default RewardCard 