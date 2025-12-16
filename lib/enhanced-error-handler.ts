// Enhanced Error Handler
// Provides comprehensive error handling for wallet conflicts and cross-origin issues

import { crossOriginComm } from './cross-origin-communication'

export interface ErrorHandlerConfig {
  enableNoiseReduction: boolean
  enableAutoRecovery: boolean
  maxRetries: number
  retryDelay: number
}

export class EnhancedErrorHandler {
  private static instance: EnhancedErrorHandler
  private config: ErrorHandlerConfig
  private errorCounts: Map<string, number> = new Map()
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {
    this.config = {
      enableNoiseReduction: true,
      enableAutoRecovery: true,
      maxRetries: 3,
      retryDelay: 1000
    }
    
    this.setupGlobalErrorHandling()
    this.setupUnhandledRejectionHandling()
    this.setupCustomErrorListeners()
  }

  static getInstance(): EnhancedErrorHandler {
    if (!EnhancedErrorHandler.instance) {
      EnhancedErrorHandler.instance = new EnhancedErrorHandler()
    }
    return EnhancedErrorHandler.instance
  }

  private setupGlobalErrorHandling(): void {
    // Handle window.ethereum conflicts
    window.addEventListener('error', (event) => {
      const error = event.error || event.message
      if (this.isWalletConflictError(error)) {
        this.handleWalletConflictError(error)
        event.preventDefault()
        return
      }
      
      if (this.isCrossOriginError(error)) {
        this.handleCrossOriginError(error)
        event.preventDefault()
        return
      }
    })

    // Handle postMessage errors
    window.addEventListener('messageerror', (event) => {
      console.warn('📨 postMessage error:', event.data)
      this.handlePostMessageError(event)
    })
  }

  private setupUnhandledRejectionHandling(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason
      if (this.isWalletRelatedError(error)) {
        this.handleWalletError(error)
        event.preventDefault()
        return
      }
    })
  }

  private setupCustomErrorListeners(): void {
    // Listen for wallet conflicts from our conflict manager
    crossOriginComm.on('walletConflict', (data: any) => {
      this.handleWalletConflict(data)
    })
    
    crossOriginComm.on('originMismatch', (data: any) => {
      this.handleOriginMismatch(data)
    })
  }

  private isWalletConflictError(error: any): boolean {
    if (!error) return false
    
    const message = error.message || error.toString()
    return message.includes('Cannot set property ethereum') ||
           message.includes('Failed to set window.ethereum') ||
           message.includes('Cannot redefine property') ||
           message.includes('window.ethereum')
  }

  private isCrossOriginError(error: any): boolean {
    if (!error) return false
    
    const message = error.message || error.toString()
    return message.includes('postMessage') ||
           message.includes('target origin') ||
           message.includes('recipient window') ||
           message.includes('origins don\'t match')
  }

  private isWalletRelatedError(error: any): boolean {
    if (!error) return false
    
    const message = error.message || error.toString()
    return message.includes('wallet') ||
           message.includes('ethereum') ||
           message.includes('MetaMask') ||
           message.includes('WalletConnect') ||
           this.isWalletConflictError(error) ||
           this.isCrossOriginError(error)
  }

  private handleWalletConflictError(error: any): void {
    const errorKey = 'wallet_conflict'
    this.incrementErrorCount(errorKey)
    
    if (!this.shouldSuppressError(errorKey)) {
      console.warn('🛡️ Wallet conflict detected and handled:', error.message)
    }
    
    // Attempt auto-recovery
    if (this.config.enableAutoRecovery) {
      this.attemptWalletConflictRecovery()
    }
  }

  private handleCrossOriginError(error: any): void {
    const errorKey = 'cross_origin'
    this.incrementErrorCount(errorKey)
    
    if (!this.shouldSuppressError(errorKey)) {
      console.warn('📨 Cross-origin error handled:', error.message)
    }
    
    // Attempt to recover from cross-origin issues
    if (this.config.enableAutoRecovery) {
      this.attemptCrossOriginRecovery()
    }
  }

  private handlePostMessageError(event: MessageEvent): void {
    const errorKey = 'postmessage'
    this.incrementErrorCount(errorKey)
    
    if (!this.shouldSuppressError(errorKey)) {
      console.warn('📨 postMessage parsing error:', event.data)
    }
  }

  private handleWalletConflict(data: any): void {
    console.log('🛡️ Wallet conflict detected via cross-origin comm:', data)
    this.attemptWalletConflictRecovery()
  }

  private handleOriginMismatch(data: any): void {
    console.log('📨 Origin mismatch detected:', data)
    this.attemptCrossOriginRecovery()
  }

  private handleWalletError(error: any): void {
    const errorKey = 'wallet_general'
    this.incrementErrorCount(errorKey)
    
    if (!this.shouldSuppressError(errorKey)) {
      console.warn('💼 Wallet error handled:', error.message || error)
    }
  }

  private incrementErrorCount(key: string): void {
    const count = this.errorCounts.get(key) || 0
    this.errorCounts.set(key, count + 1)
  }

  private shouldSuppressError(key: string): boolean {
    if (!this.config.enableNoiseReduction) {
      return false
    }
    
    const count = this.errorCounts.get(key) || 0
    return count > 10 // Suppress after 10 occurrences
  }

  private attemptWalletConflictRecovery(): void {
    const recoveryKey = 'wallet_recovery'
    
    // Clear existing retry timeout
    if (this.retryTimeouts.has(recoveryKey)) {
      clearTimeout(this.retryTimeouts.get(recoveryKey)!)
      this.retryTimeouts.delete(recoveryKey)
    }
    
    // Schedule retry
    const timeout = setTimeout(() => {
      try {
        console.log('🔄 Attempting wallet conflict recovery...')
        
        // Re-initialize wallet conflict manager
        if ((window as any).walletConflictManager) {
          (window as any).walletConflictManager.initializeProtection()
        }
        
        // Clear error count for conflicts
        this.errorCounts.delete('wallet_conflict')
        
        console.log('✅ Wallet conflict recovery attempted')
      } catch (error) {
        console.warn('⚠️ Wallet conflict recovery failed:', error)
      }
    }, this.config.retryDelay)
    
    this.retryTimeouts.set(recoveryKey, timeout)
  }

  private attemptCrossOriginRecovery(): void {
    const recoveryKey = 'cross_origin_recovery'
    
    // Clear existing retry timeout
    if (this.retryTimeouts.has(recoveryKey)) {
      clearTimeout(this.retryTimeouts.get(recoveryKey)!)
      this.retryTimeouts.delete(recoveryKey)
    }
    
    // Schedule retry
    const timeout = setTimeout(() => {
      try {
        console.log('🔄 Attempting cross-origin recovery...')
        
        // Re-initialize cross-origin communication
        crossOriginComm.broadcastMessage({
          type: 'RECOVERY_ATTEMPT',
          timestamp: Date.now()
        })
        
        // Clear error count for cross-origin issues
        this.errorCounts.delete('cross_origin')
        
        console.log('✅ Cross-origin recovery attempted')
      } catch (error) {
        console.warn('⚠️ Cross-origin recovery failed:', error)
      }
    }, this.config.retryDelay)
    
    this.retryTimeouts.set(recoveryKey, timeout)
  }

  // Public methods for external control
  public setNoiseReduction(enabled: boolean): void {
    this.config.enableNoiseReduction = enabled
    console.log(`🔊 Error noise reduction ${enabled ? 'enabled' : 'disabled'}`)
  }

  public setAutoRecovery(enabled: boolean): void {
    this.config.enableAutoRecovery = enabled
    console.log(`🔄 Auto recovery ${enabled ? 'enabled' : 'disabled'}`)
  }

  public getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    this.errorCounts.forEach((count, key) => {
      stats[key] = count
    })
    return stats
  }

  public resetErrorCounts(): void {
    this.errorCounts.clear()
    console.log('🧹 Error counts reset')
  }

  public forceRecovery(type: 'wallet' | 'crossorigin' | 'all'): void {
    switch (type) {
      case 'wallet':
        this.attemptWalletConflictRecovery()
        break
      case 'crossorigin':
        this.attemptCrossOriginRecovery()
        break
      case 'all':
        this.attemptWalletConflictRecovery()
        this.attemptCrossOriginRecovery()
        break
    }
  }

  // Cleanup method
  public destroy(): void {
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
    
    // Clear error counts
    this.errorCounts.clear()
    
    console.log('🧹 Enhanced error handler cleaned up')
  }
}

// Export singleton instance
export const enhancedErrorHandler = EnhancedErrorHandler.getInstance()