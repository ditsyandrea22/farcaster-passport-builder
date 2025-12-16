"use client"

import { useState } from "react"
import { useReownWallet } from "@/providers/reown-wallet-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const WALLET_ICONS: Record<string, string> = {
  "MetaMask": "🦊",
  "WalletConnect": "🔗",
  "Coinbase Wallet": "⬛",
  "Backpack": "🎒",
  "Phantom": "👻",
  "Privy": "🔐",
  "Trust Wallet": "✅",
  "Zerion": "🎯",
  "Rainbow": "🌈",
  "Argent": "🛡️",
  "Ledger": "📱",
  "Trezor": "🔑",
  "Frame": "🖼️",
  "OKX Wallet": "🟠",
  "Rabby Wallet": "🐰",
}

interface WalletSelectorProps {
  onConnect?: () => void
  showLabel?: boolean
  compact?: boolean
}

export function WalletSelector({ onConnect, showLabel = true, compact = false }: WalletSelectorProps) {
  const {
    wallet,
    isConnecting,
    availableWallets,
    connectWallet,
    disconnectWallet,
    readWindowWallets
  } = useReownWallet()
  const [isOpen, setIsOpen] = useState(false)
  const [displayWallets, setDisplayWallets] = useState(availableWallets)

  const handleConnect = async (walletName: string) => {
    await connectWallet(walletName)
    setIsOpen(false)
    onConnect?.()
  }

  const handleRefreshWallets = () => {
    const detected = readWindowWallets()
    setDisplayWallets(detected)
  }

  if (wallet?.isConnected) {
    return (
      <Card className={cn(
        "p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800",
        compact && "p-2"
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900 dark:text-green-200">
              ✅ {wallet.name} Connected
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 font-mono mt-1">
              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Chain: {wallet.chainId}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {parseFloat(wallet.balance).toFixed(4)} ETH
              </Badge>
            </div>
          </div>
          <Button
            onClick={disconnectWallet}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            Disconnect
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
            compact && "h-8 text-sm"
          )}
          onClick={handleRefreshWallets}
        >
          {showLabel ? "🔗 Connect Wallet" : "Connect"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Select a wallet to connect with your app
          </DialogDescription>
        </DialogHeader>

        {displayWallets.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No wallets detected. Please install a wallet extension.
            </p>
            <Button
              onClick={handleRefreshWallets}
              variant="outline"
              size="sm"
            >
              🔄 Refresh
            </Button>
          </div>
        ) : (
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {displayWallets.map((walletName) => (
              <button
                key={walletName}
                onClick={() => handleConnect(walletName)}
                disabled={isConnecting}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  "hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "border-border hover:border-purple-400"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {WALLET_ICONS[walletName] || "💼"}
                  </span>
                  <span className="font-semibold">{walletName}</span>
                  {isConnecting && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Connecting...
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            Found {displayWallets.length} wallet{displayWallets.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleRefreshWallets}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              🔄 Refresh Detection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
