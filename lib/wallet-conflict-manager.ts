// Wallet Conflict Manager
// Prevents external wallet injection conflicts and manages window.ethereum properly

export class WalletConflictManager {
  private static instance: WalletConflictManager
  private isProtected = false
  private originalEthereum: any = null
  private conflictListeners: Array<() => void> = []

  private constructor() {
    this.initializeProtection()
  }

  static getInstance(): WalletConflictManager {
    if (!WalletConflictManager.instance) {
      WalletConflictManager.instance = new WalletConflictManager()
    }
    return WalletConflictManager.instance
  }

  private initializeProtection(): void {
    if (typeof window === 'undefined') return

    try {
      // Store original ethereum if it exists
      this.originalEthereum = (window as any).ethereum

      // Create protected wallet interface
      this.createProtectedWalletInterface()

      // Listen for external wallet injection attempts
      this.interceptWalletInjection()

      // Set up origin communication handling
      this.setupOriginHandling()

      this.isProtected = true
      console.log("🛡️ Wallet conflict protection initialized")
    } catch (error) {
      console.error("Failed to initialize wallet protection:", error)
    }
  }

  private createProtectedWalletInterface(): void {
    // Create a safe proxy for window.ethereum that prevents conflicts
    const safeEthereum = {
      // Core Ethereum interface - report as Farcaster wallet
      isFarcaster: true,
      isWallet: true,
      
      // Event handlers
      _listeners: new Map<string, Set<Function>>(),
      
      // Request handler with enhanced error handling
      request: async (args: { method: string; params?: any[] }) => {
        console.log("🔒 Protected wallet request:", args.method)
        
        try {
          // Handle Farcaster wallet requests
          if ((window as any).farcaster?.wallet?.request) {
            return await (window as any).farcaster.wallet.request(args)
          }
          
          // Handle SDK requests with better method mapping
          if ((window as any).farcaster?.sdk?.actions) {
            switch (args.method) {
              case 'eth_requestAccounts':
              case 'eth_accounts':
                const address = (window as any).farcaster?.wallet?.address
                return address ? [address] : []
              
              case 'eth_chainId':
                const chainId = (window as any).farcaster?.wallet?.chainId || '8453'
                return '0x' + parseInt(chainId).toString(16)
              
              case 'eth_sendTransaction':
                if ((window as any).farcaster?.wallet?.sendTransaction) {
                  return await (window as any).farcaster.wallet.sendTransaction(args.params?.[0])
                }
                break
              
              case 'personal_sign':
                if ((window as any).farcaster?.wallet?.signMessage) {
                  return await (window as any).farcaster.wallet.signMessage(args.params?.[0])
                }
                break
              
              case 'wallet_switchEthereumChain':
                // Frame wallets typically don't support chain switching
                console.warn("Chain switching not supported in frame environment")
                return null
            }
          }

          // If we get here, method is not supported
          throw new Error(`Method ${args.method} not supported in frame environment`)
        } catch (error) {
          console.error("Wallet request failed:", error)
          throw error
        }
      },

      // Event listener management with better cleanup
      on: (event: string, callback: Function) => {
        if (!(safeEthereum as any)._listeners) {
          (safeEthereum as any)._listeners = new Map<string, Set<Function>>()
        }
        if (!(safeEthereum as any)._listeners.has(event)) {
          (safeEthereum as any)._listeners.set(event, new Set())
        }
        (safeEthereum as any)._listeners.get(event)!.add(callback)

        // Forward to Farcaster wallet if available
        if ((window as any).farcaster?.wallet?.on) {
          (window as any).farcaster.wallet.on(event, callback)
        }

        return () => {
          safeEthereum.removeListener(event, callback)
        }
      },

      removeListener: (event: string, callback: Function) => {
        const listeners = (safeEthereum as any)._listeners.get(event)
        if (listeners) {
          listeners.delete(callback)
        }
      },

      // Add isConnected property for better compatibility
      get isConnected() {
        return !!(window as any).farcaster?.wallet?.address
      },

      // Add selectedAddress property for compatibility
      get selectedAddress() {
        return (window as any).farcaster?.wallet?.address || null
      }
    }

    // Store the safe interface in a protected property
    ;(window as any).__protectedEthereum = safeEthereum

    // Define window.ethereum with protection against redefinition
    Object.defineProperty(window, 'ethereum', {
      get: () => (window as any).__protectedEthereum,
      configurable: false,
      enumerable: true
    })
  }

  private interceptWalletInjection(): void {
    // Override Object.defineProperty to prevent external wallets from redefining properties
    const originalDefineProperty = Object.defineProperty
    
    Object.defineProperty = function(obj: any, prop: PropertyKey, descriptor: PropertyDescriptor) {
      // Allow our own properties to be defined
      if (obj === window && (prop === 'ethereum' || prop === 'isZerion' || String(prop).startsWith('eth_'))) {
        // Block all external wallet property injections silently
        console.debug(`🛡️ Blocked external wallet property injection: ${String(prop)}`)
        return obj // Silently block the redefinition
      }
      
      return originalDefineProperty.call(this, obj, prop, descriptor)
    }

    // Also protect against direct property assignment
    const originalSet = Object.getOwnPropertyDescriptor(window, 'ethereum')?.set
    if (originalSet) {
      Object.defineProperty(window, 'ethereum', {
        get: () => (window as any).__protectedEthereum,
        set: () => {
          console.debug('🛡️ Blocked direct window.ethereum assignment')
          // Silently ignore
        },
        configurable: false,
        enumerable: true
      })
    }

    // Set up MutationObserver to detect and remove external wallet scripts
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              
              // Check for suspicious wallet injection scripts
              if (element.tagName === 'SCRIPT' && element.textContent) {
                const content = element.textContent
                if (content.includes('window.ethereum') ||
                    content.includes('isZerion') ||
                    content.includes('requestProvider')) {
                  // Only log very rarely to reduce noise
                  if (Math.random() < 0.005) { // 0.5% of the time
                    console.debug('🛡️ Removed suspicious wallet injection script')
                  }
                  element.parentNode?.removeChild(element)
                }
              }
            }
          })
        })
      })

      observer.observe(document.head, { childList: true, subtree: true })
    }
  }

  private setupOriginHandling(): void {
    // Enhanced origin validation with wildcard support
    const isAllowedOrigin = (origin: string): boolean => {
      const allowedOrigins = [
        'https://farcaster.xyz',
        'https://client.farcaster.xyz',
        'https://wallet.farcaster.xyz',
        'https://privy.farcaster.xyz',
        'https://warpcast.com',
        'https://client.warpcast.com',
        'https://privy.warpcast.com'
      ]
      
      // Check exact match first
      if (allowedOrigins.includes(origin)) {
        return true
      }
      
      // Check for Farcaster subdomain pattern
      if (origin.endsWith('.farcaster.xyz') || origin.endsWith('.warpcast.com')) {
        return true
      }
      
      return false
    }

    // Handle incoming messages with better error handling
    window.addEventListener('message', (event) => {
      // Skip messages without data or from our own window
      if (!event.data || event.source === window) {
        return
      }
      
      const origin = event.origin || 'unknown'
      
      // Log cross-origin messages but don't block them if they're from Farcaster domains
      if (origin !== window.location.origin) {
        if (isAllowedOrigin(origin)) {
          console.log(`📨 Accepting message from Farcaster domain: ${origin}`)
        } else {
          console.log(`📨 Cross-origin message from ${origin}`)
        }
      }
      
      // Process messages from allowed origins
      if (isAllowedOrigin(origin) || origin === window.location.origin) {
        // Handle specific message types
        if (event.data.type === 'WALLET_REQUEST') {
          this.handleWalletRequest(event)
        } else if (event.data.type === 'WALLET_STATUS') {
          this.handleWalletStatus(event)
        }
      }
    })

    // Enhanced frame communication with retry logic
    const setupFrameCommunication = () => {
      try {
        if (window.parent !== window) {
          console.log("🖼️ Running in iframe, setting up enhanced frame communication")
          
          const sendInitialization = () => {
            try {
              window.parent.postMessage({
                type: 'WALLET_INITIALIZED',
                origin: window.location.origin,
                timestamp: Date.now(),
                hasWallet: !!(window as any).farcaster?.wallet,
                walletAddress: (window as any).farcaster?.wallet?.address || null
              }, '*')
            } catch (error) {
              console.warn('Failed to send initialization message:', error)
            }
          }
          
          // Send initial message
          sendInitialization()
          
          // Set up periodic heartbeat
          const heartbeatInterval = setInterval(sendInitialization, 5000)
          
          // Clean up on page unload
          window.addEventListener('beforeunload', () => {
            clearInterval(heartbeatInterval)
          })
        }
      } catch (error) {
        console.warn("Enhanced frame communication setup failed:", error)
      }
    }

    // Initialize frame communication after a short delay
    setTimeout(setupFrameCommunication, 1000)
  }

  private handleWalletRequest(event: MessageEvent): void {
    try {
      const { data } = event
      if (data.type === 'WALLET_REQUEST' && data.method) {
        const result = this.processWalletRequest(data.method, data.params)
        event.source?.postMessage({
          type: 'WALLET_RESPONSE',
          requestId: data.requestId,
          result,
          error: null
        }, event.origin as any)
      }
    } catch (error) {
      const { data } = event
      event.source?.postMessage({
        type: 'WALLET_RESPONSE',
        requestId: data.requestId,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, event.origin as any)
    }
  }

  private handleWalletStatus(event: MessageEvent): void {
    try {
      const walletStatus = {
        isConnected: !!(window as any).farcaster?.wallet?.address,
        address: (window as any).farcaster?.wallet?.address || null,
        chainId: (window as any).farcaster?.wallet?.chainId || null,
        timestamp: Date.now()
      }
      
      event.source?.postMessage({
        type: 'WALLET_STATUS_RESPONSE',
        status: walletStatus
      }, event.origin as any)
    } catch (error) {
      console.error('Failed to handle wallet status request:', error)
    }
  }

  private processWalletRequest(method: string, params?: any[]): any {
    const farcaster = (window as any).farcaster
    
    switch (method) {
      case 'eth_accounts':
        return farcaster?.wallet?.address ? [farcaster.wallet.address] : []
      
      case 'eth_chainId':
        const chainId = farcaster?.wallet?.chainId || '8453'
        return '0x' + parseInt(chainId).toString(16)
      
      case 'eth_requestAccounts':
        // Frame wallets typically auto-connect, so return current account if available
        return farcaster?.wallet?.address ? [farcaster.wallet.address] : []
      
      default:
        throw new Error(`Method ${method} not supported`)
    }
  }

  // Public methods for external use
  public getSafeEthereum(): any {
    return (window as any).ethereum
  }

  public isFrameEnvironment(): boolean {
    return !!(window as any).farcaster
  }

  public getFarcasterWallet(): any {
    return (window as any).farcaster?.wallet || null
  }

  public onConflict(callback: () => void): () => void {
    this.conflictListeners.push(callback)
    return () => {
      const index = this.conflictListeners.indexOf(callback)
      if (index > -1) {
        this.conflictListeners.splice(index, 1)
      }
    }
  }

  private emitConflict(): void {
    this.conflictListeners.forEach(callback => callback())
  }

  // Cleanup method
  public destroy(): void {
    try {
      // Restore original ethereum if it existed
      if (this.originalEthereum !== null) {
        Object.defineProperty(window, 'ethereum', {
          value: this.originalEthereum,
          writable: true,
          configurable: true
        })
      } else {
        delete (window as any).ethereum
      }

      this.isProtected = false
      console.log("🧹 Wallet protection cleanup completed")
    } catch (error) {
      console.error("Cleanup failed:", error)
    }
  }
}

// Export singleton instance
export const walletConflictManager = WalletConflictManager.getInstance()