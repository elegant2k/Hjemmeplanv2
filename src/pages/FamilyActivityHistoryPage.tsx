import React, { useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useFamilyPoints } from '@/hooks/useFamilyPoints'
import FamilyActivityHistory from '@/components/FamilyActivityHistory'
import FamilyPointsDisplay from '@/components/FamilyPointsDisplay'
import ParticipationTracker from '@/components/ParticipationTracker'
import { userService } from '@/services/userService'

const FamilyActivityHistoryPage: React.FC = () => {
  const { currentUser } = useUser()
  const { familyActivities } = useFamilyPoints()
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  // Load family members for participation analysis
  React.useEffect(() => {
    const loadFamilyMembers = async () => {
      if (!currentUser?.familyId) return

      try {
        setIsLoadingMembers(true)
        const members = await userService.getUsersByFamily(currentUser.familyId)
        setFamilyMembers(members)
      } catch (error) {
        console.error('Error loading family members:', error)
      } finally {
        setIsLoadingMembers(false)
      }
    }

    loadFamilyMembers()
  }, [currentUser?.familyId])

  // Calculate participation statistics
  const getParticipationStats = () => {
    if (!familyActivities || !familyMembers.length) return null

    const stats = familyMembers.map(member => {
      const participationCount = familyActivities.filter(activity =>
        activity.participants.includes(member.id)
      ).length

      const totalPointsEarned = familyActivities
        .filter(activity => activity.participants.includes(member.id))
        .reduce((sum, activity) => sum + activity.pointsEarned, 0)

      return {
        member,
        participationCount,
        totalPointsEarned,
        participationRate: familyActivities.length > 0 
          ? (participationCount / familyActivities.length) * 100 
          : 0
      }
    })

    return stats.sort((a, b) => b.participationCount - a.participationCount)
  }

  const participationStats = getParticipationStats()

  // Calculate recent activity trends
  const getRecentTrends = () => {
    if (!familyActivities || familyActivities.length === 0) return null

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const thisWeek = familyActivities.filter(activity => 
      new Date(activity.completedAt) >= weekAgo
    )

    const thisMonth = familyActivities.filter(activity => 
      new Date(activity.completedAt) >= monthAgo
    )

    return {
      thisWeek: {
        count: thisWeek.length,
        points: thisWeek.reduce((sum, activity) => sum + activity.pointsEarned, 0)
      },
      thisMonth: {
        count: thisMonth.length,
        points: thisMonth.reduce((sum, activity) => sum + activity.pointsEarned, 0)
      },
      total: {
        count: familyActivities.length,
        points: familyActivities.reduce((sum, activity) => sum + activity.pointsEarned, 0)
      }
    }
  }

  const trends = getRecentTrends()

  return (
    <div className="family-activity-history-page">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Familieaktiviteter
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Historikk og deltakelse i familieaktiviteter
              </p>
            </div>
            
            {/* Quick Stats */}
            {trends && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900">{trends.thisWeek.count}</div>
                  <div className="text-xs text-gray-500">Denne uken</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900">{trends.thisMonth.count}</div>
                  <div className="text-xs text-gray-500">Denne måneden</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900">{trends.total.count}</div>
                  <div className="text-xs text-gray-500">Totalt</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Activity History */}
          <div className="lg:col-span-2">
            <FamilyActivityHistory 
              maxItems={50}
              showPointsTotal={true}
              className="bg-white border border-gray-200 rounded-lg p-6"
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Family Points Display */}
            <FamilyPointsDisplay className="bg-white border border-gray-200 rounded-lg p-6" />

            {/* Participation Statistics */}
            {participationStats && participationStats.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Deltakelsesstatistikk
                </h3>
                
                <div className="space-y-4">
                  {participationStats.map((stat) => (
                    <div key={stat.member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {stat.member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {stat.member.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {stat.participationCount} aktiviteter
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">
                          {stat.totalPointsEarned} ⭐
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(stat.participationRate)}% deltakelse
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Participation Rate Chart */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Deltakelsesrate</h4>
                  <div className="space-y-2">
                    {participationStats.map((stat) => (
                      <div key={stat.member.id} className="flex items-center space-x-2">
                        <div className="text-xs text-gray-600 w-20 truncate">
                          {stat.member.name}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(stat.participationRate, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 w-10 text-right">
                          {Math.round(stat.participationRate)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Activity Trends */}
            {trends && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Aktivitetstrender
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Denne uken</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {trends.thisWeek.count} aktiviteter
                      </div>
                      <div className="text-xs text-blue-600">
                        {trends.thisWeek.points} ⭐
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Denne måneden</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {trends.thisMonth.count} aktiviteter
                      </div>
                      <div className="text-xs text-blue-600">
                        {trends.thisMonth.points} ⭐
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Totalt</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {trends.total.count} aktiviteter
                      </div>
                      <div className="text-xs text-blue-600">
                        {trends.total.points} ⭐
                      </div>
                    </div>
                  </div>
                </div>

                {/* Average Activity Calculation */}
                {trends.total.count > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Gjennomsnitt: {Math.round(trends.total.points / trends.total.count)} ⭐ per aktivitet
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Call to Action */}
            {(!familyActivities || familyActivities.length === 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="text-center">
                  <span className="text-blue-600 text-3xl mb-2 block">🏠</span>
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    Kom i gang med familieaktiviteter!
                  </h3>
                  <p className="text-xs text-blue-700 mb-4">
                    Opprett familieoppgaver og begynn å samle familiepoeng sammen.
                  </p>
                  <a
                    href="/admin/family-activities"
                    className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Opprett aktiviteter
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FamilyActivityHistoryPage 