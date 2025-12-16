"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { useFrame } from "@/providers/frame-provider"
import { useNotifications } from "./notification-system"
import { cn } from "@/lib/utils"

interface EnhancedWalletProps {
  className?: string
  showBalance?: boolean
  showNetwork?: boolean
  compact?: boolean
  enableRetry?: boolean
}

export function EnhancedWallet({ 
  className, 
  showBalance = true, 
  showNetwork = true,
  compact = false,
  enableRetry = true
}: EnhancedWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState<string | null>(null)
  const [networkInfo, setNetworkInfo] = useState<any>(null)
  const [walletAvailable, setWalletAvailable] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  const { 
    isFrame, 
    wallet, 
    walletAddress, 
    isWalletConnected, 
    actions,
    retryDetection,
    isLoading
  } = useFrame()
  const { success, error } = useNotifications()

  // Enhanced wallet availability check with auto-detection for Farcaster mini app
  useEffect(() => {
    const checkWalletAvailability = () => {
      if (typeof window !== 'undefined') {
        const farcaster = (window as any).farcaster
        
        // Enhanced wallet detection for Farcaster mini app
        let hasWallet = false
        let walletInfo = null
        
        if (farcaster) {
          // Priority 1: Direct wallet (most reliable in mini app)
          if (farcaster.wallet && farcaster.wallet.address) {
            hasWallet = true
            walletInfo = { path: "direct", address: farcaster.wallet.address, chainId: farcaster.wallet.chainId }
            console.log("💰 Wallet found: Direct path", walletInfo)
          }
          // Priority 2: Frame context wallet
          else if (farcaster.frameContext?.wallet && farcaster.frameContext.wallet.address) {
            hasWallet = true
            walletInfo = { path: "frameContext", address: farcaster.frameContext.wallet.address, chainId: farcaster.frameContext.wallet.chainId }
            console.log("💰 Wallet found: FrameContext path", walletInfo)
          }
          // Priority 3: SDK wallet
          else if (farcaster.sdk?.wallet && farcaster.sdk.wallet.address) {
            hasWallet = true
            walletInfo = { path: "sdk", address: farcaster.sdk.wallet.address, chainId: farcaster.sdk.wallet.chainId }
            console.log("💰 Wallet found: SDK path", walletInfo)
          }
          // Priority 4: SDK context wallet
          else if (farcaster.sdk?.context?.wallet && farcaster.sdk.context.wallet.address) {
            hasWallet = true
            walletInfo = { path: "sdkContext", address: farcaster.sdk.context.wallet.address, chainId: farcaster.sdk.context.wallet.chainId }
            console.log("💰 Wallet found: SDK Context path", walletInfo)
          }
          // Priority 5: SDK actions (might have wallet access)
          else if (farcaster.sdk?.actions) {
            hasWallet = true
            walletInfo = { path: "sdkActions", address: null, chainId: "8453" }
            console.log("💰 Wallet found: SDK Actions path", walletInfo)
          }
          // Priority 6: Additional mini app wallet detection
          else if (farcaster.miniApp?.wallet) {
            hasWallet = true
            walletInfo = { path: "miniApp", address: farcaster.miniApp.wallet.address, chainId: farcaster.miniApp.wallet.chainId }
            console.log("💰 Wallet found: MiniApp path", walletInfo)
          }
          // Priority 7: Window wallet (fallback for some mini app implementations)
          else if ((window as any).ethereum || (window as any).farcasterWallet) {
            hasWallet = true
            walletInfo = { path: "window", address: (window as any).ethereum?.selectedAddress || (window as any).farcasterWallet?.address, chainId: "8453" }
            console.log("💰 Wallet found: Window path", walletInfo)
          }
        }
        
        // Auto-connect if wallet is detected in mini app environment
        if (hasWallet && walletInfo?.address && !isWalletConnected) {
          console.log("🔗 Auto-connecting wallet in mini app:", walletInfo)
          // The connection will be handled by the frame provider
        }
        
        setWalletAvailable(hasWallet)
      }
    }

    checkWalletAvailability()
    
    // Check periodically for wallet availability with reasonable intervals
    const interval = setInterval(checkWalletAvailability, 1000)
    return () => clearInterval(interval)
  }, [isWalletConnected])

  // Load balance when wallet is connected
  useEffect(() => {
    const loadBalance = async () => {
      if (walletAddress && showBalance) {
        try {
          // This would be implemented with your preferred RPC provider
          // For now, we'll show a placeholder
          setBalance("0.001 ETH")
        } catch (err) {
          console.error("Failed to load balance:", err)
        }
      }
    }

    loadBalance()
  }, [walletAddress, showBalance])

  const handleRetryDetection = () => {
    if (enableRetry) {
      setRetryCount(prev => prev + 1)
      retryDetection()
    }
  }

  const handleConnect = async () => {
    console.log("🔗 Handle connect called", { wallet, walletAvailable, walletAddress })
    
    if (!wallet && !walletAvailable) {
      error("Wallet not available", "Please wait for the wallet to load or try refreshing")
      return
    }

    if (!wallet) {
      error("Wallet not ready", "Wallet is still loading, please try again in a moment")
      return
    }

    setIsConnecting(true)
    try {
      // FarCaster wallets are auto-connected, just refresh the state
      if (wallet.address) {
        success("Wallet ready", `Connected to ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`)
      } else {
        // Try to trigger wallet connection in FarCaster
        if ((window as any).farcaster?.sdk?.actions?.requestWallet) {
          try {
            await (window as any).farcaster.sdk.actions.requestWallet()
            success("Wallet connection requested", "Please check your FarCaster wallet")
          } catch (requestErr) {
            console.error("Wallet request failed:", requestErr)
            error("Connection request failed", "Failed to request wallet connection. Please try again.")
          }
        } else {
          // For auto-connected wallets, just confirm status
          success("Wallet ready", "Your FarCaster wallet should be connected automatically")
        }
      }
    } catch (err) {
      console.error("Connection error:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown connection error"
      error("Connection failed", `Failed to connect wallet: ${errorMessage}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    // Frame wallets typically don't have a disconnect method
    // This would reload the page or refresh the context
    window.location.reload()
  }

  const copyAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress)
        success("Address copied", "Wallet address copied to clipboard")
      } catch (err) {
        error("Copy failed", "Failed to copy address")
      }
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string) => {
    return balance
  }

  // Show loading state while detecting Frame
  if (isLoading) {
    return (
      <Card className={cn("p-4 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800", className)}>
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <LoadingSpinner size="sm" />
          <div>
            <p className="text-sm font-semibold">Detecting Frame environment...</p>
            <p className="text-xs">Please wait</p>
          </div>
        </div>
      </Card>
    )
  }

  // Show Frame detection issue
  if (!isFrame) {
    return (
      <Card className={cn("p-4 bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800", className)}>
        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
          <span>⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Not in Frame context</p>
            <p className="text-xs">Please open this app in Farcaster Frame</p>
          </div>
          {enableRetry && (
            <Button
              onClick={handleRetryDetection}
              variant="outline"
              size="sm"
            >
              🔄 Retry
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // Show wallet loading state
  if (isFrame && !walletAvailable && !wallet) {
    return (
      <Card className={cn("p-4 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800", className)}>
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <LoadingSpinner size="sm" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Loading wallet...</p>
            <p className="text-xs">Attempt {retryCount + 1}</p>
          </div>
          {enableRetry && (
            <Button
              onClick={handleRetryDetection}
              variant="outline"
              size="sm"
            >
              🔄 Retry
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // Show no wallet available in Frame
  if (isFrame && !wallet && !walletAvailable) {
    return (
      <Card className={cn("p-4 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800", className)}>
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <span>❌</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Wallet not available</p>
            <p className="text-xs">Please ensure you're using the latest Farcaster app</p>
          </div>
          {enableRetry && (
            <Button
              onClick={handleRetryDetection}
              variant="outline"
              size="sm"
            >
              🔄 Retry
            </Button>
          )}
        </div>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {isWalletConnected ? (
          <>
            <Badge variant="secondary" className="text-xs">
              {walletAddress && formatAddress(walletAddress)}
            </Badge>
            {showBalance && balance && (
              <span className="text-xs text-muted-foreground">
                {formatBalance(balance)}
              </span>
            )}
          </>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
            variant="outline"
          >
            {isConnecting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Connecting...
              </>
            ) : (
              "Connect Wallet"
            )}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-purple-200/50 dark:border-purple-800/50", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            🔗 Wallet
            {isWalletConnected && (
              <Badge variant="secondary" className="text-xs">
                Connected
              </Badge>
            )}
            {walletAvailable && !isWalletConnected && (
              <Badge variant="outline" className="text-xs">
                Available
              </Badge>
            )}
          </h3>
          
          {showNetwork && networkInfo && (
            <Badge variant="outline" className="text-xs">
              {networkInfo.name || "Base"}
            </Badge>
          )}
        </div>

        {isWalletConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-mono">{walletAddress && formatAddress(walletAddress)}</p>
                {showBalance && balance && (
                  <p className="text-xs text-muted-foreground">
                    Balance: {formatBalance(balance)}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={copyAddress}
                  variant="outline"
                  size="sm"
                >
                  📋 Copy
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Network: {wallet?.chainId || "Base"} • 
              Frame: {isFrame ? "Yes" : "No"} • 
              Retry Count: {retryCount}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to mint and manage reputation passports
            </p>
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !walletAvailable}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Connecting Wallet...
                </>
              ) : (
                <>
                  🔗 Connect Wallet
                </>
              )}
            </Button>
            
            {enableRetry && (
              <Button
                onClick={handleRetryDetection}
                variant="outline"
                size="sm"
                className="w-full"
              >
                🔄 Retry Detection ({retryCount})
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// Hook for wallet operations
export function useWallet() {
  const [isLoading, setIsLoading] = useState(false)
  const { wallet, walletAddress, isWalletConnected } = useFrame()
  const { success, error } = useNotifications()

  const sendTransaction = async (tx: {
    to: string
    data: string
    value?: string
  }) => {
    if (!wallet || !isWalletConnected) {
      throw new Error("Wallet not connected")
    }

    setIsLoading(true)
    try {
      const result = await wallet.sendTransaction(tx)
      success("Transaction sent", `Hash: ${result.slice(0, 10)}...`)
      return result
    } catch (err) {
      error("Transaction failed", err instanceof Error ? err.message : "Unknown error")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const connect = async () => {
    if (!wallet) {
      throw new Error("Wallet not available")
    }

    setIsLoading(true)
    try {
      // FarCaster wallets are auto-connected, no manual connect needed
      if (wallet.address) {
        success("Wallet ready", `Connected to ${wallet.address.slice(0, 6)}...`)
      } else {
        // Try to request wallet connection
        if ((window as any).farcaster?.sdk?.actions?.requestWallet) {
          await (window as any).farcaster.sdk.actions.requestWallet()
          success("Wallet connection requested", "Please check your FarCast wallet")
        } else {
          success("Wallet ready", "Your FarCaster wallet should be connected")
        }
      }
    } catch (err) {
      error("Connection failed", "Failed to connect wallet")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    wallet,
    walletAddress,
    isWalletConnected,
    isLoading,
    sendTransaction,
    connect
  }
}