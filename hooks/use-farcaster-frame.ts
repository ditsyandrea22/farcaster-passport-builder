"use client"

import { useState, useEffect, useRef, SetStateAction } from "react"
import { enhancedWalletManager, type WalletConnectionState, type TransactionRequest, type TransactionResult } from "@/lib/enhanced-wallet-manager"

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

interface FrameWallet {
  address: string
  chainId: string
  isConnected: boolean
  connect: () => Promise<void>
  sendTransaction: (tx: {
    to: string
    data: string
    value?: string
  }) => Promise<string>
}

interface UseFarcasterFrameReturn {
  isFrame: boolean
  frameContext: FrameContext | null
  wallet: FrameWallet | null
  isLoading: boolean
  error: string | null
  retryDetection: () => void
  
  // Enhanced features
  walletState: WalletConnectionState | null
  sendTransaction: (tx: TransactionRequest) => Promise<TransactionResult>
  requestConnection: () => Promise<void>
  onWalletEvent: (event: string, callback: Function) => () => void
}

// Hook to initialize Frame SDK and call sdk.actions.ready()
function useFrameSDK() {
  const [isSDKReady, setIsSDKReady] = useState(false)

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).farcaster?.sdk) {
          // Simple check for SDK readiness with timeout
          let attempts = 0
          const maxAttempts = 50 // 5 seconds max
          
          const checkSDK = async () => {
            attempts++
            if ((window as any).farcaster?.sdk?.actions?.ready) {
              try {
                // Call sdk.actions.ready() to indicate the app is ready
                await (window as any).farcaster.sdk.actions.ready()
                setIsSDKReady(true)
                console.log("✅ Frame SDK initialized successfully")
                return true
              } catch (readyErr) {
                console.warn("⚠️ Error calling sdk.actions.ready():", readyErr)
                return false
              }
            } else if (attempts < maxAttempts) {
              // Wait 100ms before next attempt
              await new Promise(resolve => setTimeout(resolve, 100))
              return checkSDK()
            } else {
              console.warn("⚠️ SDK not ready after maximum attempts")
              return false
            }
          }
          
          await checkSDK()
        }
      } catch (err) {
        console.warn("⚠️ SDK initialization error:", err)
        // Don't throw error, just continue without SDK
      }
    }

    // Initialize SDK when component mounts
    initializeSDK()
  }, [])

  return isSDKReady
}

// Immediately call sdk.actions.ready() when SDK is detected
function useImmediateSDKReady() {
  useEffect(() => {
    const initializeImmediateSDK = async () => {
      if (typeof window !== 'undefined' && (window as any).farcaster?.sdk?.actions?.ready) {
        try {
          // Call immediately without waiting
          await (window as any).farcaster.sdk.actions.ready()
          console.log("🚀 Frame SDK ready called immediately")
        } catch (err) {
          console.warn("⚠️ Immediate SDK ready call failed:", err)
        }
      }
    }

    // Try immediately and also after a short delay to catch late-loading SDKs
    initializeImmediateSDK()
    
    const timeoutId = setTimeout(() => {
      initializeImmediateSDK()
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [])
}

export function useFarcasterFrame(): UseFarcasterFrameReturn {
  const [isFrame, setIsFrame] = useState(false)
  const [frameContext, setFrameContext] = useState<FrameContext | null>(null)
  const [wallet, setWallet] = useState<FrameWallet | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [walletState, setWalletState] = useState<WalletConnectionState | null>(null)
  const detectionAttempts = useRef(0)
  const maxAttempts = 15

  // Initialize Frame SDK with immediate ready call
  useImmediateSDKReady()
  const isSDKReady = useFrameSDK()

  // Subscribe to wallet events from enhanced manager
  useEffect(() => {
    const unsubscribeConnected = enhancedWalletManager.on('walletConnected', (state: WalletConnectionState) => {
      console.log("🔗 Enhanced wallet connected:", state)
      setWalletState(state)
      // Convert to FrameWallet format for compatibility
      if (state.isConnected && state.address) {
        setWallet({
          address: state.address,
          chainId: state.chainId || "8453",
          isConnected: state.isConnected,
          connect: async () => {},
          sendTransaction: async (tx) => {
            const result = await enhancedWalletManager.sendTransaction(tx)
            return result.hash
          }
        })
      }
    })

    const unsubscribeDisconnected = enhancedWalletManager.on('walletDisconnected', () => {
      console.log("🔌 Enhanced wallet disconnected")
      setWalletState(null)
      setWallet(null)
    })

    const unsubscribeError = enhancedWalletManager.on('walletError', (data: { error: SetStateAction<string | null> }) => {
      console.error("❌ Enhanced wallet error:", data)
      setError(data.error)
    })

    const unsubscribeBalance = enhancedWalletManager.on('balanceUpdated', (data: { balance: any }) => {
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

  const detectFrame = async () => {
    try {
      // Reset error state
      setError(null)
      detectionAttempts.current++

      // Check if we're in a Farcaster Frame environment
      if (typeof window !== 'undefined') {
        const farcaster = (window as any).farcaster
        
        console.log(`🔍 Frame detection attempt ${detectionAttempts.current}:`, {
          hasFarcaster: !!farcaster,
          hasFrameContext: !!farcaster?.frameContext,
          hasWallet: !!farcaster?.wallet,
          hasSDK: !!farcaster?.sdk,
          walletInSDK: !!farcaster?.sdk?.wallet,
          walletInContext: !!farcaster?.frameContext?.wallet,
          isSDKReady
        })

        // Check for Frame context or wallet
        const frameContext = farcaster?.frameContext
        
        // If we have any Farcaster object, consider it a Frame environment
        if (farcaster && (frameContext || farcaster?.sdk)) {
          setIsFrame(true)
          
          // Get frame context if available
          if (frameContext) {
            setFrameContext(frameContext)
          }
          
          // Use enhanced wallet manager for wallet detection
          const currentState = await enhancedWalletManager.detectWallet()
          setWalletState(currentState)
          
          if (currentState.isConnected && currentState.address) {
            // Convert to FrameWallet format for compatibility
            setWallet({
              address: currentState.address,
              chainId: currentState.chainId || "8453",
              isConnected: currentState.isConnected,
              connect: async () => {},
              sendTransaction: async (tx) => {
                const result = await enhancedWalletManager.sendTransaction(tx)
                return result.hash
              }
            })
          }
          
        } else {
          // Not in Frame context, might be standalone web app
          setIsFrame(false)
          console.log("🌐 Not in Frame context, running as standalone web app")
        }
      }
    } catch (err) {
      console.error("❌ Frame detection error:", err)
      setError(`Failed to detect Frame context: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const retryDetection = () => {
    console.log("🔄 Retrying frame detection...")
    setIsLoading(true)
    setError(null)
    detectionAttempts.current = 0
    detectFrame()
  }

  useEffect(() => {
    detectFrame()
  }, [])

  return {
    isFrame,
    frameContext,
    wallet,
    isLoading,
    error,
    retryDetection,
    
    // Enhanced features
    walletState,
    sendTransaction: (tx: TransactionRequest) => enhancedWalletManager.sendTransaction(tx),
    requestConnection: () => enhancedWalletManager.requestConnection(),
    onWalletEvent: (event: string, callback: Function) => enhancedWalletManager.on(event, callback)
  }
}