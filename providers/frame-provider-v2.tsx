"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { enhancedWalletManager } from "@/lib/enhanced-wallet-manager"
import { useFrameSimple } from "@/hooks/use-frame-simple"

interface FrameContextType {
  isFrame: boolean
  frameContext: any
  wallet: any
  isLoading: boolean
  error: string | null
  retryDetection: () => void
  // Wallet functions
  walletState: any
  sendTransaction: (tx: any) => Promise<any>
  requestConnection: () => Promise<void>
  onWalletEvent: (event: string, callback: Function) => () => void
  // Compatibility
  actions: any
  isWalletConnected: boolean
  walletAddress: string | null
}

const FrameContext = createContext<FrameContextType | undefined>(undefined)

export function FrameProvider({ children }: { children: React.ReactNode }) {
  const { isFrame, context, wallet, isLoading, sdk } = useFrameSimple()
  const [walletState, setWalletState] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCounter, setRetryCounter] = useState(0)

  // Subscribe to wallet manager events
  useEffect(() => {
    const unsubConnect = enhancedWalletManager.on('walletConnected', (state: any) => {
      console.log("🔗 Wallet connected:", state)
      setWalletState(state)
    })

    const unsubDisconnect = enhancedWalletManager.on('walletDisconnected', () => {
      console.log("🔌 Wallet disconnected")
      setWalletState(null)
    })

    const unsubError = enhancedWalletManager.on('walletError', (data: any) => {
      console.error("❌ Wallet error:", data)
      setError(data.error)
    })

    return () => {
      unsubConnect()
      unsubDisconnect()
      unsubError()
    }
  }, [])

  // If we found SDK wallet, use that
  useEffect(() => {
    if (wallet?.address && isFrame && !walletState) {
      console.log("✅ Using SDK wallet:", wallet.address)
      setWalletState({
        isConnected: true,
        address: wallet.address,
        chainId: wallet.chainId || "8453",
        balance: null,
        networkName: "Base",
        lastUpdated: Date.now()
      })
    }
  }, [wallet, isFrame, walletState])

  const value: FrameContextType = {
    isFrame,
    frameContext: context,
    wallet: walletState?.isConnected ? {
      address: walletState.address,
      chainId: walletState.chainId,
      isConnected: true,
      connect: async () => {},
      sendTransaction: (tx: any) => enhancedWalletManager.sendTransaction(tx)
    } : null,
    isLoading,
    error,
    retryDetection: () => setRetryCounter(prev => prev + 1),
    walletState,
    sendTransaction: (tx: any) => enhancedWalletManager.sendTransaction(tx),
    requestConnection: () => enhancedWalletManager.requestConnection(),
    onWalletEvent: (event: string, callback: Function) => enhancedWalletManager.on(event, callback),
    actions: {
      ready: () => sdk?.actions?.ready?.(),
      composeCast: (options: any) => sdk?.actions?.composeCast?.(options),
      signIn: () => sdk?.actions?.signIn?.()
    },
    isWalletConnected: walletState?.isConnected || false,
    walletAddress: walletState?.address || null
  }

  return (
    <FrameContext.Provider value={value}>
      {children}
    </FrameContext.Provider>
  )
}

export function useFrame() {
  const context = useContext(FrameContext)
  if (!context) {
    throw new Error("useFrame must be used within FrameProvider")
  }
  return context
}
