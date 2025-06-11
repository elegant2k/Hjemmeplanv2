import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import TaskList from '@/components/TaskList'
import TaskForm from '@/components/TaskForm'
import ApprovalDialog from '@/components/ApprovalDialog'
import NotificationSystem, { useNotifications } from '@/components/NotificationSystem'
import { completionService } from '@/services/completionService'
import type { Task, TaskCompletion } from '@/models'

const TasksPage: React.FC = () => {
  const { currentUser, currentFamily, availableUsers } = useUser()
  const { notifications, removeNotification, showSuccess, showError } = useNotifications()
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedCompletion, setSelectedCompletion] = useState<{
    completion: TaskCompletion
    task: Task
    user: any
  } | null>(null)

  // Mock data - will be replaced with actual service calls
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      familyId: 'family-1',
      title: 'Rydde rommet',
      description: 'Rydde og organisere rommet sitt grundig',
      assignedTo: 'user-3', // Emma
      frequency: 'daily',
      points: 15,
      allowanceAmount: 5,
      allowanceEnabled: true,
      isActive: true,
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'task-2',
      familyId: 'family-1',
      title: 'Hjelpe til med middag',
      description: 'Hjelpe til med tilberedning av middag',
      assignedTo: 'user-4', // Lucas
      frequency: 'daily',
      points: 20,
      allowanceEnabled: false,
      isActive: true,
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'task-3',
      familyId: 'family-1',
      title: 'Lekser',
      description: 'Gjøre alle skolelekser for dagen',
      assignedTo: 'user-3', // Emma
      frequency: 'daily',
      points: 25,
      allowanceEnabled: false,
      isActive: true,
      createdBy: 'user-2',
      createdAt: new Date()
    },
    {
      id: 'task-4',
      familyId: 'family-1',
      title: 'Ta ut søppel',
      description: 'Ta ut søppel og sette frem nye poser',
      assignedTo: 'user-1', // Mamma
      frequency: 'weekly',
      points: 10,
      allowanceEnabled: false,
      isActive: false,
      createdBy: 'user-2',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ])

  const [completions, setCompletions] = useState<TaskCompletion[]>([
    {
      id: 'completion-1',
      taskId: 'task-1',
      userId: 'user-3',
      familyId: 'family-1',
      completedAt: new Date(),
      status: 'pending',
      pointsAwarded: 15,
      allowanceAwarded: 5
    }
  ])

  // Load completions from service
  const loadCompletions = async () => {
    try {
      const allCompletions = await completionService.getCompletions()
      setCompletions(allCompletions)
    } catch (error) {
      console.error('Failed to load completions:', error)
    }
  }

  // Load completions on mount and when family changes
  useEffect(() => {
    if (currentFamily) {
      loadCompletions()
    }
  }, [currentFamily])

  const handleCompletionUpdate = () => {
    // Refresh completions when a new completion is created
    loadCompletions()
    showSuccess('Oppgave markert som fullført!', 'Venter på godkjenning fra foreldre.')
  }

  const handleApprovalClick = (completion: TaskCompletion) => {
    const task = tasks.find(t => t.id === completion.taskId)
    const user = availableUsers.find(u => u.id === completion.userId)
    
    if (task && user) {
      setSelectedCompletion({ completion, task, user })
    }
  }

  const handleApprovalSuccess = (updatedCompletion: TaskCompletion) => {
    setCompletions(prev => 
      prev.map(c => c.id === updatedCompletion.id ? updatedCompletion : c)
    )
    
    const task = tasks.find(t => t.id === updatedCompletion.taskId)
    const user = availableUsers.find(u => u.id === updatedCompletion.userId)
    
    if (updatedCompletion.status === 'approved') {
      showSuccess('Oppgave godkjent!', `${user?.name} har fått ${updatedCompletion.pointsAwarded} poeng${updatedCompletion.allowanceAwarded ? ` og ${updatedCompletion.allowanceAwarded} kr` : ''}.`)
    } else if (updatedCompletion.status === 'rejected') {
      showError('Oppgave avvist', `${task?.title} er sendt tilbake til ${user?.name}.`)
    }
    
    setSelectedCompletion(null)
  }

  const handleCreateTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`
    }
    setTasks(prev => [newTask, ...prev])
    setShowTaskForm(false)
    console.log('Created task:', newTask)
  }

  const handleUpdateTask = (taskData: Omit<Task, 'id'>) => {
    if (!editingTask) return
    
    const updatedTask: Task = {
      ...taskData,
      id: editingTask.id
    }
    setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t))
    setEditingTask(null)
    console.log('Updated task:', updatedTask)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Er du sikker på at du vil slette denne oppgaven?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId))
      console.log('Deleted task:', taskId)
    }
  }

  const handleAssignTask = async (taskId: string, userId: string) => {
    try {
      // Update local state optimistically
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, assignedTo: userId } : t
      ))
      
      // TODO: Call taskService.assignTask when integrating real backend
      // await taskService.assignTask(taskId, userId, currentUser?.id || 'unknown')
      
      console.log('Reassigned task:', taskId, 'to user:', userId)
    } catch (error) {
      console.error('Failed to reassign task:', error)
      // Revert optimistic update on error
      // Could implement error handling here
    }
  }

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    console.log(`Task ${taskId} toggled to: ${completed}`)
    // TODO: Implement actual task completion logic
  }

  const handleToggleActiveTask = async (taskId: string, active: boolean) => {
    try {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, isActive: active } : t
      ))
      
      // TODO: Call taskService.toggleTaskActive when integrating real backend
      // await taskService.toggleTaskActive(taskId)
      
      console.log('Toggled task active status:', taskId, 'to:', active)
    } catch (error) {
      console.error('Failed to toggle task active status:', error)
    }
  }

  const handleBatchDelete = async (taskIds: string[]) => {
    try {
      setTasks(prev => prev.filter(t => !taskIds.includes(t.id)))
      console.log('Batch deleted tasks:', taskIds)
    } catch (error) {
      console.error('Failed to batch delete tasks:', error)
    }
  }

  const handleBatchAssign = async (taskIds: string[], userId: string) => {
    try {
      setTasks(prev => prev.map(t => 
        taskIds.includes(t.id) ? { ...t, assignedTo: userId } : t
      ))
      console.log('Batch assigned tasks:', taskIds, 'to user:', userId)
    } catch (error) {
      console.error('Failed to batch assign tasks:', error)
    }
  }

  const handleBatchToggleActive = async (taskIds: string[], active: boolean) => {
    try {
      setTasks(prev => prev.map(t => 
        taskIds.includes(t.id) ? { ...t, isActive: active } : t
      ))
      console.log('Batch toggled tasks active status:', taskIds, 'to:', active)
    } catch (error) {
      console.error('Failed to batch toggle active status:', error)
    }
  }

  const isParent = currentUser?.role === 'parent'

  if (showTaskForm || editingTask) {
    return (
      <div className="space-y-6">
        <TaskForm
          initialData={editingTask || undefined}
          familyId={currentFamily?.id || 'family-1'}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={() => {
            setShowTaskForm(false)
            setEditingTask(null)
          }}
          isEdit={!!editingTask}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Oppgaver</h1>
          <p className="text-gray-600">
            Administrer {currentFamily?.name || 'familiens'} oppgaver og oppfølging
          </p>
        </div>
        
        {isParent && (
          <button
            onClick={() => setShowTaskForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Ny oppgave</span>
          </button>
        )}
      </div>

      {/* Task list */}
      <TaskList
        tasks={tasks}
        completions={completions}
        users={availableUsers}
        onToggleComplete={handleToggleComplete}
        onCompletionUpdate={handleCompletionUpdate}
        onApprovalClick={isParent ? handleApprovalClick : undefined}
        onEditTask={isParent ? handleEditTask : undefined}
        onDeleteTask={isParent ? handleDeleteTask : undefined}
        onAssignTask={isParent ? handleAssignTask : undefined}
        onToggleActiveTask={isParent ? handleToggleActiveTask : undefined}
        onBatchDelete={isParent ? handleBatchDelete : undefined}
        onBatchAssign={isParent ? handleBatchAssign : undefined}
        onBatchToggleActive={isParent ? handleBatchToggleActive : undefined}
      />

      {/* Approval Dialog */}
      {selectedCompletion && (
        <ApprovalDialog
          completion={selectedCompletion.completion}
          task={selectedCompletion.task}
          assignedUser={selectedCompletion.user}
          onApprove={handleApprovalSuccess}
          onReject={handleApprovalSuccess}
          onClose={() => setSelectedCompletion(null)}
          isOpen={!!selectedCompletion}
        />
      )}

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  )
}

export default TasksPage