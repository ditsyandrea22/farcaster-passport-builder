/**
 * Simplified Frame Detection Hook
 * Uses the unified wallet manager for consistent, reliable detection
 * Properly handles SSR (Server-Side Rendering)
 */

"use client"

import { useState, useEffect } from "react"
import { unifiedWalletManager, type WalletConnectionState } from "@/lib/unified-wallet-manager"

interface FrameContext {
  user?: {
    fid: number
    username: string
    displayName: string
    pfpUrl?: string
  }
  wallet?: {
    address: string
    chainId: string
  }
  client?: {
    platform: string
    version: string
  }
}

interface UseSimplifiedFrameReturn {
  isFrame: boolean
  frameContext: FrameContext | null
  wallet: {
    address: string
    chainId: string
    isConnected: boolean
    connect: () => Promise<void>
    sendTransaction: (tx: any) => Promise<any>
  } | null
  isLoading: boolean
  error: string | null
  retryDetection: () => void
  
  // Enhanced features
  walletState: WalletConnectionState | null
  sendTransaction: (tx: any) => Promise<any>
  requestConnection: () => Promise<void>
  onWalletEvent: (event: string, callback: Function) => () => void
}

export function useSimplifiedFrame(): UseSimplifiedFrameReturn {
  const [isFrame, setIsFrame] = useState(false)
  const [frameContext, setFrameContext] = useState<FrameContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [walletState, setWalletState] = useState<WalletConnectionState | null>(null)

  // Subscribe to wallet manager events
  useEffect(() => {
    const unsubscribeConnected = unifiedWalletManager.on('walletConnected', (state: WalletConnectionState) => {
      console.log("🔗 Unified wallet connected:", state)
      setWalletState(state)
    })

    const unsubscribeDisconnected = unifiedWalletManager.on('walletDisconnected', () => {
      console.log("🔌 Unified wallet disconnected")
      setWalletState(null)
    })

    const unsubscribeError = unifiedWalletManager.on('walletError', (data: { error: string }) => {
      console.error("❌ Unified wallet error:", data)
      setError(data.error)
    })

    const unsubscribeBalance = unifiedWalletManager.on('balanceUpdated', (data: { balance: string, address: string }) => {
      console.log("💰 Balance updated:", data)
      setWalletState(prev => prev ? { ...prev, balance: data.balance, lastUpdated: Date.now() } : null)
    })

    return () => {
      unsubscribeConnected()
      unsubscribeDisconnected()
      unsubscribeError()
      unsubscribeBalance()
    }
  }, [])

  // Initialize the unified wallet manager
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Initialize the unified wallet manager
        await unifiedWalletManager.initialize()
        
        // Check if we're in a frame environment
        const frameDetected = unifiedWalletManager.isInFrame()
        setIsFrame(frameDetected)
        
        // Get initial wallet state
        const initialState = unifiedWalletManager.getCurrentState()
        setWalletState(initialState)
        
        if (frameDetected) {
          console.log("✅ Frame environment detected")
          
          // Try to get frame context from SDK
          if (typeof window !== 'undefined') {
            const sdk = (window as any).farcaster?.sdk || 
                       (window as any).__FARCASTER__?.sdk ||
                       (window as any).__MINIAPP__?.sdk
            
            if (sdk?.context) {
              const context = sdk.context
              if (context && typeof context === 'object') {
                console.log("📋 Frame context found:", context)
                
                const builtContext: FrameContext = {
                  user: context.user ? {
                    fid: context.user.fid,
                    username: context.user.username || '',
                    displayName: context.user.displayName || '',
                    pfpUrl: context.user.pfpUrl
                  } : undefined,
                  client: context.client,
                  wallet: context.wallet
                }
                
                setFrameContext(builtContext)
              }
            }
          }
        } else {
          console.log("🌐 Running as standalone web app")
        }
        
      } catch (err) {
        console.error("❌ Frame initialization error:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }

    // Only initialize on client side
    if (typeof window !== 'undefined') {
      initialize()
    } else {
      setIsLoading(false)
    }
  }, [])

  const retryDetection = async () => {
    console.log("🔄 Retrying frame detection...")
    setIsLoading(true)
    setError(null)
    
    try {
      await unifiedWalletManager.retryDetection()
      const newState = unifiedWalletManager.getCurrentState()
      setWalletState(newState)
      
      // Re-check frame detection
      const frameDetected = unifiedWalletManager.isInFrame()
      setIsFrame(frameDetected)
      
    } catch (err) {
      console.error("Retry failed:", err)
      setError(err instanceof Error ? err.message : "Retry failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Create wallet object from state
  const wallet = walletState?.isConnected && walletState.address ? {
    address: walletState.address,
    chainId: walletState.chainId || "8453",
    isConnected: true,
    connect: async () => {},
    sendTransaction: async (tx: any) => {
      const result = await unifiedWalletManager.sendTransaction(tx)
      return result.hash
    }
  } : null

  return {
    isFrame,
    frameContext,
    wallet,
    isLoading,
    error,
    retryDetection,
    
    // Enhanced features
    walletState,
    sendTransaction: (tx: any) => unifiedWalletManager.sendTransaction(tx),
    requestConnection: () => unifiedWalletManager.requestConnection(),
    onWalletEvent: (event: string, callback: Function) => unifiedWalletManager.on(event, callback)
  }
}