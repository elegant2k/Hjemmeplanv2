// Simple models without complex types
export type Family = {
  id: string
  name: string
  memberCount: number
  createdBy: string
  createdAt: Date
}

export type User = {
  id: string
  familyId: string
  name: string
  role: 'parent' | 'child'
  age?: number
  pin?: string
  allowanceEnabled: boolean
  avatar?: string
}

export type Task = {
  id: string
  familyId: string
  title: string
  description?: string
  assignedTo: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'once'
  points: number
  allowanceAmount?: number
  allowanceEnabled: boolean
  isActive: boolean
  createdBy: string
  createdAt: Date
  // Family activity fields
  isFamily?: boolean
  requiredParticipants?: number
}

export type TaskCompletion = {
  id: string
  taskId: string
  userId: string
  familyId: string
  completedAt: Date
  approvedAt?: Date
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  pointsAwarded: number
  allowanceAwarded?: number
}

export type Streak = {
  id: string
  userId: string
  taskId: string
  familyId: string
  currentStreak: number
  longestStreak: number
  lastCompletionDate: Date
  isActive: boolean
  startDate: Date
}

export type Reward = {
  id: string
  familyId: string
  title: string
  description?: string
  pointsCost: number
  allowanceCost?: number
  isActive: boolean
  category: 'privilege' | 'item' | 'activity' | 'allowance'
  createdBy: string
  createdAt: Date
}

export type FamilyPointsTotal = {
  id: string
  familyId: string
  totalPoints: number
  lastUpdated: Date
  currentGoal?: number
  goalDescription?: string
}

export type FamilyActivity = {
  id: string
  taskId: string
  familyId: string
  completedAt: Date
  participants: string[] // User IDs who participated
  pointsEarned: number
  createdBy: string
}

export type FamilyGoal = {
  id: string
  familyId: string
  title: string
  description?: string
  targetPoints: number
  rewardDescription: string
  isActive: boolean
  isCompleted: boolean
  completedAt?: Date
  createdBy: string
  createdAt: Date
}