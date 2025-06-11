import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User } from '@/models'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to render user avatars properly
export function getUserAvatarIcon(user: User): string | null {
  // Convert known emoji avatars to IconMap types
  const emojiToIcon: Record<string, string> = {
    // Parents/Adults
    '👩': 'parent',
    '👨': 'parent', 
    '👩‍💼': 'parent',
    '👨‍💼': 'parent',
    '🧑‍💼': 'parent',
    '👩‍⚕️': 'parent',
    '👨‍⚕️': 'parent',
    '👩‍🏫': 'parent',
    '👨‍🏫': 'parent',
    '👩‍💻': 'parent',
    '👨‍💻': 'parent',
    '🧑': 'parent',
    
    // Children
    '👧': 'child',
    '👦': 'child',
    '🧒': 'child',
    '👶': 'child',
    '🧑‍🎓': 'child',
    '👩‍🎓': 'child',
    '👨‍🎓': 'child',
    
    // Fallback for any other human emojis
    '👤': 'user',
    '👥': 'user'
  }

  if (user.avatar && emojiToIcon[user.avatar]) {
    return emojiToIcon[user.avatar]
  }
  
  // Return null if avatar should be displayed as-is or use role fallback
  return null
}

// Helper to determine if avatar should use IconMap or emoji display
export function shouldUseIconMap(user: User): boolean {
  return getUserAvatarIcon(user) !== null || !user.avatar
}