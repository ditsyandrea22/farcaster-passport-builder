"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { BrowserProvider, ethers } from "ethers"

interface WalletInfo {
  address: string
  chainId: number
  balance: string
  name: string
  isConnected: boolean
  provider?: any
}

interface WalletContextType {
  wallet: WalletInfo | null
  isConnecting: boolean
  isConnected: boolean
  error: string | null
  availableWallets: string[]
  connectWallet: (walletName?: string) => Promise<void>
  disconnectWallet: () => Promise<void>
  switchNetwork: (chainId: number) => Promise<void>
  sendTransaction: (to: string, value: string, data?: string) => Promise<string>
  getBalance: () => Promise<string>
  readWindowWallets: () => string[]
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

/**
 * Detect all available wallets in window
 */
function detectWindowWallets(): string[] {
  const wallets: string[] = []
  
  if (typeof window === 'undefined') return wallets

  // Check for MetaMask
  if ((window as any).ethereum?.isMetaMask) {
    wallets.push('MetaMask')
  }

  // Check for WalletConnect
  if ((window as any).ethereum?.isWalletConnect) {
    wallets.push('WalletConnect')
  }

  // Check for Coinbase Wallet
  if ((window as any).ethereum?.isCoinbaseWallet) {
    wallets.push('Coinbase Wallet')
  }

  // Check for Backpack
  if ((window as any).backpack) {
    wallets.push('Backpack')
  }

  // Check for Phantom
  if ((window as any).phantom?.ethereum) {
    wallets.push('Phantom')
  }

  // Check for Privy
  if ((window as any).privy) {
    wallets.push('Privy')
  }

  // Check for Trust Wallet
  if ((window as any).trustwallet) {
    wallets.push('Trust Wallet')
  }

  // Check for Zerion
  if ((window as any).zerionWallet) {
    wallets.push('Zerion')
  }

  // Check for Rainbow Wallet
  if ((window as any).rainbow) {
    wallets.push('Rainbow')
  }

  // Check for Argent
  if ((window as any).argent) {
    wallets.push('Argent')
  }

  // Check for Ledger
  if ((window as any).ledger) {
    wallets.push('Ledger')
  }

  // Check for Trezor
  if ((window as any).trezor) {
    wallets.push('Trezor')
  }

  // Check for Frame
  if ((window as any).ethereum?.isFrame) {
    wallets.push('Frame')
  }

  // Check for OKX Wallet
  if ((window as any).okxwallet) {
    wallets.push('OKX Wallet')
  }

  // Check for Rabby Wallet
  if ((window as any).ethereum?.isRabby) {
    wallets.push('Rabby Wallet')
  }

  return [...new Set(wallets)] // Remove duplicates
}

/**
 * Get provider for specific wallet
 */
function getWalletProvider(walletName?: string): any {
  if (typeof window === 'undefined') return null

  const ethereum = (window as any).ethereum

  if (!walletName) {
    return ethereum // Return primary provider
  }

  switch (walletName.toLowerCase()) {
    case 'metamask':
      return (window as any).ethereum?.isMetaMask ? ethereum : null
    case 'coinbase wallet':
      return (window as any).ethereum?.isCoinbaseWallet ? ethereum : null
    case 'walletconnect':
      return (window as any).ethereum?.isWalletConnect ? ethereum : null
    case 'phantom':
      return (window as any).phantom?.ethereum
    case 'backpack':
      return (window as any).backpack?.ethereum
    case 'privy':
      return (window as any).privy?.wallet?.ethereum
    case 'trust wallet':
      return (window as any).trustwallet
    case 'zerion':
      return (window as any).zerionWallet?.ethereum
    case 'rainbow':
      return (window as any).rainbow
    case 'argent':
      return (window as any).argent?.ethereum
    case 'okx wallet':
      return (window as any).okxwallet
    case 'rabby wallet':
      return (window as any).ethereum?.isRabby ? ethereum : null
    default:
      return ethereum
  }
}

export function ReownWalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableWallets, setAvailableWallets] = useState<string[]>([])

  // Detect available wallets on mount
  useEffect(() => {
    const detected = detectWindowWallets()
    setAvailableWallets(detected)
    console.log("🔍 Detected wallets:", detected)

    // Listen for wallet changes
    const handleAccountsChanged = (accounts: string[]) => {
      console.log("🔄 Accounts changed:", accounts)
      if (accounts.length > 0 && wallet) {
        setWallet({ ...wallet, address: accounts[0] })
      }
    }

    const handleChainChanged = (chainId: string) => {
      console.log("🔄 Chain changed:", chainId)
      if (wallet) {
        setWallet({ ...wallet, chainId: parseInt(chainId, 16) })
      }
    }

    const handleDisconnect = () => {
      console.log("🔌 Wallet disconnected")
      setWallet(null)
    }

    const ethereum = (window as any).ethereum
    if (ethereum) {
      ethereum.on?.("accountsChanged", handleAccountsChanged)
      ethereum.on?.("chainChanged", handleChainChanged)
      ethereum.on?.("disconnect", handleDisconnect)
    }

    return () => {
      if (ethereum) {
        ethereum.removeListener?.("accountsChanged", handleAccountsChanged)
        ethereum.removeListener?.("chainChanged", handleChainChanged)
        ethereum.removeListener?.("disconnect", handleDisconnect)
      }
    }
  }, [wallet])

  // Connect wallet
  const connectWallet = useCallback(async (walletName?: string) => {
    try {
      setIsConnecting(true)
      setError(null)

      const provider = getWalletProvider(walletName)
      if (!provider) {
        throw new Error(`Wallet ${walletName || "MetaMask"} not found`)
      }

      console.log(`🔗 Connecting to ${walletName || "MetaMask"}...`)

      // Request accounts
      const accounts = await provider.request?.({
        method: "eth_requestAccounts"
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned")
      }

      const address = accounts[0]
      console.log("✅ Connected to:", address)

      // Get chain ID
      const chainIdHex = await provider.request?.({
        method: "eth_chainId"
      })
      const chainId = parseInt(chainIdHex, 16)

      // Get balance
      const balanceWei = await provider.request?.({
        method: "eth_getBalance",
        params: [address, "latest"]
      })
      const balance = ethers.formatEther(balanceWei)

      setWallet({
        address,
        chainId,
        balance,
        name: walletName || "MetaMask",
        isConnected: true,
        provider
      })

      console.log("💰 Balance:", balance, "ETH")
      console.log("🌐 Chain ID:", chainId)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet"
      console.error("❌ Connection error:", message)
      setError(message)
      setWallet(null)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      setWallet(null)
      setError(null)
      console.log("🔌 Disconnected wallet")
    } catch (err) {
      console.error("❌ Disconnect error:", err)
    }
  }, [])

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      if (!wallet?.provider) {
        throw new Error("Wallet not connected")
      }

      const chainIdHex = `0x${chainId.toString(16)}`

      await wallet.provider.request?.({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }]
      })

      setWallet({ ...wallet, chainId })
      console.log("✅ Switched to chain:", chainId)
    } catch (err) {
      console.error("❌ Switch chain error:", err)
      setError(err instanceof Error ? err.message : "Failed to switch chain")
    }
  }, [wallet])

  // Send transaction
  const sendTransaction = useCallback(
    async (to: string, value: string, data?: string): Promise<string> => {
      try {
        if (!wallet?.provider) {
          throw new Error("Wallet not connected")
        }

        console.log("💳 Sending transaction...")

        const valueWei = ethers.parseEther(value)

        const txHash = await wallet.provider.request?.({
          method: "eth_sendTransaction",
          params: [
            {
              from: wallet.address,
              to,
              value: `0x${valueWei.toString(16)}`,
              data: data || "0x"
            }
          ]
        })

        console.log("✅ Transaction sent:", txHash)
        return txHash
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transaction failed"
        console.error("❌ Transaction error:", message)
        setError(message)
        throw err
      }
    },
    [wallet]
  )

  // Get balance
  const getBalance = useCallback(async (): Promise<string> => {
    try {
      if (!wallet?.provider) {
        throw new Error("Wallet not connected")
      }

      const balanceWei = await wallet.provider.request?.({
        method: "eth_getBalance",
        params: [wallet.address, "latest"]
      })

      const balance = ethers.formatEther(balanceWei)
      console.log("💰 Balance:", balance, "ETH")
      return balance
    } catch (err) {
      console.error("❌ Get balance error:", err)
      throw err
    }
  }, [wallet])

  const value: WalletContextType = {
    wallet,
    isConnecting,
    isConnected: wallet?.isConnected || false,
    error,
    availableWallets,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    sendTransaction,
    getBalance,
    readWindowWallets: detectWindowWallets
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useReownWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useReownWallet must be used within ReownWalletProvider")
  }
  return context
}
