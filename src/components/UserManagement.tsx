import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { userService } from '@/services'
import IconMap from '@/components/IconMap'
import type { User, Family } from '@/models'

interface UserFormData {
  name: string
  email: string
  role: 'parent' | 'guardian' | 'child'
  pin: string
  confirmPin: string
  avatar: string
  isActive: boolean
}

interface UserManagementProps {
  className?: string
}

const UserManagement: React.FC<UserManagementProps> = ({ className = '' }) => {
  const { currentUser } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'child',
    pin: '',
    confirmPin: '',
    avatar: '👶',
    isActive: true
  })
  const [errors, setErrors] = useState<Partial<UserFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'joinedAt'>('name')

  // Available avatars (keeping emojis for visual variety in avatars)
  const avatars = [
    '👦', '👧', '🧒', '👶', '👨', '👩', '👨‍💼', '👩‍💼',
    '🐶', '🐱', '🦄', '🌟', '🚀', '⚽', '🎨', '📚', 
    '🎮', '🎵', '🌈', '🦸', '🧑‍🎓', '👸', '🤴', '🧙‍♂️'
  ]

  // Load users on component mount
  useEffect(() => {
    loadUsers()
  }, [currentUser])

  const loadUsers = async () => {
    if (!currentUser?.familyId) return

    setLoading(true)
    try {
      const familyUsers = await userService.getByFamilyId(currentUser.familyId)
      setUsers(familyUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'child',
      pin: '',
      confirmPin: '',
      avatar: '👶',
      isActive: true
    })
    setErrors({})
    setEditingUser(null)
    setShowForm(false)
  }

  // Start editing user
  const startEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email || '',
      role: user.role,
      pin: '', // Don't show existing PIN
      confirmPin: '',
      avatar: user.avatar,
      isActive: user.isActive
    })
    setShowForm(true)
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Navn er påkrevd'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Navn må være minst 2 tegn'
    }

    if (formData.role === 'parent' || formData.role === 'guardian') {
      if (!formData.email.trim()) {
        newErrors.email = 'E-post er påkrevd for foreldre/foresatte'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Ugyldig e-postadresse'
      }

      // PIN validation for new users or when changing PIN
      if (!editingUser || formData.pin) {
        if (!formData.pin) {
          newErrors.pin = 'PIN er påkrevd for foreldre/foresatte'
        } else if (!/^\d{4}$/.test(formData.pin)) {
          newErrors.pin = 'PIN må være 4 siffer'
        }

        if (formData.pin !== formData.confirmPin) {
          newErrors.confirmPin = 'PIN-kodene stemmer ikke overens'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !currentUser?.familyId) return

    setIsSubmitting(true)

    try {
      const userData: Omit<User, 'id'> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        isActive: formData.isActive,
        pin: formData.pin || (editingUser?.pin || ''),
        avatar: formData.avatar,
        pointsEarned: editingUser?.pointsEarned || 0,
        completedTasks: editingUser?.completedTasks || 0,
        currentStreak: editingUser?.currentStreak || 0,
        longestStreak: editingUser?.longestStreak || 0,
        joinedAt: editingUser?.joinedAt || new Date(),
        familyId: currentUser.familyId
      }

      if (editingUser) {
        await userService.update(editingUser.id, userData)
      } else {
        await userService.create(userData)
      }

      await loadUsers()
      resetForm()
    } catch (error) {
      console.error('Error saving user:', error)
      setErrors({ name: 'En feil oppstod under lagring. Prøv igjen.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle user active status
  const toggleUserStatus = async (user: User) => {
    try {
      await userService.update(user.id, { isActive: !user.isActive })
      await loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  // Delete user (with confirmation)
  const deleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Du kan ikke slette din egen konto')
      return
    }

    if (window.confirm(`Er du sikker på at du vil slette ${user.name}?`)) {
      try {
        await userService.delete(user.id)
        await loadUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      if (filter === 'active') return user.isActive
      if (filter === 'inactive') return !user.isActive
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'role':
          return a.role.localeCompare(b.role)
        case 'joinedAt':
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Laster familiemedlemmer...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Familiemedlemmer
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Administrer familiemedlemmer, roller og tilganger
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Legg til medlem
          </button>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">Alle</option>
              <option value="active">Aktive</option>
              <option value="inactive">Inaktive</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sorter:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'role' | 'joinedAt')}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="name">Navn</option>
              <option value="role">Rolle</option>
              <option value="joinedAt">Opprettet</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? 'Rediger familiemedlem' : 'Legg til familiemedlem'}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Navn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      errors.name 
                        ? 'border-red-300 focus:ring-red-200' 
                        : 'border-gray-300 focus:ring-blue-200'
                    }`}
                    placeholder="f.eks. Emma Hansen"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rolle
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'parent' | 'guardian' | 'child' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="child">Barn</option>
                    <option value="parent">Forelder</option>
                    <option value="guardian">Foresatt/verge</option>
                  </select>
                </div>

                {/* Email (for parents/guardians) */}
                {(formData.role === 'parent' || formData.role === 'guardian') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-postadresse *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.email 
                          ? 'border-red-300 focus:ring-red-200' 
                          : 'border-gray-300 focus:ring-blue-200'
                      }`}
                      placeholder="emma@example.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                    )}
                  </div>
                )}

                {/* PIN (for parents/guardians) */}
                {(formData.role === 'parent' || formData.role === 'guardian') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PIN (4 siffer) {editingUser ? '(la stå tom for å beholde)' : '*'}
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={formData.pin}
                        onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          errors.pin 
                            ? 'border-red-300 focus:ring-red-200' 
                            : 'border-gray-300 focus:ring-blue-200'
                        }`}
                        placeholder="••••"
                      />
                      {errors.pin && (
                        <p className="text-sm text-red-600 mt-1">{errors.pin}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bekreft PIN {editingUser ? '(hvis endret)' : '*'}
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={formData.confirmPin}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPin: e.target.value.replace(/\D/g, '') }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          errors.confirmPin 
                            ? 'border-red-300 focus:ring-red-200' 
                            : 'border-gray-300 focus:ring-blue-200'
                        }`}
                        placeholder="••••"
                      />
                      {errors.confirmPin && (
                        <p className="text-sm text-red-600 mt-1">{errors.confirmPin}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Avatar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                        className={`p-3 text-xl rounded-lg border-2 transition-colors hover:bg-blue-50 ${
                          formData.avatar === avatar 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Aktiv bruker
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Lagrer...</span>
                    </div>
                  ) : (
                    editingUser ? 'Oppdater medlem' : 'Legg til medlem'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="p-6">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">
              <IconMap type="family" size={48} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ingen familiemedlemmer funnet
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? 'Start med å legge til familiemedlemmer.'
                : `Ingen ${filter === 'active' ? 'aktive' : 'inaktive'} medlemmer funnet.`
              }
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Legg til første medlem
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`border rounded-lg p-4 transition-colors ${
                  user.isActive 
                    ? 'border-gray-200 bg-white' 
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{user.avatar}</div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${user.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {user.name}
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-blue-600 ml-2">(Du)</span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {user.role === 'parent' ? 'Forelder' : 
                         user.role === 'guardian' ? 'Foresatt' : 'Barn'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEdit(user)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Rediger"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`p-1 transition-colors ${
                        user.isActive 
                          ? 'text-gray-400 hover:text-yellow-600' 
                          : 'text-yellow-600 hover:text-green-600'
                      }`}
                      title={user.isActive ? 'Deaktiver' : 'Aktiver'}
                    >
                      {user.isActive ? '⏸️' : '▶️'}
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => deleteUser(user)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Slett"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {user.email && (
                    <p>📧 {user.email}</p>
                  )}
                  <p>📊 {user.completedTasks} oppgaver fullført</p>
                  <p>⭐ {user.pointsEarned} poeng opptjent</p>
                  <p>🔥 {user.currentStreak} dagers streak</p>
                  <p>📅 Ble med {new Date(user.joinedAt).toLocaleDateString('nb-NO')}</p>
                </div>

                {!user.isActive && (
                  <div className="mt-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-lg text-center">
                    Inaktiv bruker
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {users.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                <div className="text-sm text-gray-600">Totalt medlemmer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Aktive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'parent' || u.role === 'guardian').length}
                </div>
                <div className="text-sm text-gray-600">Foreldre/Foresatte</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {users.filter(u => u.role === 'child').length}
                </div>
                <div className="text-sm text-gray-600">Barn</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement 