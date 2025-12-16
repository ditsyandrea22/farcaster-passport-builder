/**
 * Safe Property Access Utilities
 * Prevents conflicts when multiple libraries try to set properties on window object
 */

/**
 * Safely access nested properties without causing conflicts
 * @param obj - The object to access properties from
 * @param path - Dot-separated path to the property (e.g., 'farcaster.sdk.actions')
 * @returns The property value or undefined if not found/error
 */
export function safeGetProperty(obj: any, path: string): any {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  } catch (error) {
    console.warn(`Safe property access failed for "${path}":`, error)
    return undefined
  }
}

/**
 * Safely get a property descriptor to check if a property can be accessed
 * @param obj - The object to check
 * @param prop - The property name
 * @returns Property descriptor or undefined if not found/error
 */
export function safeGetPropertyDescriptor(obj: any, prop: string): PropertyDescriptor | undefined {
  try {
    return Object.getOwnPropertyDescriptor(obj, prop)
  } catch (error) {
    console.warn(`Property descriptor check failed for "${prop}":`, error)
    return undefined
  }
}

/**
 * Safely check if a window property exists and is accessible
 * @param windowObj - The window object
 * @param prop - The property name to check
 * @returns True if the property exists and is accessible
 */
export function isWindowPropertyAccessible(windowObj: any, prop: string): boolean {
  try {
    const descriptor = safeGetPropertyDescriptor(windowObj, prop)
    if (!descriptor) return false
    
    // Check if the property is readable
    if (descriptor.get) {
      try {
        const value = windowObj[prop]
        return value !== undefined
      } catch {
        return false
      }
    }
    
    // For data properties, just check if they exist
    return windowObj.hasOwnProperty(prop)
  } catch (error) {
    console.warn(`Window property accessibility check failed for "${prop}":`, error)
    return false
  }
}

/**
 * Safely access window.ethereum with conflict prevention
 * @param windowObj - The window object
 * @returns The ethereum object if accessible, null otherwise
 */
export function safeGetWindowEthereum(windowObj: any): any {
  try {
    // First check if the property is safely accessible
    if (!isWindowPropertyAccessible(windowObj, 'ethereum')) {
      return null
    }
    
    // Try to access the ethereum object
    const ethereum = windowObj.ethereum
    
    // Verify it's an object and has the expected structure
    if (ethereum && typeof ethereum === 'object') {
      return ethereum
    }
    
    return null
  } catch (error) {
    console.warn('Safe window.ethereum access failed:', error)
    return null
  }
}

/**
 * Safe way to access potential wallet address from various sources
 * @param sources - Array of objects to check for wallet address
 * @returns The wallet address if found, null otherwise
 */
export function safeGetWalletAddress(sources: any[]): string | null {
  for (const source of sources) {
    try {
      if (!source) continue
      
      // Check various possible wallet address locations
      const possiblePaths = [
        'wallet.address',
        'selectedAddress',
        'context.wallet.address',
        'frameContext.wallet.address'
      ]
      
      for (const path of possiblePaths) {
        const address = safeGetProperty(source, path)
        if (address && typeof address === 'string' && address.startsWith('0x')) {
          return address
        }
      }
    } catch (error) {
      // Continue to next source if this one fails
      continue
    }
  }
  
  return null
}