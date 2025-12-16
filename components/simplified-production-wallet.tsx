/**
 * Simplified Production Wallet
 * Uses unified wallet manager for consistent, reliable wallet connections
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-skeleton"
import { useFrame } from "@/providers/frame-provider-unified"
import { useNotifications } from "./notification-system"
import { cn } from "@/lib/utils"

interface SimplifiedProductionWalletProps {
  className?: string
  showBalance?: boolean
  showNetwork?: boolean
  compact?: boolean
  enableRetry?: boolean
  showConnectionDetails?: boolean
}

export function SimplifiedProductionWallet({ 
  className, 
  showBalance = true, 
  showNetwork = true,
  compact = false,
  enableRetry = true,
  showConnectionDetails = false
}: SimplifiedProductionWalletProps) {
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
    retryDetection,
    isLoading,
    error
  } = useFrame()
  
  const { success, error: showError } = useNotifications()

  // Subscribe to wallet events
  useEffect(() => {
    const unsubscribeConnected = onWalletEvent('walletConnected', (state: any) => {
      console.log("🔗 Simplified wallet connected:", state)
      setConnectionMethod(state.connectionMethod || 'auto')
      setLastActivity(Date.now())
      success("Wallet Connected", `Connected to ${walletAddress ? walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4) : 'Unknown'}`)
    })

    const unsubscribeDisconnected = onWalletEvent('walletDisconnected', () => {
      console.log("🔌 Simplified wallet disconnected")
      setConnectionMethod(null)
      setLastActivity(null)
    })

    const unsubscribeError = onWalletEvent('walletError', (data: any) => {
      console.error("❌ Simplified wallet error:", data)
      showError("Wallet Error", data.error)
    })

    const unsubscribeTransaction = onWalletEvent('transactionSent', (data: any) => {
      console.log("💸 Transaction sent:", data.hash)
      success("Transaction Sent", `Hash: ${data.hash.slice(0, 10)}...`)
      setLastActivity(Date.now())
    })

    const unsubscribeConfirmed = onWalletEvent('transactionConfirmed', (data: any) => {
      console.log("✅ Transaction confirmed:", data.status)
      success("Transaction Confirmed", `Status: ${data.status}`)
    })

    const unsubscribeBalanceError = onWalletEvent('balanceError', (data: any) => {
      console.warn("⚠️ Balance load failed:", data.error)
    })

    return () => {
      unsubscribeConnected()
      unsubscribeDisconnected()
      unsubscribeError()
      unsubscribeTransaction()
      unsubscribeConfirmed()
      unsubscribeBalanceError()
    }
  }, [onWalletEvent, success, showError, walletAddress])

  const handleRetryDetection = () => {
    if (enableRetry) {
      setRetryCount(prev => prev + 1)
      retryDetection()
    }
  }

  const handleConnect = async () => {
    console.log("🔗 Simplified wallet connect requested")
    
    if (!wallet && !isWalletConnected) {
      showError("Wallet not available", "Please wait for the wallet to load or try refreshing")
      return
    }

    setIsConnecting(true)
    try {
      if (isWalletConnected && walletAddress) {
        // Already connected, just refresh state
        success("Wallet ready", `Connected to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`)
      } else {
        // Try to request wallet connection
        try {
          await requestConnection()
          success("Wallet connection requested", "Please check your FarCaster wallet")
        } catch (requestErr) {
          console.error("Simplified wallet request failed:", requestErr)
          showError("Connection request failed", "Failed to request wallet connection. Please try again.")
        }
      }
    } catch (err) {
      console.error("Connection error:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown connection error"
      showError("Connection failed", `Failed to connect wallet: ${errorMessage}`)
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
        showError("Copy failed", "Failed to copy address")
      }
    }
  }

  const formatAddress = (address: string | null) => {
    if (!address) return 'Unknown'
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

  // If we have a wallet, show it regardless of frame status (wallet proves we're in frame)
  if (isWalletConnected && walletAddress) {
    return (
      <Card className={cn("p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-purple-200/50 dark:border-purple-800/50", className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              🔗 Simplified Wallet
              <Badge variant="secondary" className="text-xs">
                Connected
              </Badge>
              {connectionMethod && getConnectionMethodBadge()}
            </h3>
            
            {showNetwork && walletState?.networkName && (
              <Badge variant="outline" className="text-xs">
                {walletState.networkName}
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-mono">{formatAddress(walletAddress)}</p>
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
        </div>
      </Card>
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

  // Show Frame detection issue only if we truly can't find any wallet/SDK
  if (!isFrame && !walletState?.isConnected) {
    return (
      <Card className={cn("p-4 bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800", className)}>
        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
          <span>⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Not in Frame context</p>
            <p className="text-xs">Please open this app in Farcaster Frame or connect a wallet</p>
            {error && (
              <p className="text-xs mt-1">Error: {error}</p>
            )}
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
              {formatAddress(walletAddress)}
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
            🔗 Simplified Wallet
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

        {isWalletConnected && walletAddress ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-mono">{formatAddress(walletAddress)}</p>
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
              Connect your wallet to mint and manage reputation passports
            </p>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Connecting Simplified Wallet...
                </>
              ) : (
                <>
                  🔗 Connect Simplified Wallet
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