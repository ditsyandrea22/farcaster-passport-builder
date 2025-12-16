"use client"

import { useEffect, useState } from "react"
import { useReownWallet } from "@/providers/reown-wallet-provider"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WalletSelector } from "@/components/wallet-selector"
import { cn } from "@/lib/utils"

interface WalletStatusProps {
  className?: string
  showDetails?: boolean
  showNetworkSwitch?: boolean
  compact?: boolean
}

export function WalletStatus({
  className,
  showDetails = true,
  showNetworkSwitch = false,
  compact = false
}: WalletStatusProps) {
  const {
    wallet,
    isConnected,
    error,
    availableWallets,
    getBalance,
    switchNetwork
  } = useReownWallet()
  const [balance, setBalance] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Refresh balance
  const refreshBalance = async () => {
    if (!isConnected) return
    try {
      setIsLoading(true)
      const newBalance = await getBalance()
      setBalance(newBalance)
    } catch (err) {
      console.error("Failed to get balance:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && !balance) {
      refreshBalance()
    }
  }, [isConnected])

  if (!isConnected) {
    return (
      <div className={className}>
        <Card className={cn(
          "p-4 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700",
          compact && "p-2"
        )}>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Wallet Status
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {availableWallets.length} wallet{availableWallets.length !== 1 ? "s" : ""} available
              </p>
            </div>
            <WalletSelector compact={compact} />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <Card className={cn(
        "p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800",
        compact && "p-2"
      )}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                ✅ {wallet?.name || "Wallet"} Connected
              </p>
              {showDetails && (
                <p className="text-xs text-green-700 dark:text-green-300 font-mono mt-1">
                  {wallet?.address.slice(0, 6)}...{wallet?.address.slice(-4)}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100">
              Connected
            </Badge>
          </div>

          {/* Details */}
          {showDetails && (
            <div className="space-y-2 pt-2 border-t border-green-200 dark:border-green-800">
              <div className="flex justify-between items-center">
                <span className="text-xs text-green-700 dark:text-green-300">Network:</span>
                <Badge variant="outline" className="text-xs bg-white/50 dark:bg-white/10">
                  Chain ID: {wallet?.chainId || "Unknown"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-green-700 dark:text-green-300">Balance:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-white/50 dark:bg-white/10 font-mono">
                    {balance ? `${parseFloat(balance).toFixed(4)} ETH` : "Loading..."}
                  </Badge>
                  <Button
                    onClick={refreshBalance}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-200/50"
                    disabled={isLoading}
                  >
                    {isLoading ? "⟳" : "🔄"}
                  </Button>
                </div>
              </div>

              {showNetworkSwitch && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => switchNetwork(8453)} // Base
                    size="sm"
                    variant={wallet?.chainId === 8453 ? "default" : "outline"}
                    className="text-xs flex-1"
                  >
                    Base (8453)
                  </Button>
                  <Button
                    onClick={() => switchNetwork(1)} // Ethereum
                    size="sm"
                    variant={wallet?.chainId === 1 ? "default" : "outline"}
                    className="text-xs flex-1"
                  >
                    Eth (1)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-green-200 dark:border-green-800">
            <WalletSelector onConnect={refreshBalance} compact />
          </div>

          {/* Error */}
          {error && (
            <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded text-xs text-red-700 dark:text-red-300">
              ❌ {error}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
