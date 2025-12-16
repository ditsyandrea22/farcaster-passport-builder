// FarCaster Wallet Utilities
// Provides robust wallet detection and transaction handling for FarCaster Frames

export interface FarCasterWallet {
  address: string
  chainId: string
  isConnected: boolean
  sendTransaction: (tx: {
    to: string
    data: string
    value?: string
  }) => Promise<string>
}

export class FarCasterWalletManager {
  private static instance: FarCasterWalletManager
  private wallet: FarCasterWallet | null = null
  private isInitialized = false
  private detectionAttempts = 0
  private maxAttempts = 10

  private constructor() {}

  static getInstance(): FarCasterWalletManager {
    if (!FarCasterWalletManager.instance) {
      FarCasterWalletManager.instance = new FarCasterWalletManager()
    }
    return FarCasterWalletManager.instance
  }

  // Detect FarCaster wallet with multiple fallback strategies
  async detectWallet(): Promise<FarCasterWallet | null> {
    if (typeof window === 'undefined') return null

    const farcaster = (window as any).farcaster
    if (!farcaster) return null

    this.detectionAttempts++

    // Try multiple wallet detection paths
    const walletSources = [
      // Direct wallet
      farcaster.wallet,
      // SDK wallet
      farcaster.sdk?.wallet,
      // Frame context wallet
      farcaster.frameContext?.wallet,
      // SDK context wallet
      farcaster.sdk?.context?.wallet
    ]

    for (const walletSource of walletSources) {
      if (walletSource && walletSource.address) {
        this.wallet = this.createWalletInterface(walletSource)
        this.isInitialized = true
        console.log("FarCaster wallet detected:", this.wallet)
        return this.wallet
      }
    }

    // If no direct wallet found, check for SDK that might provide wallet access
    if (farcaster.sdk?.actions) {
      this.wallet = this.createSDKWalletInterface()
      this.isInitialized = true
      console.log("SDK wallet interface created")
      return this.wallet
    }

    // If we've exhausted attempts, return null
    if (this.detectionAttempts >= this.maxAttempts) {
      console.warn("Max wallet detection attempts reached")
      return null
    }

    return null
  }

  private createWalletInterface(walletSource: any): FarCasterWallet {
    return {
      address: walletSource.address || "",
      chainId: walletSource.chainId || "8453", // Base network
      isConnected: !!walletSource.address,
      sendTransaction: async (tx) => {
        if (walletSource.sendTransaction) {
          try {
            const result = await walletSource.sendTransaction(tx)
            return result?.hash || result
          } catch (err) {
            console.error("Direct wallet transaction failed:", err)
            throw err
          }
        }
        throw new Error("Wallet transaction not supported")
      }
    }
  }

  private createSDKWalletInterface(): FarCasterWallet {
    return {
      address: "",
      chainId: "8453",
      isConnected: false,
      sendTransaction: async (tx) => {
        const farcaster = (window as any).farcaster
        
        // Try multiple SDK transaction methods
        const sdkMethods = [
          'transaction',
          'sendTransaction', 
          'eth_sendTransaction',
          'requestTransaction'
        ]

        for (const method of sdkMethods) {
          if (farcaster?.sdk?.actions?.[method]) {
            try {
              const result = await farcaster.sdk.actions[method](tx)
              return result?.hash || result
            } catch (err) {
              console.warn(`SDK method ${method} failed:`, err)
              continue
            }
          }
        }

        throw new Error("No supported transaction method found in SDK")
      }
    }
  }

  getWallet(): FarCasterWallet | null {
    return this.wallet
  }

  isWalletReady(): boolean {
    return this.isInitialized && this.wallet !== null
  }

  // Enhanced transaction sending with fallback strategies
  async sendTransaction(tx: {
    to: string
    data: string
    value?: string
  }): Promise<string> {
    if (!this.wallet) {
      throw new Error("Wallet not available")
    }

    // Try direct wallet transaction first
    if (this.wallet.sendTransaction) {
      try {
        return await this.wallet.sendTransaction(tx)
      } catch (err) {
        console.warn("Direct wallet transaction failed:", err)
      }
    }

    // Fallback to FarCaster SDK
    const farcaster = (window as any).farcaster
    const sdkMethods = ['transaction', 'sendTransaction', 'eth_sendTransaction']
    
    for (const method of sdkMethods) {
      if (farcaster?.sdk?.actions?.[method]) {
        try {
          const result = await farcaster.sdk.actions[method](tx)
          return result?.hash || result
        } catch (err) {
          console.warn(`SDK method ${method} failed:`, err)
          continue
        }
      }
    }

    throw new Error("No transaction method available")
  }

  // Request wallet connection (for wallets that support it)
  async requestWalletConnection(): Promise<void> {
    const farcaster = (window as any).farcaster
    
    // Try multiple connection request methods
    const connectionMethods = [
      'requestWallet',
      'connectWallet',
      'openWallet',
      'requestConnection'
    ]

    for (const method of connectionMethods) {
      if (farcaster?.sdk?.actions?.[method]) {
        try {
          await farcaster.sdk.actions[method]()
          return
        } catch (err) {
          console.warn(`Connection method ${method} failed:`, err)
          continue
        }
      }
    }

    // For auto-connected wallets, just trigger a refresh
    console.log("No connection method available, triggering refresh")
    window.location.reload()
  }

  // Check if we're in a FarCaster Frame environment
  isInFrame(): boolean {
    if (typeof window === 'undefined') return false
    const farcaster = (window as any).farcaster
    return !!(
      farcaster?.frameContext || 
      farcaster?.wallet || 
      farcaster?.sdk ||
      farcaster?.sdk?.actions
    )
  }

  // Get frame context information
  getFrameContext(): any {
    if (typeof window === 'undefined') return null
    return (window as any).farcaster?.frameContext || null
  }

  // Monitor wallet state changes
  onWalletStateChange(callback: (wallet: FarCasterWallet | null) => void): () => void {
    const interval = setInterval(async () => {
      try {
        const currentWallet = await this.detectWallet()
        callback(currentWallet)
      } catch (err) {
        console.error("Wallet state change detection failed:", err)
      }
    }, 1000)

    return () => clearInterval(interval)
  }

  // Reset detection attempts
  resetDetection(): void {
    this.detectionAttempts = 0
  }

  // Get detection status
  getDetectionStatus(): { attempts: number; maxAttempts: number; isInitialized: boolean } {
    return {
      attempts: this.detectionAttempts,
      maxAttempts: this.maxAttempts,
      isInitialized: this.isInitialized
    }
  }
}

// Export singleton instance
export const walletManager = FarCasterWalletManager.getInstance()

// Utility functions for common wallet operations
export const WalletUtils = {
  // Format address for display
  formatAddress: (address: string): string => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  },

  // Validate address format
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },

  // Convert wei to ether (if needed)
  weiToEther: (wei: string): string => {
    try {
      const ether = parseInt(wei) / 1e18
      return ether.toFixed(4)
    } catch {
      return "0.0000"
    }
  },

  // Check if wallet is connected and ready
  isWalletConnected: (wallet: FarCasterWallet | null): boolean => {
    return wallet?.isConnected && wallet?.address ? true : false
  },

  // Get wallet network name
  getNetworkName: (chainId: string): string => {
    const networks: Record<string, string> = {
      "1": "Ethereum",
      "137": "Polygon", 
      "8453": "Base",
      "42161": "Arbitrum",
      "10": "Optimism"
    }
    return networks[chainId] || "Unknown Network"
  },

  // Enhanced wallet detection with detailed logging
  detectWalletWithLogging: async (): Promise<FarCasterWallet | null> => {
    console.log("Starting enhanced wallet detection...")
    
    if (typeof window === 'undefined') {
      console.log("No window object available")
      return null
    }

    const farcaster = (window as any).farcaster
    console.log("Farcaster object:", !!farcaster)

    if (!farcaster) {
      console.log("No farcaster object found")
      return null
    }

    // Log all available properties
    console.log("Farcaster properties:", {
      wallet: !!farcaster.wallet,
      sdk: !!farcaster.sdk,
      frameContext: !!farcaster.frameContext,
      actions: !!farcaster.sdk?.actions
    })

    return walletManager.detectWallet()
  },

  // Test wallet connection
  testWalletConnection: async (wallet: FarCasterWallet): Promise<boolean> => {
    try {
      if (!wallet.address) {
        console.log("No wallet address available")
        return false
      }
      
      console.log("Testing wallet connection for address:", wallet.address)
      return wallet.isConnected
    } catch (err) {
      console.error("Wallet connection test failed:", err)
      return false
    }
  }
}