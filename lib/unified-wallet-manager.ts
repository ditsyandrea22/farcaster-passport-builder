/**
 * Unified Wallet Manager
 * 
 * Single source of truth for wallet detection and management
 * Consolidates multiple detection systems into one reliable implementation
 * Properly handles SSR (Server-Side Rendering) to prevent build errors
 * Uses safe property access to prevent conflicts with wallet extensions
 */

import { 
  safeGetProperty, 
  safeGetPropertyDescriptor, 
  safeGetWindowEthereum,
  safeGetWalletAddress 
} from './safe-property-access'

export interface WalletConnectionState {
  isConnected: boolean
  address: string | null
  chainId: string | null
  balance: string | null
  networkName: string | null
  lastUpdated: number
  connectionMethod: 'sdk' | 'direct' | 'frameContext' | 'window' | null
}

export interface TransactionRequest {
  to: string
  data: string
  value?: string
  gasLimit?: string
  gasPrice?: string
  nonce?: string
}

export interface TransactionResult {
  hash: string
  status: 'pending' | 'success' | 'failed'
  confirmations: number
  timestamp: number
}

export class UnifiedWalletManager {
  private static instance: UnifiedWalletManager
  private currentState: WalletConnectionState = {
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    networkName: null,
    lastUpdated: 0,
    connectionMethod: null
  }
  
  private eventListeners: Map<string, Function[]> = new Map()
  private isInitialized = false
  private isInitializing = false
  private readyCalled = false
  private detectionStarted = false

  private constructor() {}

  static getInstance(): UnifiedWalletManager {
    if (!UnifiedWalletManager.instance) {
      UnifiedWalletManager.instance = new UnifiedWalletManager()
    }
    return UnifiedWalletManager.instance
  }

  // Get current wallet state
  getCurrentState(): WalletConnectionState {
    return { ...this.currentState }
  }

  // Initialize the wallet manager - should be called once at app startup
  async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      return
    }

    // Prevent initialization during SSR
    if (typeof window === 'undefined') {
      return
    }

    this.isInitializing = true
    console.log("🚀 Initializing Unified Wallet Manager...")

    try {
      // Call sdk.actions.ready() immediately for Mini App compatibility
      await this.callSDKReady()
      
      // Start detection process
      await this.detectWallet()
      
      this.isInitialized = true
      console.log("✅ Unified Wallet Manager initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize wallet manager:", error)
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  // Call sdk.actions.ready() once and only once
  private async callSDKReady(): Promise<void> {
    if (this.readyCalled || typeof window === 'undefined') {
      return
    }

    const sdk = this.getSDK()
    if (sdk?.actions?.ready && !this.readyCalled) {
      try {
        console.log("📞 Calling sdk.actions.ready()...")
        await sdk.actions.ready()
        this.readyCalled = true
        console.log("✅ SDK ready called successfully")
      } catch (error) {
        console.warn("⚠️ SDK ready call failed (this is often normal):", error)
        // Don't throw - ready() might fail in web environment
        this.readyCalled = true
      }
    }
  }

  // Get SDK from any available location using safe property access
  private getSDK(): any {
    if (typeof window === 'undefined') return null
    
    try {
      const farcasterSDK = safeGetProperty(window, 'farcaster.sdk') ||
                           safeGetProperty(window, '__FARCASTER__.sdk') ||
                           safeGetProperty(window, '__MINIAPP__.sdk')
      
      return farcasterSDK || null
    } catch (error) {
      console.warn("⚠️ SDK access failed:", error)
      return null
    }
  }

  // Get Farcaster object from any available location using safe property access
  private getFarcaster(): any {
    if (typeof window === 'undefined') return null
    
    try {
      const farcaster = safeGetProperty(window, 'farcaster') ||
                        safeGetProperty(window, '__FARCASTER__') ||
                        safeGetProperty(window, '__MINIAPP__')
      
      return farcaster || null
    } catch (error) {
      console.warn("⚠️ Farcaster object access failed:", error)
      return null
    }
  }

  // Single, reliable wallet detection method
  async detectWallet(): Promise<WalletConnectionState> {
    if (this.detectionStarted || typeof window === 'undefined') {
      return this.currentState
    }

    this.detectionStarted = true

    try {
      const farcaster = this.getFarcaster()
      const sdk = this.getSDK()

      console.log("🔍 Starting unified wallet detection:", {
        hasFarcaster: !!farcaster,
        hasSDK: !!sdk,
        timestamp: Date.now()
      })

      // Method 1: Direct wallet (highest priority)
      if (farcaster?.wallet?.address) {
        console.log("✅ Direct wallet found:", farcaster.wallet.address)
        return this.updateWalletState({
          isConnected: true,
          address: farcaster.wallet.address,
          chainId: farcaster.wallet.chainId || "8453",
          connectionMethod: 'direct'
        })
      }

      // Method 2: SDK wallet
      if (sdk?.wallet?.address) {
        console.log("✅ SDK wallet found:", sdk.wallet.address)
        return this.updateWalletState({
          isConnected: true,
          address: sdk.wallet.address,
          chainId: sdk.wallet.chainId || "8453",
          connectionMethod: 'sdk'
        })
      }

      // Method 3: Frame context wallet
      if (farcaster?.frameContext?.wallet?.address) {
        console.log("✅ Frame context wallet found:", farcaster.frameContext.wallet.address)
        return this.updateWalletState({
          isConnected: true,
          address: farcaster.frameContext.wallet.address,
          chainId: farcaster.frameContext.wallet.chainId || "8453",
          connectionMethod: 'frameContext'
        })
      }

      // Method 4: SDK context wallet
      if (sdk?.context?.wallet?.address) {
        console.log("✅ SDK context wallet found:", sdk.context.wallet.address)
        return this.updateWalletState({
          isConnected: true,
          address: sdk.context.wallet.address,
          chainId: sdk.context.wallet.chainId || "8453",
          connectionMethod: 'sdk'
        })
      }

      // Method 5: Window fallback (only if in iframe) - using safe access
      if (window.self !== window.top) {
        try {
          // Use safe window.ethereum access to prevent conflicts
          const ethereum = safeGetWindowEthereum(window)
          
          if (ethereum && ethereum.selectedAddress) {
            const windowWallet = ethereum.selectedAddress
            if (windowWallet) {
              console.log("✅ Window wallet found:", windowWallet)
              return this.updateWalletState({
                isConnected: true,
                address: windowWallet,
                chainId: "8453",
                connectionMethod: 'window'
              })
            }
          }
        } catch (error) {
          console.warn("⚠️ Window wallet access failed (this is often normal):", error)
          // Continue without throwing - window.ethereum conflicts are common
        }
      }

      // No wallet found
      console.log("⚠️ No wallet found during detection")
      return this.updateWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        connectionMethod: null
      })

    } catch (error) {
      console.error("❌ Wallet detection error:", error)
      return this.updateWalletState({
        isConnected: false,
        address: null,
        chainId: null,
        connectionMethod: null
      })
    }
  }

  // Update wallet state and emit events
  private updateWalletState(newState: Partial<WalletConnectionState>): WalletConnectionState {
    const oldState = this.currentState
    this.currentState = {
      ...this.currentState,
      ...newState,
      networkName: this.getNetworkName(newState.chainId || this.currentState.chainId),
      lastUpdated: Date.now()
    }

    // Emit events based on state changes
    if (!oldState.isConnected && this.currentState.isConnected) {
      this.emit('walletConnected', this.currentState)
    } else if (oldState.isConnected && !this.currentState.isConnected) {
      this.emit('walletDisconnected', null)
    } else if (oldState.address !== this.currentState.address) {
      this.emit('walletAddressChanged', this.currentState)
    }

    console.log("📊 Wallet state updated:", this.currentState)
    return this.currentState
  }

  // Send transaction using the most reliable method available
  async sendTransaction(tx: TransactionRequest): Promise<TransactionResult> {
    if (!this.currentState.isConnected || !this.currentState.address) {
      throw new Error("Wallet not connected")
    }

    if (typeof window === 'undefined') {
      throw new Error("Transactions can only be sent from client-side")
    }

    const farcaster = this.getFarcaster()
    const sdk = this.getSDK()

    // Transaction methods in order of reliability
    const methods = [
      () => farcaster?.wallet?.sendTransaction?.(tx),
      () => sdk?.actions?.transaction?.(tx),
      () => sdk?.actions?.sendTransaction?.(tx),
      () => farcaster?.frameContext?.wallet?.sendTransaction?.(tx)
    ]

    let lastError: Error | null = null

    for (const method of methods) {
      try {
        const result = await method()
        if (result?.hash) {
          const txResult: TransactionResult = {
            hash: result.hash,
            status: 'pending',
            confirmations: 0,
            timestamp: Date.now()
          }
          
          this.emit('transactionSent', txResult)
          return txResult
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown transaction error")
        continue
      }
    }

    throw new Error(`Transaction failed: ${lastError?.message}`)
  }

  // Request wallet connection
  async requestConnection(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error("Connection can only be requested from client-side")
    }
    
    const sdk = this.getSDK()
    
    const methods = [
      'requestWallet',
      'connectWallet', 
      'openWallet',
      'requestConnection'
    ]

    for (const methodName of methods) {
      try {
        if (sdk?.actions?.[methodName]) {
          console.log(`📱 Calling ${methodName}...`)
          await sdk.actions[methodName]()
          this.emit('connectionRequested', { method: methodName })
          return
        }
      } catch (error) {
        console.warn(`⚠️ Connection method ${methodName} failed:`, error)
        continue
      }
    }

    throw new Error("No wallet connection method available")
  }

  // Load balance for current wallet
  async loadBalance(): Promise<void> {
    if (!this.currentState.address || typeof window === 'undefined') {
      return
    }

    try {
      const balance = await this.fetchBalanceFromRPC(this.currentState.address)
      this.updateWalletState({ balance })
      this.emit('balanceUpdated', { balance, address: this.currentState.address })
    } catch (error) {
      console.error("Failed to load balance:", error)
      this.emit('balanceError', { error: error instanceof Error ? error.message : "Failed to load balance" })
    }
  }

  // Fetch balance from RPC
  private async fetchBalanceFromRPC(address: string): Promise<string> {
    const rpcProviders = [
      'https://base-mainnet.g.alchemy.com/v2/demo',
      'https://base.drpc.org',
      'https://base.gateway.tenderly.co'
    ]

    for (const rpcUrl of rpcProviders) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBalance',
            params: [address, 'latest']
          })
        })
        
        const data = await response.json()
        if (data.result) {
          const wei = parseInt(data.result, 16)
          const ether = wei / 1e18
          return `${ether.toFixed(6)} ETH`
        }
      } catch (error) {
        console.warn(`RPC provider ${rpcUrl} failed:`, error)
        continue
      }
    }
    
    throw new Error("All RPC providers failed")
  }

  // Get network name from chain ID
  private getNetworkName(chainId: string | null): string | null {
    if (!chainId) return null
    
    const networks: Record<string, string> = {
      "1": "Ethereum",
      "137": "Polygon", 
      "8453": "Base",
      "42161": "Arbitrum",
      "10": "Optimism"
    }
    return networks[chainId] || "Unknown Network"
  }

  // Event system
  on(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
    
    return () => {
      const listeners = this.eventListeners.get(event)
      if (listeners) {
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  // Check if we're in a frame environment
  isInFrame(): boolean {
    if (typeof window === 'undefined') return false
    return !!this.getFarcaster()
  }

  // Retry detection
  async retryDetection(): Promise<void> {
    if (typeof window === 'undefined') return
    
    console.log("🔄 Retrying wallet detection...")
    this.detectionStarted = false
    await this.detectWallet()
  }

  // Reset state
  reset(): void {
    this.currentState = {
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      networkName: null,
      lastUpdated: 0,
      connectionMethod: null
    }
    this.detectionStarted = false
    this.emit('walletDisconnected', null)
  }
}

// Export singleton instance
export const unifiedWalletManager = UnifiedWalletManager.getInstance()