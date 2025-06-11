const storagePrefix = 'familie_todo_'

export interface StorageError {
  type: 'QUOTA_EXCEEDED' | 'PRIVATE_BROWSING' | 'JSON_PARSE_ERROR' | 'NOT_AVAILABLE'
  message: string
  key?: string
}

class StorageService {
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__'
      window.localStorage.setItem(test, 'test')
      window.localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  private isPrivateBrowsing(): boolean {
    try {
      window.localStorage.setItem('__private_test__', '1')
      window.localStorage.removeItem('__private_test__')
      return false
    } catch {
      return true
    }
  }

  getItem<T>(key: string): T | null {
    if (!this.isAvailable()) {
      console.warn('localStorage not available')
      return null
    }

    try {
      const item = window.localStorage.getItem(`${storagePrefix}${key}`)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error)
      return null
    }
  }

  setItem<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage not available')
      return false
    }

    if (this.isPrivateBrowsing()) {
      console.warn('Private browsing detected - localStorage may not persist')
    }

    try {
      window.localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value))
      return true
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.error('Storage quota exceeded')
      } else {
        console.error(`Error writing to localStorage for key ${key}:`, error)
      }
      return false
    }
  }

  removeItem(key: string): boolean {
    if (!this.isAvailable()) {
      return false
    }

    try {
      window.localStorage.removeItem(`${storagePrefix}${key}`)
      return true
    } catch (error) {
      console.error(`Error removing from localStorage for key ${key}:`, error)
      return false
    }
  }

  clear(): boolean {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const keys = Object.keys(window.localStorage).filter(key => 
        key.startsWith(storagePrefix)
      )
      keys.forEach(key => window.localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }

  batchSet(items: Record<string, any>): boolean {
    if (!this.isAvailable()) {
      return false
    }

    const backup: Record<string, string | null> = {}
    
    try {
      // Backup existing values
      Object.keys(items).forEach(key => {
        backup[key] = window.localStorage.getItem(`${storagePrefix}${key}`)
      })

      // Set new values
      Object.entries(items).forEach(([key, value]) => {
        window.localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value))
      })

      return true
    } catch (error) {
      // Rollback on error
      Object.entries(backup).forEach(([key, value]) => {
        if (value !== null) {
          window.localStorage.setItem(`${storagePrefix}${key}`, value)
        } else {
          window.localStorage.removeItem(`${storagePrefix}${key}`)
        }
      })
      console.error('Error in batch set operation:', error)
      return false
    }
  }

  batchGet<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {}
    
    keys.forEach(key => {
      result[key] = this.getItem<T>(key)
    })

    return result
  }

  getStorageInfo() {
    if (!this.isAvailable()) {
      return { available: false, quotaExceeded: false, privateBrowsing: false }
    }

    return {
      available: true,
      quotaExceeded: false,
      privateBrowsing: this.isPrivateBrowsing()
    }
  }

  exportData(): Record<string, any> {
    const data: Record<string, any> = {}
    
    Object.keys(window.localStorage)
      .filter(key => key.startsWith(storagePrefix))
      .forEach(key => {
        try {
          const cleanKey = key.replace(storagePrefix, '')
          data[cleanKey] = JSON.parse(window.localStorage.getItem(key) || 'null')
        } catch (error) {
          console.error(`Error parsing data for key ${key}:`, error)
        }
      })

    return data
  }

  importData(data: Record<string, any>): boolean {
    try {
      Object.entries(data).forEach(([key, value]) => {
        this.setItem(key, value)
      })
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }
}

export const storage = new StorageService()