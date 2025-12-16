"use client"

import { useEffect, useState } from "react"
import { useReownWallet } from "@/providers/reown-wallet-provider"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WalletSelector } from "@/components/wallet-selector"
import { WalletStatus } from "@/components/wallet-status"

interface WalletInfo {
  available: boolean
  name: string
  detected: boolean
  installed: boolean
  status: "available" | "connected" | "not-detected"
}

export default function WalletsPage() {
  const { wallet, isConnected, readWindowWallets, availableWallets } = useReownWallet()
  const [allWallets, setAllWallets] = useState<WalletInfo[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const KNOWN_WALLETS = [
    "MetaMask",
    "WalletConnect",
    "Coinbase Wallet",
    "Backpack",
    "Phantom",
    "Privy",
    "Trust Wallet",
    "Zerion",
    "Rainbow",
    "Argent",
    "Ledger",
    "Trezor",
    "Frame",
    "OKX Wallet",
    "Rabby Wallet"
  ]

  useEffect(() => {
    const detected = readWindowWallets()
    const walletInfo = KNOWN_WALLETS.map(name => {
      const status: "available" | "connected" | "not-detected" = isConnected && wallet?.name === name ? "connected" : detected.includes(name) ? "available" : "not-detected"
      return {
        name,
        detected: detected.includes(name),
        installed: detected.includes(name),
        available: detected.includes(name),
        status
      }
    })
    setAllWallets(walletInfo)
  }, [refreshKey, isConnected, wallet, readWindowWallets])

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            🔗 Wallet Manager
          </h1>
          <p className="text-muted-foreground">
            Connect and manage your crypto wallets with Reown
          </p>
        </div>

        {/* Current Wallet Status */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Current Status</h2>
          <WalletStatus showDetails showNetworkSwitch />
        </div>

        {/* Available Wallets Summary */}
        <Card className="p-6 bg-white/80 dark:bg-gray-900/80 border-purple-200/50 dark:border-purple-800/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Wallets</h3>
              <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                {availableWallets.length} detected
              </Badge>
            </div>
            
            {availableWallets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableWallets.map(wallet => (
                  <Badge key={wallet} variant="outline" className="bg-green-100/50 dark:bg-green-900/30 border-green-300 dark:border-green-700">
                    ✅ {wallet}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No wallets detected. Install a wallet extension to get started.
              </p>
            )}

            <div className="pt-3 border-t">
              <Button onClick={() => setRefreshKey(k => k + 1)} variant="outline" size="sm">
                🔄 Refresh Detection
              </Button>
            </div>
          </div>
        </Card>

        {/* Wallet Directory */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Wallet Directory</h2>
            <p className="text-sm text-muted-foreground">
              {allWallets.filter(w => w.detected).length} of {KNOWN_WALLETS.length} detected
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allWallets.map(walletInfo => (
              <Card
                key={walletInfo.name}
                className={`p-4 transition-all ${
                  walletInfo.status === "connected"
                    ? "bg-green-50/80 dark:bg-green-950/20 border-green-300 dark:border-green-700"
                    : walletInfo.status === "available"
                    ? "bg-blue-50/80 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700"
                    : "bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/50 opacity-60"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{walletInfo.name}</h3>
                    {walletInfo.status === "connected" && (
                      <Badge className="bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100">
                        Connected
                      </Badge>
                    )}
                    {walletInfo.status === "available" && (
                      <Badge className="bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                        Available
                      </Badge>
                    )}
                    {walletInfo.status === "not-detected" && (
                      <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                        Not Installed
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Status:{" "}
                      <span className="font-mono">
                        {walletInfo.status === "connected" && "🟢 Connected"}
                        {walletInfo.status === "available" && "🟡 Available"}
                        {walletInfo.status === "not-detected" && "🔴 Not Detected"}
                      </span>
                    </p>
                    <p>
                      Detected: {walletInfo.detected ? "✅ Yes" : "❌ No"}
                    </p>
                  </div>

                  {walletInfo.available && walletInfo.status !== "connected" && (
                    <WalletSelector onConnect={() => setRefreshKey(k => k + 1)} compact showLabel={false} />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <Card className="p-6 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <div className="space-y-3">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">Getting Started</h3>
            <ol className="space-y-2 text-sm text-amber-900/80 dark:text-amber-100/80">
              <li>1️⃣ Install a wallet extension (MetaMask, Phantom, etc.)</li>
              <li>2️⃣ Refresh this page or click "Refresh Detection"</li>
              <li>3️⃣ Click "Connect Wallet" and select your wallet</li>
              <li>4️⃣ Approve the connection in your wallet</li>
              <li>5️⃣ Your wallet is now ready to use!</li>
            </ol>
          </div>
        </Card>

        {/* Developer Info */}
        <Card className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Developer Info</h3>
            <div className="space-y-2 text-xs font-mono text-gray-600 dark:text-gray-400">
              <p>
                <span className="text-gray-700 dark:text-gray-300">Connected:</span> {isConnected ? "Yes" : "No"}
              </p>
              {wallet && (
                <>
                  <p>
                    <span className="text-gray-700 dark:text-gray-300">Wallet:</span> {wallet.name}
                  </p>
                  <p>
                    <span className="text-gray-700 dark:text-gray-300">Address:</span> {wallet.address}
                  </p>
                  <p>
                    <span className="text-gray-700 dark:text-gray-300">Chain ID:</span> {wallet.chainId}
                  </p>
                  <p>
                    <span className="text-gray-700 dark:text-gray-300">Balance:</span> {wallet.balance} ETH
                  </p>
                </>
              )}
              <p>
                <span className="text-gray-700 dark:text-gray-300">Available Wallets:</span> {availableWallets.join(", ") || "None"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
