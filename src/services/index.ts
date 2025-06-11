import { familyService } from './familyService'
import { userService } from './userService'
import { taskService } from './taskService'
import { completionService } from './completionService'
import { streakService } from './streakService'
import { rewardService } from './rewardService'
import { allowanceService } from './allowanceService'
import { generateSeedData } from './seedData'
import { streakStorage } from './streakStorage'

// Re-export individual services
export { familyService } from './familyService'
export { userService } from './userService'
export { taskService } from './taskService'
export { completionService } from './completionService'
export { streakService, type HolidayException } from './streakService'
export { rewardService } from './rewardService'
export { allowanceService, type AllowancePayment, type WeeklyAllowanceCalculation } from './allowanceService'
export { streakStorage, type StreakHistory, type StreakMetadata } from './streakStorage'
export { rewardClaimingService, type ClaimedReward, type Achievement, type CelebrationEvent } from './rewardClaimingService'
export { familyPointsService } from './familyPointsService'
export { 
  generateSeedData, 
  clearAllData, 
  checkDataExists, 
  exportAllData, 
  importAllData, 
  downloadBackup, 
  uploadBackup, 
  initializeApp,
  type BackupData 
} from './seedData'

// Service registry for easy access
export const services = {
  family: familyService,
  user: userService,
  task: taskService,
  completion: completionService,
  streak: streakService,
  reward: rewardService,
  allowance: allowanceService,
  seedData: generateSeedData,
}

export type ServiceRegistry = typeof services