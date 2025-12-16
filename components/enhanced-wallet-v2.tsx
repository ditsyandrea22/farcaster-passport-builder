"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { useFrame } from "@/providers/frame-provider"
import { useNotifications } from "./notification-system"
import { cn } from "@/lib/utils"

interface EnhancedWalletV2Props {
  className?: string
  showBalance?: boolean
  showNetwork?: boolean
  showTransactionHistory?: boolean
  compact?: boolean
  enableRetry?: boolean
  showConnectionDetails?: boolean
}

export function EnhancedWalletV2({ 
  className, 
  showBalance = true, 
  showNetwork = true,
  showTransactionHistory = false,
  compact = false,
  enableRetry = true,
  showConnectionDetails = false
}: EnhancedWalletV2Props) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [connectionMethod, setConnectionMethod] = useState<string | null>(null)
  const [lastActivity, setLastActivity] = useState<number | null>(null)
  
  const { 
    isFrame, 
    wallet, 
    walletAddress, 
    isWalletConnected, 
    walletState,
    sendTransaction,
    requestConnection,
    onWalletEvent,
    actions,
    retryDetection,
    isLoading
  } = useFrame()
  
  const { success, error } = useNotifications()

  // Subscribe to enhanced wallet events
  useEffect(() => {
    const unsubscribeConnected = onWalletEvent('walletConnected', (state: any) => {
      console.log("🔗 Enhanced wallet connected via V2 component:", state)
      setConnectionMethod(state.method || 'auto')
      setLastActivity(Date.now())
      success("Wallet Connected", `Connected via ${state.method || 'auto-detection'}`)
    })

    const unsubscribeDisconnected = onWalletEvent('walletDisconnected', () => {
      console.log("🔌 Enhanced wallet disconnected via V2 component")
      setConnectionMethod(null)
      setLastActivity(null)
    })

    const unsubscribeError = onWalletEvent('walletError', (data: any) => {
      console.error("❌ Enhanced wallet error via V2 component:", data)
      error("Wallet Error", data.error)
    })

    const unsubscribeTransaction = onWalletEvent('transactionSent', (data: any) => {
      console.log("💸 Transaction sent via V2 component:", data)
      success("Transaction Sent", `Hash: ${data.hash.slice(0, 10)}...`)
      setLastActivity(Date.now())
    })

    const unsubscribeConfirmed = onWalletEvent('transactionConfirmed', (data: any) => {
      console.log("✅ Transaction confirmed via V2 component:", data)
      success("Transaction Confirmed", `Transaction ${data.status}`)
    })

    return () => {
      unsubscribeConnected()
      unsubscribeDisconnected()
      unsubscribeError()
      unsubscribeTransaction()
      unsubscribeConfirmed()
    }
  }, [onWalletEvent, success, error])

  const handleRetryDetection = () => {
    if (enableRetry) {
      setRetryCount(prev => prev + 1)
      retryDetection()
    }
  }

  const handleConnect = async () => {
    console.log("🔗 Handle connect called in V2", { 
      wallet, 
      walletAvailable: isWalletConnected, 
      walletAddress,
      walletState 
    })
    
    if (!wallet && !isWalletConnected) {
      error("Wallet not available", "Please wait for the wallet to load or try refreshing")
      return
    }

    setIsConnecting(true)
    try {
      if (isWalletConnected && walletAddress) {
        // Already connected, just refresh state
        success("Wallet ready", `Connected to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`)
      } else {
        // Try to request wallet connection using enhanced method
        try {
          await requestConnection()
          success("Wallet connection requested", "Please check your FarCaster wallet")
        } catch (requestErr) {
          console.error("Enhanced wallet request failed:", requestErr)
          error("Connection request failed", "Failed to request wallet connection. Please try again.")
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

  const getConnectionMethodBadge = () => {
    if (!connectionMethod) return null
    
    const methodLabels: Record<string, string> = {
      'direct': 'Direct',
      'frameContext': 'Frame Context',
      'sdk': 'SDK',
      'sdkContext': 'SDK Context',
      'miniApp': 'Mini App',
      'window': 'Window',
      'auto': 'Auto'
    }
    
    return (
      <Badge variant="outline" className="text-xs">
        {methodLabels[connectionMethod] || connectionMethod}
      </Badge>
    )
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

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {isWalletConnected ? (
          <>
            <Badge variant="secondary" className="text-xs">
              {walletAddress && formatAddress(walletAddress)}
            </Badge>
            {showBalance && walletState?.balance && (
              <span className="text-xs text-muted-foreground">
                {formatBalance(walletState.balance)}
              </span>
            )}
            {connectionMethod && getConnectionMethodBadge()}
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
            🔗 Enhanced Wallet V2
            {isWalletConnected && (
              <Badge variant="secondary" className="text-xs">
                Connected
              </Badge>
            )}
            {connectionMethod && getConnectionMethodBadge()}
          </h3>
          
          {showNetwork && walletState?.networkName && (
            <Badge variant="outline" className="text-xs">
              {walletState.networkName}
            </Badge>
          )}
        </div>

        {isWalletConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-mono">{walletAddress && formatAddress(walletAddress)}</p>
                {showBalance && walletState?.balance && (
                  <p className="text-xs text-muted-foreground">
                    Balance: {formatBalance(walletState.balance)}
                  </p>
                )}
                {showConnectionDetails && walletState && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Chain ID: {walletState.chainId}</p>
                    <p>Last Updated: {new Date(walletState.lastUpdated).toLocaleTimeString()}</p>
                    {lastActivity && (
                      <p>Last Activity: {new Date(lastActivity).toLocaleTimeString()}</p>
                    )}
                  </div>
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
              Network: {walletState?.networkName || "Base"} • 
              Frame: {isFrame ? "Yes" : "No"} • 
              Retry Count: {retryCount} • 
              Method: {connectionMethod || "Unknown"}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to mint and manage reputation passports with enhanced detection
            </p>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Connecting Enhanced Wallet...
                </>
              ) : (
                <>
                  🔗 Connect Enhanced Wallet
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

// Enhanced hook for wallet operations
export function useEnhancedWallet() {
  const [isLoading, setIsLoading] = useState(false)
  const { 
    wallet, 
    walletAddress, 
    isWalletConnected, 
    walletState,
    sendTransaction,
    requestConnection,
    onWalletEvent
  } = useFrame()
  const { success, error } = useNotifications()

  const sendTransactionEnhanced = async (tx: {
    to: string
    data: string
    value?: string
    gasLimit?: string
  }) => {
    if (!isWalletConnected || !walletAddress) {
      throw new Error("Wallet not connected")
    }

    setIsLoading(true)
    try {
      const result = await sendTransaction(tx)
      success("Transaction sent", `Hash: ${result.hash.slice(0, 10)}...`)
      return result
    } catch (err) {
      error("Transaction failed", err instanceof Error ? err.message : "Unknown error")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const connectEnhanced = async () => {
    setIsLoading(true)
    try {
      if (isWalletConnected && walletAddress) {
        success("Wallet ready", `Connected to ${walletAddress.slice(0, 6)}...`)
      } else {
        await requestConnection()
        success("Wallet connection requested", "Please check your FarCaster wallet")
      }
    } catch (err) {
      error("Connection failed", "Failed to connect wallet")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Subscribe to wallet events
  useEffect(() => {
    const unsubscribe = onWalletEvent('walletConnected', (state: any) => {
      console.log("Enhanced wallet connected via hook:", state)
    })

    return unsubscribe
  }, [onWalletEvent])

  return {
    wallet,
    walletAddress,
    walletState,
    isWalletConnected,
    isLoading,
    sendTransaction: sendTransactionEnhanced,
    connect: connectEnhanced,
    onWalletEvent
  }
}