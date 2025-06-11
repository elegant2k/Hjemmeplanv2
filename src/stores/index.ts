export { useFamilyStore } from './familyStore'
export { useUserStore } from './userStore'
export { useTaskStore } from './taskStore'

// Combined hook for easier access to all stores
export const useAppStores = () => ({
  family: useFamilyStore(),
  user: useUserStore(),
  task: useTaskStore(),
})