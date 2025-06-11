import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { rewardService } from '@/services'
import { useUser } from '@/contexts/UserContext'
import type { Reward } from '@/models'

interface RewardFormProps {
  reward?: Reward
  onSuccess?: (reward: Reward) => void
  onCancel?: () => void
  isDialog?: boolean
}

interface FormData {
  title: string
  description: string
  pointsCost: number
  allowanceCost: number
  category: Reward['category']
  isActive: boolean
  allowanceEnabled: boolean
}

const categoryLabels: Record<Reward['category'], string> = {
  privilege: 'Privilegium',
  item: 'Gjenstand',
  activity: 'Aktivitet',
  allowance: 'Ukelønn'
}

const categoryDescriptions: Record<Reward['category'], string> = {
  privilege: 'Ekstra tid med TV, senere leggetid, etc.',
  item: 'Leker, bøker, eller andre fysiske gjenstander',
  activity: 'Spesielle aktiviteter eller utflukter',
  allowance: 'Ekstra ukelønn eller bonuser'
}

const RewardForm: React.FC<RewardFormProps> = ({
  reward,
  onSuccess,
  onCancel,
  isDialog = false
}) => {
  const { currentFamily, currentUser } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: reward?.title || '',
    description: reward?.description || '',
    pointsCost: reward?.pointsCost || 100,
    allowanceCost: reward?.allowanceCost || 0,
    category: reward?.category || 'privilege',
    isActive: reward?.isActive ?? true,
    allowanceEnabled: !!reward?.allowanceCost
  })

  const [previewCost, setPreviewCost] = useState<string>('')

  useEffect(() => {
    // Update preview cost when form data changes
    const costs = []
    if (formData.pointsCost > 0) {
      costs.push(`${formData.pointsCost} poeng`)
    }
    if (formData.allowanceEnabled && formData.allowanceCost > 0) {
      costs.push(`${formData.allowanceCost} kr`)
    }
    setPreviewCost(costs.join(' + ') || 'Gratis')
  }, [formData.pointsCost, formData.allowanceCost, formData.allowanceEnabled])

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentFamily || !currentUser) {
      setError('Familie eller bruker ikke funnet')
      return
    }

    if (!formData.title.trim()) {
      setError('Tittel er påkrevd')
      return
    }

    if (formData.pointsCost < 0) {
      setError('Poengkostnad kan ikke være negativ')
      return
    }

    if (formData.allowanceEnabled && formData.allowanceCost < 0) {
      setError('Ukelønnskostnad kan ikke være negativ')
      return
    }

    if (formData.pointsCost === 0 && (!formData.allowanceEnabled || formData.allowanceCost === 0)) {
      setError('Belønningen må koste minst noe (poeng eller ukelønn)')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let result: Reward

      const rewardData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        pointsCost: formData.pointsCost,
        allowanceCost: formData.allowanceEnabled ? formData.allowanceCost : undefined,
        category: formData.category,
        isActive: formData.isActive,
        familyId: currentFamily.id,
        createdBy: currentUser.id
      }

      if (reward) {
        result = await rewardService.updateReward(reward.id, rewardData) as Reward
      } else {
        result = await rewardService.createReward(rewardData)
      }

      onSuccess?.(result)
    } catch (err: any) {
      console.error('Failed to save reward:', err)
      setError(err.message || 'Kunne ikke lagre belønning')
    } finally {
      setIsLoading(false)
    }
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

  const ContainerComponent = isDialog ? 'div' : Card

  return (
    <ContainerComponent className={isDialog ? '' : 'w-full max-w-2xl mx-auto'}>
      {!isDialog && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {reward ? 'Rediger Belønning' : 'Ny Belønning'}
            <span className="text-2xl">{getCategoryIcon(formData.category)}</span>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={isDialog ? 'p-0' : ''}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{getCategoryIcon(formData.category)}</span>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {formData.title || 'Belønningstittel...'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.description || 'Beskrivelse...'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formData.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {categoryLabels[formData.category]}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {previewCost}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Tittel *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="F.eks. Extra TV-tid i 30 min"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Beskrivelse
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detaljert beskrivelse av belønningen..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value as Reward['category'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {getCategoryIcon(value as Reward['category'])} {label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {categoryDescriptions[formData.category]}
              </p>
            </div>
          </div>

          {/* Cost Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Kostnad</h4>
            
            <div>
              <label htmlFor="pointsCost" className="block text-sm font-medium text-gray-700 mb-1">
                Poeng
              </label>
              <input
                id="pointsCost"
                type="number"
                min="0"
                step="10"
                value={formData.pointsCost}
                onChange={(e) => handleInputChange('pointsCost', parseInt(e.target.value) || 0)}
                placeholder="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Hvor mange poeng kreves for denne belønningen
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="allowanceEnabled" className="text-sm font-medium text-gray-700">
                  Inkluder ukelønnskostnad
                </label>
                <input
                  id="allowanceEnabled"
                  type="checkbox"
                  checked={formData.allowanceEnabled}
                  onChange={(e) => handleInputChange('allowanceEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              {formData.allowanceEnabled && (
                <div>
                  <input
                    id="allowanceCost"
                    type="number"
                    min="0"
                    step="5"
                    value={formData.allowanceCost}
                    onChange={(e) => handleInputChange('allowanceCost', parseInt(e.target.value) || 0)}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ekstra kr som trekkes fra ukelønn
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Innstillinger</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Aktiv belønning
                </label>
                <p className="text-xs text-gray-500">
                  Kun aktive belønninger kan hentes av familien
                </p>
              </div>
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Avbryt
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Lagrer...' : reward ? 'Oppdater Belønning' : 'Opprett Belønning'}
            </Button>
          </div>
        </form>
      </CardContent>
    </ContainerComponent>
  )
}

export default RewardForm 