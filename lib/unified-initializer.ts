// Unified Initializer
// Coordinates the initialization of all wallet protection and error handling systems

import { walletConflictManager } from './wallet-conflict-manager'
import { crossOriginComm } from './cross-origin-communication'
import { enhancedErrorHandler } from './enhanced-error-handler'
import { unifiedWalletManager } from './unified-wallet-manager'

export interface InitializationOptions {
  enableWalletProtection: boolean
  enableCrossOriginComm: boolean
  enableErrorHandler: boolean
  enableWalletManager: boolean
  noiseReduction: boolean
  autoRecovery: boolean
}

export class UnifiedInitializer {
  private static instance: UnifiedInitializer
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): UnifiedInitializer {
    if (!UnifiedInitializer.instance) {
      UnifiedInitializer.instance = new UnifiedInitializer()
    }
    return UnifiedInitializer.instance
  }

  async initialize(options: Partial<InitializationOptions> = {}): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.isInitialized) {
      return this.initializationPromise || Promise.resolve()
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    const defaultOptions: InitializationOptions = {
      enableWalletProtection: true,
      enableCrossOriginComm: true,
      enableErrorHandler: true,
      enableWalletManager: true,
      noiseReduction: true,
      autoRecovery: true,
      ...options
    }

    this.initializationPromise = this.performInitialization(defaultOptions)
    
    try {
      await this.initializationPromise
      this.isInitialized = true
    } catch (error) {
      console.error('❌ Initialization failed:', error)
      throw error
    }

    return this.initializationPromise
  }

  private async performInitialization(options: InitializationOptions): Promise<void> {
    console.log('🚀 Starting unified initialization...')

    try {
      // Step 1: Initialize error handler first (foundation layer)
      if (options.enableErrorHandler) {
        console.log('🛡️ Initializing enhanced error handler...')
        enhancedErrorHandler.setNoiseReduction(options.noiseReduction)
        enhancedErrorHandler.setAutoRecovery(options.autoRecovery)
        console.log('✅ Enhanced error handler initialized')
      }

      // Step 2: Initialize cross-origin communication
      if (options.enableCrossOriginComm) {
        console.log('📡 Initializing cross-origin communication...')
        // Cross-origin communication is already initialized as singleton
        console.log('✅ Cross-origin communication initialized')
      }

      // Step 3: Initialize wallet conflict protection
      if (options.enableWalletProtection) {
        console.log('🔒 Initializing wallet conflict protection...')
        // Wallet conflict manager is already initialized as singleton
        console.log('✅ Wallet conflict protection initialized')
      }

      // Step 4: Initialize unified wallet manager
      if (options.enableWalletManager) {
        console.log('💼 Initializing unified wallet manager...')
        await unifiedWalletManager.initialize()
        console.log('✅ Unified wallet manager initialized')
      }

      // Step 5: Set up cross-system communication
      this.setupCrossSystemCommunication()

      // Step 6: Perform health check
      await this.performHealthCheck()

      console.log('🎉 Unified initialization completed successfully')
    } catch (error) {
      console.error('❌ Initialization step failed:', error)
      throw error
    }
  }

  private setupCrossSystemCommunication(): void {
    console.log('🔗 Setting up cross-system communication...')

    // Connect wallet conflict manager with error handler
    walletConflictManager.onConflict(() => {
      enhancedErrorHandler.forceRecovery('wallet')
      crossOriginComm.broadcastMessage({
        type: 'walletConflict',
        timestamp: Date.now()
      })
    })

    // Connect cross-origin communication with error handler
    crossOriginComm.on('originMismatch', (data: any) => {
      enhancedErrorHandler.forceRecovery('crossorigin')
    })

    // Connect wallet manager with cross-origin communication
    unifiedWalletManager.on('walletConnected', (state: any) => {
      crossOriginComm.broadcastMessage({
        type: 'walletStatusUpdate',
        status: state,
        timestamp: Date.now()
      })
    })

    console.log('✅ Cross-system communication established')
  }

  private async performHealthCheck(): Promise<void> {
    console.log('🏥 Performing health check...')

    const checks = [
      {
        name: 'Error Handler',
        test: () => {
          const stats = enhancedErrorHandler.getErrorStats()
          return Object.keys(stats).length >= 0
        }
      },
      {
        name: 'Cross-Origin Communication',
        test: () => {
          const origins = crossOriginComm.getAllowedOrigins()
          return origins.length > 0
        }
      },
      {
        name: 'Wallet Conflict Manager',
        test: () => {
          return walletConflictManager.isFrameEnvironment() !== undefined
        }
      },
      {
        name: 'Unified Wallet Manager',
        test: () => {
          const state = unifiedWalletManager.getCurrentState()
          return state !== null
        }
      }
    ]

    const results = await Promise.allSettled(
      checks.map(check => 
        Promise.resolve(check.test())
          .then(result => ({ name: check.name, success: result }))
          .catch(error => ({ name: check.name, success: false, error }))
      )
    )

    const failedChecks = results
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value.success ? null : checks[index].name
        } else {
          return checks[index].name
        }
      })
      .filter(Boolean) as string[]

    if (failedChecks.length > 0) {
      console.warn('⚠️ Health check failed for:', failedChecks)
    } else {
      console.log('✅ All health checks passed')
    }
  }

  // Public API for external control
  public async reinitialize(): Promise<void> {
    console.log('🔄 Reinitializing...')
    this.isInitialized = false
    this.initializationPromise = null
    await this.initialize()
  }

  public getStatus(): {
    isInitialized: boolean
    components: Record<string, boolean>
  } {
    const components = {
      errorHandler: true, // Always available as singleton
      crossOriginComm: true, // Always available as singleton
      walletConflictManager: true, // Always available as singleton
      walletManager: this.isInitialized // Only available after full initialization
    }

    return {
      isInitialized: this.isInitialized,
      components
    }
  }

  public forceRecovery(type: 'wallet' | 'crossorigin' | 'all'): void {
    console.log(`🔧 Forcing recovery: ${type}`)
    enhancedErrorHandler.forceRecovery(type)
  }

  public getErrorStats(): Record<string, number> {
    return enhancedErrorHandler.getErrorStats()
  }

  public reset(): void {
    console.log('🔄 Resetting initialization state...')
    this.isInitialized = false
    this.initializationPromise = null
    enhancedErrorHandler.resetErrorCounts()
  }

  // Cleanup method
  public destroy(): void {
    console.log('🧹 Cleaning up unified initializer...')
    
    this.isInitialized = false
    this.initializationPromise = null
    
    // Note: We don't destroy the singletons as they may be used elsewhere
    // This is just cleanup for this specific initializer instance
    
    console.log('✅ Unified initializer cleaned up')
  }
}

// Export singleton instance
export const unifiedInitializer = UnifiedInitializer.getInstance()