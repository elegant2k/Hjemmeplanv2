import { create } from 'zustand'
import type { Task, TaskCompletion } from '@/models'

interface TaskState {
  tasks: Task[]
  completions: TaskCompletion[]
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  getTasksByFamily: (familyId: string) => Task[]
  getTasksByUser: (userId: string) => Task[]
  getTaskById: (id: string) => Task | undefined
  
  // Completion Actions
  addCompletion: (completion: Omit<TaskCompletion, 'id'>) => void
  updateCompletion: (id: string, updates: Partial<TaskCompletion>) => void
  getCompletionsByTask: (taskId: string) => TaskCompletion[]
  getCompletionsByUser: (userId: string) => TaskCompletion[]
  getPendingCompletions: (familyId: string) => TaskCompletion[]
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  completions: [],

  // Task Actions
  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }
    
    set((state) => ({
      tasks: [...state.tasks, newTask]
    }))
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      )
    }))
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id)
    }))
  },

  getTasksByFamily: (familyId) => {
    return get().tasks.filter((task) => task.familyId === familyId)
  },

  getTasksByUser: (userId) => {
    return get().tasks.filter((task) => task.assignedTo === userId)
  },

  getTaskById: (id) => {
    return get().tasks.find((task) => task.id === id)
  },

  // Completion Actions
  addCompletion: (completionData) => {
    const newCompletion: TaskCompletion = {
      ...completionData,
      id: crypto.randomUUID(),
    }
    
    set((state) => ({
      completions: [...state.completions, newCompletion]
    }))
  },

  updateCompletion: (id, updates) => {
    set((state) => ({
      completions: state.completions.map((completion) =>
        completion.id === id ? { ...completion, ...updates } : completion
      )
    }))
  },

  getCompletionsByTask: (taskId) => {
    return get().completions.filter((completion) => completion.taskId === taskId)
  },

  getCompletionsByUser: (userId) => {
    return get().completions.filter((completion) => completion.userId === userId)
  },

  getPendingCompletions: (familyId) => {
    const { tasks, completions } = get()
    const familyTasks = tasks.filter((task) => task.familyId === familyId)
    const familyTaskIds = familyTasks.map((task) => task.id)
    
    return completions.filter((completion) => 
      familyTaskIds.includes(completion.taskId) && completion.status === 'pending'
    )
  }
}))