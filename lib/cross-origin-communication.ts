// Cross-Origin Communication Handler
// Manages postMessage communication between different Farcaster domains

export interface CrossOriginMessage {
  type: string
  [key: string]: any
}

export interface CrossOriginConfig {
  allowedOrigins: string[]
  timeout?: number
  retryAttempts?: number
}

export class CrossOriginCommunication {
  private static instance: CrossOriginCommunication
  private config: CrossOriginConfig
  private messageQueue: Map<string, {
    resolve: Function
    reject: Function
    timeout: NodeJS.Timeout
  }> = new Map()
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {
    this.config = {
      allowedOrigins: [
        'https://farcaster.xyz',
        'https://client.farcaster.xyz',
        'https://wallet.farcaster.xyz',
        'https://privy.farcaster.xyz',
        'https://warpcast.com',
        'https://client.warpcast.com',
        'https://privy.warpcast.com'
      ],
      timeout: 10000,
      retryAttempts: 3
    }
    
    this.setupMessageListener()
  }

  static getInstance(): CrossOriginCommunication {
    if (!CrossOriginCommunication.instance) {
      CrossOriginCommunication.instance = new CrossOriginCommunication()
    }
    return CrossOriginCommunication.instance
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Skip messages without data or from our own window
      if (!event.data || event.source === window) {
        return
      }

      const origin = event.origin || 'unknown'
      
      // Log cross-origin messages for debugging
      if (origin !== window.location.origin) {
        console.log(`📨 Cross-origin message from ${origin}:`, event.data.type)
      }

      // Handle response messages (have requestId)
      if (event.data.requestId && this.messageQueue.has(event.data.requestId)) {
        const queued = this.messageQueue.get(event.data.requestId)!
        clearTimeout(queued.timeout)
        
        if (event.data.error) {
          queued.reject(new Error(event.data.error))
        } else {
          queued.resolve(event.data.result)
        }
        
        this.messageQueue.delete(event.data.requestId)
        return
      }

      // Handle event messages (no requestId)
      this.emit(event.data.type, event.data, origin)
    })
  }

  private isAllowedOrigin(origin: string): boolean {
    // Check exact match first
    if (this.config.allowedOrigins.includes(origin)) {
      return true
    }
    
    // Check for Farcaster subdomain pattern
    if (origin.endsWith('.farcaster.xyz') || origin.endsWith('.warpcast.com')) {
      return true
    }
    
    return false
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private emit(type: string, data: any, origin: string): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data, origin)
        } catch (error) {
          console.error(`Error in message listener for ${type}:`, error)
        }
      })
    }
  }

  public on(type: string, callback: Function): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)!.push(callback)
    
    return () => {
      const listeners = this.listeners.get(type)
      if (listeners) {
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  public sendMessage(
    targetWindow: Window,
    message: CrossOriginMessage,
    targetOrigin?: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId()
      const messageWithId = { ...message, requestId }
      
      // Set up timeout
      const timeout = setTimeout(() => {
        this.messageQueue.delete(requestId)
        reject(new Error(`Message timeout after ${this.config.timeout}ms`))
      }, this.config.timeout!)
      
      // Queue the message
      this.messageQueue.set(requestId, { resolve, reject, timeout })
      
      try {
        // Determine target origin
        const origin = targetOrigin || (targetWindow.location?.origin || '*')
        
        // Send the message
        targetWindow.postMessage(messageWithId, origin)
        console.log(`📤 Sent message to ${origin}:`, message.type)
      } catch (error) {
        clearTimeout(timeout)
        this.messageQueue.delete(requestId)
        reject(error)
      }
    })
  }

  public broadcastMessage(message: CrossOriginMessage): void {
    // In a frame environment, try to communicate with parent
    if (window.parent && window.parent !== window) {
      try {
        this.sendMessage(window.parent, message)
      } catch (error) {
        console.warn('Failed to send message to parent:', error)
      }
    }
    
    // Also emit locally for same-origin listeners
    this.emit(message.type, message, window.location.origin)
  }

  public requestWalletInfo(): Promise<any> {
    return new Promise((resolve) => {
      // Try multiple sources for wallet info
      const sources = [
        () => (window as any).farcaster?.wallet,
        () => (window as any).farcaster?.sdk?.wallet,
        () => (window as any).__FARCASTER__?.wallet,
        () => (window as any).__MINIAPP__?.wallet
      ]
      
      for (const source of sources) {
        try {
          const wallet = source()
          if (wallet?.address) {
            resolve({
              isConnected: true,
              address: wallet.address,
              chainId: wallet.chainId || '8453',
              source: 'direct'
            })
            return
          }
        } catch (error) {
          // Continue to next source
        }
      }
      
      // If no wallet found, resolve with disconnected state
      resolve({
        isConnected: false,
        address: null,
        chainId: null,
        source: 'none'
      })
    })
  }

  public validateOrigin(origin: string): boolean {
    return this.isAllowedOrigin(origin)
  }

  public getAllowedOrigins(): string[] {
    return [...this.config.allowedOrigins]
  }
}

// Export singleton instance
export const crossOriginComm = CrossOriginCommunication.getInstance()