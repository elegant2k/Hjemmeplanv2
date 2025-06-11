import type { Family, User, Task, TaskCompletion, Streak, Reward } from '@/models'
import { familyService } from './familyService'
import { userService } from './userService'
import { taskService } from './taskService'
import { completionService } from './completionService'
import { streakService } from './streakService'
import { rewardService } from './rewardService'
import { familyPointsService } from './familyPointsService'
import { storage } from '@/lib/storage'

export const generateSeedData = async (): Promise<void> => {
  // Check if data already exists
  const existingFamilies = await familyService.getFamilies()
  if (existingFamilies.length > 0) {
    console.log('Seed data already exists, skipping...')
    return
  }

  console.log('Generating seed data...')

  // Create a test family
  const testFamily = await familyService.createFamily({
    name: 'Testfamilien',
    memberCount: 4,
    createdBy: 'system'
  })

  // Create users
  const mom = await userService.createUser({
    familyId: testFamily.id,
    name: 'Mamma',
    role: 'parent',
    age: 35,
    pin: '1234',
    allowanceEnabled: false
  })

  const dad = await userService.createUser({
    familyId: testFamily.id,
    name: 'Pappa',
    role: 'parent',
    age: 37,
    pin: '5678',
    allowanceEnabled: false
  })

  const child1 = await userService.createUser({
    familyId: testFamily.id,
    name: 'Emma',
    role: 'child',
    age: 12,
    allowanceEnabled: true
  })

  const child2 = await userService.createUser({
    familyId: testFamily.id,
    name: 'Lucas',
    role: 'child',
    age: 8,
    allowanceEnabled: true
  })

  // Create sample tasks
  const tasks = [
    {
      familyId: testFamily.id,
      title: 'Rydde rommet',
      description: 'Rydde opp på rommet og legge klær i skittentøykurven',
      assignedTo: child1.id,
      frequency: 'daily' as const,
      points: 10,
      allowanceAmount: 5,
      allowanceEnabled: true,
      isActive: true,
      createdBy: mom.id
    },
    {
      familyId: testFamily.id,
      title: 'Børste tenner',
      description: 'Børste tenner morgen og kveld',
      assignedTo: child1.id,
      frequency: 'daily' as const,
      points: 5,
      allowanceAmount: 2,
      allowanceEnabled: true,
      isActive: true,
      createdBy: mom.id
    },
    {
      familyId: testFamily.id,
      title: 'Mate katta',
      description: 'Gi katten fôr og friskt vann',
      assignedTo: child2.id,
      frequency: 'daily' as const,
      points: 8,
      allowanceAmount: 3,
      allowanceEnabled: true,
      isActive: true,
      createdBy: dad.id
    },
    {
      familyId: testFamily.id,
      title: 'Hjelpe til med oppvask',
      description: 'Hjelpe til med å rydde bordet etter middag',
      assignedTo: child2.id,
      frequency: 'daily' as const,
      points: 15,
      allowanceAmount: 8,
      allowanceEnabled: true,
      isActive: true,
      createdBy: mom.id
    },
    {
      familyId: testFamily.id,
      title: 'Ta ut søppel',
      description: 'Ta ut søppel og sette frem søppelkasser på tirsdag',
      assignedTo: child1.id,
      frequency: 'weekly' as const,
      points: 20,
      allowanceAmount: 15,
      allowanceEnabled: true,
      isActive: true,
      createdBy: dad.id
    },
    {
      familyId: testFamily.id,
      title: 'Støvsuge stua',
      description: 'Støvsuge hele stua og under sofaer',
      assignedTo: child1.id,
      frequency: 'weekly' as const,
      points: 25,
      allowanceAmount: 20,
      allowanceEnabled: true,
      isActive: true,
      createdBy: mom.id
    },
    // Family activities
    {
      familyId: testFamily.id,
      title: 'Familiekvelder - spill og snacks',
      description: 'Ha en familiekveld med brettspill, snacks og hygge',
      assignedTo: testFamily.id, // Will be managed separately for family activities
      frequency: 'weekly' as const,
      points: 50,
      allowanceAmount: 0,
      allowanceEnabled: false,
      isActive: true,
      createdBy: mom.id,
      isFamily: true,
      requiredParticipants: 3
    },
    {
      familyId: testFamily.id,
      title: 'Familietrim - gåtur eller sykling',
      description: 'Hele familien deltar i fysisk aktivitet sammen',
      assignedTo: testFamily.id,
      frequency: 'weekly' as const,
      points: 40,
      allowanceAmount: 0,
      allowanceEnabled: false,
      isActive: true,
      createdBy: dad.id,
      isFamily: true,
      requiredParticipants: 4
    },
    {
      familyId: testFamily.id,
      title: 'Lag middag sammen',
      description: 'Hele familien hjelper til med å lage middag',
      assignedTo: testFamily.id,
      frequency: 'once' as const,
      points: 60,
      allowanceAmount: 0,
      allowanceEnabled: false,
      isActive: true,
      createdBy: mom.id,
      isFamily: true,
      requiredParticipants: 3
    }
  ]

  // Create tasks
  const createdTasks: Task[] = []
  for (const taskData of tasks) {
    const task = await taskService.createTask(taskData)
    createdTasks.push(task)
  }

  // Create sample rewards
  const rewards = [
    {
      familyId: testFamily.id,
      title: 'Ekstra 30 min skjermtid',
      description: 'Få lov til å være på iPad/TV 30 minutter lenger',
      pointsCost: 50,
      category: 'privilege' as const,
      isActive: true,
      createdBy: mom.id
    },
    {
      familyId: testFamily.id,
      title: 'Velge middag',
      description: 'Få bestemme hva familien skal spise til middag',
      pointsCost: 75,
      category: 'privilege' as const,
      isActive: true,
      createdBy: mom.id
    },
    {
      familyId: testFamily.id,
      title: 'Kino med venner',
      description: 'Få lov til å gå på kino med venner',
      pointsCost: 200,
      allowanceCost: 150,
      category: 'activity' as const,
      isActive: true,
      createdBy: dad.id
    },
    {
      familyId: testFamily.id,
      title: 'Nytt videospill',
      description: 'Få kjøpe et nytt videospill',
      pointsCost: 500,
      allowanceCost: 400,
      category: 'item' as const,
      isActive: true,
      createdBy: dad.id
    },
    {
      familyId: testFamily.id,
      title: 'Ukelønnsbonus',
      description: 'Få ekstra 50 kr i ukelønn',
      pointsCost: 100,
      allowanceCost: 0,
      category: 'allowance' as const,
      isActive: true,
      createdBy: mom.id
    }
  ]

  for (const rewardData of rewards) {
    await rewardService.createReward(rewardData)
  }

  // Create some sample completions to show progress
  const sampleCompletions = [
    {
      taskId: createdTasks[0].id, // Rydde rommet
      userId: child1.id,
      familyId: testFamily.id,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'approved' as const,
      pointsAwarded: 10,
      allowanceAwarded: 5
    },
    {
      taskId: createdTasks[0].id, // Rydde rommet
      userId: child1.id,
      familyId: testFamily.id,
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'approved' as const,
      pointsAwarded: 10,
      allowanceAwarded: 5
    },
    {
      taskId: createdTasks[1].id, // Børste tenner
      userId: child1.id,
      familyId: testFamily.id,
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'approved' as const,
      pointsAwarded: 5,
      allowanceAwarded: 2
    },
    {
      taskId: createdTasks[2].id, // Mate katta
      userId: child2.id,
      familyId: testFamily.id,
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'pending' as const,
      pointsAwarded: 8,
      allowanceAwarded: 3
    }
  ]

  for (const completionData of sampleCompletions) {
    await completionService.createCompletion(completionData)
  }

  // Update streaks for both children
  const child1Tasks = createdTasks
    .filter(task => task.assignedTo === child1.id)
    .map(task => ({ id: task.id, frequency: task.frequency, familyId: task.familyId }))
  
  const child2Tasks = createdTasks
    .filter(task => task.assignedTo === child2.id)
    .map(task => ({ id: task.id, frequency: task.frequency, familyId: task.familyId }))
  
  await streakService.updateAllStreaksForUser(child1.id, child1Tasks)
  await streakService.updateAllStreaksForUser(child2.id, child2Tasks)

  // Create family goals
  const familyGoals = [
    {
      familyId: testFamily.id,
      title: 'Familietur til Tusenfryd',
      description: 'Spar sammen for en morsom dag på Tusenfryd',
      targetPoints: 300,
      rewardDescription: 'Hel dag på Tusenfryd med familien',
      isActive: true,
      isCompleted: false,
      createdBy: dad.id
    },
    {
      familyId: testFamily.id,
      title: 'Kino og pizza kveld',
      description: 'Spar til en hyggelig kveld med kino og pizza',
      targetPoints: 150,
      rewardDescription: 'Kino og pizza for hele familien',
      isActive: true,
      isCompleted: false,
      createdBy: mom.id
    }
  ]

  for (const goalData of familyGoals) {
    await familyPointsService.createFamilyGoal(goalData)
  }

  // Create some sample family activities to show progress
  const familyTasks = createdTasks.filter(task => task.isFamily)
  
  if (familyTasks.length > 0) {
    // Sample family activity from last week
    await familyPointsService.addPointsForActivity(
      testFamily.id,
      familyTasks[0].id, // Familiekvelder
      [mom.id, dad.id, child1.id], // 3 participants
      50,
      mom.id
    )

    // Sample family activity from a few days ago
    await familyPointsService.addPointsForActivity(
      testFamily.id,
      familyTasks[1].id, // Familietrim
      [mom.id, dad.id, child1.id, child2.id], // All 4 participants
      40,
      dad.id
    )
  }

  console.log('Seed data generated successfully!')
  console.log(`Created:`)
  console.log(`- 1 family: ${testFamily.name}`)
  console.log(`- 4 users: 2 parents, 2 children`)
  console.log(`- ${createdTasks.length} tasks (including ${familyTasks.length} family activities)`)
  console.log(`- ${rewards.length} rewards`) 
  console.log(`- ${familyGoals.length} family goals`)
  console.log(`- ${sampleCompletions.length} sample completions`)
  console.log(`- 2 sample family activities`)
  console.log(`- Calculated streaks for children`)
}

export const clearAllData = (): void => {
  storage.clear()
  console.log('All data cleared from localStorage')
}

export const checkDataExists = async (): Promise<boolean> => {
  const families = await familyService.getFamilies()
  return families.length > 0
}

export interface BackupData {
  version: string
  timestamp: string
  families: Family[]
  users: User[]
  tasks: Task[]
  completions: TaskCompletion[]
  streaks: Streak[]
  rewards: Reward[]
  userRewards: any[]
  familyPoints: any[]
  familyActivities: any[]
  familyGoals: any[]
}

export const exportAllData = async (): Promise<BackupData> => {
  try {
    console.log('Exporting all data...')

    const [families, users, tasks, completions, streaks, rewards] = await Promise.all([
      familyService.getFamilies(),
      userService.getUsers(),
      taskService.getTasks(),
      completionService.getCompletions(),
      streakService.getStreaks(),
      rewardService.getRewards()
    ])

    // Get user rewards from storage directly since it's internal to rewardService
    const userRewards: any[] = storage.getItem('user_rewards') || []
    
    // Get family points data
    const familyPoints: any[] = storage.getItem('family_points') || []
    const familyActivities: any[] = storage.getItem('family_activities') || []
    const familyGoals: any[] = storage.getItem('family_goals') || []

    const backupData: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      families,
      users,
      tasks,
      completions,
      streaks,
      rewards,
      userRewards,
      familyPoints,
      familyActivities,
      familyGoals
    }

    console.log('Data export completed successfully')
    console.log(`Exported:`)
    console.log(`- ${families.length} families`)
    console.log(`- ${users.length} users`)
    console.log(`- ${tasks.length} tasks`)
    console.log(`- ${completions.length} completions`)
    console.log(`- ${streaks.length} streaks`)
    console.log(`- ${rewards.length} rewards`)
    console.log(`- ${userRewards.length} user rewards`)
    console.log(`- ${familyPoints.length} family points records`)
    console.log(`- ${familyActivities.length} family activities`)
    console.log(`- ${familyGoals.length} family goals`)

    return backupData
  } catch (error) {
    console.error('Failed to export data:', error)
    throw new Error('Data export failed')
  }
}

export const importAllData = async (backupData: BackupData): Promise<void> => {
  try {
    console.log('Importing data...')
    console.log(`Backup version: ${backupData.version}`)
    console.log(`Backup timestamp: ${backupData.timestamp}`)

    // Clear existing data first
    clearAllData()

    // Import data directly to storage to bypass service validation/duplication checks
    const importPromises: boolean[] = []

    if (backupData.families?.length > 0) {
      importPromises.push(storage.setItem('families', backupData.families))
    }

    if (backupData.users?.length > 0) {
      importPromises.push(storage.setItem('users', backupData.users))
    }

    if (backupData.tasks?.length > 0) {
      importPromises.push(storage.setItem('tasks', backupData.tasks))
    }

    if (backupData.completions?.length > 0) {
      importPromises.push(storage.setItem('completions', backupData.completions))
    }

    if (backupData.streaks?.length > 0) {
      importPromises.push(storage.setItem('streaks', backupData.streaks))
    }

    if (backupData.rewards?.length > 0) {
      importPromises.push(storage.setItem('rewards', backupData.rewards))
    }

    if (backupData.userRewards?.length > 0) {
      importPromises.push(storage.setItem('user_rewards', backupData.userRewards))
    }

    if (backupData.familyPoints?.length > 0) {
      importPromises.push(storage.setItem('family_points', backupData.familyPoints))
    }

    if (backupData.familyActivities?.length > 0) {
      importPromises.push(storage.setItem('family_activities', backupData.familyActivities))
    }

    if (backupData.familyGoals?.length > 0) {
      importPromises.push(storage.setItem('family_goals', backupData.familyGoals))
    }

    // Check if all imports succeeded
    const failedImports = importPromises.filter(result => !result).length

    if (failedImports > 0) {
      throw new Error(`${failedImports} import operations failed`)
    }

    console.log('Data import completed successfully')
    console.log(`Imported:`)
    console.log(`- ${backupData.families?.length || 0} families`)
    console.log(`- ${backupData.users?.length || 0} users`)
    console.log(`- ${backupData.tasks?.length || 0} tasks`)
    console.log(`- ${backupData.completions?.length || 0} completions`)
    console.log(`- ${backupData.streaks?.length || 0} streaks`)
    console.log(`- ${backupData.rewards?.length || 0} rewards`)
    console.log(`- ${backupData.userRewards?.length || 0} user rewards`)
    console.log(`- ${backupData.familyPoints?.length || 0} family points records`)
    console.log(`- ${backupData.familyActivities?.length || 0} family activities`)
    console.log(`- ${backupData.familyGoals?.length || 0} family goals`)

  } catch (error) {
    console.error('Failed to import data:', error)
    throw new Error('Data import failed')
  }
}

export const downloadBackup = async (): Promise<void> => {
  try {
    const backupData = await exportAllData()
    const dataStr = JSON.stringify(backupData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `familie-todo-backup-${new Date().toISOString().split('T')[0]}.json`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
    console.log('Backup file downloaded successfully')
  } catch (error) {
    console.error('Failed to download backup:', error)
    throw new Error('Backup download failed')
  }
}

export const uploadBackup = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const backupData: BackupData = JSON.parse(content)
        
        // Basic validation
        if (!backupData.version || !backupData.timestamp) {
          throw new Error('Invalid backup file format')
        }
        
        await importAllData(backupData)
        console.log('Backup uploaded and imported successfully')
        resolve()
      } catch (error) {
        console.error('Failed to process backup file:', error)
        reject(new Error('Failed to process backup file'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read backup file'))
    }
    
    reader.readAsText(file)
  })
}

export const initializeApp = async (): Promise<void> => {
  try {
    console.log('Initializing app...')
    
    const hasData = await checkDataExists()
    
    if (!hasData) {
      console.log('No existing data found, generating seed data...')
      await generateSeedData()
    } else {
      console.log('Existing data found, skipping seed data generation')
    }
    
    console.log('App initialization completed')
  } catch (error) {
    console.error('App initialization failed:', error)
    throw new Error('Failed to initialize app')
  }
}