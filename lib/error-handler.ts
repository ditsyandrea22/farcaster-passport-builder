/**
 * Enhanced Error Handler
 * Provides comprehensive error handling and logging with noise reduction
 */

export interface ErrorInfo {
  message: string
  stack?: string
  timestamp: number
  source: string
  type: 'wallet' | 'frame' | 'network' | 'ui' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: ErrorInfo[] = []
  private maxLogSize = 100
  private noiseReduction = true
  private lastErrorTime = new Map<string, number>()
  private errorCounts = new Map<string, number>()

  private constructor() {
    this.setupGlobalErrorHandling()
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  private setupGlobalErrorHandling(): void {
    if (typeof window === 'undefined') return

    // Override console.error to filter and enhance error logging
    const originalError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      
      // Filter out common noise patterns
      if (this.shouldSuppressError(message)) {
        return
      }

      // Enhanced error logging
      const errorInfo: ErrorInfo = {
        message,
        timestamp: Date.now(),
        source: this.getErrorSource(message),
        type: this.categorizeError(message),
        severity: this.determineSeverity(message)
      }

      this.logError(errorInfo)
      originalError.apply(console, args)
    }

    // Override console.warn to filter warnings
    const originalWarn = console.warn
    console.warn = (...args) => {
      const message = args.join(' ')
      
      // Filter out common warning noise
      if (this.shouldSuppressWarning(message)) {
        return
      }

      originalWarn.apply(console, args)
    }

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorInfo: ErrorInfo = {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        source: 'promise',
        type: 'unknown',
        severity: 'medium'
      }
      this.logError(errorInfo)
    })

    // Handle global errors
    window.addEventListener('error', (event) => {
      const errorInfo: ErrorInfo = {
        message: `Global Error: ${event.message}`,
        stack: event.error?.stack,
        timestamp: Date.now(),
        source: 'global',
        type: 'unknown',
        severity: 'high'
      }
      this.logError(errorInfo)
    })
  }

  private shouldSuppressError(message: string): boolean {
    const patterns = [
      'Cannot set property',
      'Failed to set window.ethereum',
      'isZerion',
      'origins don\'t match',
      'Invalid JSON message received',
      'Backpack couldn\'t override',
      'Missing `Description` or `aria-describedby`',
      'Expected length,',
      'Shims Injected:',
      'Frame detection attempt'
    ]

    return patterns.some(pattern => message.includes(pattern))
  }

  private shouldSuppressWarning(message: string): boolean {
    const patterns = [
      'You are reading this message because you opened the browser console',
      'Missing `Description` or `aria-describedby`',
      'Frame initialized: Running as standalone web app',
      'ServiceWorkerRegistration'
    ]

    return patterns.some(pattern => message.includes(pattern))
  }

  private getErrorSource(message: string): string {
    if (message.includes('ethereum') || message.includes('wallet')) return 'wallet'
    if (message.includes('frame') || message.includes('farcaster')) return 'frame'
    if (message.includes('network') || message.includes('fetch') || message.includes('csp')) return 'network'
    if (message.includes('svg') || message.includes('dialog') || message.includes('ui')) return 'ui'
    return 'unknown'
  }

  private categorizeError(message: string): ErrorInfo['type'] {
    if (message.includes('ethereum') || message.includes('wallet') || message.includes('transaction')) {
      return 'wallet'
    }
    if (message.includes('frame') || message.includes('farcaster') || message.includes('miniapp')) {
      return 'frame'
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('csp') || message.includes('connect')) {
      return 'network'
    }
    if (message.includes('svg') || message.includes('dialog') || message.includes('ui') || message.includes('component')) {
      return 'ui'
    }
    return 'unknown'
  }

  private determineSeverity(message: string): ErrorInfo['severity'] {
    if (message.includes('critical') || message.includes('fatal') || message.includes('security')) {
      return 'critical'
    }
    if (message.includes('error') || message.includes('failed') || message.includes('exception')) {
      return 'high'
    }
    if (message.includes('warning') || message.includes('deprecated') || message.includes('performance')) {
      return 'medium'
    }
    return 'low'
  }

  private shouldThrottleError(message: string): boolean {
    const now = Date.now()
    const lastTime = this.lastErrorTime.get(message) || 0
    const count = this.errorCounts.get(message) || 0

    // Throttle errors that occur too frequently
    if (now - lastTime < 5000 && count > 3) { // More than 3 times in 5 seconds
      return true
    }

    this.lastErrorTime.set(message, now)
    this.errorCounts.set(message, count + 1)

    return false
  }

  private logError(errorInfo: ErrorInfo): void {
    // Throttle noisy errors
    if (this.shouldThrottleError(errorInfo.message)) {
      return
    }

    // Add to log
    this.errorLog.push(errorInfo)

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize)
    }

    // Log to console with appropriate level
    switch (errorInfo.severity) {
      case 'critical':
        console.error(`🚨 CRITICAL: ${errorInfo.message}`)
        break
      case 'high':
        console.error(`❌ ERROR: ${errorInfo.message}`)
        break
      case 'medium':
        console.warn(`⚠️ WARNING: ${errorInfo.message}`)
        break
      default:
        console.log(`ℹ️ INFO: ${errorInfo.message}`)
    }
  }

  // Public methods
  public log(errorInfo: ErrorInfo): void {
    this.logError(errorInfo)
  }

  public getErrors(type?: ErrorInfo['type'], severity?: ErrorInfo['severity']): ErrorInfo[] {
    let filtered = this.errorLog

    if (type) {
      filtered = filtered.filter(error => error.type === type)
    }

    if (severity) {
      filtered = filtered.filter(error => error.severity === severity)
    }

    return filtered
  }

  public getErrorSummary(): {
    total: number
    byType: Record<ErrorInfo['type'], number>
    bySeverity: Record<ErrorInfo['severity'], number>
    recent: ErrorInfo[]
  } {
    const byType = {} as Record<ErrorInfo['type'], number>
    const bySeverity = {} as Record<ErrorInfo['severity'], number>

    this.errorLog.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1
    })

    return {
      total: this.errorLog.length,
      byType,
      bySeverity,
      recent: this.errorLog.slice(-10)
    }
  }

  public clearErrors(): void {
    this.errorLog = []
    this.lastErrorTime.clear()
    this.errorCounts.clear()
  }

  public setNoiseReduction(enabled: boolean): void {
    this.noiseReduction = enabled
  }

  public isNoiseReductionEnabled(): boolean {
    return this.noiseReduction
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Convenience functions
export const logWalletError = (message: string, stack?: string) => {
  errorHandler.log({
    message,
    stack,
    timestamp: Date.now(),
    source: 'wallet',
    type: 'wallet',
    severity: 'medium'
  })
}

export const logFrameError = (message: string, stack?: string) => {
  errorHandler.log({
    message,
    stack,
    timestamp: Date.now(),
    source: 'frame',
    type: 'frame',
    severity: 'medium'
  })
}

export const logNetworkError = (message: string, stack?: string) => {
  errorHandler.log({
    message,
    stack,
    timestamp: Date.now(),
    source: 'network',
    type: 'network',
    severity: 'high'
  })
}

export const logUIError = (message: string, stack?: string) => {
  errorHandler.log({
    message,
    stack,
    timestamp: Date.now(),
    source: 'ui',
    type: 'ui',
    severity: 'low'
  })
}