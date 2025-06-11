import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { IconMap } from '@/components/IconMap'
import TaskItem from '@/components/TaskItem'
import EmptyState from '@/components/EmptyState'
import type { Task, TaskCompletion, User } from '@/models'

type SortField = 'title' | 'points' | 'frequency' | 'assignedTo' | 'createdAt'
type SortDirection = 'asc' | 'desc'
type FilterStatus = 'all' | 'active' | 'inactive' | 'completed' | 'pending'
type FilterFrequency = 'all' | 'daily' | 'weekly' | 'monthly' | 'once'

interface TaskListProps {
  tasks: Task[]
  completions: TaskCompletion[]
  users: User[]
  onToggleComplete?: (taskId: string, completed: boolean) => void
  onCompletionUpdate?: () => void
  onApprovalClick?: (completion: TaskCompletion) => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onAssignTask?: (taskId: string, userId: string) => void
  onToggleActiveTask?: (taskId: string, active: boolean) => void
  onBatchDelete?: (taskIds: string[]) => void
  onBatchAssign?: (taskIds: string[], userId: string) => void
  onBatchToggleActive?: (taskIds: string[], active: boolean) => void
  className?: string
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  completions,
  users,
  onToggleComplete,
  onCompletionUpdate,
  onApprovalClick,
  onEditTask,
  onDeleteTask,
  onAssignTask,
  onToggleActiveTask,
  onBatchDelete,
  onBatchAssign,
  onBatchToggleActive,
  className
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterFrequency, setFilterFrequency] = useState<FilterFrequency>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'delete' | 'deactivate'
    count: number
  } | null>(null)

  // Helper function to get task status
  const getTaskStatus = (taskId: string) => {
    const completion = completions.find(c => c.taskId === taskId)
    if (completion) {
      switch (completion.status) {
        case 'approved':
          return 'completed'
        case 'pending':
          return 'awaiting-approval'
        case 'rejected':
          return 'pending'
        default:
          return 'pending'
      }
    }
    return 'pending'
  }

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Search filter
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Status filter
      if (filterStatus !== 'all') {
        const taskStatus = getTaskStatus(task.id)
        switch (filterStatus) {
          case 'active':
            return task.isActive
          case 'inactive':
            return !task.isActive
          case 'completed':
            return taskStatus === 'completed'
          case 'pending':
            return taskStatus === 'pending' || taskStatus === 'awaiting-approval'
        }
      }

      // Frequency filter
      if (filterFrequency !== 'all' && task.frequency !== filterFrequency) {
        return false
      }

      // Assignee filter
      if (filterAssignee !== 'all' && task.assignedTo !== filterAssignee) {
        return false
      }

      return true
    })

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'points':
          aValue = a.points
          bValue = b.points
          break
        case 'frequency':
          const frequencyOrder = { daily: 1, weekly: 2, monthly: 3, once: 4 }
          aValue = frequencyOrder[a.frequency]
          bValue = frequencyOrder[b.frequency]
          break
        case 'assignedTo':
          const aUser = users.find(u => u.id === a.assignedTo)
          const bUser = users.find(u => u.id === b.assignedTo)
          aValue = aUser?.name.toLowerCase() || ''
          bValue = bUser?.name.toLowerCase() || ''
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [tasks, completions, sortField, sortDirection, filterStatus, filterFrequency, filterAssignee, searchQuery, users])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  // Selection helpers
  const handleSelectTask = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTasks)
    if (selected) {
      newSelected.add(taskId)
    } else {
      newSelected.delete(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTasks(new Set(filteredAndSortedTasks.map(t => t.id)))
    } else {
      setSelectedTasks(new Set())
    }
  }

  const isAllSelected = filteredAndSortedTasks.length > 0 && 
    filteredAndSortedTasks.every(task => selectedTasks.has(task.id))
  
  const isSomeSelected = selectedTasks.size > 0 && selectedTasks.size < filteredAndSortedTasks.length

  // Batch operations
  const handleBatchDelete = () => {
    const taskIds = Array.from(selectedTasks)
    setShowConfirmDialog({ type: 'delete', count: taskIds.length })
  }

  const handleBatchToggleActive = (active: boolean) => {
    const taskIds = Array.from(selectedTasks)
    if (!active) {
      setShowConfirmDialog({ type: 'deactivate', count: taskIds.length })
    } else {
      onBatchToggleActive?.(taskIds, active)
      setSelectedTasks(new Set())
    }
  }

  const handleBatchAssignUser = (userId: string) => {
    const taskIds = Array.from(selectedTasks)
    onBatchAssign?.(taskIds, userId)
    setSelectedTasks(new Set())
  }

  const confirmBatchOperation = () => {
    const taskIds = Array.from(selectedTasks)
    if (showConfirmDialog?.type === 'delete') {
      onBatchDelete?.(taskIds)
    } else if (showConfirmDialog?.type === 'deactivate') {
      onBatchToggleActive?.(taskIds, false)
    }
    setSelectedTasks(new Set())
    setShowConfirmDialog(null)
  }

  const statusOptions = [
    { value: 'all', label: 'Alle statuser' },
    { value: 'active', label: 'Aktive' },
    { value: 'inactive', label: 'Inaktive' },
    { value: 'completed', label: 'Fullførte' },
    { value: 'pending', label: 'Ventende' }
  ]

  const frequencyOptions = [
    { value: 'all', label: 'Alle frekvenser' },
    { value: 'daily', label: 'Daglig' },
    { value: 'weekly', label: 'Ukentlig' },
    { value: 'monthly', label: 'Månedlig' },
    { value: 'once', label: 'Én gang' }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Søk
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk etter oppgaver..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency filter */}
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Frekvens
            </label>
            <select
              id="frequency"
              value={filterFrequency}
              onChange={(e) => setFilterFrequency(e.target.value as FilterFrequency)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee filter */}
          <div>
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
              Tildelt til
            </label>
            <select
              id="assignee"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle familiemedlemmer</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role === 'parent' ? 'Forelder' : 'Barn'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Sorter etter:</span>
        {[
          { field: 'title' as SortField, label: 'Tittel' },
          { field: 'points' as SortField, label: 'Poeng' },
          { field: 'frequency' as SortField, label: 'Frekvens' },
          { field: 'assignedTo' as SortField, label: 'Tildelt til' },
          { field: 'createdAt' as SortField, label: 'Opprettet' }
        ].map(({ field, label }) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={cn(
              'px-3 py-1 text-sm rounded-md transition-colors',
              sortField === field
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {label} {getSortIcon(field)}
          </button>
        ))}
      </div>

      {/* Batch operations toolbar */}
      {selectedTasks.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedTasks.size} oppgave{selectedTasks.size !== 1 ? 'r' : ''} valgt
              </span>
              <button
                onClick={() => setSelectedTasks(new Set())}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Fjern valg
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Batch assign */}
              {onBatchAssign && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBatchAssignUser(e.target.value)
                      e.target.value = '' // Reset
                    }
                  }}
                  className="text-sm border border-blue-300 rounded px-2 py-1 bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>Tildel til...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role === 'parent' ? 'Forelder' : 'Barn'})
                    </option>
                  ))}
                </select>
              )}

              {/* Batch activate */}
              {onBatchToggleActive && (
                <button
                  onClick={() => handleBatchToggleActive(true)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Aktiver
                </button>
              )}

              {/* Batch deactivate */}
              {onBatchToggleActive && (
                <button
                  onClick={() => handleBatchToggleActive(false)}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Deaktiver
                </button>
              )}

              {/* Batch delete */}
              {onBatchDelete && (
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Slett
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-600">
            Viser {filteredAndSortedTasks.length} av {tasks.length} oppgaver
          </p>
          {filteredAndSortedTasks.length > 0 && (onBatchDelete || onBatchAssign || onBatchToggleActive) && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isSomeSelected
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-600">
                {isAllSelected ? 'Fjern alle' : isSomeSelected ? 'Velg alle' : 'Velg alle'}
              </label>
            </div>
          )}
        </div>
        {filteredAndSortedTasks.length > 0 && (
          <button
            onClick={() => setExpandedTasks(new Set())}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Lukk alle detaljer
          </button>
        )}
      </div>

      {/* Pending Approvals Section */}
      {onApprovalClick && completions.filter(c => c.status === 'pending').length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Venter på godkjenning ({completions.filter(c => c.status === 'pending').length})
          </h3>
          <div className="space-y-2">
            {completions
              .filter(c => c.status === 'pending')
              .map(completion => {
                const task = tasks.find(t => t.id === completion.taskId)
                const user = users.find(u => u.id === completion.userId)
                
                if (!task || !user) return null
                
                return (
                  <div
                    key={completion.id}
                    className="flex items-center justify-between p-3 bg-white rounded border border-blue-200 cursor-pointer hover:bg-blue-50"
                    onClick={() => onApprovalClick(completion)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {user.avatar ? (
                          <span className="text-sm">{user.avatar}</span>
                        ) : (
                          <IconMap type="user" size={16} className="text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-600">
                          {user.name} • Fullført {new Date(completion.completedAt).toLocaleDateString('no-NO')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {completion.pointsAwarded}p
                        {completion.allowanceAwarded && ` • ${completion.allowanceAwarded}kr`}
                      </span>
                      <span className="text-blue-600">
                        <IconMap type="eye" size={16} />
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Task list */}
      {filteredAndSortedTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedTasks.map(task => {
            const completion = completions.find(c => c.taskId === task.id)
            const assignedUser = users.find(u => u.id === task.assignedTo)
            
            return (
              <TaskItem
                key={task.id}
                task={task}
                completion={completion}
                assignedUser={assignedUser}
                onToggleComplete={onToggleComplete}
                onCompletionUpdate={onCompletionUpdate}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onAssign={onAssignTask}
                onToggleActive={onToggleActiveTask}
                availableUsers={users}
                isExpanded={expandedTasks.has(task.id)}
                onToggleExpand={() => toggleTaskExpansion(task.id)}
                isSelected={selectedTasks.has(task.id)}
                onSelect={(onBatchDelete || onBatchAssign || onBatchToggleActive) ? handleSelectTask : undefined}
              />
            )
          })}
        </div>
      ) : (
        <EmptyState
          type="tasks"
          title={searchQuery ? 'Ingen oppgaver funnet' : 'Ingen oppgaver'}
          description={
            searchQuery 
              ? `Ingen oppgaver matcher søket "${searchQuery}". Prøv å endre søkekriteriene.`
              : 'Opprett din første oppgave for å komme i gang.'
          }
          action={{
            label: searchQuery ? 'Nullstill filtre' : 'Opprett oppgave',
            onClick: () => {
              if (searchQuery) {
                setSearchQuery('')
                setFilterStatus('all')
                setFilterFrequency('all')
                setFilterAssignee('all')
              } else {
                console.log('Create new task')
              }
            }
          }}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bekreft handling
            </h3>
            <p className="text-gray-600 mb-6">
              Er du sikker på at du vil {showConfirmDialog.type === 'delete' ? 'slette' : 'deaktivere'} {' '}
              {showConfirmDialog.count} oppgave{showConfirmDialog.count !== 1 ? 'r' : ''}?
              {showConfirmDialog.type === 'delete' && (
                <span className="text-red-600 font-medium"> Denne handlingen kan ikke angres.</span>
              )}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={confirmBatchOperation}
                className={cn(
                  "flex-1 px-4 py-2 text-white rounded-md",
                  showConfirmDialog.type === 'delete'
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                )}
              >
                {showConfirmDialog.type === 'delete' ? 'Slett' : 'Deaktiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskList