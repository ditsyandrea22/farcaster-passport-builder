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
      // Core Ethereum interface
      isMetaMask: false,
      isWalletConnect: false,
      isCoinbaseWallet: false,
      
      // Event handlers
      _listeners: new Map<string, Set<Function>>(),
      
      // Request handler
      request: async (args: { method: string; params?: any[] }) => {
        console.log("🔒 Protected wallet request:", args.method)
        
        // Handle Farcaster wallet requests
        if ((window as any).farcaster?.wallet?.request) {
          try {
            return await (window as any).farcaster.wallet.request(args)
          } catch (error) {
            console.error("Farcaster wallet request failed:", error)
            throw error
          }
        }
        
        // Handle SDK requests
        if ((window as any).farcaster?.sdk?.actions) {
          switch (args.method) {
            case 'eth_requestAccounts':
            case 'eth_accounts':
              return (window as any).farcaster?.wallet?.address ? [(window as any).farcaster.wallet.address] : []
            
            case 'eth_chainId':
              return '0x' + parseInt((window as any).farcaster?.wallet?.chainId || '8453').toString(16)
            
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
          }
        }

        throw new Error(`Method ${args.method} not supported`)
      },

      // Event listener management
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
          const listeners = (safeEthereum as any)._listeners.get(event)
          if (listeners) {
            listeners.delete(callback)
          }
        }
      },

      removeListener: (event: string, callback: Function) => {
        const listeners = (safeEthereum as any)._listeners.get(event)
        if (listeners) {
          listeners.delete(callback)
        }
      }
    }

    // Define window.ethereum with protection against redefinition
    Object.defineProperty(window, 'ethereum', {
      get: () => safeEthereum,
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
        // Only log very occasionally to reduce noise significantly
        if (Math.random() < 0.01) { // 1% of the time
          console.debug(`🛡️ Blocked external wallet property injection: ${String(prop)}`)
        }
        return obj // Silently block the redefinition
      }
      
      return originalDefineProperty.call(this, obj, prop, descriptor)
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
    // Handle origin mismatches gracefully
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) {
        console.log(`📨 Cross-origin message from ${event.origin}`)
        
        // Don't process messages from unauthorized origins
        const allowedOrigins = [
          'https://farcaster.xyz',
          'https://client.farcaster.xyz',
          'https://wallet.farcaster.xyz',
          'https://warpcast.com',
          'https://client.warpcast.com'
        ]
        
        if (!allowedOrigins.includes(event.origin)) {
          // Only log very rarely to reduce noise
          if (Math.random() < 0.002) { // 0.2% of the time
            console.debug(`🛡️ Blocking message from unauthorized origin: ${event.origin}`)
          }
          return
        }
      }
    })

    // Handle frame communication
    try {
      if (window.parent !== window) {
        console.log("🖼️ Running in iframe, setting up frame communication")
        
        // Notify parent of successful initialization
        window.parent.postMessage({
          type: 'WALLET_INITIALIZED',
          origin: window.location.origin,
          hasWallet: !!(window as any).farcaster?.wallet
        }, '*')
      }
    } catch (error) {
      console.warn("Frame communication setup failed:", error)
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