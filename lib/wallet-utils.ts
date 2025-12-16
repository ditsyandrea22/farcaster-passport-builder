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

    // Try multiple wallet detection paths
    const walletSources = [
      farcaster.wallet,
      farcaster.sdk?.wallet,
      farcaster.frameContext?.wallet,
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

    // If no wallet found, check for SDK that might provide wallet access
    if (farcaster.sdk?.actions) {
      this.wallet = this.createSDKWalletInterface()
      this.isInitialized = true
      return this.wallet
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
          const result = await walletSource.sendTransaction(tx)
          return result?.hash || result
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
        if (farcaster?.sdk?.actions?.transaction) {
          const result = await farcaster.sdk.actions.transaction(tx)
          return result?.hash || result
        }
        throw new Error("SDK transaction not supported")
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
    if (farcaster?.sdk?.actions?.transaction) {
      try {
        const result = await farcaster.sdk.actions.transaction(tx)
        return result?.hash || result
      } catch (err) {
        console.warn("SDK transaction failed:", err)
        throw new Error("Transaction failed: SDK method unavailable")
      }
    }

    throw new Error("No transaction method available")
  }

  // Request wallet connection (for wallets that support it)
  async requestWalletConnection(): Promise<void> {
    const farcaster = (window as any).farcaster
    if (farcaster?.sdk?.actions?.requestWallet) {
      await farcaster.sdk.actions.requestWallet()
    } else {
      // For auto-connected wallets, just trigger a refresh
      window.location.reload()
    }
  }

  // Check if we're in a FarCaster Frame environment
  isInFrame(): boolean {
    if (typeof window === 'undefined') return false
    const farcaster = (window as any).farcaster
    return !!(farcaster?.frameContext || farcaster?.wallet || farcaster?.sdk)
  }

  // Get frame context information
  getFrameContext(): any {
    if (typeof window === 'undefined') return null
    return (window as any).farcaster?.frameContext || null
  }

  // Monitor wallet state changes
  onWalletStateChange(callback: (wallet: FarCasterWallet | null) => void): () => void {
    const interval = setInterval(async () => {
      const currentWallet = await this.detectWallet()
      callback(currentWallet)
    }, 1000)

    return () => clearInterval(interval)
  }
}

// Export singleton instance
export const walletManager = FarCasterWalletManager.getInstance()

// Utility functions for common wallet operations
export const WalletUtils = {
  // Format address for display
  formatAddress: (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  },

  // Validate address format
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },

  // Convert wei to ether (if needed)
  weiToEther: (wei: string): string => {
    const ether = parseInt(wei) / 1e18
    return ether.toFixed(4)
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
  }
}