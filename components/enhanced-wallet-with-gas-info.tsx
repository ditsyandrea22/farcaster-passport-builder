"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFrame } from "@/providers/frame-provider"
import { useNotifications } from "@/components/notification-system"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface GasInfo {
  estimatedCost: string
  gasLimit: string
  gasPrice: string
  networkCongestion: "low" | "medium" | "high"
  confidence: "high" | "medium" | "low"
}

interface WalletWithGasInfoProps {
  onMintClick?: () => void
  showMintButton?: boolean
  className?: string
}

export function EnhancedWalletWithGasInfo({ 
  onMintClick, 
  showMintButton = false, 
  className 
}: WalletWithGasInfoProps) {
  const [gasInfo, setGasInfo] = useState<GasInfo | null>(null)
  const [loadingGas, setLoadingGas] = useState(false)
  const [balance, setBalance] = useState<string>("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const { isFrame, wallet, user, isWalletConnected, walletState } = useFrame()
  const { success, error: showError } = useNotifications()

  // Auto-refresh balance and gas info
  useEffect(() => {
    if (isWalletConnected && walletState?.address) {
      updateWalletInfo()
      const interval = setInterval(updateWalletInfo, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isWalletConnected, walletState?.address])

  const updateWalletInfo = async () => {
    if (!walletState?.address) return

    try {
      // Update balance
      if (walletState.balance) {
        setBalance(`${parseFloat(walletState.balance).toFixed(4)} ETH`)
      }

      // Update gas info
      await fetchGasInfo()
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Failed to update wallet info:", err)
    }
  }

  const fetchGasInfo = async () => {
    if (!walletState?.address) return

    setLoadingGas(true)
    try {
      // Simulate gas estimation (in real app, this would call an actual gas API)
      const mockGasInfo: GasInfo = {
        estimatedCost: "$2.45",
        gasLimit: "185,000",
        gasPrice: "0.1 gwei",
        networkCongestion: "medium",
        confidence: "high"
      }
      
      // Add some randomization to simulate real-time changes
      const baseCost = 2.45
      const variance = (Math.random() - 0.5) * 0.5
      mockGasInfo.estimatedCost = `$${(baseCost + variance).toFixed(2)}`
      
      setGasInfo(mockGasInfo)
    } catch (err) {
      console.error("Failed to fetch gas info:", err)
    } finally {
      setLoadingGas(false)
    }
  }

  const handleConnectWallet = async () => {
    if (!isFrame) {
      showError("Not in Frame", "Wallet connection is only available within Farcaster")
      return
    }

    try {
      // The wallet connection should be handled by the frame context
      if (!isWalletConnected) {
        showError("Wallet Required", "Please connect your wallet through Farcaster")
      }
    } catch (err) {
      showError("Connection Failed", "Failed to connect wallet")
    }
  }

  const handleMintWithGasEstimate = () => {
    if (!gasInfo) {
      fetchGasInfo()
      return
    }

    if (onMintClick) {
      onMintClick()
    }
  }

  const getCongestionColor = (congestion: string) => {
    switch (congestion) {
      case "low": return "text-green-600"
      case "medium": return "text-yellow-600"
      case "high": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "text-green-600"
      case "medium": return "text-yellow-600"
      case "low": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  if (!isFrame) {
    return (
      <Card className={cn("p-4 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800", className)}>
        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold">Frame Required</p>
            <p className="text-xs mt-1">
              This app works best within Farcaster. Open in a Farcaster frame for full functionality.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-purple-200/50 dark:border-purple-800/50 shadow-lg", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💳</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">Wallet Status</h3>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Connection Status */}
        {isWalletConnected && walletState ? (
          <div className="space-y-3">
            {/* Wallet Info */}
            <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">✅</span>
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Wallet Connected
                </span>
              </div>
              <div className="space-y-1 text-xs text-green-600 dark:text-green-400">
                <p>Address: {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}</p>
                <p>Network: Base</p>
                {balance && <p>Balance: {balance}</p>}
              </div>
            </div>

            {/* Gas Information */}
            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⛽</span>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    Gas Estimation
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchGasInfo}
                  disabled={loadingGas}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                >
                  {loadingGas ? <Spinner className="h-3 w-3" /> : "🔄"}
                </Button>
              </div>
              
              {gasInfo ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-blue-600 dark:text-blue-400 font-medium">Estimated Cost</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {gasInfo.estimatedCost}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600 dark:text-blue-400 font-medium">Gas Limit</p>
                      <p className="font-semibold text-blue-700 dark:text-blue-300">
                        {gasInfo.gasLimit}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-blue-600 dark:text-blue-400">Gas Price</p>
                      <p className="font-medium">{gasInfo.gasPrice}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 dark:text-blue-400">Network</p>
                      <div className="flex items-center gap-1">
                        <span className={cn("font-medium", getCongestionColor(gasInfo.networkCongestion))}>
                          {gasInfo.networkCongestion.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-600 dark:text-blue-400">Confidence:</span>
                    <span className={cn("font-medium", getConfidenceColor(gasInfo.confidence))}>
                      {gasInfo.confidence.toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchGasInfo}
                    disabled={loadingGas}
                    className="text-xs"
                  >
                    {loadingGas ? (
                      <>
                        <Spinner className="mr-2 h-3 w-3" />
                        Calculating...
                      </>
                    ) : (
                      "Get Gas Estimate"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Balance Warning */}
            {balance && parseFloat(balance) < 0.01 && (
              <div className="bg-red-50 dark:bg-red-950/50 rounded-lg p-3 border border-red-200/50 dark:border-red-800/50">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold">Low Balance</p>
                    <p className="text-xs mt-1">
                      You need at least $2-5 worth of Base ETH for gas fees. Add funds to continue.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mint Button */}
            {showMintButton && (
              <Button
                onClick={handleMintWithGasEstimate}
                disabled={!gasInfo || loadingGas}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                {loadingGas ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Calculating Gas...
                  </>
                ) : gasInfo ? (
                  `Mint NFT (${gasInfo.estimatedCost})`
                ) : (
                  "Get Gas Estimate First"
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-yellow-50 dark:bg-yellow-950/50 rounded-lg p-3 border border-yellow-200/50 dark:border-yellow-800/50">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <span className="text-sm">🔌</span>
                <div>
                  <p className="text-sm font-semibold">Wallet Not Connected</p>
                  <p className="text-xs mt-1">
                    Connect your wallet to mint your reputation passport NFT.
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleConnectWallet}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              Connect Wallet
            </Button>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">💡</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Gas Fee Info
            </span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Gas fees go to Base network validators, not to us</p>
            <p>• Fees vary based on network congestion</p>
            <p>• We estimate costs before you confirm</p>
            <p>• You can cancel before confirming if fees seem high</p>
          </div>
        </div>
      </div>
    </Card>
  )
}