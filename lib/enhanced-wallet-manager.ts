// Enhanced FarCaster Wallet Manager
// Implements advanced wallet detection, connection handling, and transaction management
// Based on best practices from successful FarCaster mini apps

export interface WalletConnectionState {
  isConnected: boolean
  address: string | null
  chainId: string | null
  balance: string | null
  networkName: string | null
  lastUpdated: number
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

export class EnhancedWalletManager {
  private static instance: EnhancedWalletManager
  private currentState: WalletConnectionState = {
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    networkName: null,
    lastUpdated: 0
  }
  
  private eventListeners: Map<string, Function[]> = new Map()
  private detectionAttempts = 0
  private maxAttempts = 20
  private isInitializing = false
  
  private readonly WALLET_PRIORITIES = [
    // Priority 1: Direct wallet (most reliable)
    (farcaster: any) => farcaster?.wallet?.address ? {
      wallet: farcaster.wallet,
      method: 'direct',
      reliability: 1.0
    } : null,
    
    // Priority 2: Frame context wallet  
    (farcaster: any) => farcaster?.frameContext?.wallet?.address ? {
      wallet: farcaster.frameContext.wallet,
      method: 'frameContext',
      reliability: 0.9
    } : null,
    
    // Priority 3: SDK wallet
    (farcaster: any) => farcaster?.sdk?.wallet?.address ? {
      wallet: farcaster.sdk.wallet,
      method: 'sdk',
      reliability: 0.8
    } : null,
    
    // Priority 4: SDK context wallet
    (farcaster: any) => farcaster?.sdk?.context?.wallet?.address ? {
      wallet: farcaster.sdk.context.wallet,
      method: 'sdkContext',
      reliability: 0.7
    } : null,
    
    // Priority 5: Mini app wallet
    (farcaster: any) => farcaster?.miniApp?.wallet?.address ? {
      wallet: farcaster.miniApp.wallet,
      method: 'miniApp',
      reliability: 0.6
    } : null,
    
    // Priority 6: Window wallet (fallback)
    (farcaster: any) => {
      const windowWallet = (window as any).ethereum?.selectedAddress || (window as any).farcasterWallet?.address
      return windowWallet ? {
        wallet: { address: windowWallet, chainId: "8453" },
        method: 'window',
        reliability: 0.5
      } : null
    }
  ]

  private constructor() {}

  static getInstance(): EnhancedWalletManager {
    if (!EnhancedWalletManager.instance) {
      EnhancedWalletManager.instance = new EnhancedWalletManager()
    }
    return EnhancedWalletManager.instance
  }

  // Get current wallet state without triggering detection
  getState(): WalletConnectionState {
    return this.currentState
  }

  // Get state asynchronously, will attempt detection if needed
  async getStateAsync(): Promise<WalletConnectionState> {
    if (this.currentState.isConnected) {
      return this.currentState
    }
    // If not connected, try detection once
    return await this.detectWallet()
  }

  // Simplified wallet detection with timeout
  async detectWallet(): Promise<WalletConnectionState> {
    if (typeof window === 'undefined' || this.isInitializing) {
      return this.currentState
    }

    this.isInitializing = true
    this.detectionAttempts++

    try {
      const farcaster = (window as any).farcaster
      
      console.log(`🔍 Simplified wallet detection attempt ${this.detectionAttempts}:`, {
        hasFarcaster: !!farcaster,
        timestamp: Date.now()
      })

      // Quick detection - only try direct methods first
      if (farcaster?.wallet?.address) {
        console.log("✅ Direct wallet found:", farcaster.wallet.address)
        
        this.currentState = {
          isConnected: true,
          address: farcaster.wallet.address,
          chainId: farcaster.wallet.chainId || "8453",
          balance: null,
          networkName: "Base",
          lastUpdated: Date.now()
        }
        
        this.emit('walletConnected', this.currentState)
        return this.currentState
      }
      
      // Quick SDK detection
      if (farcaster?.sdk?.wallet?.address) {
        console.log("✅ SDK wallet found:", farcaster.sdk.wallet.address)
        
        this.currentState = {
          isConnected: true,
          address: farcaster.sdk.wallet.address,
          chainId: farcaster.sdk.wallet.chainId || "8453",
          balance: null,
          networkName: "Base",
          lastUpdated: Date.now()
        }
        
        this.emit('walletConnected', this.currentState)
        return this.currentState
      }
      
      // Frame context detection
      if (farcaster?.frameContext?.wallet?.address) {
        console.log("✅ Frame context wallet found:", farcaster.frameContext.wallet.address)
        
        this.currentState = {
          isConnected: true,
          address: farcaster.frameContext.wallet.address,
          chainId: farcaster.frameContext.wallet.chainId || "8453",
          balance: null,
          networkName: "Base",
          lastUpdated: Date.now()
        }
        
        this.emit('walletConnected', this.currentState)
        return this.currentState
      }

      // No wallet found - return disconnected state
      console.log("⚠️ No wallet found, returning disconnected state")
      this.currentState = {
        isConnected: false,
        address: null,
        chainId: "8453",
        balance: null,
        networkName: "Base",
        lastUpdated: Date.now()
      }

      // Only retry a few times with shorter delays
      if (this.detectionAttempts < 5) {
        setTimeout(() => this.detectWallet(), 500 * this.detectionAttempts)
      } else {
        console.warn("⚠️ Wallet detection completed - no wallet found")
      }

    } catch (error) {
      console.error("❌ Wallet detection error:", error)
      this.emit('walletError', { error: error instanceof Error ? error.message : "Unknown error" })
      
      // Return disconnected state on error
      this.currentState = {
        isConnected: false,
        address: null,
        chainId: "8453",
        balance: null,
        networkName: "Base",
        lastUpdated: Date.now()
      }
    } finally {
      this.isInitializing = false
    }

    return this.currentState
  }

  // Enhanced transaction sending with real gas estimation and multiple fallback strategies
  async sendTransaction(tx: TransactionRequest): Promise<TransactionResult> {
    const farcaster = (window as any).farcaster
    
    if (!this.currentState.isConnected || !this.currentState.address) {
      throw new Error("Wallet not connected")
    }

    const startTime = Date.now()
    console.log("💳 Starting transaction:", { ...tx, timestamp: startTime })

    try {
      // Estimate gas before sending
      if (!tx.gasLimit) {
        console.log("⛽ Estimating gas...")
        tx.gasLimit = await this.estimateGas(tx)
        console.log(`✅ Gas estimated: ${tx.gasLimit}`)
      }

      // Validate transaction before sending
      this.validateTransaction(tx)

    } catch (error) {
      console.error("❌ Transaction preparation failed:", error)
      throw new Error(`Transaction preparation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }

    // Try multiple transaction methods
    const transactionMethods = [
      // Method 1: Direct SDK transaction (most reliable)
      {
        name: 'sdk.transaction',
        method: () => farcaster?.sdk?.actions?.transaction?.(tx),
        reliability: 1.0
      },
      
      // Method 2: Direct wallet transaction
      {
        name: 'direct.wallet.sendTransaction',
        method: () => farcaster?.wallet?.sendTransaction?.(tx),
        reliability: 0.9
      },
      
      // Method 3: Mini app specific transaction
      {
        name: 'miniApp.transaction',
        method: () => farcaster?.miniApp?.wallet?.sendTransaction?.(tx),
        reliability: 0.8
      },
      
      // Method 4: Alternative SDK methods
      {
        name: 'sdk.sendTransaction',
        method: () => farcaster?.sdk?.actions?.sendTransaction?.(tx),
        reliability: 0.7
      },
      
      // Method 5: Frame context transaction
      {
        name: 'frameContext.transaction',
        method: () => farcaster?.frameContext?.wallet?.sendTransaction?.(tx),
        reliability: 0.6
      }
    ]

    let lastError: Error | null = null
    
    for (const txMethod of transactionMethods) {
      try {
        console.log(`📤 Trying transaction method: ${txMethod.name}`)
        const result = await txMethod.method()
        
        if (result && result.hash) {
          const txResult: TransactionResult = {
            hash: result.hash,
            status: 'pending',
            confirmations: 0,
            timestamp: startTime
          }
          
          console.log(`✅ Transaction successful via ${txMethod.name}:`, txResult)
          this.emit('transactionSent', txResult)
          
          // Start monitoring transaction status
          this.monitorTransaction(txResult.hash)
          
          return txResult
        }
      } catch (error) {
        console.warn(`⚠️ Transaction method ${txMethod.name} failed:`, error)
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes('insufficient funds')) {
            throw new Error("Insufficient funds for transaction")
          } else if (error.message.includes('user rejected')) {
            throw new Error("Transaction rejected by user")
          } else if (error.message.includes('gas')) {
            throw new Error("Gas estimation failed")
          }
        }
        
        lastError = error instanceof Error ? error : new Error("Unknown transaction error")
        continue
      }
    }

    // All methods failed
    const finalError = new Error(`All transaction methods failed. Last error: ${lastError?.message}`)
    console.error("❌ Transaction completely failed:", finalError)
    this.emit('transactionFailed', { error: finalError, tx })
    throw finalError
  }

  // Validate transaction parameters
  private validateTransaction(tx: TransactionRequest): void {
    if (!tx.to || !/^0x[a-fA-F0-9]{40}$/.test(tx.to)) {
      throw new Error("Invalid recipient address")
    }
    
    if (tx.data && !/^0x[a-fA-F0-9]*$/.test(tx.data)) {
      throw new Error("Invalid transaction data")
    }
    
    if (tx.value && (!/^\d+$/.test(tx.value) || parseInt(tx.value) < 0)) {
      throw new Error("Invalid value amount")
    }
    
    if (tx.gasLimit && (!/^\d+$/.test(tx.gasLimit) || parseInt(tx.gasLimit) < 21000)) {
      throw new Error("Invalid gas limit")
    }
  }

  // Check wallet balance for transaction
  async checkBalanceForTransaction(tx: TransactionRequest): Promise<boolean> {
    if (!this.currentState.address) {
      return false
    }

    try {
      const balance = await this.fetchBalanceFromRPC(this.currentState.address)
      const balanceWei = parseFloat(balance.replace(' ETH', '')) * 1e18
      const valueWei = tx.value ? parseInt(tx.value) : 0
      
      // Add estimated gas cost (rough calculation)
      const gasCost = tx.gasLimit ? parseInt(tx.gasLimit) * 20000000000 : 21000 * 20000000000 // 20 gwei default
      
      return balanceWei >= (valueWei + gasCost)
    } catch (error) {
      console.error("Balance check failed:", error)
      return false
    }
  }

  // Request wallet connection
  async requestConnection(): Promise<void> {
    const farcaster = (window as any).farcaster
    
    console.log("🔗 Requesting wallet connection...")
    
    const connectionMethods = [
      'requestWallet',
      'connectWallet', 
      'openWallet',
      'requestConnection'
    ]

    for (const methodName of connectionMethods) {
      try {
        if (farcaster?.sdk?.actions?.[methodName]) {
          console.log(`📱 Calling ${methodName}...`)
          await farcaster.sdk.actions[methodName]()
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

  // Load wallet balance using real RPC
  private async loadBalance(address: string): Promise<void> {
    try {
      const balance = await this.fetchBalanceFromRPC(address)
      
      this.currentState = {
        ...this.currentState,
        balance,
        lastUpdated: Date.now()
      }
      
      this.emit('balanceUpdated', { balance, address })
    } catch (error) {
      console.error("Failed to load balance:", error)
      this.emit('balanceError', { error: error instanceof Error ? error.message : "Failed to load balance" })
    }
  }

  // Real RPC balance fetching with multiple providers
  private async fetchBalanceFromRPC(address: string): Promise<string> {
    const rpcProviders = [
      'https://base-mainnet.g.alchemy.com/v2/demo',
      'https://base-mainnet.g.alchemy.com/v2/your-api-key-here',
      'https://base-mainnet.infura.io/v3/your-project-id',
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
    
    throw new Error("All RPC providers failed to fetch balance")
  }

  // Monitor transaction status using real RPC
  private async monitorTransaction(hash: string): Promise<void> {
    const maxAttempts = 30 // 5 minutes max
    let attempts = 0
    
    const checkStatus = async () => {
      attempts++
      
      try {
        const status = await this.getTransactionStatus(hash)
        
        if (status === 'success') {
          this.emit('transactionConfirmed', { hash, status: 'success', confirmations: 12 })
          return
        } else if (status === 'failed') {
          this.emit('transactionConfirmed', { hash, status: 'failed', confirmations: 0 })
          return
        }
        
        // Still pending
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000) // Check every 10 seconds
        } else {
          this.emit('transactionTimeout', { hash, attempts })
        }
      } catch (error) {
        console.error("Transaction status check failed:", error)
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000)
        }
      }
    }
    
    // Start monitoring
    setTimeout(checkStatus, 5000) // First check after 5 seconds
  }

  // Get real transaction status from RPC
  private async getTransactionStatus(hash: string): Promise<'pending' | 'success' | 'failed'> {
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
            method: 'eth_getTransactionReceipt',
            params: [hash]
          })
        })
        
        const data = await response.json()
        if (data.result) {
          if (data.result.status === '0x1') {
            return 'success'
          } else if (data.result.status === '0x0') {
            return 'failed'
          }
          return 'pending'
        }
      } catch (error) {
        console.warn(`RPC provider ${rpcUrl} failed:`, error)
        continue
      }
    }
    
    return 'pending'
  }

  // Get gas estimation for transaction
  async estimateGas(tx: TransactionRequest): Promise<string> {
    const farcaster = (window as any).farcaster
    
    try {
      // Try SDK gas estimation first
      if (farcaster?.sdk?.actions?.estimateGas) {
        const gasEstimate = await farcaster.sdk.actions.estimateGas(tx)
        return gasEstimate
      }
      
      // Fallback to RPC estimation
      const rpcProviders = [
        'https://base-mainnet.g.alchemy.com/v2/demo',
        'https://base.drpc.org'
      ]

      for (const rpcUrl of rpcProviders) {
        try {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_estimateGas',
              params: [{
                to: tx.to,
                data: tx.data,
                value: tx.value
              }]
            })
          })
          
          const data = await response.json()
          if (data.result) {
            return parseInt(data.result, 16).toString()
          }
        } catch (error) {
          continue
        }
      }
    } catch (error) {
      console.error("Gas estimation failed:", error)
    }
    
    // Default gas limit for Base network
    return "21000"
  }

  // Event system
  on(event: string, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
    
    // Return unsubscribe function
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

  // Utility methods
  getCurrentState(): WalletConnectionState {
    return { ...this.currentState }
  }

  isInFrame(): boolean {
    return !!(window as any).farcaster
  }

  getNetworkName(chainId: string): string {
    const networks: Record<string, string> = {
      "1": "Ethereum",
      "137": "Polygon", 
      "8453": "Base",
      "42161": "Arbitrum",
      "10": "Optimism"
    }
    return networks[chainId] || "Unknown Network"
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Reset detection
  reset(): void {
    this.detectionAttempts = 0
    this.currentState = {
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      networkName: null,
      lastUpdated: 0
    }
    this.emit('walletDisconnected', null)
  }
}

// Export singleton instance
export const enhancedWalletManager = EnhancedWalletManager.getInstance()