import React from 'react'
import { useUser } from '@/contexts/UserContext'
import { userService } from '@/services/userService'
import type { FamilyActivity } from '@/models'

interface ParticipationTrackerProps {
  activity: FamilyActivity
  participants: string[] // User IDs
  onParticipantsChange?: (participants: string[]) => void
  editable?: boolean
  showAvatars?: boolean
  maxDisplay?: number
  className?: string
}

const ParticipationTracker: React.FC<ParticipationTrackerProps> = ({
  activity,
  participants,
  onParticipantsChange,
  editable = false,
  showAvatars = true,
  maxDisplay = 4,
  className = ''
}) => {
  const { currentUser } = useUser()
  const [familyMembers, setFamilyMembers] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Load family members
  React.useEffect(() => {
    const loadFamilyMembers = async () => {
      if (!currentUser?.familyId) return

      try {
        setIsLoading(true)
        const members = await userService.getUsersByFamily(currentUser.familyId)
        setFamilyMembers(members)
      } catch (error) {
        console.error('Error loading family members:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFamilyMembers()
  }, [currentUser?.familyId])

  // Get participant details
  const participantDetails = participants
    .map(participantId => familyMembers.find(member => member.id === participantId))
    .filter(Boolean)

  // Toggle participant
  const toggleParticipant = (userId: string) => {
    if (!editable || !onParticipantsChange) return

    const newParticipants = participants.includes(userId)
      ? participants.filter(id => id !== userId)
      : [...participants, userId]
    
    onParticipantsChange(newParticipants)
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className={`participation-tracker ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-pulse flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-gray-200 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`participation-tracker ${className}`}>
      <div className="flex items-center justify-between">
        {/* Participant Avatars */}
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-1 overflow-hidden">
            {participantDetails.slice(0, maxDisplay).map((participant, index) => (
              <div
                key={participant.id}
                className={`relative inline-block h-8 w-8 rounded-full ring-2 ring-white ${
                  editable ? 'cursor-pointer hover:ring-blue-300' : ''
                }`}
                onClick={() => editable && toggleParticipant(participant.id)}
                title={participant.name}
                style={{ zIndex: maxDisplay - index }}
              >
                {showAvatars && participant.avatar ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover"
                    src={participant.avatar}
                    alt={participant.name}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                    {getInitials(participant.name)}
                  </div>
                )}
                
                {/* Participation Status Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-400"></div>
              </div>
            ))}

            {/* Show overflow count */}
            {participantDetails.length > maxDisplay && (
              <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                +{participantDetails.length - maxDisplay}
              </div>
            )}
          </div>

          {/* Participant Count */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">{participantDetails.length}</span>
            {familyMembers.length > 0 && (
              <span className="text-gray-400"> / {familyMembers.length}</span>
            )}
            <span className="ml-1">deltakere</span>
          </div>
        </div>

        {/* Edit Mode Selector */}
        {editable && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Velg deltakere:</span>
            <div className="flex flex-wrap gap-1">
              {familyMembers.map(member => {
                const isParticipating = participants.includes(member.id)
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleParticipant(member.id)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      isParticipating
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {isParticipating ? '✓' : '+'} {member.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Participant Names (when not showing avatars or in compact mode) */}
      {!showAvatars && participantDetails.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          <strong>Deltakere:</strong> {participantDetails.map(p => p.name).join(', ')}
        </div>
      )}

      {/* No participants message */}
      {participantDetails.length === 0 && (
        <div className="text-sm text-gray-500 italic">
          Ingen deltakere registrert
        </div>
      )}
    </div>
  )
}

export default ParticipationTracker 